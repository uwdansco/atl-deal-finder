import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";
import * as React from 'https://esm.sh/react@18.3.1';
import { renderToString } from 'https://esm.sh/react-dom@18.3.1/server';
import { VerificationEmail } from '../_shared/email-templates/verification-email.tsx';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationRequest {
  email: string;
  name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name }: VerificationRequest = await req.json();

    console.log("Processing verification request for:", email);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate verification token
    const verificationToken = crypto.randomUUID();

    // Check if email already exists
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, is_verified")
      .eq("email", email)
      .single();

    if (existing) {
      if (existing.is_verified) {
        return new Response(
          JSON.stringify({ error: "Email already subscribed and verified" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      } else {
        // Resend verification email
        const { error: updateError } = await supabase
          .from("subscribers")
          .update({ verification_token: verificationToken })
          .eq("id", existing.id);

        if (updateError) throw updateError;
      }
    } else {
      // Insert new subscriber
      const { error: insertError } = await supabase
        .from("subscribers")
        .insert([{
          email,
          name,
          verification_token: verificationToken,
          is_verified: false,
          is_active: false
        }]);

      if (insertError) throw insertError;
    }

    // Get site URL from environment or use default
    const siteUrl = Deno.env.get("SITE_URL") || "https://cheapatlantaflights.com";
    const verificationUrl = `${siteUrl}/verify?token=${verificationToken}`;
    const unsubscribeUrl = `${siteUrl}/unsubscribe`;

    // Render React Email template
    const emailHtml = renderToString(
      React.createElement(VerificationEmail, {
        verificationUrl,
        email,
        unsubscribeUrl,
      })
    );

    // Send verification email
    const emailFrom = Deno.env.get("EMAIL_FROM") || "Cheap Singapore Flights <noreply@cheapatlantaflights.online>";
    const emailResponse = await resend.emails.send({
      from: emailFrom,
      to: [email],
      subject: "Confirm your subscription to Cheap Singapore Flights",
      html: emailHtml,
    });

    if (emailResponse.error) {
      console.error("Resend API error:", emailResponse.error);
      throw new Error(`Failed to send email: ${emailResponse.error.message}`);
    }

    console.log("Verification email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Verification email sent" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-verification function:", error);
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
