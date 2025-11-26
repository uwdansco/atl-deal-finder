import Hero from "@/components/Hero";
import RecentDeals from "@/components/RecentDeals";
import HowItWorks from "@/components/HowItWorks";
import SocialProof from "@/components/SocialProof";
import Footer from "@/components/Footer";
import { SEO } from "@/components/SEO";
import { OrganizationSchema, WebSiteSchema } from "@/components/StructuredData";

const Index = () => {
  return (
    <>
      <SEO
        title="Cheap Flights from Atlanta"
        description="Get personalized flight price alerts from Atlanta (ATL) to 50+ destinations. Track deals, set your budget, and never miss cheap flights again. Free to use."
        keywords="cheap flights Atlanta, ATL flights, Atlanta flight deals, flight price alerts, cheap flights from Atlanta"
        canonicalUrl={window.location.origin}
      />
      <OrganizationSchema
        name="Cheap Atlanta Flights"
        url={window.location.origin}
        logo={`${window.location.origin}/logo.png`}
        description="Automated flight price tracking and alerts from Atlanta to 50+ destinations worldwide"
      />
      <WebSiteSchema name="Cheap Atlanta Flights" url={window.location.origin} />

      <main className="min-h-screen bg-background">
        <Hero />
        <RecentDeals />
        <HowItWorks />
        <SocialProof />
        <Footer />
      </main>
    </>
  );
};

export default Index;
