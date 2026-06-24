import HeroSection from "@/components/home/HeroSection";
import WorkflowCategories from "@/components/home/WorkflowCategories";
import AdBanner from "@/components/home/AdBanner";
import PricingSection from "@/components/home/PricingSection";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <HeroSection />
      <WorkflowCategories />
      <AdBanner />
      <PricingSection />
      <Footer />
    </>
  );
}
