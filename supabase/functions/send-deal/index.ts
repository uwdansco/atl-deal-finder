import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import React from 'https://esm.sh/react@18.3.1';
import { renderAsync } from 'https://esm.sh/@react-email/components@0.0.22';
import { DealAlertEmail } from '../_shared/email-templates/deal-alert-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendDealRequest {
  dealId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify admin access
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Unauthorized - admin access required");
    }

    const { dealId }: SendDealRequest = await req.json();

    // Get deal details with destination info
    const { data: deal, error: dealError } = await supabase
      .from("deals")
      .select(`
        *,
        destinations (
          city_name,
          country,
          airport_code
        )
      `)
      .eq("id", dealId)
      .single();

    if (dealError || !deal) {
      throw new Error("Deal not found");
    }

    if (deal.sent_to_subscribers) {
      throw new Error("Deal already sent to subscribers");
    }

    // Get active subscribers
    const { data: subscribers, error: subsError } = await supabase
      .from("subscribers")
      .select("email, name")
      .eq("is_active", true)
      .eq("is_verified", true);

    if (subsError) {
      throw new Error("Failed to fetch subscribers");
    }

    if (!subscribers || subscribers.length === 0) {
      throw new Error("No active subscribers found");
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://cheapatlantaflights.com";
    const subject = `🎯 Deal Alert: Singapore to ${deal.destinations.city_name} from $${deal.price}`;
    
    let sentCount = 0;

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const unsubscribeUrl = `${siteUrl}/unsubscribe`;

        // Render React Email template
        const emailHtml = await renderAsync(
          React.createElement(DealAlertEmail, {
            destination_city: deal.destinations.city_name,
            destination_country: deal.destinations.country,
            current_price: deal.price,
            user_threshold: deal.price, // For manual deals, use the deal price
            outbound_date: deal.outbound_date,
            return_date: deal.return_date,
            booking_link: deal.booking_link,
            unsubscribeUrl,
            deal_quality: '🎯 SPECIAL DEAL',
            savings_percent: 0,
            recommendation: 'Handpicked deal from our team!',
            urgency: 'moderate',
          })
        );

        const emailFrom = Deno.env.get("EMAIL_FROM") || "Cheap Singapore Flights <alerts@cheapatlantaflights.online>";
        await resend.emails.send({
          from: emailFrom,
          to: [subscriber.email],
          subject,
          html: emailHtml,
        });

        sentCount++;
      } catch (emailError) {
        console.error(`Failed to send to ${subscriber.email}:`, emailError);
      }
    }

    // Update deal status
    await supabase
      .from("deals")
      .update({ sent_to_subscribers: true, sent_at: new Date().toISOString() })
      .eq("id", dealId);

    // Record email sent
    await supabase.from("sent_emails").insert({
      deal_id: dealId,
      subscriber_count: sentCount,
      subject,
    });

    return new Response(
      JSON.stringify({ success: true, count: sentCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-deal function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
