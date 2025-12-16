import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, Navigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Search, TrendingDown, Target } from "lucide-react";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

export default function Destinations() {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const { data: destinations, isLoading } = useQuery({
    queryKey: ["user-tracked-destinations", searchTerm, user.id],
    queryFn: async () => {
      let query = supabase
        .from("user_destinations")
        .select(`
          destination_id,
          price_threshold,
          is_active,
          destination:destinations (
            id,
            city_name,
            country,
            airport_code,
            price_statistics (
              avg_90day,
              all_time_low
            )
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true);

      const { data: userDestinations, error } = await query;
      if (error) throw error;

      // Transform to match expected format and apply search filter
      let results = userDestinations?.map((ud: any) => ({
        ...ud.destination,
        user_threshold: ud.price_threshold,
        is_tracked: true,
      })) || [];

      // Apply search filter
      if (searchTerm) {
        results = results.filter((dest: any) =>
          dest.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dest.country.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      return results;
    },
  });

  return (
    <>

      <SEO
        title="My Tracked Destinations - Cheap Flights from Singapore"
        description="Track flight prices to your favorite destinations from Singapore (SIN). Get instant alerts when prices drop to your budget."
        keywords="Singapore flights, tracked flights, price alerts, flight deals, SIN destinations"
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                My Tracked Destinations
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Monitor prices to your chosen destinations. We'll alert you when prices drop to your budget.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search your destinations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Destinations Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                Your Tracked Destinations
              </h2>
              <p className="text-muted-foreground">
                {destinations?.length || 0} destination{destinations?.length !== 1 ? 's' : ''} tracked
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">Loading destinations...</div>
            ) : destinations?.length === 0 ? (
              <div className="text-center py-16 bg-card rounded-lg border-2 border-dashed">
                <div className="max-w-md mx-auto">
                  <h3 className="text-2xl font-semibold mb-2">
                    No Tracked Destinations
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchTerm 
                      ? "No destinations match your search."
                      : "You haven't tracked any destinations yet. Start tracking prices to your favorite destinations!"}
                  </p>
                  {!searchTerm && (
                    <Button asChild size="lg">
                      <Link to="/dashboard/destinations">
                        Add Your First Destination
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {destinations?.map((dest: any) => (
                  <Link
                    key={dest.id}
                    to={`/destinations/${dest.city_name.toLowerCase().replace(/\s+/g, "-")}`}
                    state={{ destination: dest }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow relative">
                      <Badge className="absolute top-4 right-4 bg-green-600">
                        Tracking
                      </Badge>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-bold">{dest.city_name}</h3>
                            <p className="text-sm text-muted-foreground">{dest.country}</p>
                          </div>
                          <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded">
                            {dest.airport_code}
                          </span>
                        </div>

                        <div className="mb-2 p-2 bg-primary/5 rounded">
                          <p className="text-sm font-semibold text-primary">
                            Your Alert: ${dest.user_threshold}
                          </p>
                        </div>

                        {dest.price_statistics?.[0] && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Avg Price: <span className="font-bold">${Math.round(dest.price_statistics[0].avg_90day)}</span>
                              </span>
                            </div>
                            {dest.price_statistics[0].all_time_low && (
                              <p className="text-xs text-muted-foreground">
                                Best deal: ${Math.round(dest.price_statistics[0].all_time_low)}
                              </p>
                            )}
                          </div>
                        )}

                        <Button variant="outline" className="w-full mt-4" size="sm">
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
