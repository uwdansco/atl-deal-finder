import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AmadeusAuthResponse {
  access_token: string;
  expires_in: number;
}

interface FlightOffer {
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        at: string;
      };
      arrival: {
        at: string;
      };
    }>;
  }>;
}

interface AmadeusFlightResponse {
  data: FlightOffer[];
}

async function getAmadeusAccessToken(): Promise<string> {
  const clientId = Deno.env.get("AMADEUS_CLIENT_ID");
  const clientSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Amadeus auth error:", error);
    throw new Error(`Failed to get Amadeus access token: ${response.status}`);
  }

  const data: AmadeusAuthResponse = await response.json();
  return data.access_token;
}

async function searchFlights(
  accessToken: string,
  origin: string,
  destination: string,
  departureDate: string
): Promise<number | null> {
  const url = new URL("https://test.api.amadeus.com/v2/shopping/flight-offers");
  url.searchParams.append("originLocationCode", origin);
  url.searchParams.append("destinationLocationCode", destination);
  url.searchParams.append("departureDate", departureDate);
  url.searchParams.append("adults", "1");
  url.searchParams.append("max", "5");
  url.searchParams.append("currencyCode", "USD");

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`Amadeus flight search error for ${destination}:`, error);
    return null;
  }

  const data: AmadeusFlightResponse = await response.json();
  
  if (!data.data || data.data.length === 0) {
    console.log(`No flights found for ${destination}`);
    return null;
  }

  // Find the cheapest price
  const prices = data.data.map(offer => parseFloat(offer.price.total));
  const cheapestPrice = Math.min(...prices);
  
  return cheapestPrice;
}

function getNextDepartureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30); // Look 30 days ahead
  return date.toISOString().split('T')[0];
}

async function classifyDeal(currentPrice: number, stats: any): Promise<{
  quality: string;
  savingsPercent: number;
  recommendation: string;
}> {
  if (!stats || !stats.avg_90day) {
    return {
      quality: "UNKNOWN",
      savingsPercent: 0,
      recommendation: "Not enough historical data to classify this deal"
    };
  }

  const avg90 = parseFloat(stats.avg_90day);
  const savingsPercent = ((avg90 - currentPrice) / avg90) * 100;

  let quality = "POOR";
  let recommendation = "This is above average pricing. Consider waiting for a better deal.";

  if (currentPrice <= stats.all_time_low || savingsPercent >= 40) {
    quality = "EXCEPTIONAL";
    recommendation = "🔥 ALL-TIME LOW! Book immediately - prices rarely get this low!";
  } else if (savingsPercent >= 30) {
    quality = "EXCELLENT";
    recommendation = "⭐ Excellent deal! Book within 24 hours as prices may rise.";
  } else if (savingsPercent >= 20) {
    quality = "GREAT";
    recommendation = "Great price! This is a solid deal worth booking.";
  } else if (savingsPercent >= 10) {
    quality = "GOOD";
    recommendation = "Good deal! Consider booking if the dates work for you.";
  } else if (savingsPercent >= 0) {
    quality = "FAIR";
    recommendation = "Fair price, slightly below average. Could wait for better.";
  }

  return { quality, savingsPercent, recommendation };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting flight price check...");

    // Get Amadeus access token
    const accessToken = await getAmadeusAccessToken();
    console.log("Got Amadeus access token");

    // Get all active destinations
    const { data: destinations, error: destError } = await supabase
      .from("destinations")
      .select("*")
      .eq("is_active", true);

    if (destError) {
      throw destError;
    }

    console.log(`Checking prices for ${destinations?.length || 0} destinations`);

    const results = [];
    let alertsTriggered = 0;

    // Process each destination
    for (const destination of destinations || []) {
      try {
        console.log(`Checking ${destination.city_name} (${destination.airport_code})...`);

        // Search for flights
        const departureDate = getNextDepartureDate();
        const price = await searchFlights(
          accessToken,
          "ATL", // Atlanta
          destination.airport_code,
          departureDate
        );

        if (price === null) {
          console.log(`No price found for ${destination.city_name}`);
          continue;
        }

        console.log(`Found price for ${destination.city_name}: $${price}`);

        // Save to price history
        const { error: historyError } = await supabase
          .from("price_history")
          .insert({
            destination_id: destination.id,
            price: price,
            outbound_date: departureDate,
            checked_at: new Date().toISOString(),
          });

        if (historyError) {
          console.error("Error saving price history:", historyError);
        }

        // Refresh price statistics
        const { error: statsError } = await supabase.rpc("refresh_price_statistics");
        if (statsError) {
          console.error("Error refreshing statistics:", statsError);
        }

        // Get updated statistics
        const { data: stats } = await supabase
          .from("price_statistics")
          .select("*")
          .eq("destination_id", destination.id)
          .single();

        // Classify the deal
        const dealAnalysis = await classifyDeal(price, stats);

        // Check if any users should be alerted
        const { data: userDestinations } = await supabase
          .from("user_destinations")
          .select("*, user_preferences!inner(email_notifications_enabled)")
          .eq("destination_id", destination.id)
          .eq("is_active", true)
          .lte("price_threshold", price);

        // Trigger alerts for matching users
        for (const userDest of userDestinations || []) {
          // Check cooldown period
          const cooldownHours = (userDest.alert_cooldown_days || 7) * 24;
          const lastAlert = userDest.last_alert_sent_at ? new Date(userDest.last_alert_sent_at) : null;
          const hoursSinceLastAlert = lastAlert 
            ? (Date.now() - lastAlert.getTime()) / (1000 * 60 * 60)
            : Infinity;

          // Skip if within cooldown (unless EXCEPTIONAL)
          if (dealAnalysis.quality !== "EXCEPTIONAL" && hoursSinceLastAlert < cooldownHours) {
            console.log(`Skipping alert for user ${userDest.user_id} - cooldown active`);
            continue;
          }

          // Create price alert
          const { error: alertError } = await supabase
            .from("price_alerts")
            .insert({
              user_id: userDest.user_id,
              destination_id: destination.id,
              price: price,
              tracking_threshold: userDest.price_threshold,
              deal_quality: dealAnalysis.quality,
              savings_percent: dealAnalysis.savingsPercent,
              avg_90day_price: stats?.avg_90day,
              all_time_low: stats?.all_time_low,
              dates: departureDate,
            });

          if (!alertError) {
            // Queue email
            await supabase.rpc("queue_email", {
              p_user_id: userDest.user_id,
              p_email_type: "price_alert",
              p_email_data: {
                destination: destination.city_name,
                country: destination.country,
                current_price: price,
                user_threshold: userDest.price_threshold,
                deal_quality: dealAnalysis.quality,
                savings_percent: dealAnalysis.savingsPercent,
                recommendation: dealAnalysis.recommendation,
                avg_90day: stats?.avg_90day,
                all_time_low: stats?.all_time_low,
              },
            });

            // Update last alert timestamp
            await supabase
              .from("user_destinations")
              .update({ last_alert_sent_at: new Date().toISOString() })
              .eq("id", userDest.id);

            alertsTriggered++;
            console.log(`Alert triggered for user ${userDest.user_id}`);
          }
        }

        results.push({
          destination: destination.city_name,
          price,
          quality: dealAnalysis.quality,
          savings: dealAnalysis.savingsPercent,
        });

        // Rate limiting - wait 1 second between API calls
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error processing ${destination.city_name}:`, error);
        results.push({
          destination: destination.city_name,
          error: error.message,
        });
      }
    }

    console.log(`Price check complete. Checked ${results.length} destinations, triggered ${alertsTriggered} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        destinationsChecked: results.length,
        alertsTriggered,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("Error in check-flight-prices:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
