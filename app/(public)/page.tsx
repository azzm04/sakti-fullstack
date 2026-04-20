import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import HeroSection from "@/components/landing/HeroSection";
import LayananSection from "@/components/landing/LayananSection";
import PanduanSection from "@/components/landing/PanduanSection";
import PengaduanSection from "@/components/landing/PengaduanSection";

export default function LandingPage() {
  return (
    <div className="bg-[#F8FAFC] font-body text-slate-800 selection:bg-primary/20 selection:text-primary">
      <Navbar />

      <main className="min-h-screen">
        <HeroSection />
        <LayananSection />
        <PanduanSection />
        <PengaduanSection />
      </main>

      {/* Widget Chatbot */}
      <ChatWidget />

      {/* Footer Utama */}
      <Footer />
    </div>
  );
}