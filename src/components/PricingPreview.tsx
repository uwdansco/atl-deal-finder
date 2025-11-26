import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

const PricingPreview = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your travel style. Both plans include unlimited destination tracking.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Plan Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Monthly Plan</CardTitle>
              <CardDescription>Perfect for flexible travelers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$4.99</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold">Track unlimited destinations</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Real-time price alerts</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>7-day free trial</span>
              </div>
            </CardContent>
          </Card>

          {/* Annual Plan Preview */}
          <Card className="border-primary shadow-lg relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
              Best Value
            </div>
            <CardHeader>
              <CardTitle className="text-2xl">Annual Plan</CardTitle>
              <CardDescription>Best for frequent travelers</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$39.99</span>
                <span className="text-muted-foreground">/year</span>
              </div>
              <p className="text-sm text-muted-foreground">Save $20/year</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold">Everything in Monthly</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="font-semibold">Booking Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>7-day free trial</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-8">
          <Button asChild size="lg" className="gap-2">
            <Link to="/pricing">
              View Full Pricing Details <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PricingPreview;
