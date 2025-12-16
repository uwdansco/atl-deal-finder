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
    let destinationName = `${city}, ${country}`;
    
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
      systemPrompt = `You are an expert flight pricing analyst. Analyze the historical price data and recommend an optimal price alert threshold.

Your goal: Recommend a threshold that captures genuinely good deals (around 20-30th percentile) while avoiding alerts for average or above-average prices.

Return ONLY a JSON object with these exact fields (no markdown, no code blocks):
{
  "recommended_threshold": <number between all_time_low and percentile_50>,
  "confidence": "high",
  "reasoning": "<1 sentence explaining your recommendation based on the data>"
}`;

      userPrompt = `Analyze this historical price data for flights from Singapore (SIN) to ${city}, ${country}:

Historical Statistics (based on ${existingStats.total_samples} price samples):
- All-time low: $${existingStats.all_time_low}
- 25th percentile: $${existingStats.percentile_25}
- 50th percentile (median): $${existingStats.percentile_50}
- 90-day average: $${existingStats.avg_90day}

Recommend a threshold that will alert users to exceptional deals (below typical good prices) but not too low to be unrealistic.`;
    } else {
      // No historical data - use AI estimation
      systemPrompt = `You are an expert flight pricing analyst. Based on the destination provided, recommend an optimal price alert threshold for round-trip flights from Singapore (SIN).

Consider:
- Typical flight costs from Singapore to this destination
- Distance, region, and seasonal patterns
- Whether it's a popular/budget or premium destination
- Realistic "good deal" prices travelers would want to be alerted about

Return ONLY a JSON object with these exact fields (no markdown, no code blocks):
{
  "recommended_threshold": <number between 200-1500>,
  "confidence": "medium",
  "reasoning": "<brief 1-sentence explanation>"
}`;

      userPrompt = `Suggest a price alert threshold for flights from Singapore (SIN) to ${city}, ${country}${airport_code ? ` (${airport_code})` : ''}.

What price point would indicate a genuinely good deal for this route?`;
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

  } catch (error: any) {
    console.error('Error in suggest-threshold function:', error);
    return new Response(
      JSON.stringify({
        recommended_threshold: 500,
        confidence: 'low',
        reasoning: 'Error occurred - using default threshold',
        error: error.message,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
