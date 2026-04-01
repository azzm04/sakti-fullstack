import Navbar from "@/components/layout/Navbar";
import ChatWidget from "@/components/chat/ChatWidget";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/public/landing/HeroSection";
import StatsBar from "@/components/public/landing/StatsBar";
import JadwalSection from "@/components/public/landing/JadwalSection";
import CtaBanner from "@/components/public/landing/CtaBanner";

export default function LandingPage() {
  return (
    <div className="bg-[#F8FAFC] font-body text-secondary selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="pt-20">
        <HeroSection />
        <StatsBar />
        <JadwalSection />
        <CtaBanner />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
}
