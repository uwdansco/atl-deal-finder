import Hero from "@/components/Hero";
import RecentDeals from "@/components/RecentDeals";
import HowItWorks from "@/components/HowItWorks";
import PricingPreview from "@/components/PricingPreview";
import FAQ from "@/components/FAQ";
import SocialProof from "@/components/SocialProof";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { OrganizationSchema, WebSiteSchema } from "@/components/StructuredData";

const Index = () => {
  return (
    <>
      <SEO
        title="Cheap Flights from Memphis"
        description="Get personalized flight price alerts from Memphis (MEM) to any destination. Track deals, set your budget, and never miss cheap flights again. Start your 7-day free trial."
        keywords="cheap flights Memphis, MEM flights, Memphis flight deals, flight price alerts, cheap flights from Memphis"
        canonicalUrl={window.location.origin}
      />
      <OrganizationSchema
        name="Cheap Memphis Flights"
        url={window.location.origin}
        logo={`${window.location.origin}/logo.png`}
        description="Automated flight price tracking and alerts from Memphis to any destination worldwide"
      />
      <WebSiteSchema name="Cheap Memphis Flights" url={window.location.origin} />

      <main className="min-h-screen bg-background">
        <Hero />
        <RecentDeals />
        <HowItWorks />
        <PricingPreview />
        <SocialProof />
        <FAQ />
        <Footer />
      </main>
    </>
  );
};

export default Index;
