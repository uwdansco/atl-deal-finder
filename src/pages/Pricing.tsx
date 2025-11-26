import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Choose Your Plan
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
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

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-foreground text-center mb-8">
              Frequently Asked Questions
            </h2>
            <Card>
              <CardContent className="pt-6">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="item-1">
                    <AccordionTrigger>What's included in the free trial?</AccordionTrigger>
                    <AccordionContent>
                      Both plans include a 7-day free trial with full access to all features. You can track unlimited destinations, receive price alerts, and access historical data. No credit card is required to start the trial.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-2">
                    <AccordionTrigger>How does the booking guarantee work?</AccordionTrigger>
                    <AccordionContent>
                      Annual plan subscribers get our Booking Guarantee: if you don't book a flight using our alerts within your subscription year, we'll refund your full subscription cost. Simply submit a claim before your subscription ends, and we'll process your refund within 7 business days.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-3">
                    <AccordionTrigger>Can I track unlimited destinations?</AccordionTrigger>
                    <AccordionContent>
                      Yes! Both monthly and annual plans allow you to track unlimited destinations worldwide. Set custom price thresholds for each destination and receive alerts when prices drop below your target.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-4">
                    <AccordionTrigger>Can I cancel anytime?</AccordionTrigger>
                    <AccordionContent>
                      Absolutely. You can cancel your subscription at any time from your account settings. Your access will continue until the end of your current billing period. No cancellation fees apply.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-5">
                    <AccordionTrigger>What payment methods do you accept?</AccordionTrigger>
                    <AccordionContent>
                      We accept all major credit cards (Visa, Mastercard, American Express, Discover) and debit cards. Payments are processed securely through Stripe.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-6">
                    <AccordionTrigger>What's the difference between monthly and annual plans?</AccordionTrigger>
                    <AccordionContent>
                      Both plans include unlimited destination tracking and real-time alerts. The annual plan saves you $20 per year and includes our exclusive Booking Guarantee. If you travel regularly, the annual plan offers the best value.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-7">
                    <AccordionTrigger>How often are prices updated?</AccordionTrigger>
                    <AccordionContent>
                      We monitor flight prices daily from Atlanta to destinations worldwide. When a price drops below your threshold, you'll receive an instant email alert so you can book before the deal expires.
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="item-8">
                    <AccordionTrigger>What if I need a refund?</AccordionTrigger>
                    <AccordionContent>
                      For annual plan subscribers, our Booking Guarantee provides a full refund if you don't book a flight within the year. Monthly subscriptions can be canceled anytime, and you won't be charged for future months. If you have concerns about your subscription, contact our support team.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center text-muted-foreground">
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
