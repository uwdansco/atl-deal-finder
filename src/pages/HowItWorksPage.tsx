import { SEO } from "@/components/SEO";
import { FAQSchema } from "@/components/StructuredData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, MapPin, Bell, Plane, CheckCircle } from "lucide-react";
import Footer from "@/components/Footer";

const steps = [
  {
    icon: UserPlus,
    title: "Sign Up Free",
    description: "Create your free account in less than 30 seconds. No credit card required, ever.",
    time: "30 seconds",
  },
  {
    icon: MapPin,
    title: "Choose Destinations",
    description: "Select up to 10 destinations you want to track from our list of locations worldwide.",
    time: "2 minutes",
  },
  {
    icon: Bell,
    title: "Set Your Budget",
    description: "Tell us your ideal price for each destination. We'll only alert you when prices drop to YOUR budget.",
    time: "1 minute",
  },
  {
    icon: Plane,
    title: "Get Instant Alerts",
    description: "Receive email notifications the moment prices drop. Book quickly and save big!",
    time: "24/7 Monitoring",
  },
];

const benefits = [
  "Track up to 10 destinations for free",
  "Daily price monitoring",
  "Instant email alerts",
  "Historical price charts",
  "Price trend analysis",
  "Deal quality indicators",
  "No ads or spam",
  "Cancel anytime",
];

const faqs = [
  {
    question: "How often do you check prices?",
    answer: "We check flight prices from Singapore to all destinations every 24 hours. This ensures you always have the most current pricing information and never miss a deal.",
  },
  {
    question: "Will I get spammed with emails?",
    answer: "Absolutely not. We only send you alerts when prices drop below YOUR specific threshold. You can also adjust your notification preferences to receive daily or weekly digests instead of instant alerts.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <SEO
        title="How It Works - Flight Price Tracking Made Simple"
        description="Learn how Cheap Singapore Flights helps you save money on airfare with automated price tracking, smart alerts, and personalized notifications."
        keywords="how flight tracking works, price alerts, save on flights, automated price monitoring"
      />
      <FAQSchema faqs={faqs} />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              How Cheap Singapore Flights Works
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Save money on flights with our simple 4-step process. Start tracking prices in under 5 minutes.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Get Started Free</Link>
            </Button>
          </div>
        </section>

        {/* Steps */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              {steps.map((step, index) => (
                <Card key={index} className="relative">
                  <div className="absolute -top-4 -left-4 w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-xl">
                    {index + 1}
                  </div>
                  <CardContent className="p-6 pt-8">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <step.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                    <p className="text-muted-foreground mb-3">{step.description}</p>
                    <div className="text-sm font-medium text-primary">{step.time}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* What You Get */}
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-8 text-center">What's Included (Free Forever)</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-3xl font-bold mb-8">Frequently Asked Questions</h2>
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-lg mb-6">Have more questions?</p>
              <Button variant="outline" asChild>
                <Link to="/faq">View Full FAQ</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Saving?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of travelers who never overpay for flights.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Create Free Account</Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
