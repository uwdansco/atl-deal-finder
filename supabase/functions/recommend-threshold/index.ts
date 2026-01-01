import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ThresholdRequest {
  destination_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('Recommend threshold function called');

  try {
    const { destination_id }: ThresholdRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch price statistics for the destination
    const { data: stats, error: statsError } = await supabaseClient
      .from('price_statistics')
      .select('*')
      .eq('destination_id', destination_id)
      .single();

    if (statsError) {
      console.error('Error fetching price statistics:', statsError);
      // Fallback to basic destination data if stats don't exist
      const { data: dest } = await supabaseClient
        .from('destinations')
        .select('city_name, country, airport_code')
        .eq('id', destination_id)
        .single();

      return new Response(
        JSON.stringify({
          recommended_threshold: 500,
          confidence: 'low',
          reasoning: 'Insufficient historical data. Using default threshold. More data needed for AI analysis.',
          destination_name: dest ? `${dest.city_name}, ${dest.country}` : 'Unknown',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch destination info
    const { data: destination } = await supabaseClient
      .from('destinations')
      .select('city_name, country, airport_code')
      .eq('id', destination_id)
      .single();

    // Check if we have enough data for AI analysis
    if (!stats.total_samples || stats.total_samples < 30) {
      return new Response(
        JSON.stringify({
          recommended_threshold: Math.round((stats.avg_90day || 500) * 0.75),
          confidence: 'low',
          reasoning: 'Limited historical data. Using 75% of average price as conservative threshold.',
          destination_name: destination ? `${destination.city_name}, ${destination.country}` : 'Unknown',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Use AI to analyze the price data and recommend threshold
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const systemPrompt = `You are an expert flight pricing analyst. Analyze historical price data and recommend an optimal price alert threshold.

All flights are from Memphis International Airport (MEM) to the specified destination.

Your goal: Find the sweet spot where users get notified of genuinely good deals without too many alerts.

Consider:
- Historical price patterns and volatility
- Percentile distributions (what's a truly good deal vs. average)
- Seasonal trends and price stability
- User psychology (they want deals, not spam)

Return your analysis as a JSON object with these exact fields:
{
  "recommended_threshold": <number>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<1-2 sentence explanation of why this threshold is optimal>"
}`;

    const userPrompt = `Analyze this flight pricing data for flights from Memphis International Airport (MEM) to ${destination?.city_name}, ${destination?.country} (${destination?.airport_code}):

**Price Statistics:**
- 7-day average: $${stats.avg_7day?.toFixed(2) || 'N/A'}
- 30-day average: $${stats.avg_30day?.toFixed(2) || 'N/A'}
- 90-day average: $${stats.avg_90day?.toFixed(2) || 'N/A'}
- All-time low: $${stats.all_time_low?.toFixed(2) || 'N/A'}
- All-time high: $${stats.all_time_high?.toFixed(2) || 'N/A'}
- 25th percentile: $${stats.percentile_25?.toFixed(2) || 'N/A'}
- Median (50th percentile): $${stats.percentile_50?.toFixed(2) || 'N/A'}
- 75th percentile: $${stats.percentile_75?.toFixed(2) || 'N/A'}
- Standard deviation: $${stats.std_deviation?.toFixed(2) || 'N/A'}
- Total price samples: ${stats.total_samples}

**Task:**
Recommend an optimal price threshold that will:
1. Capture genuinely good deals (top 20-30% best prices)
2. Avoid alerting on average/mediocre prices
3. Balance between frequency (not too many alerts) and opportunity (not missing good deals)

Consider that prices below the 30th percentile are generally good deals, and prices near the all-time low are exceptional.`;

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
      
      // Fallback to percentile-based calculation
      const fallbackThreshold = Math.round(stats.percentile_25 || (stats.avg_90day * 0.75));
      return new Response(
        JSON.stringify({
          recommended_threshold: fallbackThreshold,
          confidence: 'medium',
          reasoning: 'Set to 25th percentile - alerts for prices better than 75% of historical data.',
          destination_name: destination ? `${destination.city_name}, ${destination.country}` : 'Unknown',
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

    // Parse AI response - extract JSON from markdown code blocks if present
    let recommendation;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      recommendation = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      // Fallback
      const fallbackThreshold = Math.round(stats.percentile_25 || (stats.avg_90day * 0.75));
      recommendation = {
        recommended_threshold: fallbackThreshold,
        confidence: 'medium',
        reasoning: 'Set to 25th percentile based on historical data analysis.',
      };
    }

    // Validate and sanitize the recommendation
    const threshold = Math.max(
      Math.round(stats.all_time_low * 0.9), // At minimum, 90% of all-time low
      Math.min(
        Math.round(recommendation.recommended_threshold),
        Math.round(stats.avg_90day * 0.9) // At maximum, 90% of 90-day average
      )
    );

    return new Response(
      JSON.stringify({
        recommended_threshold: threshold,
        confidence: recommendation.confidence || 'medium',
        reasoning: recommendation.reasoning || 'AI-optimized threshold based on historical price patterns.',
        destination_name: destination ? `${destination.city_name}, ${destination.country}` : 'Unknown',
        stats: {
          avg_90day: Math.round(stats.avg_90day || 0),
          all_time_low: Math.round(stats.all_time_low || 0),
          percentile_25: Math.round(stats.percentile_25 || 0),
          total_samples: stats.total_samples,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Error in recommend-threshold function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});