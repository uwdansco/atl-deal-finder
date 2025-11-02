import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SEO } from "@/components/SEO";

const CheckEmail = () => {
  return (
    <>
      <SEO 
        title="Check Your Email"
        description="Verify your email to start receiving flight deal alerts from Atlanta."
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 px-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Check Your Email!</h1>
            <p className="text-muted-foreground">
              We've sent you a verification link. Click it to confirm your subscription and start receiving amazing flight deals from Atlanta.
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
            <p className="font-medium">What's next?</p>
            <ol className="text-left space-y-1 text-muted-foreground">
              <li>1. Check your inbox (and spam folder)</li>
              <li>2. Click the verification link</li>
              <li>3. Start receiving deal alerts!</li>
            </ol>
          </div>

          <div className="pt-4">
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <p className="text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or try signing up again.
          </p>
        </Card>
      </div>
    </>
  );
};

export default CheckEmail;
