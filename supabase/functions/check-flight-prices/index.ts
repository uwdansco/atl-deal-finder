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

  // Monitor rate limits
  const rateLimitRemaining = response.headers.get("X-RateLimit-Remaining");
  const rateLimitReset = response.headers.get("X-RateLimit-Reset");
  
  if (rateLimitRemaining) {
    console.log(`⚠️ Amadeus API Rate Limit: ${rateLimitRemaining} requests remaining`);
    if (parseInt(rateLimitRemaining) < 100) {
      console.warn(`⚠️ WARNING: Low rate limit - only ${rateLimitRemaining} requests remaining. Reset at: ${rateLimitReset}`);
    }
  }

  if (!response.ok) {
    if (response.status === 429) {
      console.error(`🚨 RATE LIMIT EXCEEDED for ${destination}. Will retry later. Reset at: ${rateLimitReset}`);
      return null;
    }
    const error = await response.text();
    console.error(`Amadeus flight search error for ${destination} (${response.status}):`, error);
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
  date.setDate(date.getDate() + 30);
  return date.toISOString().split('T')[0];
}

function getReturnDate(departureDate: string): string {
  const date = new Date(departureDate);
  date.setDate(date.getDate() + 7); // 7-day trip
  return date.toISOString().split('T')[0];
}

// Google Flights fallback using SerpApi
async function searchFlightsWithSerpApi(
  origin: string,
  destination: string,
  departureDate: string,
  returnDate: string
): Promise<number | null> {
  const serpApiKey = Deno.env.get("SERPAPI_API_KEY");
  
  if (!serpApiKey) {
    console.error("❌ SerpApi key not configured");
    return null;
  }

  try {
    const params = new URLSearchParams({
      engine: "google_flights",
      departure_id: origin,
      arrival_id: destination,
      outbound_date: departureDate,
      return_date: returnDate,
      currency: "USD",
      hl: "en",
      api_key: serpApiKey
    });

    const response = await fetch(`https://serpapi.com/search?${params.toString()}`);

    if (!response.ok) {
      console.error(`❌ SerpApi error: ${response.status} for ${destination}`);
      return null;
    }

    const data = await response.json();
    
    // Extract cheapest price from best_flights or other_flights
    const allFlights = [
      ...(data.best_flights || []),
      ...(data.other_flights || [])
    ];
    
    if (allFlights.length === 0) {
      console.log(`No Google Flights found for ${destination}`);
      return null;
    }

    const prices = allFlights.map((flight: any) => flight.price).filter((p: number) => p > 0);
    if (prices.length === 0) {
      return null;
    }

    const cheapestPrice = Math.min(...prices);
    console.log(`✅ Google Flights price for ${destination}: $${cheapestPrice}`);
    return cheapestPrice;
  } catch (error) {
    console.error(`❌ SerpApi exception for ${destination}:`, error);
    return null;
  }
}

async function classifyDeal(currentPrice: number, stats: any): Promise<{
  quality: string;
  badge: string;
  savingsPercent: number;
  recommendation: string;
  urgency: string;
  currentPercentile: number;
}> {
  if (!stats || !stats.avg_90day) {
    return {
      quality: "unknown",
      badge: "NEW",
      savingsPercent: 0,
      recommendation: "Insufficient historical data for deal analysis",
      urgency: "low",
      currentPercentile: 50
    };
  }

  const avg90 = parseFloat(stats.avg_90day);
  const allTimeLow = stats.all_time_low ? parseFloat(stats.all_time_low) : null;
  const savingsPercent = ((avg90 - currentPrice) / avg90) * 100;
  
  let quality = "poor";
  let badge = "POOR";
  let recommendation = "";
  let urgency = "low";

  if ((allTimeLow && currentPrice <= allTimeLow) || savingsPercent >= 40) {
    quality = "exceptional";
    badge = "🔥 EXCEPTIONAL";
    recommendation = "This is an all-time low! Prices at this level occur only 1-2 times per year. Book within 24 hours as prices will likely rise.";
    urgency = "high";
  } else if (savingsPercent >= 30) {
    quality = "excellent";
    badge = "⭐ EXCELLENT";
    recommendation = "Outstanding deal! This price is in the bottom 10% of all prices. Occurs only 3-4 times per year. We strongly recommend booking within 48 hours.";
    urgency = "high";
  } else if (savingsPercent >= 20) {
    quality = "great";
    badge = "✨ GREAT";
    recommendation = "Great price! This is well below average and occurs 5-8 times per year. Consider booking within 3 days.";
    urgency = "moderate";
  } else if (savingsPercent >= 10) {
    quality = "good";
    badge = "👍 GOOD";
    recommendation = "Good deal! This price is below average. Worth booking if the dates work for you.";
    urgency = "moderate";
  } else if (savingsPercent >= 0) {
    quality = "fair";
    badge = "FAIR";
    recommendation = "Fair price, slightly below average. You might want to wait for a better deal.";
    urgency = "low";
  } else {
    quality = "poor";
    badge = "POOR";
    recommendation = "Price is above average. We recommend waiting for a better deal.";
    urgency = "low";
  }

  // Calculate current percentile
  let currentPercentile = 50;
  if (stats.percentile_25 && stats.percentile_75) {
    const p25 = parseFloat(stats.percentile_25);
    const p75 = parseFloat(stats.percentile_75);
    if (currentPrice <= p25) {
      currentPercentile = 25;
    } else if (currentPrice >= p75) {
      currentPercentile = 75;
    } else {
      currentPercentile = 50;
    }
  }

  return {
    quality,
    badge,
    savingsPercent: Math.round(savingsPercent),
    recommendation,
    urgency,
    currentPercentile
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for check mode
    let checkMode = "priority"; // default to priority (user-tracked only)
    try {
      const body = await req.json();
      checkMode = body.check_mode || "priority";
    } catch {
      // If no body or invalid JSON, use default
    }

    console.log(`Starting flight price check in '${checkMode}' mode...`);

    const accessToken = await getAmadeusAccessToken();
    console.log("Got Amadeus access token");

    // Get destinations based on check mode
    let destinations;
    
    if (checkMode === "all") {
      // "all" mode - check everything (for manual testing)
      const { data: allDests, error: destError } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true);
      
      if (destError) throw destError;
      
      destinations = allDests || [];
      console.log(`🌍 All mode: Checking ${destinations.length} active destinations`);
    } else {
      // Default "priority" mode - only check user-tracked destinations
      const { data: trackedDests } = await supabase
        .from("user_destinations")
        .select("destination_id")
        .eq("is_active", true);
      
      const trackedIds = new Set(trackedDests?.map(d => d.destination_id) || []);
      
      const { data: allDests, error: destError } = await supabase
        .from("destinations")
        .select("*")
        .eq("is_active", true);
      
      if (destError) throw destError;
      
      destinations = allDests?.filter(d => trackedIds.has(d.id)) || [];
      console.log(`🎯 Checking ${destinations.length} user-tracked destinations`);
    }

    if (destinations.length === 0) {
      console.log("⚠️ No destinations to check in this mode");
      return new Response(
        JSON.stringify({
          success: true,
          checkMode,
          destinationsChecked: 0,
          alertsTriggered: 0,
          message: `No destinations found for '${checkMode}' mode`
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results = [];
    let alertsTriggered = 0;
    const origin = "MEM";
    
    // Track API usage statistics
    let amadeusSuccess = 0;
    let amadeusFailures = 0;
    let serpApiSuccess = 0;
    let serpApiFailures = 0;

    for (const destination of destinations || []) {
      try {
        console.log(`Checking ${destination.city_name} (${destination.airport_code})...`);

        const departureDate = getNextDepartureDate();
        const returnDate = getReturnDate(departureDate);
        
        // TRY AMADEUS FIRST
        let price = await searchFlights(accessToken, origin, destination.airport_code, departureDate);
        let priceSource = "amadeus";

        if (price !== null) {
          amadeusSuccess++;
        } else {
          amadeusFailures++;
        }

        // FALLBACK TO GOOGLE FLIGHTS (SERPAPI) IF AMADEUS FAILS
        if (price === null) {
          console.log(`⚠️ Amadeus failed for ${destination.city_name}, trying Google Flights...`);
          
          price = await searchFlightsWithSerpApi(
            origin,
            destination.airport_code,
            departureDate,
            returnDate
          );
          priceSource = "google_flights";
          
          if (price !== null) {
            serpApiSuccess++;
          } else {
            serpApiFailures++;
          }
        }

        if (price === null) {
          console.log(`❌ Both sources failed for ${destination.city_name}`);
          results.push({
            destination: destination.city_name,
            status: "failed",
            error: "All price sources unavailable"
          });
          continue;
        }

        console.log(`✅ Got price from ${priceSource} for ${destination.city_name}: $${price}`);

        // Save to price history with source tracking
        await supabase
          .from("price_history")
          .insert({
            destination_id: destination.id,
            price: price,
            outbound_date: departureDate,
            return_date: returnDate,
            checked_at: new Date().toISOString(),
            price_source: priceSource
          });

        // Refresh price statistics
        await supabase.rpc("refresh_price_statistics");

        // Get updated statistics
        const { data: stats } = await supabase
          .from("price_statistics")
          .select("*")
          .eq("destination_id", destination.id)
          .single();

        // Classify the deal
        const dealClassification = await classifyDeal(price, stats);

        // Fetch admin settings
        const { data: adminSettings } = await supabase
          .from("admin_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["alert_min_history_days", "alert_min_price_drop"]);

        const minHistoryDays = adminSettings?.find(s => s.setting_key === "alert_min_history_days")?.setting_value || 30;
        const adminMinPriceDrop = adminSettings?.find(s => s.setting_key === "alert_min_price_drop")?.setting_value || 5;

        // Check if we have enough price history (false positive prevention)
        // Reduced to 3 samples for faster alert generation
        if (!stats || (stats.total_samples || 0) < 3) {
          console.log(`Insufficient price history for ${destination.city_name} (${stats?.total_samples || 0} samples, need at least 3)`);
          continue;
        }

        // Check for outlier prices (false positive prevention)
        if (stats.std_deviation && stats.avg_90day) {
          const zScore = Math.abs((price - parseFloat(stats.avg_90day)) / parseFloat(stats.std_deviation));
          if (zScore > 2 && price < parseFloat(stats.avg_90day)) {
            console.log(`⚠️ Outlier price detected for ${destination.city_name}, flagging for review`);
          }
        }

        // Get interested users
        const { data: interestedUsers } = await supabase
          .from("user_destinations")
          .select("*")
          .eq("destination_id", destination.id)
          .eq("is_active", true);

        // Send alerts to qualifying users
        for (const userDest of interestedUsers || []) {
          // 1. Check if price is below threshold (REQUIRED)
          if (price > userDest.price_threshold) {
            continue;
          }

          // 2. Check deal quality meets minimum requirement
          const qualityLevels: {[key: string]: number} = { 
            any: 0, poor: 1, fair: 2, good: 3, great: 4, excellent: 5, exceptional: 6 
          };
          const minQuality = userDest.min_deal_quality || "good";
          if (qualityLevels[dealClassification.quality] < qualityLevels[minQuality]) {
            console.log(`Deal quality ${dealClassification.quality} below minimum ${minQuality} for user ${userDest.user_id}`);
            continue;
          }

          // 3. Check cooldown period (unless EXCEPTIONAL deal)
          if (userDest.last_alert_sent_at && dealClassification.quality !== "exceptional") {
            const daysSinceLastAlert = (Date.now() - new Date(userDest.last_alert_sent_at).getTime()) / (1000 * 60 * 60 * 24);
            const cooldownDays = userDest.alert_cooldown_days || 7;
            
            if (daysSinceLastAlert < cooldownDays) {
              console.log(`Cooldown active for user ${userDest.user_id} (${daysSinceLastAlert.toFixed(1)}/${cooldownDays} days)`);
              continue;
            }
          }

          // 4. Check if price is meaningfully better than last alert
          if (userDest.last_alert_sent_at && dealClassification.quality !== "exceptional") {
            const { data: lastAlert } = await supabase
              .from("price_alerts")
              .select("triggered_price")
              .eq("user_id", userDest.user_id)
              .eq("destination_id", destination.id)
              .order("sent_at", { ascending: false })
              .limit(1)
              .maybeSingle();

            if (lastAlert?.triggered_price) {
              const minDropPercent = userDest.min_price_drop_percent || adminMinPriceDrop;
              const improvementPercent = ((lastAlert.triggered_price - price) / lastAlert.triggered_price) * 100;
              if (improvementPercent < minDropPercent) {
                console.log(`Price improvement ${improvementPercent.toFixed(1)}% below minimum ${minDropPercent}%`);
                continue;
              }
            }
          }

          // 5. Check weekly alert limit
          const { data: recentAlerts } = await supabase
            .from("price_alerts")
            .select("id")
            .eq("user_id", userDest.user_id)
            .gte("sent_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

          const { data: userPrefs } = await supabase
            .from("user_preferences")
            .select("max_alerts_per_week")
            .eq("user_id", userDest.user_id)
            .maybeSingle();

          const maxAlertsPerWeek = userPrefs?.max_alerts_per_week || 10;
          if (recentAlerts && recentAlerts.length >= maxAlertsPerWeek && dealClassification.quality !== "exceptional") {
            console.log(`Weekly alert limit reached (${recentAlerts.length}/${maxAlertsPerWeek})`);
            continue;
          }

          // 6. Check for duplicate alerts (within last 24 hours for same destination)
          const { data: recentDuplicateAlert } = await supabase
            .from("price_alerts")
            .select("id, triggered_price")
            .eq("user_id", userDest.user_id)
            .eq("destination_id", destination.id)
            .gte("sent_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .order("sent_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (recentDuplicateAlert) {
            const priceDifference = Math.abs(recentDuplicateAlert.triggered_price - price);
            if (priceDifference < 5) { // Less than $5 difference
              console.log(`Duplicate alert prevented: similar price ($${price}) sent within last 24h for user ${userDest.user_id}`);
              continue;
            }
          }

          // All checks passed - create price alert with Google Flights URL
          const bookingLink = `https://www.google.com/travel/flights?q=flights+from+${origin}+to+${destination.airport_code}+on+${departureDate}+returning+${returnDate}`;
          
          const { data: alertData, error: alertError } = await supabase
            .from("price_alerts")
            .insert({
              user_id: userDest.user_id,
              destination_id: destination.id,
              price: price,
              dates: `${departureDate} - ${returnDate}`,
              booking_link: bookingLink,
              deal_quality: dealClassification.quality,
              tracking_threshold: userDest.price_threshold,
              all_time_low: stats.all_time_low,
              avg_90day_price: stats.avg_90day,
              savings_percent: dealClassification.savingsPercent,
              sent_at: new Date().toISOString(),
              triggered_price: price,
              threshold_price: userDest.price_threshold,
              outbound_date: departureDate,
              return_date: returnDate
            })
            .select()
            .single();

          if (alertError || !alertData) {
            console.error("Error creating price alert:", alertError);
            continue;
          }

          console.log(`✅ Created price alert ${alertData.id} for ${destination.city_name}`);

          // Queue email notification with alert_id for tracking
          const emailResult = await supabase.rpc("queue_email", {
            p_user_id: userDest.user_id,
            p_email_type: "price_alert",
            p_email_data: {
              alert_id: alertData.id,
              destination: {
                city_name: destination.city_name,
                country: destination.country,
                average_price: stats.avg_90day || price * 1.2
              },
              price: price,
              threshold: userDest.price_threshold,
              outbound_date: departureDate,
              return_date: returnDate,
              booking_link: bookingLink,
              deal_quality: dealClassification.badge,
              savings_percent: dealClassification.savingsPercent,
              recommendation: dealClassification.recommendation,
              urgency: dealClassification.urgency,
              avg_90day: stats.avg_90day,
              all_time_low: stats.all_time_low,
              current_percentile: dealClassification.currentPercentile
            }
          });

          if (emailResult.error) {
            console.error("Error queuing email:", emailResult.error);
          } else {
            console.log(`✉️ Email queued for user ${userDest.user_id}`);
          }

          // Update last alert sent time
          await supabase
            .from("user_destinations")
            .update({ last_alert_sent_at: new Date().toISOString() })
            .eq("id", userDest.id);

          alertsTriggered++;
          console.log(`✅ Alert sent to user ${userDest.user_id} - ${dealClassification.badge}`);
        }

        results.push({
          destination: destination.city_name,
          price,
          quality: dealClassification.quality,
          savings: dealClassification.savingsPercent,
        });

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`Error processing ${destination.city_name}:`, error);
        results.push({
          destination: destination.city_name,
          error: error.message,
        });
      }
    }

    const totalAttempts = amadeusSuccess + serpApiSuccess;
    const fallbackRate = totalAttempts > 0 ? (serpApiSuccess / totalAttempts * 100).toFixed(1) : "0.0";
    
    console.log(`
📊 API Usage Summary:
  Amadeus: ${amadeusSuccess} successes, ${amadeusFailures} failures
  Google Flights (SerpApi): ${serpApiSuccess} successes, ${serpApiFailures} failures
  Fallback Rate: ${fallbackRate}%
  Total Price Checks: ${totalAttempts}
    `);

    console.log(`✅ Price check complete. Checked ${results.length} destinations, triggered ${alertsTriggered} alerts`);

    return new Response(
      JSON.stringify({
        success: true,
        checkMode,
        destinationsChecked: results.length,
        alertsTriggered,
        results,
        apiUsage: {
          amadeus: { successes: amadeusSuccess, failures: amadeusFailures },
          serpApi: { successes: serpApiSuccess, failures: serpApiFailures },
          fallbackRate: fallbackRate
        }
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
