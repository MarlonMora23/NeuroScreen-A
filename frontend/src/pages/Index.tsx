import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/page-sections/HeroSection";
import HowItWorks from "@/components/page-sections/HowItWorks";
import Features from "@/components/page-sections/Features";
import Results from "@/components/page-sections/Results";
import Footer from "@/components/layout/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Features />
      <Results />
      <Footer />
    </div>
  );
};

export default Index;
