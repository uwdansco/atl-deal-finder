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
        title="Cheap Flights from Singapore"
        description="Get personalized flight price alerts from Singapore (SIN) to any destination. Track deals, set your budget, and never miss cheap flights again. Free to use."
        keywords="cheap flights Singapore, SIN flights, Singapore flight deals, flight price alerts, cheap flights from Singapore"
        canonicalUrl={window.location.origin}
      />
      <OrganizationSchema
        name="Cheap Singapore Flights"
        url={window.location.origin}
        logo={`${window.location.origin}/logo.png`}
        description="Automated flight price tracking and alerts from Singapore to any destination worldwide"
      />
      <WebSiteSchema name="Cheap Singapore Flights" url={window.location.origin} />

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
