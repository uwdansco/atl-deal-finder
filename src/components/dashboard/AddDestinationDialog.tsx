import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { Sparkles, Loader2, Plus, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Destination = {
  id: string;
  city_name: string;
  country: string;
  airport_code: string;
};

interface AddDestinationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  currentCount: number;
  maxCount: number;
}

export const AddDestinationDialog = ({
  open,
  onOpenChange,
  onSuccess,
  currentCount,
  maxCount,
}: AddDestinationDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isActive, isGrandfathered } = useSubscription();

  const [threshold, setThreshold] = useState(500);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    threshold: number;
    reasoning: string;
    confidence: string;
    has_historical_data?: boolean;
    data_samples?: number;
  } | null>(null);

  // New destination form
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newAirportCode, setNewAirportCode] = useState('');

  const hasAccess = isActive || isGrandfathered;

  // Auto-suggest threshold when user types new destination
  useEffect(() => {
    const getSuggestion = async () => {
      if (!newCity.trim() || !newCountry.trim()) {
        setAiRecommendation(null);
        return;
      }

      setLoadingAI(true);
      try {
        const { data, error } = await supabase.functions.invoke('suggest-threshold', {
          body: {
            city: newCity.trim(),
            country: newCountry.trim(),
            airport_code: newAirportCode.trim(),
          },
        });

        if (error) throw error;

        if (data && data.recommended_threshold) {
          setAiRecommendation({
            threshold: data.recommended_threshold,
            reasoning: data.reasoning,
            confidence: data.confidence,
            has_historical_data: data.has_historical_data,
            data_samples: data.data_samples,
          });
          setThreshold(data.recommended_threshold);
          toast({
            title: data.has_historical_data 
              ? `AI analyzed ${data.data_samples} price samples` 
              : "AI recommendation generated",
            description: data.reasoning,
          });
        }
      } catch (error: any) {
        console.error('Error getting AI suggestion:', error);
        setAiRecommendation(null);
      } finally {
        setLoadingAI(false);
      }
    };

    const timeoutId = setTimeout(getSuggestion, 1000);
    return () => clearTimeout(timeoutId);
  }, [newCity, newCountry, newAirportCode]);

  const handleAddNewDestination = async () => {
    if (!user || !newCity.trim() || !newCountry.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide city and country names',
        variant: 'destructive',
      });
      return;
    }

    if (currentCount >= maxCount) {
      toast({
        title: 'Limit reached',
        description: 'Upgrade to Pro to track unlimited destinations',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let destinationId: string;
      const airportCode = newAirportCode.trim().toUpperCase() || null;

      // Check if destination already exists (by airport code or city/country combination)
      let existingDest: Destination | null = null;

      if (airportCode && airportCode !== 'N/A') {
        const { data: byAirport } = await (supabase as any)
          .from('destinations')
          .select('id')
          .eq('airport_code', airportCode)
          .maybeSingle();
        existingDest = byAirport;
      }

      if (!existingDest) {
        const { data: byCity } = await (supabase as any)
          .from('destinations')
          .select('id')
          .eq('city_name', newCity.trim())
          .eq('country', newCountry.trim())
          .maybeSingle();
        existingDest = byCity;
      }

      if (existingDest) {
        destinationId = existingDest.id;
      } else {
        const { data: destData, error: destError } = await (supabase as any)
          .from('destinations')
          .insert({
            city_name: newCity.trim(),
            country: newCountry.trim(),
            airport_code: airportCode || `${newCity.trim().substring(0, 3).toUpperCase()}`,
            priority: 999,
            is_active: true,
          })
          .select()
          .single();

        if (destError) throw destError;
        destinationId = destData.id;
      }

      const { error: trackError } = await (supabase as any)
        .from('user_destinations')
        .insert({
          user_id: user.id,
          destination_id: destinationId,
          price_threshold: threshold || 500,
          is_active: true,
        });

      if (trackError) throw trackError;

      toast({
        title: 'Success!',
        description: `Now tracking ${newCity}`,
      });

      onSuccess();
      onOpenChange(false);
      setNewCity('');
      setNewCountry('');
      setNewAirportCode('');
      setThreshold(500);
      setAiRecommendation(null);
    } catch (error: any) {
      console.error('Error adding destination:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Destination to Track</DialogTitle>
          <DialogDescription>
            {hasAccess
              ? 'Add a new destination you want to track. We will monitor prices for you.'
              : 'Subscription required to add destinations'}
          </DialogDescription>
        </DialogHeader>

        {!hasAccess ? (
          <div className="space-y-4">
            <Alert>
              <CreditCard className="h-4 w-4" />
              <AlertDescription>
                You need an active subscription to add destinations and receive price alerts.
              </AlertDescription>
            </Alert>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={() => (window.location.href = '/pricing')} className="flex-1">
                View Plans
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City Name *</Label>
                  <Input
                    id="city"
                    placeholder="e.g., Dallas, Tokyo, Paris"
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Input
                    id="country"
                    placeholder="e.g., USA, Japan, France"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="airport">Airport Code (Optional)</Label>
                  <Input
                    id="airport"
                    placeholder="e.g., DFW, NRT, CDG"
                    value={newAirportCode}
                    onChange={(e) => setNewAirportCode(e.target.value)}
                    maxLength={3}
                  />
                </div>
              </div>

              <div className="space-y-4">
                {loadingAI ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI analyzing destination...</span>
                  </div>
                ) : (
                  <>
                    {aiRecommendation && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 space-y-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">AI Recommendation</span>
                          {aiRecommendation.has_historical_data && (
                            <Badge variant="default" className="text-xs">
                              {aiRecommendation.data_samples} samples
                            </Badge>
                          )}
                          <Badge
                            variant={
                              aiRecommendation.confidence === 'high' ? 'default' : 'secondary'
                            }
                            className="text-xs"
                          >
                            {aiRecommendation.confidence}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                          {aiRecommendation.reasoning}
                        </p>
                        {aiRecommendation.has_historical_data && (
                          <p className="text-xs text-primary font-medium">
                            Based on real price history
                          </p>
                        )}
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Price alert threshold:</Label>
                        <div className="text-2xl font-bold">${threshold || 500}</div>
                      </div>
                      <Slider
                        value={[threshold || 500]}
                        onValueChange={([value]) => setThreshold(value)}
                        min={50}
                        max={1500}
                        step={10}
                        className="w-full"
                        disabled={loadingAI}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>$50</span>
                        <span>$1500</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAddNewDestination}
                disabled={loading || !newCity.trim() || !newCountry.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add & Track Destination
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
