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
import { Search } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const { isActive, isGrandfathered, isTrialing } = useSubscription();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [threshold, setThreshold] = useState(500);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    threshold: number;
    reasoning: string;
    confidence: string;
  } | null>(null);
  
  // New destination form
  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');
  const [newAirportCode, setNewAirportCode] = useState('');
  const [newDestAiRecommendation, setNewDestAiRecommendation] = useState<{
    threshold: number;
    reasoning: string;
    confidence: string;
  } | null>(null);

  // Check subscription status
  const hasAccess = isActive || isGrandfathered;

  useEffect(() => {
    if (open) {
      fetchAvailableDestinations();
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery) {
      setFilteredDestinations(
        destinations.filter(
          (dest) =>
            dest.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
            dest.airport_code.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    } else {
      setFilteredDestinations(destinations);
    }
  }, [searchQuery, destinations]);

  // Auto-suggest threshold when user types new destination
  useEffect(() => {
    const getSuggestion = async () => {
      if (!newCity.trim() || !newCountry.trim()) {
        setNewDestAiRecommendation(null);
        return;
      }

      setLoadingAI(true);
      try {
        console.log('Getting AI suggestion for new destination:', { newCity, newCountry, newAirportCode });
        const { data, error } = await supabase.functions.invoke('suggest-threshold', {
          body: {
            city: newCity.trim(),
            country: newCountry.trim(),
            airport_code: newAirportCode.trim(),
          }
        });

        console.log('AI suggestion response:', { data, error });

        if (error) throw error;

        if (data && data.recommended_threshold) {
          setNewDestAiRecommendation({
            threshold: data.recommended_threshold,
            reasoning: data.reasoning,
            confidence: data.confidence,
          });
          setThreshold(data.recommended_threshold);
        }
      } catch (error: any) {
        console.error('Error getting AI suggestion:', error);
        setNewDestAiRecommendation(null);
      } finally {
        setLoadingAI(false);
      }
    };

    // Debounce the API call
    const timeoutId = setTimeout(getSuggestion, 1000);
    return () => clearTimeout(timeoutId);
  }, [newCity, newCountry, newAirportCode]);

  const fetchAvailableDestinations = async () => {
    if (!user) return;

    try {
      const { data: tracked, error: trackedError } = await (supabase as any)
        .from('user_destinations')
        .select('destination_id')
        .eq('user_id', user.id);

      const trackedIds = (tracked || []).map((t: any) => t.destination_id);

      let query = (supabase as any)
        .from('destinations')
        .select('*')
        .eq('is_active', true);

      if (trackedIds.length > 0) {
        query = query.not('id', 'in', `(${trackedIds.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []).map((d: any) => ({
        id: d.id,
        city_name: d.city_name,
        country: d.country,
        airport_code: d.airport_code,
      }));

      setDestinations(typedData);
      setFilteredDestinations(typedData);
    } catch (error: any) {
      console.error('Error loading destinations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load destinations',
        variant: 'destructive',
      });
    }
  };

  const handleSelectDestination = async (dest: Destination) => {
    setSelectedDestination(dest);
    setLoadingAI(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('recommend-threshold', {
        body: { destination_id: dest.id }
      });

      if (error) throw error;

      if (data && data.recommended_threshold) {
        setAiRecommendation({
          threshold: data.recommended_threshold,
          reasoning: data.reasoning,
          confidence: data.confidence,
        });
        setThreshold(data.recommended_threshold);
        
        toast({
          title: '✨ AI Recommendation Ready',
          description: data.reasoning,
        });
      }
    } catch (error: any) {
      console.error('Error getting AI recommendation:', error);
      const fallbackThreshold = 500;
      setThreshold(fallbackThreshold);
      setAiRecommendation({
        threshold: fallbackThreshold,
        reasoning: 'Using default threshold value',
        confidence: 'low',
      });
      
      toast({
        title: 'Using Default Threshold',
        description: 'AI recommendation unavailable, using default value',
        variant: 'destructive',
      });
    } finally {
      setLoadingAI(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedDestination || !user) return;

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
      const { error } = await (supabase as any)
        .from('user_destinations')
        .insert({
          user_id: user.id,
          destination_id: selectedDestination.id,
          price_threshold: threshold,
          is_active: true,
        });

      if (error) throw error;

      toast({
        title: 'Success!',
        description: `Now tracking ${selectedDestination.city_name}`,
      });

      onSuccess();
      onOpenChange(false);
      setSelectedDestination(null);
      setSearchQuery('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

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
      let existingDest = null;
      
      if (airportCode && airportCode !== 'N/A') {
        const { data: byAirport } = await (supabase as any)
          .from('destinations')
          .select('id')
          .eq('airport_code', airportCode)
          .single();
        existingDest = byAirport;
      }
      
      if (!existingDest) {
        const { data: byCity } = await (supabase as any)
          .from('destinations')
          .select('id')
          .eq('city_name', newCity.trim())
          .eq('country', newCountry.trim())
          .single();
        existingDest = byCity;
      }

      if (existingDest) {
        // Use existing destination
        destinationId = existingDest.id;
      } else {
        // Create new destination
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

      // Now track it
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
            {hasAccess ? 'Choose an existing destination or add a new one' : 'Subscription required to add destinations'}
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
              <Button onClick={() => window.location.href = '/pricing'} className="flex-1">
                View Plans
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="existing" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing">Existing Destinations</TabsTrigger>
            <TabsTrigger value="new">Add New Destination</TabsTrigger>
          </TabsList>

          <TabsContent value="existing" className="space-y-4 mt-4">
            {!selectedDestination ? (
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search destinations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {filteredDestinations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchQuery ? 'No destinations found matching your search' : 'No destinations available'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                    {filteredDestinations.map((dest) => (
                      <button
                        key={dest.id}
                        onClick={() => handleSelectDestination(dest)}
                        className="p-4 text-left rounded-lg border border-border hover:border-primary hover:bg-accent transition-colors"
                      >
                        <h3 className="font-semibold">{dest.city_name}</h3>
                        <p className="text-sm text-muted-foreground">{dest.country}</p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary">{dest.airport_code}</Badge>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-secondary rounded-lg">
                  <h3 className="font-semibold text-lg">{selectedDestination.city_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedDestination.country} ({selectedDestination.airport_code})
                  </p>
                </div>

                <div className="space-y-4">
                  {loadingAI ? (
                    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>AI analyzing price patterns...</span>
                    </div>
                  ) : (
                    <>
                      {aiRecommendation && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">AI Recommendation</span>
                            <Badge variant={aiRecommendation.confidence === 'high' ? 'default' : 'secondary'} className="text-xs">
                              {aiRecommendation.confidence} confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground italic">{aiRecommendation.reasoning}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <Label>Alert me when price drops below:</Label>
                        <div className="text-2xl font-bold">${threshold}</div>
                      </div>
                    </>
                  )}

                  <Slider
                    value={[threshold]}
                    onValueChange={([value]) => setThreshold(value)}
                    min={50}
                    max={1500}
                    step={10}
                    className="w-full"
                  />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$50</span>
                    <span>$1500</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setSelectedDestination(null)} className="flex-1">
                    Back
                  </Button>
                  <Button onClick={handleAdd} disabled={loading} className="flex-1">
                    {loading ? 'Adding...' : 'Add Destination'}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-4">
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

              <div className="space-y-4 pt-4">
                {loadingAI ? (
                  <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>AI analyzing destination...</span>
                  </div>
                ) : (
                  <>
                    {newDestAiRecommendation && (
                      <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">AI Recommendation</span>
                          <Badge variant={newDestAiRecommendation.confidence === 'high' ? 'default' : 'secondary'} className="text-xs">
                            {newDestAiRecommendation.confidence} confidence
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground italic">{newDestAiRecommendation.reasoning}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <Label>Price alert threshold:</Label>
                      <div className="text-2xl font-bold">${threshold || 500}</div>
                    </div>
                  </>
                )}

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

              <Button 
                onClick={handleAddNewDestination} 
                disabled={loading || !newCity.trim() || !newCountry.trim()}
                className="w-full"
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
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
