import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Plane } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SEO } from '@/components/SEO';

const MONTHLY_PRICE_ID = 'price_1SQJu5Cm33gke1O8lp73P8iV'; // $4.99/month
const ANNUAL_PRICE_ID = 'price_1SQJvmCm33gke1O8QXGB4O3g'; // $39.99/year

const Pricing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSelectPlan = async (priceId: string, planName: string) => {
    try {
      setLoading(priceId);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        toast({
          title: 'Login Required',
          description: 'Please log in or sign up to subscribe.',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(null);
    }
  };

  return (
    <>
      <SEO
        title="Pricing - Cheap Atlanta Flights"
        description="Choose the perfect plan for your travel needs. Get real-time flight deal alerts from Atlanta with our monthly or annual subscription."
      />
      <div className="min-h-screen bg-gradient-hero">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <Plane className="h-12 w-12 text-primary mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-white mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Start your 7-day free trial. No credit card required during trial.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Monthly Plan */}
            <Card className="relative">
              <CardHeader>
                <CardTitle className="text-2xl">Monthly Plan</CardTitle>
                <CardDescription>Perfect for occasional travelers</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold text-primary">Track unlimited destinations worldwide</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Real-time price alerts to any destination</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Email notifications when prices drop below your threshold</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Historical price data and trends</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>7-day free trial</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(MONTHLY_PRICE_ID, 'Monthly')}
                  disabled={loading === MONTHLY_PRICE_ID}
                >
                  {loading === MONTHLY_PRICE_ID ? 'Processing...' : 'Start Free Trial'}
                </Button>
              </CardFooter>
            </Card>

            {/* Annual Plan */}
            <Card className="relative border-primary shadow-lg">
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                Best Value
              </Badge>
              <CardHeader>
                <CardTitle className="text-2xl">Annual Plan</CardTitle>
                <CardDescription>Save $20/year + booking guarantee</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$39.99</span>
                  <span className="text-muted-foreground">/year</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  ($3.33/month)
                </p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold text-primary">Track unlimited destinations worldwide</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Real-time price alerts to any destination</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">Booking Guarantee: Full refund if you don't book a flight within the year</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Historical price data and trends</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Save $20 compared to monthly plan</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>7-day free trial</span>
                  </li>
                  <li className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>Cancel anytime</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleSelectPlan(ANNUAL_PRICE_ID, 'Annual')}
                  disabled={loading === ANNUAL_PRICE_ID}
                >
                  {loading === ANNUAL_PRICE_ID ? 'Processing...' : 'Start Free Trial'}
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="mt-12 text-center text-white/80">
            <p className="text-sm">
              By subscribing, you agree to our Terms of Service and Refund Policy.
            </p>
            <p className="text-sm mt-2">
              Your subscription will automatically renew after the trial period unless canceled.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Pricing;
