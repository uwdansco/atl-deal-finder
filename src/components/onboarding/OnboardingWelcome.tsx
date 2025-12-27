import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plane, ArrowRight } from 'lucide-react';

interface OnboardingWelcomeProps {
  userName: string;
  onNext: () => void;
}

export const OnboardingWelcome = ({ userName, onNext }: OnboardingWelcomeProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center mb-8">
          <Plane className="h-16 w-16 text-primary mr-4" />
        </div>
        
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-4xl mb-2">
              Welcome to Cheap Memphis Flights{userName ? `, ${userName}` : ''}!
            </CardTitle>
            <CardDescription className="text-lg">
              Let's set up your personalized flight alerts in 2 easy steps
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6 text-left">
              <div className="p-6 rounded-lg bg-secondary">
                <h3 className="font-semibold text-lg mb-2">📍 Choose Destinations</h3>
                <p className="text-muted-foreground">
                  Select up to 10 destinations you'd like to track from Memphis
                </p>
              </div>
              <div className="p-6 rounded-lg bg-secondary">
                <h3 className="font-semibold text-lg mb-2">💰 Set Price Alerts</h3>
                <p className="text-muted-foreground">
                  We'll notify you when prices drop below your target
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-muted"></div>
              <div className="h-2 w-2 rounded-full bg-muted"></div>
            </div>
            <p className="text-sm text-muted-foreground">Step 1 of 3</p>
          </CardContent>
          
          <CardFooter className="justify-center">
            <Button onClick={onNext} size="lg" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
