import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Target, Users, Zap, Heart } from "lucide-react";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <>
      <SEO
        title="About Us - Cheap Singapore Flights"
        description="Learn about Cheap Singapore Flights - our mission to make affordable travel accessible to everyone through smart price tracking and personalized alerts."
        keywords="about cheap singapore flights, our mission, who we are, flight price tracking"
      />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Making Cheap Flights Accessible to Everyone
            </h1>
            <p className="text-xl text-muted-foreground">
              We believe everyone deserves to travel. Our mission is to help you find the best flight deals from Singapore.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <div className="prose prose-lg max-w-none">
              <p className="text-muted-foreground mb-4">
                Cheap Singapore Flights was born from a simple frustration: why is it so hard to find good flight deals? 
                We spent countless hours manually checking prices, setting calendar reminders, and missing out on amazing deals 
                because we checked just a day too late.
              </p>
              <p className="text-muted-foreground mb-4">
                In 2024, we decided to build the solution we wished existed. A tool that would monitor flight prices 24/7, 
                alert us the moment prices dropped, and help us book at the perfect time. What started as a personal project 
                quickly grew into a platform serving thousands of Singapore travelers.
              </p>
              <p className="text-muted-foreground">
                Today, we're proud to help our users save an average of $220 per ticket by booking at exactly the right moment. 
                We're not just a flight tracking tool - we're your personal travel assistant, working around the clock to find you the best deals.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-12 text-center">What Drives Us</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Transparency</h3>
                  <p className="text-sm text-muted-foreground">
                    No hidden fees, no tricks. Just honest price tracking and clear alerts.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">User-First</h3>
                  <p className="text-sm text-muted-foreground">
                    Every feature we build starts with the question: "Will this help our users save money?"
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Innovation</h3>
                  <p className="text-sm text-muted-foreground">
                    We use cutting-edge technology to give you the most accurate and timely price alerts.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-bold mb-2">Community</h3>
                  <p className="text-sm text-muted-foreground">
                    We're building a community of savvy travelers who help each other find the best deals.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-3xl font-bold mb-6">How We Track Prices</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2">1. Daily Price Monitoring</h3>
                <p className="text-muted-foreground">
                  We check flight prices from Singapore to any destination every single day using official airline APIs. 
                  This ensures you always have the most up-to-date pricing information.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">2. Smart Price Analysis</h3>
                <p className="text-muted-foreground">
                  Our algorithms analyze historical pricing data to identify genuine deals. We calculate the all-time low, 
                  average prices, and price trends to give you context for every deal.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">3. Personalized Alerts</h3>
                <p className="text-muted-foreground">
                  Set your own price thresholds and we'll only alert you when prices drop below YOUR budget. 
                  No spam, just the deals you care about.
                </p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2">4. Instant Notifications</h3>
                <p className="text-muted-foreground">
                  Get email alerts within minutes of a price drop. Our users book an average of 2 hours after 
                  receiving an alert, securing the best prices before they rise again.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-primary/5">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <h2 className="text-3xl font-bold mb-4">Join Thousands of Smart Travelers</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start tracking prices and never overpay for flights again. It's completely free to get started.
            </p>
            <Button size="lg" asChild>
              <Link to="/signup">Start Saving on Flights</Link>
            </Button>
          </div>
        </section>

        <Footer />
      </main>
    </>
  );
}
