import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatWidget from "@/components/chat/ChatWidget";
import PanduanHero from "@/components/public/panduan/PanduanHero";
import VideoSection from "@/components/public/panduan/VideoSection";
import StepsSection from "@/components/public/panduan/StepsSection";
import EligibilitySection from "@/components/public/panduan/EligibilitySection";
import WhistleblowerSection from "@/components/public/panduan/WhistleblowerSection";

export default function PanduanPage() {
  return (
    <div className="bg-[#F8FAFC] font-body text-slate-600 selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="pt-20">
        <PanduanHero />
        <VideoSection />
        <StepsSection />
        <EligibilitySection />
        <WhistleblowerSection />
      </main>
      <ChatWidget />
      <Footer />
    </div>
  );
}
