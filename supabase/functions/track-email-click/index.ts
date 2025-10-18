import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const queueId = url.searchParams.get("queue_id");
    const redirectUrl = url.searchParams.get("url");

    if (!queueId || !redirectUrl) {
      return new Response("Missing parameters", { status: 400 });
    }

    // Get current email_data
    const { data: currentData } = await supabase
      .from("email_queue")
      .select("email_data")
      .eq("id", queueId)
      .single();

    const updatedData = {
      ...(currentData?.email_data || {}),
      link_clicked: true,
    };

    // Update email queue with click tracking
    await supabase
      .from("email_queue")
      .update({ email_data: updatedData })
      .eq("id", queueId);

    // If this is a price alert, also update price_alerts table
    const { data: queueItem } = await supabase
      .from("email_queue")
      .select("email_type, email_data")
      .eq("id", queueId)
      .single();

    if (queueItem?.email_type === "price_alert" && queueItem.email_data?.alert_id) {
      await supabase
        .from("price_alerts")
        .update({ link_clicked: true })
        .eq("id", queueItem.email_data.alert_id);
    }

    // Redirect to the actual URL
    return Response.redirect(redirectUrl, 302);
  } catch (error: any) {
    console.error("Error tracking email click:", error);
    // Still redirect on error
    const url = new URL(req.url);
    const redirectUrl = url.searchParams.get("url");
    if (redirectUrl) {
      return Response.redirect(redirectUrl, 302);
    }
    return new Response("Error", { status: 500 });
  }
};

serve(handler);
