import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { DestinationCard } from '@/components/dashboard/DestinationCard';
import { AddDestinationDialog } from '@/components/dashboard/AddDestinationDialog';
import { EditThresholdDialog } from '@/components/dashboard/EditThresholdDialog';
import { Skeleton } from '@/components/ui/skeleton';

export type TrackedDestination = {
  id: string;
  destination_id: string;
  price_threshold: number;
  is_active: boolean;
  alert_cooldown_days: number;
  min_deal_quality: string | null;
  min_price_drop_percent: number | null;
  destination: {
    id: string;
    city_name: string;
    country: string;
    airport_code: string;
  };
  current_price?: number;
};

const MyDestinations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<TrackedDestination[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<TrackedDestination | null>(null);

  const MAX_DESTINATIONS = 10;

  const fetchDestinations = async () => {
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('user_destinations')
        .select(`
          *,
          destination:destinations(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch current prices
      const destinationsWithPrices = await Promise.all(
        (data || []).map(async (dest: any) => {
          const { data: priceData } = await (supabase as any)
            .from('price_history')
            .select('price')
            .eq('destination_id', dest.destination_id)
            .order('checked_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...dest,
            current_price: priceData?.price || null,
          };
        })
      );

      setDestinations(destinationsWithPrices);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load destinations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [user]);

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .from('user_destinations')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isActive ? 'Tracking paused' : 'Tracking resumed',
        description: 'Your destination has been updated.',
      });

      fetchDestinations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('user_destinations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Destination removed',
        description: 'The destination has been removed from tracking.',
      });

      fetchDestinations();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">My Destinations</h2>
          <p className="text-muted-foreground mt-1">Track flight prices to your preferred destinations</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} disabled={destinations.length >= MAX_DESTINATIONS}>
          <Plus className="h-4 w-4 mr-2" />
          Add Destination
        </Button>
      </div>

      {destinations.length === 0 ? (
        <div className="text-center py-16 bg-card rounded-lg border-2 border-dashed">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl font-semibold mb-2">Start Tracking Prices</h3>
            <p className="text-muted-foreground mb-6">
              Add destinations you want to travel to and set your ideal price. We'll alert you when prices drop.
            </p>
            <Button onClick={() => setAddDialogOpen(true)} size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Destination
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {destinations.length} of {MAX_DESTINATIONS} destinations
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <DestinationCard
                key={dest.id}
                destination={dest}
                onToggleActive={handleToggleActive}
                onEdit={() => setEditingDestination(dest)}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </div>
      )}

      <AddDestinationDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchDestinations}
        currentCount={destinations.length}
        maxCount={MAX_DESTINATIONS}
      />

      {editingDestination && (
        <EditThresholdDialog
          destination={editingDestination}
          open={!!editingDestination}
          onOpenChange={(open) => !open && setEditingDestination(null)}
          onSuccess={fetchDestinations}
        />
      )}
    </div>
  );
};

export default MyDestinations;
