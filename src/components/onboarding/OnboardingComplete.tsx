import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface OnboardingCompleteProps {
  destinationCount: number;
  onFinish: () => void;
  loading: boolean;
}

export const OnboardingComplete = ({ destinationCount, onFinish, loading }: OnboardingCompleteProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <Card className="text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-24 w-24 text-green-500" />
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold mb-3">You're all set! 🎉</h1>
              <p className="text-xl text-muted-foreground">
                We're now monitoring {destinationCount} destination{destinationCount !== 1 ? 's' : ''} for you
              </p>
            </div>
            
            <div className="max-w-md mx-auto space-y-4 text-left bg-secondary p-6 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="text-2xl">📧</div>
                <div>
                  <h3 className="font-semibold mb-1">Email Alerts</h3>
                  <p className="text-sm text-muted-foreground">
                    You'll receive email alerts when prices drop below your targets
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-2xl">📊</div>
                <div>
                  <h3 className="font-semibold mb-1">Price Tracking</h3>
                  <p className="text-sm text-muted-foreground">
                    We monitor prices daily to find you the best deals
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="text-2xl">⚙️</div>
                <div>
                  <h3 className="font-semibold mb-1">Manage Anytime</h3>
                  <p className="text-sm text-muted-foreground">
                    You can update your destinations and price thresholds from your dashboard
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="justify-center">
            <Button onClick={onFinish} size="lg" disabled={loading}>
              {loading ? 'Setting up...' : 'Go to Dashboard'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
