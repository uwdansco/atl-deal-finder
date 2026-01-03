import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VerifyTokenResponse {
  success: boolean;
  error?: string;
  already_verified?: boolean;
  email?: string;
  name?: string;
}

const Verify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. No token provided.");
        return;
      }

      try {
        // Use the secure RPC function to verify token
        const { data, error } = await supabase.rpc("verify_subscriber_token", {
          p_token: token,
        }) as { data: VerifyTokenResponse | null; error: Error | null };

        if (error) {
          console.error("Verification RPC error:", error);
          setStatus("error");
          setMessage("An error occurred during verification. Please try again or contact support.");
          return;
        }

        if (!data.success) {
          setStatus("error");
          setMessage(data.error || "Invalid or expired verification link. Please try subscribing again.");
          return;
        }

        if (data.already_verified) {
          setStatus("success");
          setMessage("Your email is already verified! You're all set to receive flight deals.");
          return;
        }

        // Send welcome email
        try {
          await supabase.functions.invoke("send-welcome", {
            body: {
              email: data.email,
              name: data.name,
            },
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
          // Don't fail verification if welcome email fails
        }

        setStatus("success");
        setMessage("🎉 Success! Your subscription is now active. Check your inbox for a welcome email with more details!");

        // Redirect to homepage after 5 seconds
        setTimeout(() => {
          navigate("/");
        }, 5000);
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("error");
        setMessage("An error occurred during verification. Please try again or contact support.");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-card rounded-2xl shadow-xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 mx-auto text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Verifying your email...
            </h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your subscription.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="h-16 w-16 mx-auto text-accent mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Email Verified! ✈️
            </h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <p className="text-sm text-muted-foreground">
              Redirecting you to the homepage in 5 seconds...
            </p>
            <Button
              onClick={() => navigate("/")}
              className="mt-6 bg-gradient-sunset"
            >
              Go to Homepage Now
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">
              Verification Failed
            </h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Button
              onClick={() => navigate("/")}
              className="bg-gradient-sunset"
            >
              Return to Homepage
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default Verify;
