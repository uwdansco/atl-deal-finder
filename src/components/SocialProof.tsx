import { Star, Users, Globe, TrendingDown } from "lucide-react";

const stats = [
  {
    icon: Users,
    value: "5,000+",
    label: "Active Subscribers",
    color: "text-primary",
  },
  {
    icon: Globe,
    value: "Any",
    label: "Destinations Tracked",
    color: "text-accent",
  },
  {
    icon: TrendingDown,
    value: "$500+",
    label: "Average Savings",
    color: "text-primary",
  },
  {
    icon: Star,
    value: "4.9/5",
    label: "Subscriber Rating",
    color: "text-accent",
  },
];

const testimonials = [
  {
    name: "Sarah M.",
    location: "Singapore",
    text: "Found a roundtrip to Paris for $399! This newsletter has saved me so much money on flights.",
    rating: 5,
  },
  {
    name: "Michael R.",
    location: "Decatur, GA",
    text: "I never miss a deal now. The alerts are timely and the prices are legitimately amazing.",
    rating: 5,
  },
  {
    name: "Jessica L.",
    location: "Marietta, GA",
    text: "As someone who travels frequently for work, this service has been a game-changer for my personal trips too.",
    rating: 5,
  },
];

const SocialProof = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/30">
      <div className="container mx-auto max-w-6xl">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div 
                key={index} 
                className="text-center p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex justify-center mb-4">
                  <div className="w-14 h-14 bg-gradient-sky rounded-full flex items-center justify-center">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Testimonials Section */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              Loved by Singapore Travelers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Don't just take our word for it. Here's what our subscribers have to say.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="p-6 rounded-2xl bg-card border border-border hover:border-accent/30 transition-all duration-300 hover:shadow-deal animate-fade-in"
                style={{ animationDelay: `${(index + 4) * 100}ms` }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-accent text-accent" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-foreground mb-4 leading-relaxed">
                  "{testimonial.text}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-4 border-t border-border">
                  <div className="w-10 h-10 bg-gradient-sky rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {testimonial.location}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProof;
