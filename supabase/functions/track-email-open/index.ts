import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

const handler = async (req: Request): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const queueId = url.searchParams.get("queue_id");

    if (!queueId) {
      return new Response("Missing queue_id", { status: 400 });
    }

    // Get current email_data
    const { data: currentData } = await supabase
      .from("email_queue")
      .select("email_data")
      .eq("id", queueId)
      .single();

    const updatedData = {
      ...(currentData?.email_data || {}),
      email_opened: true,
    };

    // Update email queue with open tracking
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
        .update({ email_opened: true })
        .eq("id", queueItem.email_data.alert_id);
    }

    // Return 1x1 transparent pixel
    const pixel = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));
    
    return new Response(pixel, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("Error tracking email open:", error);
    // Still return pixel even on error
    const pixel = Uint8Array.from(atob("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"), c => c.charCodeAt(0));
    return new Response(pixel, {
      headers: { "Content-Type": "image/gif" },
    });
  }
};

serve(handler);
