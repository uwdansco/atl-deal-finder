import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

type PriceAlert = {
  id: string;
  sent_at: string;
  triggered_price: number;
  threshold_price: number;
  booking_link: string | null;
  outbound_date: string | null;
  return_date: string | null;
  email_opened: boolean;
  link_clicked: boolean;
  destination_id: string;
  destination?: {
    city_name: string;
    country: string;
  };
};

const PriceAlerts = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAlerts();
  }, [user, filter]);

  const fetchAlerts = async () => {
    if (!user) return;

    try {
      let query = (supabase as any)
        .from('price_alerts')
        .select(`
          *,
          destination:destinations(city_name, country)
        `)
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false });

      if (filter === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query = query.gte('sent_at', sevenDaysAgo.toISOString());
      } else if (filter === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        query = query.gte('sent_at', thirtyDaysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      setAlerts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load price alerts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (alert: PriceAlert) => {
    if (alert.link_clicked) {
      return <Badge variant="default">Clicked</Badge>;
    }
    if (alert.email_opened) {
      return <Badge variant="secondary">Opened</Badge>;
    }
    return <Badge variant="outline">Sent</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-3xl font-bold">Price Alerts</h2>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by time" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">All time</SelectItem>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border-2 border-dashed">
          <p className="text-xl text-muted-foreground mb-2">No price alerts yet</p>
          <p className="text-sm text-muted-foreground">
            We'll email you when deals match your criteria!
          </p>
        </div>
      ) : (
        <div className="bg-card rounded-lg border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Your Threshold</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell>
                    {format(new Date(alert.sent_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{alert.destination?.city_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {alert.destination?.country}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-green-600">
                    ${Math.round(alert.triggered_price)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    ${Math.round(alert.threshold_price)}
                  </TableCell>
                  <TableCell>{getStatusBadge(alert)}</TableCell>
                  <TableCell>
                    {alert.booking_link ? (
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={alert.booking_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          View Deal
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default PriceAlerts;
