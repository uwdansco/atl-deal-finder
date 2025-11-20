import { Bell, Search, Mail, Plane } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    icon: Search,
    title: "We Track Prices",
    description: "Our system monitors flight prices from Atlanta to 50+ destinations daily using advanced automation.",
  },
  {
    icon: Bell,
    title: "Deals Get Detected",
    description: "When prices drop significantly, we instantly capture the deal with all the important details.",
  },
  {
    icon: Mail,
    title: "You Get Notified",
    description: "Exclusive deals are sent straight to your inbox - no searching, no hassle, just great prices.",
  },
  {
    icon: Plane,
    title: "Book & Save",
    description: "Click through to book your flight and save hundreds on your next adventure from Atlanta.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">How It Works</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We do the hard work so you don't have to. Here's how we find and deliver the best flight deals to you.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div 
                key={index} 
                className="relative group animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Connecting Line (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}

                {/* Step Number Badge */}
                <div className="absolute -top-4 -left-4 w-10 h-10 bg-gradient-sky rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg z-10">
                  {index + 1}
                </div>

                {/* Card */}
                <div className="relative p-6 rounded-2xl bg-card border-2 border-border hover:border-primary/30 transition-all duration-300 h-full group-hover:shadow-lg">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
            <h3 className="text-2xl font-bold">Ready to start saving?</h3>
            <p className="text-muted-foreground max-w-md">
              Join thousands of Atlanta travelers who never miss a deal. It's completely free.
            </p>
            <Link 
              to="/pricing" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-sunset text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Mail className="w-5 h-5" />
              Subscribe Now
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
