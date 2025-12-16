import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import * as React from "https://esm.sh/react@18.3.1";
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22";
import { DealAlertEmail } from "../_shared/email-templates/deal-alert-email.tsx";

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
            emailSubject = "Welcome to Cheap Singapore Flights! ✈️";
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
            console.log(`Processing price alert for ${data.destination?.city_name || 'unknown destination'}`);
            
            emailSubject = `✈️ ${data.deal_quality || 'Price Alert'}: Singapore to ${data.destination.city_name} - Now $${Math.round(data.price)}!`;
            
            const trackingBookingLink = `${supabaseUrl}/functions/v1/track-email-click?queue_id=${item.id}&url=${encodeURIComponent(data.booking_link)}`;
            
            // Use improved HTML template with React Email styling
            emailHtml = generatePriceAlertEmailV2({
              name: userName,
              destination: data.destination,
              price: data.price,
              threshold: data.threshold,
              outbound_date: data.outbound_date,
              return_date: data.return_date,
              booking_link: trackingBookingLink,
              dashboardUrl: `${baseUrl}/dashboard`,
              unsubscribeUrl: `${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
              trackingPixelUrl,
              deal_quality: data.deal_quality,
              savings_percent: data.savings_percent,
              recommendation: data.recommendation,
              urgency: data.urgency,
              avg_90day: data.avg_90day,
              all_time_low: data.all_time_low,
            });
            break;
          }

          default:
            console.warn(`Unknown email type: ${item.email_type}`);
            continue;
        }

        // Send email via Resend with deliverability headers
        console.log(`Sending ${item.email_type} email to ${userEmail} with subject: ${emailSubject}`);
        
        // Get custom email domain from environment (or use default Resend domain)
        const emailFrom = Deno.env.get("EMAIL_FROM") || "Cheap Singapore Flights <onboarding@resend.dev>";
        
        const { data: sendData, error: sendError } = await resend.emails.send({
          from: emailFrom,
          to: [userEmail],
          subject: emailSubject,
          html: emailHtml,
          headers: {
            'X-Entity-Ref-ID': item.id,
            'List-Unsubscribe': `<${baseUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}>`,
          },
        });

        if (sendError) {
          console.error(`Resend error for ${userEmail}:`, sendError);
          throw sendError;
        }
        
        console.log(`✅ Email sent successfully to ${userEmail}, message ID: ${sendData?.id}`);

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

// Simple HTML email template for welcome emails
function generateWelcomeEmail(props: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cheap Singapore Flights</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%); padding: 32px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0;">✈️ Cheap Singapore Flights</h1>
    </div>
    
    <div style="padding: 32px;">
      <h2 style="color: #1E40AF; margin: 0 0 16px;">Welcome, ${props.name}! 🎉</h2>
      
      <p style="color: #333; font-size: 16px; line-height: 24px;">
        Thanks for joining! You're now tracking <strong>${props.destinations.length} destination${props.destinations.length !== 1 ? 's' : ''}</strong> from Singapore.
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
        © 2025 Cheap Singapore Flights. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

// Enhanced price alert email with better styling
function generatePriceAlertEmailV2(props: any): string {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const savings = props.avg_90day ? Math.round(props.avg_90day - props.price) : 0;
  const urgencyColor = props.urgency === 'high' ? '#dc2626' : props.urgency === 'moderate' ? '#f59e0b' : '#10b981';
  const urgencyText = props.urgency === 'high' ? '🔴 HIGH URGENCY - Book within 24 hours' : 
                      props.urgency === 'moderate' ? '🟡 MODERATE - Book within 3 days' : 
                      '🟢 LOW - You have time to consider';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Price Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #0066CC 0%, #0052A3 100%); padding: 24px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0 0 8px; font-size: 24px; font-weight: bold;">✈️ Cheap Singapore Flights</h1>
      <div style="background-color: #FF6B35; color: #ffffff; display: inline-block; font-size: 14px; font-weight: bold; padding: 6px 16px; border-radius: 20px; margin: 0;">
        ${props.deal_quality || 'GOOD DEAL'}
      </div>
    </div>

    <!-- Hero Section -->
    <div style="padding: 24px 48px; background-color: #f0f9ff; text-align: center;">
      <h2 style="color: #1E40AF; font-size: 20px; font-weight: bold; margin: 0;">
        ✈️ Your flight to ${props.destination.city_name} just got cheaper!
      </h2>
    </div>

    <!-- Content -->
    <div style="padding: 32px 48px;">
      <h2 style="color: #1E40AF; margin: 0 0 16px; font-size: 32px; font-weight: bold; text-align: center;">
        Singapore → ${props.destination.city_name}
      </h2>
      <p style="color: #737373; font-size: 18px; margin: 0 0 24px; text-align: center;">
        ${props.destination.country}
      </p>

      <!-- Price Context Box -->
      <div style="background-color: #f8fafc; border: 2px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <p style="fontSize: 12px; font-weight: bold; color: #64748b; letter-spacing: 1px; margin-bottom: 12px;">
          PRICE BREAKDOWN
        </p>
        <hr style="border-color: #e2e8f0; margin: 12px 0;">
        <p style="font-size: 14px; color: #334155; margin: 8px 0;">
          <strong>Current Price:</strong> <span style="color: #059669; font-size: 20px; font-weight: bold;">$${Math.round(props.price)}</span>
        </p>
        <p style="font-size: 14px; color: #334155; margin: 8px 0;">
          <strong>Your Threshold:</strong> $${Math.round(props.threshold)}
        </p>
        ${props.avg_90day ? `
        <p style="font-size: 14px; color: #334155; margin: 8px 0;">
          <strong>90-Day Average:</strong> $${Math.round(props.avg_90day)}
        </p>
        ` : ''}
        ${props.all_time_low ? `
        <p style="font-size: 14px; color: #334155; margin: 8px 0;">
          <strong>All-Time Low:</strong> $${Math.round(props.all_time_low)}
        </p>
        ` : ''}
        ${savings > 0 ? `
        <p style="font-size: 16px; margin: 12px 0; font-weight: bold;">
          <strong>Your Savings:</strong> <span style="color: #059669; font-size: 18px;">$${savings} (${props.savings_percent}%)</span>
        </p>
        ` : ''}
      </div>

      <!-- Urgency Indicator -->
      <div style="border: 2px solid ${urgencyColor}; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center;">
        <p style="font-size: 16px; font-weight: bold; margin: 0; color: ${urgencyColor};">${urgencyText}</p>
      </div>

      <!-- Recommendation -->
      ${props.recommendation ? `
      <p style="font-size: 15px; line-height: 24px; color: #475569; background-color: #fff7ed; padding: 16px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
        ${props.recommendation}
      </p>
      ` : ''}

      <!-- Flight Details -->
      <div style="background-color: #f0f9ff; border-radius: 8px; padding: 24px; margin: 24px 0;">
        <p style="font-size: 16px; margin: 8px 0; color: #333333;">
          <strong>✈️ Departure:</strong> ${formatDate(props.outbound_date)}
        </p>
        <p style="font-size: 16px; margin: 8px 0; color: #333333;">
          <strong>🏠 Return:</strong> ${formatDate(props.return_date)}
        </p>
        <p style="font-size: 16px; margin: 8px 0; color: #333333;">
          <strong>📍 From:</strong> Singapore (SIN)
        </p>
      </div>

      <!-- CTA Button -->
      <div style="padding: 32px 0; text-align: center;">
        <a href="${props.booking_link}" style="background-color: #FF6B35; border-radius: 8px; color: #ffffff; font-size: 18px; font-weight: bold; text-decoration: none; text-align: center; display: inline-block; padding: 16px 48px;">
          🎫 View Flights on Google →
        </a>
        <p style="color: #737373; font-size: 14px; margin: 12px 0 0; text-align: center;">
          Click to search flights with your dates pre-filled
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background-color: #f6f9fc; padding: 32px 48px; text-align: center;">
      <p style="color: #737373; font-size: 14px; margin: 8px 0;">
        You're receiving this because you subscribed to Cheap Singapore Flights price alerts.
      </p>
      <p style="font-size: 14px; margin: 16px 0 0;">
        <a href="${props.dashboardUrl}" style="color: #0066CC; text-decoration: underline;">Manage Destinations</a> |
        <a href="${props.unsubscribeUrl}" style="color: #0066CC; text-decoration: underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
  <img src="${props.trackingPixelUrl}" width="1" height="1" alt="" style="display:block" />
</body>
</html>
  `;
}

serve(handler);
