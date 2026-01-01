import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import * as React from 'https://esm.sh/react@18.3.1';
import { renderToString } from 'https://esm.sh/react-dom@18.3.1/server';
import { WelcomeEmail } from '../_shared/email-templates/welcome-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WelcomeRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: WelcomeRequest = await req.json();

    console.log("Sending welcome email to:", email);

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get a recent deal to showcase
    const { data: recentDeal } = await supabase
      .from("deals")
      .select(`
        price,
        outbound_date,
        return_date,
        destinations (
          city_name,
          country,
          airport_code
        )
      `)
      .eq("sent_to_subscribers", true)
      .order("sent_at", { ascending: false })
      .limit(1)
      .single();

    const siteUrl = Deno.env.get("SITE_URL") || "https://cheapmemphisflights.com";
    const unsubscribeUrl = `${siteUrl}/unsubscribe`;

    let dealData = undefined;
    if (recentDeal && recentDeal.destinations) {
      const dest = recentDeal.destinations as any;
      const formatDate = (dateStr: string) => {
        try {
          const date = new Date(dateStr);
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        } catch {
          return dateStr;
        }
      };
      
      dealData = {
        destination: `${dest.city_name}, ${dest.country}`,
        price: recentDeal.price,
        dates: `${formatDate(recentDeal.outbound_date)} - ${formatDate(recentDeal.return_date)}`,
      };
    }

    // Render React Email template
    const emailHtml = renderToString(
      React.createElement(WelcomeEmail, {
        name,
        email,
        recentDeal: dealData,
        unsubscribeUrl,
      })
    );

    // Send welcome email
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Cheap Memphis Flights <noreply@cheapmemphisflights.online>";
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: "Welcome to Cheap Memphis Flights! ✈️",
      html: emailHtml,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Welcome email sent" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-welcome function:", error);
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
