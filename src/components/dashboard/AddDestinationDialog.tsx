import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
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
  region: string;
  average_price: number;
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
      // Get user's tracked destinations
      const { data: tracked } = await (supabase as any)
        .from('user_destinations')
        .select('destination_id')
        .eq('user_id', user.id);

      const trackedIds = (tracked || []).map((t: any) => t.destination_id);

      // Get all destinations not already tracked
      const { data, error } = await (supabase as any)
        .from('destinations')
        .select('*')
        .eq('is_active', true)
        .not('id', 'in', `(${trackedIds.join(',')})`);

      if (error) throw error;

      const typedData = (data || []).map((d: any) => ({
        id: d.id,
        city_name: d.city_name,
        country: d.country,
        airport_code: d.airport_code,
        region: d.region || 'Other',
        average_price: d.average_price || 500,
      }));

      setDestinations(typedData);
      setFilteredDestinations(typedData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load destinations',
        variant: 'destructive',
      });
    }
  };

  const handleSelectDestination = (dest: Destination) => {
    setSelectedDestination(dest);
    setThreshold(Math.round(dest.average_price * 0.8));
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
                    <span className="text-sm">Avg: ${Math.round(dest.average_price)}</span>
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
              <p className="text-sm mt-2">
                Average price: <span className="font-semibold">${Math.round(selectedDestination.average_price)}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Alert me when price drops below:</Label>
                <div className="text-2xl font-bold">${threshold}</div>
              </div>

              <Slider
                value={[threshold]}
                onValueChange={([value]) => setThreshold(value)}
                min={Math.round(selectedDestination.average_price * 0.5)}
                max={Math.round(selectedDestination.average_price * 1.5)}
                step={10}
                className="w-full"
              />

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${Math.round(selectedDestination.average_price * 0.5)}</span>
                <span>${Math.round(selectedDestination.average_price * 1.5)}</span>
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
