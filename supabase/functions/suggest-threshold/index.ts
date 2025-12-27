import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SuggestThresholdRequest {
  city: string;
  country: string;
  airport_code?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Suggest threshold function called');

  try {
    const { city, country, airport_code }: SuggestThresholdRequest = await req.json();
    
    if (!city || !country) {
      return new Response(
        JSON.stringify({ error: 'City and country are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to find existing destination with price history
    let existingStats = null;
    
    const { data: destination } = await supabase
      .from('destinations')
      .select('id, city_name, country')
      .ilike('city_name', city)
      .ilike('country', country)
      .maybeSingle();

    if (destination) {
      console.log('Found existing destination:', destination.id);
      const { data: stats } = await supabase
        .from('price_statistics')
        .select('*')
        .eq('destination_id', destination.id)
        .maybeSingle();
      
      if (stats && stats.total_samples && stats.total_samples > 0) {
        existingStats = stats;
        console.log('Found price statistics:', stats);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured, using fallback');
      return new Response(
        JSON.stringify({
          recommended_threshold: existingStats?.percentile_25 || 500,
          confidence: existingStats ? 'medium' : 'low',
          reasoning: existingStats 
            ? `Based on ${existingStats.total_samples} price samples` 
            : 'Default threshold - AI unavailable',
          has_historical_data: !!existingStats,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (existingStats) {
      // We have real historical data - use it for much better recommendations
      systemPrompt = `You are a flight pricing analyst. Your task is to recommend a price alert threshold based on historical data.

IMPORTANT: You must respond with ONLY a valid JSON object. No other text, no markdown, no explanations outside the JSON.

Response format:
{"recommended_threshold": NUMBER, "confidence": "high", "reasoning": "YOUR_REASONING"}

The recommended_threshold should be between the all_time_low and percentile_50 values provided.`;

      userPrompt = `Historical price data for flights from Memphis International Airport (MEM) to ${city}, ${country}:

- All-time low: $${existingStats.all_time_low}
- 25th percentile: $${existingStats.percentile_25}
- 50th percentile (median): $${existingStats.percentile_50}
- 90-day average: $${existingStats.avg_90day}
- Total samples: ${existingStats.total_samples}

Recommend a threshold between the all-time low and 25th percentile for this Memphis route.`;
    } else {
      // No historical data - use AI estimation
      systemPrompt = `You are a flight pricing analyst. Your task is to recommend a price alert threshold for round-trip flights from Memphis International Airport (MEM).

IMPORTANT: You must respond with ONLY a valid JSON object. No other text, no markdown, no explanations outside the JSON.

Response format:
{"recommended_threshold": NUMBER, "confidence": "medium", "reasoning": "YOUR_REASONING"}

The NUMBER should be between 200 and 1500 USD.`;

      userPrompt = `Recommend a price alert threshold for round-trip flights from Memphis (MEM) to ${city}, ${country}${airport_code ? ` (${airport_code})` : ''}.

Consider typical flight costs from Memphis to this destination and what would be a genuinely good deal price.`;
    }

    console.log('Calling Lovable AI for threshold suggestion...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      
      return new Response(
        JSON.stringify({
          recommended_threshold: 500,
          confidence: 'low',
          reasoning: 'AI service unavailable - using default threshold',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0]?.message?.content;

    if (!aiContent) {
      throw new Error('No response from AI');
    }

    console.log('AI response:', aiContent);

    // Parse AI response
    let recommendation;
    try {
      // Remove markdown code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent.trim();
      recommendation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      return new Response(
        JSON.stringify({
          recommended_threshold: 500,
          confidence: 'low',
          reasoning: 'Unable to parse AI recommendation - using default',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate and sanitize the recommendation
    let threshold = Math.round(recommendation.recommended_threshold || 500);
    
    // Apply bounds based on whether we have historical data
    if (existingStats) {
      const minThreshold = Math.max(200, Math.round(existingStats.all_time_low * 0.9));
      const maxThreshold = Math.round(existingStats.percentile_50);
      threshold = Math.max(minThreshold, Math.min(maxThreshold, threshold));
    } else {
      threshold = Math.max(200, Math.min(1500, threshold));
    }

    return new Response(
      JSON.stringify({
        recommended_threshold: threshold,
        confidence: recommendation.confidence || (existingStats ? 'high' : 'medium'),
        reasoning: recommendation.reasoning || `Suggested threshold for ${city}, ${country}`,
        has_historical_data: !!existingStats,
        data_samples: existingStats?.total_samples || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in suggest-threshold function:', err);
    return new Response(
      JSON.stringify({
        recommended_threshold: 500,
        confidence: 'low',
        reasoning: 'Error occurred - using default threshold',
        error: err.message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
