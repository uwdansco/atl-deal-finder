import { useLocation, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingDown, Calendar, Users } from "lucide-react";
import Footer from "@/components/Footer";
import { format } from "date-fns";

export default function DestinationDetail() {
  const location = useLocation();
  const navigate = useNavigate();
  const destination = location.state?.destination;

  const { data: priceHistory } = useQuery({
    queryKey: ["destination-price-history", destination?.id],
    queryFn: async () => {
      if (!destination) return [];

      const { data } = await supabase
        .from("price_history")
        .select("price, checked_at")
        .eq("destination_id", destination.id)
        .order("checked_at", { ascending: true })
        .limit(90);

      return data?.map((item) => ({
        date: format(new Date(item.checked_at), "MMM dd"),
        price: item.price,
      })) || [];
    },
    enabled: !!destination,
  });

  const { data: stats } = useQuery({
    queryKey: ["destination-stats", destination?.id],
    queryFn: async () => {
      if (!destination) return null;

      const { data } = await supabase
        .from("price_statistics")
        .select("*")
        .eq("destination_id", destination.id)
        .single();

      return data;
    },
    enabled: !!destination,
  });

  if (!destination) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Destination not found</h1>
          <Button onClick={() => navigate("/destinations")}>Back to Destinations</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`Cheap Flights from Memphis to ${destination.city_name}`}
        description={`Find the best flight deals from Memphis (MEM) to ${destination.city_name}, ${destination.country}. Track prices, get alerts, and book at the perfect time.`}
        keywords={`Memphis to ${destination.city_name}, MEM to ${destination.airport_code}, cheap flights ${destination.city_name}, ${destination.city_name} flight deals`}
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/20 via-background to-secondary/20 py-20">
          <div className="container mx-auto px-4">
            <Link to="/destinations" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
              <ArrowLeft className="h-4 w-4" />
              Back to Destinations
            </Link>

            <div className="max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Cheap Flights from Memphis to {destination.city_name}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {destination.country} • {destination.airport_code}
              </p>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-card p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Average Price (90d)</p>
                    <p className="text-2xl font-bold">${stats.avg_90day || "N/A"}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Best Deal Ever</p>
                    <p className="text-2xl font-bold text-green-600">${stats.all_time_low || "N/A"}</p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Current Range</p>
                    <p className="text-2xl font-bold">
                      ${stats.percentile_25 || "N/A"}-${stats.percentile_75 || "N/A"}
                    </p>
                  </div>
                  <div className="bg-card p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Price Trend</p>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-6 w-6 text-green-600" />
                      <p className="text-lg font-bold">Stable</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Price Chart */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <Card>
              <CardHeader>
                <CardTitle>Price History (Last 90 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                {priceHistory && priceHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={priceHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No price history available yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Travel Tips */}
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Travel Tips for {destination.city_name}</h2>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      <CardTitle>Best Time to Book</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Book 2-3 months in advance for the best deals. Prices tend to rise 4-6 weeks before departure.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      <CardTitle>Popular Airlines</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Delta, United, and American Airlines offer regular service from Memphis to {destination.city_name}.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-8">
                <CardContent className="p-8 text-center">
                  <h3 className="text-2xl font-bold mb-4">Track This Destination</h3>
                  <p className="text-muted-foreground mb-6">
                    Get instant alerts when prices drop to {destination.city_name}. Set your budget and we'll notify you.
                  </p>
                  <Button size="lg" asChild>
                    <Link to="/signup">Start Tracking Prices</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
