import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, RefreshCw, Activity, TrendingDown, Bell, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

export default function PriceMonitoring() {
  const [isChecking, setIsChecking] = useState(false);
  const queryClient = useQueryClient();

  // Fetch monitoring stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["monitoring-stats"],
    queryFn: async () => {
      const [priceHistoryResult, alertsResult, destinationsResult] = await Promise.all([
        supabase
          .from("price_history")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("price_alerts")
          .select("*", { count: "exact", head: true })
          .gte("received_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from("destinations")
          .select("*", { count: "exact" })
          .eq("is_active", true),
      ]);

      return {
        totalChecks: priceHistoryResult.count || 0,
        alertsThisWeek: alertsResult.count || 0,
        activeDestinations: destinationsResult.count || 0,
      };
    },
  });

  // Fetch recent price checks
  const { data: recentChecks } = useQuery({
    queryKey: ["recent-price-checks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_history")
        .select(`
          *,
          destinations (
            city_name,
            country,
            airport_code
          )
        `)
        .order("checked_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Fetch recent alerts
  const { data: recentAlerts } = useQuery({
    queryKey: ["recent-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select(`
          *,
          destinations (
            city_name,
            country
          )
        `)
        .order("received_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  // Manual price check trigger
  const checkPricesMutation = useMutation({
    mutationFn: async () => {
      setIsChecking(true);
      const { data, error } = await supabase.functions.invoke("check-flight-prices");
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Price check complete! ${data.destinationsChecked} destinations checked, ${data.alertsTriggered} alerts triggered`);
      queryClient.invalidateQueries({ queryKey: ["monitoring-stats"] });
      queryClient.invalidateQueries({ queryKey: ["recent-price-checks"] });
      queryClient.invalidateQueries({ queryKey: ["recent-alerts"] });
      setIsChecking(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to check prices: ${error.message}`);
      setIsChecking(false);
    },
  });

  const getDealQualityBadge = (quality: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      EXCEPTIONAL: "destructive",
      EXCELLENT: "default",
      GREAT: "secondary",
      GOOD: "outline",
      FAIR: "outline",
      POOR: "outline",
    };
    return <Badge variant={variants[quality] || "outline"}>{quality}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Price Monitoring</h1>
          <p className="text-muted-foreground">Monitor flight prices and automated alerts</p>
        </div>
        <Button
          onClick={() => checkPricesMutation.mutate()}
          disabled={isChecking}
          size="lg"
        >
          {isChecking ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking Prices...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Run Price Check Now
            </>
          )}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Price Checks</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalChecks || 0}</div>
            <p className="text-xs text-muted-foreground">All-time price checks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alerts This Week</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alertsThisWeek || 0}</div>
            <p className="text-xs text-muted-foreground">Price drop alerts sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Destinations</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDestinations || 0}</div>
            <p className="text-xs text-muted-foreground">Being monitored</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Price Checks */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Price Checks</CardTitle>
          <CardDescription>Latest flight prices from Amadeus API</CardDescription>
        </CardHeader>
        <CardContent>
          {recentChecks && recentChecks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Outbound Date</TableHead>
                  <TableHead>Checked</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentChecks.map((check: any) => (
                  <TableRow key={check.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{check.destinations?.city_name}</div>
                        <div className="text-sm text-muted-foreground">{check.destinations?.country}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">${check.price}</TableCell>
                    <TableCell>{check.outbound_date || "N/A"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(check.checked_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No price checks yet. Run a manual check to get started!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Price Alerts</CardTitle>
          <CardDescription>Price drop alerts triggered for users</CardDescription>
        </CardHeader>
        <CardContent>
          {recentAlerts && recentAlerts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destination</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Deal Quality</TableHead>
                  <TableHead>Savings</TableHead>
                  <TableHead>Sent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAlerts.map((alert: any) => (
                  <TableRow key={alert.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{alert.destinations?.city_name}</div>
                        <div className="text-sm text-muted-foreground">{alert.destinations?.country}</div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold">${alert.price}</TableCell>
                    <TableCell>{getDealQualityBadge(alert.deal_quality)}</TableCell>
                    <TableCell className="text-green-600">
                      {alert.savings_percent ? `${alert.savings_percent.toFixed(0)}%` : "N/A"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.received_at), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No alerts triggered yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
