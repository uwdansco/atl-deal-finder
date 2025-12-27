import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { TrendingDown } from "lucide-react";
import DealCard from "./DealCard";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";

interface Deal {
  id: string;
  price: number;
  currency: string;
  outbound_date: string;
  return_date: string;
  booking_link: string;
  destination: {
    city_name: string;
    country: string;
    airport_code: string;
  };
}

const RecentDeals = () => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
            destination:destinations (
              city_name,
              country,
              airport_code
            )
          `)
          .eq("sent_to_subscribers", true)
          .order("sent_at", { ascending: false })
          .limit(6);

        if (error) throw error;
        setDeals(data as Deal[]);
      } catch (error) {
        console.error("Error fetching deals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">Loading deals...</h2>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 px-4 bg-secondary/30">
      <div className="container mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
            <TrendingDown className="w-4 h-4 text-accent" />
            <span className="text-sm font-semibold text-accent">Recent Deals</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold">
            Latest Flight Deals from Memphis
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real deals sent to our subscribers. Don't miss out on your next adventure!
          </p>
        </div>

        {/* Deals Grid */}
        {deals.length === 0 ? (
          <div className="text-center py-16">
            <h3 className="text-2xl font-bold mb-2">Stay tuned for amazing deals!</h3>
            <p className="text-muted-foreground">
              We'll send the latest flight deals to your inbox daily.
            </p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {deals.map((deal, index) => (
                <DealCard
                  key={deal.id}
                  id={deal.id}
                  destination={deal.destination}
                  price={deal.price}
                  currency={deal.currency}
                  outbound_date={deal.outbound_date}
                  return_date={deal.return_date}
                  booking_link={deal.booking_link}
                  animationDelay={index * 100}
                />
              ))}
            </div>

            {/* CTA */}
            <div className="text-center mt-12 space-y-4">
              <p className="text-lg text-muted-foreground">
                These deals were sent to our subscribers. 
                <Link to="/pricing" className="ml-2 font-semibold text-primary hover:underline">
                  Subscribe now to get the next one →
                </Link>
              </p>
              <Link to="/deals">
                <Button variant="outline" size="lg">
                  View All Deals
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default RecentDeals;
