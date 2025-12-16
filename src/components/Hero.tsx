import { Mail, LogIn, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import heroPlane from "@/assets/hero-plane.jpg";

const Hero = () => {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate('/');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted", { email, name });
    
    if (!email || !name) {
      console.log("Validation failed: missing email or name");
      toast({
        title: "Missing information",
        description: "Please enter both your name and email",
        variant: "destructive",
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Validation failed: invalid email format");
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    console.log("Starting subscription process...");
    setIsLoading(true);

    try {
      console.log("Calling send-verification edge function...");
      // Call edge function to handle subscription and send verification email
      const { data, error } = await supabase.functions.invoke("send-verification", {
        body: { email, name },
      });
      console.log("Edge function response:", { data, error });

      if (error) {
        console.log("Subscription error from edge function:", error);
        if (error.message?.includes("already subscribed")) {
          toast({
            title: "Already subscribed!",
            description: "This email is already verified. Check your inbox for deals!",
          });
        } else {
          throw error;
        }
      } else {
        console.log("Subscription successful!");
        setEmail("");
        setName("");
        // Redirect to check email page
        navigate('/check-email');
      }
    } catch (error) {
      console.error("Subscription error:", error);
      toast({
        title: "Oops!",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroPlane} 
          alt="Airplane flying through blue sky" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/20 via-primary/40 to-background/95" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20 mx-auto text-center">
        {/* Top Navigation */}
        <div className="absolute top-4 right-4 flex gap-2">
          {user ? (
            <>
              <Button asChild className="bg-gradient-sunset">
                <Link to="/dashboard/destinations">
                  <User className="h-4 w-4 mr-2" />
                  My Dashboard
                </Link>
              </Button>
              {isAdmin && (
                <Button asChild variant="outline" className="bg-card/80 backdrop-blur-sm">
                  <Link to="/admin">
                    <LogIn className="h-4 w-4 mr-2" />
                    Admin Dashboard
                  </Link>
                </Button>
              )}
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                className="bg-card/80 backdrop-blur-sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="bg-card/60 backdrop-blur-sm">
                <Link to="/pricing">
                  Pricing
                </Link>
              </Button>
              <Button asChild variant="outline" className="bg-card/80 backdrop-blur-sm">
                <Link to="/login">
                  <LogIn className="h-4 w-4 mr-2" />
                  Login
                </Link>
              </Button>
              <Button asChild className="bg-gradient-sunset">
                <Link to="/signup">
                  <User className="h-4 w-4 mr-2" />
                  Sign Up
                </Link>
              </Button>
            </>
          )}
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <span className="text-sm font-semibold text-accent">✈️ Singapore's #1 Flight Deal Newsletter</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold leading-tight">
            <span className="text-foreground drop-shadow-lg">Cheap Flights from</span>
            <br />
            <span className="text-foreground drop-shadow-lg">
              Singapore <span className="text-accent">(SIN)</span>
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Get real-time price alerts for your favorite destinations.
            <span className="font-semibold text-foreground"> Save hundreds on your next adventure.</span>
          </p>

          {/* CTA Button */}
          <div className="max-w-2xl mx-auto">
            <Button 
              asChild
              size="lg" 
              className="h-16 px-12 text-xl font-semibold bg-gradient-sunset hover:opacity-90 transition-opacity"
            >
              <Link to="/pricing">
                <Mail className="mr-2 h-6 w-6" />
                Start 7-Day Free Trial
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              $4.99/month or $39.99/year with booking guarantee. Cancel anytime.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 pt-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">5,000+ Subscribers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Any Destination</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-muted-foreground">Daily Price Tracking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
