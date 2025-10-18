import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailQueueItem {
  id: string;
  user_id: string;
  email_type: string;
  email_data: any;
  retry_count: number;
  max_retries: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Processing email queue...");

    // Fetch pending emails from queue
    const { data: queueItems, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(10);

    if (fetchError) throw fetchError;

    if (!queueItems || queueItems.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending emails", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${queueItems.length} emails to process`);

    const results = [];

    for (const item of queueItems as EmailQueueItem[]) {
      try {
        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(
          item.user_id
        );

        if (!userData.user?.email) {
          console.error(`No email found for user ${item.user_id}`);
          continue;
        }

        const userEmail = userData.user.email;
        const userName = userData.user.user_metadata?.full_name || "Traveler";

        // Generate tracking URLs
        const trackingPixelUrl = `${supabaseUrl}/functions/v1/track-email-open?queue_id=${item.id}`;
        const baseUrl = Deno.env.get("PUBLIC_URL") || "https://yourapp.lovable.app";

        let emailHtml = "";
        let emailSubject = "";

        // Generate email based on type
        switch (item.email_type) {
          case "welcome": {
            const destinations = item.email_data.destinations || [];
            emailSubject = "Welcome to Cheap Atlanta Flights! ✈️";
            emailHtml = generateWelcomeEmail({
              name: userName,
              destinations,
              dashboardUrl: `${baseUrl}/dashboard`,
              unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
            });
            break;
          }

          case "price_alert": {
            const data = item.email_data;
            emailSubject = `✈️ Price Alert: Atlanta to ${data.destination.city_name} - Now $${Math.round(data.price)}!`;
            
            const trackingBookingLink = `${supabaseUrl}/functions/v1/track-email-click?queue_id=${item.id}&url=${encodeURIComponent(data.booking_link)}`;
            
            emailHtml = generatePriceAlertEmail({
              name: userName,
              destination: data.destination,
              price: data.price,
              threshold: data.threshold,
              outbound_date: data.outbound_date,
              return_date: data.return_date,
              booking_link: trackingBookingLink,
              dashboardUrl: `${baseUrl}/dashboard`,
              pauseUrl: `${baseUrl}/dashboard/destinations`,
              unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
              trackingPixelUrl,
            });
            break;
          }

          default:
            console.warn(`Unknown email type: ${item.email_type}`);
            continue;
        }

        // Send email via Resend
        const { error: sendError } = await resend.emails.send({
          from: "Cheap Atlanta Flights <deals@updates.lovable.app>",
          to: [userEmail],
          subject: emailSubject,
          html: emailHtml,
        });

        if (sendError) throw sendError;

        // Mark as sent
        await supabase
          .from("email_queue")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({ id: item.id, status: "sent" });
        console.log(`Sent ${item.email_type} email to ${userEmail}`);
      } catch (error: any) {
        console.error(`Error processing email ${item.id}:`, error);

        // Update retry count
        const newRetryCount = item.retry_count + 1;
        const isFailed = newRetryCount >= item.max_retries;

        await supabase
          .from("email_queue")
          .update({
            status: isFailed ? "failed" : "pending",
            retry_count: newRetryCount,
            error_message: error.message,
          })
          .eq("id", item.id);

        results.push({
          id: item.id,
          status: isFailed ? "failed" : "retry",
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in process-email-queue:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Simple HTML email templates
function generateWelcomeEmail(props: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0;">✈️ Cheap Atlanta Flights</h1>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="color: #1E40AF; margin: 0 0 16px;">Welcome, ${props.name}! 🎉</h2>
      
      <p style="color: #333; font-size: 16px; line-height: 24px;">
        Thanks for joining! You're now tracking <strong>${props.destinations.length} destination${props.destinations.length !== 1 ? 's' : ''}</strong> from Atlanta.
      </p>

      ${props.destinations.length > 0 ? `
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="color: #1E40AF; margin: 0 0 12px;">Your Tracked Destinations:</h3>
        ${props.destinations.map((d: any) => `
          <p style="color: #333; margin: 8px 0;">
            <strong>${d.city_name}</strong> - Alert below $${Math.round(d.threshold)}
          </p>
        `).join('')}
      </div>
      ` : ''}

      <div style="background-color: #fff7ed; border-left: 4px solid #F97316; padding: 16px; margin: 24px 0;">
        <h3 style="color: #1E40AF; margin: 0 0 12px;">What happens next?</h3>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin: 8px 0;">We check prices daily across all your destinations</li>
          <li style="margin: 8px 0;">You'll get instant email alerts when prices drop</li>
          <li style="margin: 8px 0;">Each alert includes booking links and deal details</li>
        </ul>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${props.dashboardUrl}" style="background-color: #F97316; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; font-weight: bold;">
          View Dashboard
        </a>
      </div>
    </div>

    <div style="background-color: #f6f9fc; padding: 24px; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; margin: 4px 0;">
        <a href="${props.dashboardUrl}" style="color: #1E40AF;">Manage Destinations</a> |
        <a href="${props.unsubscribeUrl}" style="color: #1E40AF;">Unsubscribe</a>
      </p>
      <p style="color: #8898aa; font-size: 12px; margin: 4px 0;">
        © 2025 Cheap Atlanta Flights. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

function generatePriceAlertEmail(props: any): string {
  const savings = props.threshold - props.price;
  const percentBelow = Math.round(
    ((props.destination.average_price - props.price) / props.destination.average_price) * 100
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px;">🎯 PRICE ALERT!</h1>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="color: #1E40AF; margin: 0 0 16px;">Hi ${props.name},</h2>
      
      <p style="color: #333; font-size: 16px; line-height: 24px;">
        Great news! The price for flights from Atlanta to <strong>${props.destination.city_name}, ${props.destination.country}</strong> just dropped!
      </p>

      <div style="background-color: #fff7ed; border: 3px solid #F97316; border-radius: 12px; padding: 24px; margin: 24px 0;">
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #666;">Price dropped to:</span>
          <span style="color: #15803d; font-size: 32px; font-weight: bold;">$${Math.round(props.price)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #666;">Your threshold:</span>
          <span style="font-size: 18px;">$${Math.round(props.threshold)}</span>
        </div>
        <hr style="border-color: #F97316; margin: 16px 0;">
        <div style="display: flex; justify-content: space-between; margin: 12px 0;">
          <span style="color: #15803d; font-weight: bold;">You save:</span>
          <span style="color: #15803d; font-size: 24px; font-weight: bold;">$${Math.round(savings)}</span>
        </div>
      </div>

      ${props.outbound_date || props.return_date ? `
      <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h3 style="color: #1E40AF; margin: 0 0 8px;">Flight Details</h3>
        ${props.outbound_date ? `<p style="margin: 8px 0;"><strong>Outbound:</strong> ${props.outbound_date}</p>` : ''}
        ${props.return_date ? `<p style="margin: 8px 0;"><strong>Return:</strong> ${props.return_date}</p>` : ''}
        <p style="color: #666; font-size: 12px; margin: 12px 0 0;">💡 Tip: Flexible dates? Check nearby dates for even better prices!</p>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 32px 0;">
        <a href="${props.booking_link}" style="background-color: #F97316; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 18px;">
          View Flights & Book Now ✈️
        </a>
      </div>

      <div style="background-color: #eff6ff; border-left: 4px solid #1E40AF; padding: 16px; margin: 24px 0;">
        <p style="margin: 4px 0;">📊 This is <strong>${percentBelow}% below</strong> the average price of $${Math.round(props.destination.average_price)}</p>
        <p style="color: #dc2626; margin: 12px 0 0; font-weight: 500;">⚠️ Prices can change quickly. Book soon to lock in this deal!</p>
      </div>
    </div>

    <div style="background-color: #f6f9fc; padding: 24px; text-align: center;">
      <p style="color: #8898aa; font-size: 12px; margin: 4px 0;">
        <a href="${props.dashboardUrl}" style="color: #1E40AF;">Manage Destinations</a> |
        <a href="${props.pauseUrl}" style="color: #1E40AF;">Pause Alerts for ${props.destination.city_name}</a> |
        <a href="${props.unsubscribeUrl}" style="color: #1E40AF;">Unsubscribe</a>
      </p>
      <p style="color: #8898aa; font-size: 12px; margin: 4px 0;">
        © 2025 Cheap Atlanta Flights. All rights reserved.
      </p>
    </div>
  </div>
  <img src="${props.trackingPixelUrl}" width="1" height="1" alt="" />
</body>
</html>
  `;
}

serve(handler);
