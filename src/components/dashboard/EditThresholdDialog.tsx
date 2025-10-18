import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import type { TrackedDestination } from '@/pages/dashboard/MyDestinations';

interface EditThresholdDialogProps {
  destination: TrackedDestination;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const EditThresholdDialog = ({
  destination,
  open,
  onOpenChange,
  onSuccess,
}: EditThresholdDialogProps) => {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState(destination.price_threshold);
  const [loading, setLoading] = useState(false);

  const avgPrice = destination.destination.average_price;
  const minPrice = Math.round(avgPrice * 0.5);
  const maxPrice = Math.round(avgPrice * 1.5);

  const handleSave = async () => {
    setLoading(true);

    try {
      const { error } = await (supabase as any)
        .from('user_destinations')
        .update({ price_threshold: threshold })
        .eq('id', destination.id);

      if (error) throw error;

      toast({
        title: 'Success!',
        description: 'Price threshold updated',
      });

      onSuccess();
      onOpenChange(false);
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
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>Edit Price Threshold</DialogTitle>
          <DialogDescription>
            Update your price alert for {destination.destination.city_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">Average price</p>
            <p className="text-2xl font-bold">${Math.round(avgPrice)}</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Alert me when price drops below:</Label>
              <div className="text-2xl font-bold">${threshold}</div>
            </div>

            <Slider
              value={[threshold]}
              onValueChange={([value]) => setThreshold(value)}
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

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
