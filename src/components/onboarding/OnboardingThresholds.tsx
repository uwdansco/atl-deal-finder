import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import type { SelectedDestination } from '@/pages/Onboarding';

interface OnboardingThresholdsProps {
  selectedDestinations: SelectedDestination[];
  onNext: (destinations: SelectedDestination[]) => void;
  onBack: () => void;
}

export const OnboardingThresholds = ({ selectedDestinations, onNext, onBack }: OnboardingThresholdsProps) => {
  const [destinations, setDestinations] = useState(selectedDestinations);

  const updateThreshold = (id: string, threshold: number) => {
    setDestinations(prev => 
      prev.map(dest => dest.id === id ? { ...dest, threshold } : dest)
    );
  };

  const useSmartDefaults = () => {
    setDestinations(prev => 
      prev.map(dest => ({
        ...dest,
        threshold: Math.round((dest.average_price || 500) * 0.8)
      }))
    );
  };

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Set your price alerts</CardTitle>
            <CardDescription className="text-lg">
              We'll notify you when prices drop below these thresholds
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={useSmartDefaults} variant="outline" size="sm">
                Use smart defaults for all
              </Button>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {destinations.map(dest => {
                const avgPrice = dest.average_price || 500;
                const minPrice = Math.round(avgPrice * 0.5);
                const maxPrice = Math.round(avgPrice * 1.5);
                
                return (
                  <div key={dest.id} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {dest.city_name}, {dest.country}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Average price: ${Math.round(avgPrice)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Alert me when below:</div>
                        <Input
                          type="number"
                          value={dest.threshold}
                          onChange={(e) => updateThreshold(dest.id, parseInt(e.target.value) || 0)}
                          className="w-32 text-lg font-semibold"
                          min={minPrice}
                          max={maxPrice}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Slider
                        value={[dest.threshold]}
                        onValueChange={([value]) => updateThreshold(dest.id, value)}
                        min={minPrice}
                        max={maxPrice}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>${minPrice}</span>
                        <span>${maxPrice}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Step 3 of 3</p>
          </CardContent>
          
          <CardFooter className="justify-between">
            <Button onClick={onBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button onClick={() => onNext(destinations)} className="gap-2">
              Finish Setup <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
