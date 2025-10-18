import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, TrendingUp, Plane, Mail, Eye, MousePointerClick, Target } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

export default function DashboardOverview() {
  // Comprehensive stats query
  const { data: stats } = useQuery({
    queryKey: ["admin-comprehensive-stats"],
    queryFn: async () => {
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sevenDaysAgo = subDays(new Date(), 7);

      const [
        totalUsersResult,
        weekUsersResult,
        activeDestsResult,
        alertsResult,
        emailsResult,
        emailOpenedResult,
        emailClickedResult,
      ] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }),
        supabase.from("user_roles").select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgo.toISOString()),
        supabase.from("user_destinations").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("price_alerts").select("*", { count: "exact", head: true })
          .gte("received_at", thirtyDaysAgo.toISOString()),
        supabase.from("email_queue").select("*", { count: "exact", head: true })
          .eq("status", "sent")
          .gte("sent_at", thirtyDaysAgo.toISOString()),
        supabase.from("price_alerts").select("*", { count: "exact", head: true })
          .eq("email_opened", true)
          .gte("received_at", thirtyDaysAgo.toISOString()),
        supabase.from("price_alerts").select("*", { count: "exact", head: true })
          .eq("link_clicked", true)
          .gte("received_at", thirtyDaysAgo.toISOString()),
      ]);

      const openRate = alertsResult.count && emailOpenedResult.count
        ? (emailOpenedResult.count / alertsResult.count) * 100
        : 0;
      const clickRate = alertsResult.count && emailClickedResult.count
        ? (emailClickedResult.count / alertsResult.count) * 100
        : 0;

      return {
        totalUsers: totalUsersResult.count || 0,
        weekUsers: weekUsersResult.count || 0,
        activeDestinations: activeDestsResult.count || 0,
        alertsSent: alertsResult.count || 0,
        emailsSent: emailsResult.count || 0,
        emailOpenRate: openRate.toFixed(1),
        emailClickRate: clickRate.toFixed(1),
      };
    },
  });

  // User growth chart data
  const { data: userGrowth } = useQuery({
    queryKey: ["user-growth-chart"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("created_at")
        .order("created_at");

      if (!data) return [];

      // Group by day
      const grouped: Record<string, number> = {};
      data.forEach((user) => {
        const day = format(new Date(user.created_at), "MMM dd");
        grouped[day] = (grouped[day] || 0) + 1;
      });

      return Object.entries(grouped).map(([date, count]) => ({ date, users: count }));
    },
  });

  // Most tracked destinations
  const { data: topDestinations } = useQuery({
    queryKey: ["top-destinations"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_destinations")
        .select(`
          destination_id,
          destinations (
            city_name
          )
        `)
        .eq("is_active", true);

      if (!data) return [];

      // Count occurrences
      const counts: Record<string, { name: string; count: number }> = {};
      data.forEach((item: any) => {
        const name = item.destinations?.city_name || "Unknown";
        if (!counts[name]) {
          counts[name] = { name, count: 0 };
        }
        counts[name].count++;
      });

      return Object.values(counts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  // Recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ["recent-activity-detailed"],
    queryFn: async () => {
      const [signups, alerts] = await Promise.all([
        supabase
          .from("user_roles")
          .select("user_id, created_at")
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("price_alerts")
          .select(`
            id,
            price,
            received_at,
            destinations (
              city_name
            )
          `)
          .order("received_at", { ascending: false })
          .limit(5),
      ]);

      return {
        signups: signups.data || [],
        alerts: alerts.data || [],
      };
    },
  });

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive analytics and insights</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.weekUsers || 0} this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Destinations</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeDestinations || 0}</div>
            <p className="text-xs text-muted-foreground">Active user destinations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Price Alerts (30d)</CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.alertsSent || 0}</div>
            <p className="text-xs text-muted-foreground">Alerts triggered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent (30d)</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailsSent || 0}</div>
            <p className="text-xs text-muted-foreground">All email types</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailOpenRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emailClickRate || 0}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={userGrowth || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Tracked Destinations</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topDestinations || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Feed */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.signups.map((signup: any) => (
                <div key={signup.user_id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">New User</p>
                    <p className="text-sm text-muted-foreground">{signup.user_id.slice(0, 8)}...</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(signup.created_at), "MMM dd, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Price Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.alerts.map((alert: any) => (
                <div key={alert.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="font-medium">{alert.destinations?.city_name || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">${alert.price}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(alert.received_at), "MMM dd, HH:mm")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
