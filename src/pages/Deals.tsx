import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import DealCard from "@/components/DealCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { Helmet } from "react-helmet";

interface Deal {
  id: string;
  price: number;
  currency: string;
  outbound_date: string;
  return_date: string;
  booking_link: string;
  sent_at: string;
  destination: {
    city_name: string;
    country: string;
    airport_code: string;
  };
}

const DEALS_PER_PAGE = 12;

const Deals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchDeals();
  }, []);

  useEffect(() => {
    filterAndSortDeals();
  }, [deals, searchQuery, sortBy]);

  const fetchDeals = async () => {
    try {
      const { data, error } = await supabase
        .from("deals")
        .select(`
          id,
          price,
          currency,
          outbound_date,
          return_date,
          booking_link,
          sent_at,
          destination:destinations (
            city_name,
            country,
            airport_code
          )
        `)
        .eq("sent_to_subscribers", true)
        .order("sent_at", { ascending: false });

      if (error) throw error;
      setDeals(data as Deal[]);
    } catch (error) {
      console.error("Error fetching deals:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndSortDeals = () => {
    let result = [...deals];

    // Search filter
    if (searchQuery) {
      result = result.filter(deal => 
        deal.destination.city_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.destination.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        deal.destination.airport_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "destination":
        result.sort((a, b) => a.destination.city_name.localeCompare(b.destination.city_name));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime());
    }

    setFilteredDeals(result);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredDeals.length / DEALS_PER_PAGE);
  const paginatedDeals = filteredDeals.slice(
    (currentPage - 1) * DEALS_PER_PAGE,
    currentPage * DEALS_PER_PAGE
  );

  return (
    <>
      <Helmet>
        <title>Flight Deals from Atlanta | Cheap Atlanta Flights</title>
        <meta name="description" content="Browse all flight deals from Atlanta. Find cheap flights to destinations worldwide with our curated deals." />
        <meta property="og:title" content="Flight Deals from Atlanta" />
        <meta property="og:description" content="Browse all flight deals from Atlanta. Find cheap flights to destinations worldwide." />
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="py-16 px-4 bg-gradient-sunset">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              All Flight Deals from Atlanta
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Browse {deals.length} curated flight deals to destinations worldwide
            </p>
          </div>
        </section>

        {/* Filters Section */}
        <section className="py-8 px-4 border-b bg-card">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by destination..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 items-center w-full md:w-auto">
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price-low">Lowest Price</SelectItem>
                    <SelectItem value="price-high">Highest Price</SelectItem>
                    <SelectItem value="destination">Destination A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {paginatedDeals.length} of {filteredDeals.length} deals
            </div>
          </div>
        </section>

        {/* Deals Grid */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="text-center py-16">
                <h3 className="text-2xl font-bold mb-2">No deals found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search criteria" 
                    : "Stay tuned for amazing deals!"}
                </p>
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {paginatedDeals.map((deal, index) => (
                    <DealCard
                      key={deal.id}
                      id={deal.id}
                      destination={deal.destination}
                      price={deal.price}
                      currency={deal.currency}
                      outbound_date={deal.outbound_date}
                      return_date={deal.return_date}
                      booking_link={deal.booking_link}
                      animationDelay={index * 50}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-2 px-4">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
    </>
  );
};

export default Deals;
