import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import DealCard from "@/components/DealCard";
import { 
  ExternalLink, 
  Calendar, 
  MapPin, 
  Plane, 
  Share2,
  ArrowLeft 
} from "lucide-react";
import { format } from "date-fns";
import { Helmet } from "react-helmet";
import { useToast } from "@/hooks/use-toast";

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

const DealDetails = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [relatedDeals, setRelatedDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (id) {
      fetchDeal();
    }
  }, [id]);

  const fetchDeal = async () => {
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
        .eq("id", id)
        .single();

      if (error) throw error;
      
      setDeal(data as Deal);
      
      // Fetch Unsplash image
      fetchDestinationImage(data.destination.city_name);
      
      // Fetch related deals
      fetchRelatedDeals(data.destination.city_name, data.price);
    } catch (error) {
      console.error("Error fetching deal:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDestinationImage = async (cityName: string) => {
    try {
      const response = await fetch(
        `https://source.unsplash.com/1200x600/?${encodeURIComponent(cityName)},travel,city`
      );
      setImageUrl(response.url);
    } catch (error) {
      console.error("Error fetching image:", error);
    }
  };

  const fetchRelatedDeals = async (cityName: string, currentPrice: number) => {
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
        .neq("id", id)
        .limit(3);

      if (error) throw error;
      setRelatedDeals(data as Deal[]);
    } catch (error) {
      console.error("Error fetching related deals:", error);
    }
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Check out this flight deal to ${deal?.destination.city_name} for $${deal?.price}!`;
    
    let shareUrl = "";
    switch (platform) {
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied!",
      description: "Deal link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="container mx-auto py-8">
          <Skeleton className="h-96 w-full mb-8" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Deal not found</h2>
          <Link to="/deals">
            <Button>Browse All Deals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <>
      <Helmet>
        <title>{`${deal.destination.city_name} Flight Deal - $${deal.price} from Singapore`}</title>
        <meta 
          name="description" 
          content={`Fly to ${deal.destination.city_name}, ${deal.destination.country} for just $${deal.price} roundtrip from Singapore. Book now!`} 
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Offer",
            "name": `Flight to ${deal.destination.city_name}`,
            "price": deal.price,
            "priceCurrency": deal.currency,
            "url": window.location.href,
            "availability": "https://schema.org/InStock"
          })}
        </script>
      </Helmet>

      <main className="min-h-screen bg-background">
        {/* Hero Image */}
        <div className="relative h-96 overflow-hidden">
          {imageUrl && (
            <img 
              src={imageUrl} 
              alt={deal.destination.city_name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto">
              <Link to="/deals">
                <Button variant="ghost" className="mb-4 text-white hover:text-white/80">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Deals
                </Button>
              </Link>
              <h1 className="text-5xl font-bold text-white mb-2">
                {deal.destination.city_name}
              </h1>
              <p className="text-xl text-white/90">
                {deal.destination.country} ({deal.destination.airport_code})
              </p>
            </div>
          </div>
        </div>

        {/* Deal Details */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="p-8">
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h2 className="text-sm uppercase text-muted-foreground mb-2">Price</h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold bg-gradient-sunset bg-clip-text text-transparent">
                      ${deal.price}
                    </span>
                    <span className="text-xl text-muted-foreground">roundtrip</span>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm uppercase text-muted-foreground mb-2">Travel Dates</h2>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Departure:</span>
                      <span>{formatDate(deal.outbound_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      <span className="font-semibold">Return:</span>
                      <span>{formatDate(deal.return_date)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-sm uppercase text-muted-foreground mb-2">Route</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-semibold">Singapore (SIN)</span>
                  </div>
                  <Plane className="w-5 h-5 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span className="font-semibold">
                      {deal.destination.city_name} ({deal.destination.airport_code})
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="flex-1"
                  onClick={() => window.open(deal.booking_link, '_blank')}
                >
                  Book This Deal
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => handleShare('twitter')}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => handleShare('facebook')}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={copyLink}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                Deal posted: {formatDate(deal.sent_at)}
              </p>
            </Card>
          </div>
        </section>

        {/* Related Deals */}
        {relatedDeals.length > 0 && (
          <section className="py-12 px-4 bg-secondary/30">
            <div className="container mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">More Great Deals</h2>
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {relatedDeals.map((relatedDeal, index) => (
                  <DealCard
                    key={relatedDeal.id}
                    id={relatedDeal.id}
                    destination={relatedDeal.destination}
                    price={relatedDeal.price}
                    currency={relatedDeal.currency}
                    outbound_date={relatedDeal.outbound_date}
                    return_date={relatedDeal.return_date}
                    booking_link={relatedDeal.booking_link}
                    animationDelay={index * 100}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Email Signup CTA */}
        <section className="py-16 px-4 bg-gradient-sunset">
          <div className="container mx-auto text-center max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">
              Never Miss a Deal
            </h2>
            <p className="text-lg text-white/90 mb-8">
              Subscribe to get daily flight deals from Singapore sent to your inbox
            </p>
            <Link to="/pricing">
              <Button size="lg" variant="secondary">
                Subscribe Now
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </>
  );
};

export default DealDetails;
