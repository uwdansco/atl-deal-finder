import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, TrendingDown, ExternalLink, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface DealCardProps {
  id: string;
  destination: {
    city_name: string;
    country: string;
    airport_code: string;
  };
  price: number;
  currency?: string;
  outbound_date: string;
  return_date: string;
  booking_link?: string;
  animationDelay?: number;
  variant?: "compact" | "full";
}

const DealCard = ({ 
  id, 
  destination, 
  price, 
  currency = "USD",
  outbound_date, 
  return_date, 
  booking_link,
  animationDelay = 0,
  variant = "compact"
}: DealCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  return (
    <Card 
      className="group p-6 hover:shadow-deal transition-all duration-300 hover:-translate-y-1 border-2 hover:border-accent/30 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Destination */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <Link to={`/deals/${id}`}>
            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer">
              {destination?.city_name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            {destination?.country} ({destination?.airport_code})
          </p>
        </div>
        <Plane className="w-6 h-6 text-primary group-hover:rotate-45 transition-transform duration-300" />
      </div>

      {/* Price */}
      <div className="mb-4">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold bg-gradient-sunset bg-clip-text text-transparent">
            ${price}
          </span>
          <span className="text-lg text-muted-foreground">roundtrip</span>
        </div>
      </div>

      {/* Dates */}
      <div className="pt-4 border-t border-border space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {formatDate(outbound_date)} - {formatDate(return_date)}
          </span>
        </div>
      </div>

      {/* Deal Badge */}
      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
          <TrendingDown className="w-3 h-3" />
          Great Deal
        </span>
        
        {booking_link && variant === "full" && (
          <Button 
            size="sm" 
            onClick={() => window.open(booking_link, '_blank')}
            className="gap-2"
          >
            Book Now
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}
      </div>

      {variant === "compact" && (
        <Link to={`/deals/${id}`}>
          <Button className="w-full mt-4" variant="outline">
            View Details
          </Button>
        </Link>
      )}
    </Card>
  );
};

export default DealCard;
