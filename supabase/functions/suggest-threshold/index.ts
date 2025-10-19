import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured, using fallback');
      return new Response(
        JSON.stringify({
          recommended_threshold: 500,
          confidence: 'low',
          reasoning: 'Default threshold - AI unavailable',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const systemPrompt = `You are an expert flight pricing analyst. Based on the destination provided, recommend an optimal price alert threshold for round-trip flights from Atlanta (ATL).

Consider:
- Typical flight costs from Atlanta to this destination
- Distance, region, and seasonal patterns
- Whether it's a popular/budget or premium destination
- Realistic "good deal" prices travelers would want to be alerted about

Return ONLY a JSON object with these exact fields (no markdown, no code blocks):
{
  "recommended_threshold": <number between 200-1500>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<brief 1-sentence explanation>"
}`;

    const userPrompt = `Suggest a price alert threshold for flights from Atlanta (ATL) to ${city}, ${country}${airport_code ? ` (${airport_code})` : ''}.

What price point would indicate a genuinely good deal for this route?`;

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
    const threshold = Math.max(200, Math.min(1500, Math.round(recommendation.recommended_threshold || 500)));

    return new Response(
      JSON.stringify({
        recommended_threshold: threshold,
        confidence: recommendation.confidence || 'medium',
        reasoning: recommendation.reasoning || `Suggested threshold for ${city}, ${country}`,
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
