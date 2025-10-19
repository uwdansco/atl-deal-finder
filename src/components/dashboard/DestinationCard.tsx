import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { TrackedDestination } from '@/pages/dashboard/MyDestinations';

interface DestinationCardProps {
  destination: TrackedDestination;
  onToggleActive: (id: string, isActive: boolean) => void;
  onEdit: () => void;
  onRemove: (id: string) => void;
}

export const DestinationCard = ({
  destination,
  onToggleActive,
  onEdit,
  onRemove,
}: DestinationCardProps) => {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  const currentPrice = destination.current_price;
  const threshold = destination.price_threshold;

  const getPriceTrend = () => {
    if (!currentPrice || !threshold) return 'neutral';
    if (currentPrice < threshold * 0.9) return 'down';
    if (currentPrice > threshold * 1.1) return 'up';
    return 'neutral';
  };

  const trend = getPriceTrend();

  return (
    <>
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">
                {destination.destination.city_name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {destination.destination.country} ({destination.destination.airport_code})
              </p>
            </div>
            <Badge variant={destination.is_active ? 'default' : 'secondary'}>
              {destination.is_active ? 'Active' : 'Paused'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Price */}
          <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Current Price</p>
              <p className="text-2xl font-bold">
                ${currentPrice ? Math.round(currentPrice) : '—'}
              </p>
            </div>
            {trend === 'down' && <TrendingDown className="h-8 w-8 text-green-500" />}
            {trend === 'up' && <TrendingUp className="h-8 w-8 text-destructive" />}
            {trend === 'neutral' && <Minus className="h-8 w-8 text-muted-foreground" />}
          </div>

          {/* Threshold */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your threshold:</span>
            <span className="font-semibold">${Math.round(threshold)}</span>
          </div>

          {/* Price below threshold indicator */}
          {currentPrice && currentPrice <= threshold && (
            <Badge variant="destructive" className="w-full justify-center">
              🎯 Price below your threshold!
            </Badge>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-2">
              <Switch
                checked={destination.is_active}
                onCheckedChange={() => onToggleActive(destination.id, destination.is_active)}
              />
              <span className="text-sm">{destination.is_active ? 'Tracking' : 'Paused'}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRemoveDialog(true)}
                className="text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent className="bg-background">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove destination?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to stop tracking {destination.destination.city_name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onRemove(destination.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
