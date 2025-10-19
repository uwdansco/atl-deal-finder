import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
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
import { Search } from 'lucide-react';

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
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [threshold, setThreshold] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    threshold: number;
    reasoning: string;
    confidence: string;
  } | null>(null);

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

  const fetchAvailableDestinations = async () => {
    if (!user) return;

    try {
      console.log('Fetching available destinations for user:', user.id);
      
      // Get user's tracked destinations
      const { data: tracked, error: trackedError } = await (supabase as any)
        .from('user_destinations')
        .select('destination_id')
        .eq('user_id', user.id);

      console.log('Tracked destinations:', tracked, 'Error:', trackedError);

      const trackedIds = (tracked || []).map((t: any) => t.destination_id);
      console.log('Tracked IDs:', trackedIds);

      // Get all active destinations
      let query = (supabase as any)
        .from('destinations')
        .select('*')
        .eq('is_active', true);

      // Only filter out tracked destinations if user has any
      if (trackedIds.length > 0) {
        query = query.not('id', 'in', `(${trackedIds.join(',')})`);
      }

      const { data, error } = await query;

      console.log('Available destinations:', data, 'Error:', error);

      if (error) throw error;

      const typedData = (data || []).map((d: any) => ({
        id: d.id,
        city_name: d.city_name,
        country: d.country,
        airport_code: d.airport_code,
      }));

      console.log('Processed destinations:', typedData.length, 'destinations');
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
      console.log('Calling recommend-threshold for destination:', dest.id);
      const { data, error } = await supabase.functions.invoke('recommend-threshold', {
        body: { destination_id: dest.id }
      });

      console.log('AI Response:', { data, error });

      if (error) {
        console.error('Error from edge function:', error);
        throw error;
      }

      if (!data || !data.recommended_threshold) {
        throw new Error('Invalid response from AI function');
      }

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
    } catch (error: any) {
      console.error('Error getting AI recommendation:', error);
      // Fallback to default threshold
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-background max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Destination to Track</DialogTitle>
          <DialogDescription>
            {selectedDestination
              ? 'Set your price alert threshold'
              : 'Choose a destination to start tracking'}
          </DialogDescription>
        </DialogHeader>

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

            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {filteredDestinations.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => handleSelectDestination(dest)}
                  className="p-4 text-left rounded-lg border hover:border-primary transition-colors"
                >
                  <h3 className="font-semibold">{dest.city_name}</h3>
                  <p className="text-sm text-muted-foreground">{dest.country}</p>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="secondary">{dest.airport_code}</Badge>
                  </div>
                </button>
              ))}
            </div>
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
                min={200}
                max={1500}
                step={10}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>$200</span>
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
      </DialogContent>
    </Dialog>
  );
};
