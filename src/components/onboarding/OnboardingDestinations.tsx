import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, ArrowLeft, Search } from 'lucide-react';
import type { Destination, SelectedDestination } from '@/pages/Onboarding';

interface OnboardingDestinationsProps {
  selectedDestinations: SelectedDestination[];
  onNext: (destinations: SelectedDestination[]) => void;
  onBack: () => void;
}

export const OnboardingDestinations = ({ selectedDestinations, onNext, onBack }: OnboardingDestinationsProps) => {
  const { toast } = useToast();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [filteredDestinations, setFilteredDestinations] = useState<Destination[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedDestinations.map(d => d.id)));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const MAX_SELECTIONS = 10;

  useEffect(() => {
    const fetchDestinations = async () => {
      const { data, error } = await supabase
        .from('destinations')
        .select('*')
        .eq('is_active', true);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to load destinations',
          variant: 'destructive',
        });
        return;
      }

      // Map data to ensure all required fields exist with defaults
      const typedData: Destination[] = (data || []).map((d: any) => ({
        id: d.id,
        city_name: d.city_name,
        country: d.country,
        airport_code: d.airport_code,
        region: d.region || 'Other',
        average_price: d.average_price || 500,
        image_url: d.image_url || null,
      }));

      // Sort by popularity_rank if available
      typedData.sort((a: any, b: any) => {
        const rankA = a.popularity_rank || 999;
        const rankB = b.popularity_rank || 999;
        return rankA - rankB;
      });

      setDestinations(typedData);
      setFilteredDestinations(typedData);
      setLoading(false);
    };

    fetchDestinations();
  }, [toast]);

  useEffect(() => {
    let filtered = destinations;

    if (searchQuery) {
      filtered = filtered.filter(dest => 
        dest.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dest.airport_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredDestinations(filtered);
  }, [searchQuery, destinations]);

  const toggleSelection = (dest: Destination) => {
    const newSelected = new Set(selected);
    
    if (newSelected.has(dest.id)) {
      newSelected.delete(dest.id);
    } else {
      if (newSelected.size >= MAX_SELECTIONS) {
        toast({
          title: 'Maximum reached',
          description: `You can select up to ${MAX_SELECTIONS} destinations`,
          variant: 'destructive',
        });
        return;
      }
      newSelected.add(dest.id);
    }
    
    setSelected(newSelected);
  };

  const handleNext = () => {
    if (selected.size === 0) {
      toast({
        title: 'No destinations selected',
        description: 'Please select at least one destination',
        variant: 'destructive',
      });
      return;
    }

    const selectedDests: SelectedDestination[] = destinations
      .filter(d => selected.has(d.id))
      .map(d => ({
        ...d,
        threshold: Math.round((d.average_price || 500) * 0.8), // 80% of average as default
      }));

    onNext(selectedDests);
  };

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Which destinations interest you?</CardTitle>
            <CardDescription className="text-lg">
              Select up to {MAX_SELECTIONS} destinations to track (you can change these anytime)
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search destinations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Selection Counter */}
            <div className="flex items-center justify-between p-4 bg-secondary rounded-lg">
              <span className="font-semibold">Selected: {selected.size}/{MAX_SELECTIONS}</span>
              {selected.size > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Destinations Grid */}
            {loading ? (
              <div className="text-center py-12">Loading destinations...</div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                {filteredDestinations.map(dest => (
                  <div
                    key={dest.id}
                    onClick={() => toggleSelection(dest)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      selected.has(dest.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{dest.city_name}</h3>
                        <p className="text-sm text-muted-foreground">{dest.country}</p>
                      </div>
                      <Checkbox 
                        checked={selected.has(dest.id)}
                        onCheckedChange={() => toggleSelection(dest)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <Badge variant="secondary">{dest.airport_code}</Badge>
                      {dest.average_price && (
                        <span className="text-sm font-medium">
                          Avg: ${Math.round(dest.average_price)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredDestinations.length === 0 && !loading && (
              <div className="text-center py-12 text-muted-foreground">
                No destinations found. Try adjusting your search or filters.
              </div>
            )}

            {/* Progress */}
            <div className="flex items-center justify-center gap-2 pt-4">
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
              <div className="h-2 w-2 rounded-full bg-muted"></div>
            </div>
            <p className="text-sm text-muted-foreground text-center">Step 2 of 3</p>
          </CardContent>
          
          <CardFooter className="justify-between">
            <Button onClick={onBack} variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button 
              onClick={handleNext} 
              disabled={selected.size === 0}
              className="gap-2"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
