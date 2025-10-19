import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sparkles, Loader2 } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<{
    threshold: number;
    reasoning: string;
    confidence: string;
  } | null>(null);

  const avgPrice = destination.destination.average_price;
  const minPrice = Math.round(avgPrice * 0.5);
  const maxPrice = Math.round(avgPrice * 1.5);

  const getAIRecommendation = async () => {
    setLoadingAI(true);
    
    try {
      console.log('Getting AI recommendation for destination:', destination.destination_id);
      const { data, error } = await supabase.functions.invoke('recommend-threshold', {
        body: { destination_id: destination.destination_id }
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
      toast({
        title: 'AI Optimization Failed',
        description: 'Could not get AI recommendation. You can still adjust manually.',
        variant: 'destructive',
      });
    } finally {
      setLoadingAI(false);
    }
  };

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

          {/* AI Recommendation Button */}
          <Button 
            onClick={getAIRecommendation}
            disabled={loadingAI}
            variant="outline"
            className="w-full"
          >
            {loadingAI ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI analyzing prices...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Get AI-Optimized Threshold
              </>
            )}
          </Button>

          {/* AI Recommendation Display */}
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
