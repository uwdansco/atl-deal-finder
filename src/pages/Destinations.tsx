import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEO } from "@/components/SEO";
import { useState } from "react";
import { Search, TrendingDown } from "lucide-react";
import Footer from "@/components/Footer";

export default function Destinations() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: destinations, isLoading } = useQuery({
    queryKey: ["public-destinations", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("destinations")
        .select(`
          *,
          price_statistics (
            avg_90day,
            all_time_low
          )
        `)
        .eq("is_active", true)
        .order("priority");

      if (searchTerm) {
        query = query.or(`city_name.ilike.%${searchTerm}%,country.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <SEO
        title="Cheap Flights from Atlanta to Any Destination"
        description="Browse all destinations with cheap flights from Atlanta (ATL). Compare prices, track deals, and find the best time to book your next trip."
        keywords="Atlanta flights, ATL destinations, cheap flights, flight deals, international flights from Atlanta"
      />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Discover Cheap Flights from Atlanta
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                Track prices to any destination worldwide. Get alerts when prices drop to your budget.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search destinations..."
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
              <h2 className="text-2xl font-bold mb-2">All Destinations</h2>
              <p className="text-muted-foreground">
                {destinations?.length || 0} destinations available
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">Loading destinations...</div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {destinations?.map((dest: any) => (
                  <Link
                    key={dest.id}
                    to={`/destinations/${dest.city_name.toLowerCase().replace(/\s+/g, "-")}`}
                    state={{ destination: dest }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow">
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

                        {dest.price_statistics?.[0] && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <TrendingDown className="h-4 w-4 text-green-600" />
                              <span className="text-sm">
                                Avg Price: <span className="font-bold">${dest.price_statistics[0].avg_90day}</span>
                              </span>
                            </div>
                            {dest.price_statistics[0].all_time_low && (
                              <p className="text-xs text-muted-foreground">
                                Best deal: ${dest.price_statistics[0].all_time_low}
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
