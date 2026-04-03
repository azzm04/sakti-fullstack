"use client";

import WelcomeBanner from "@/components/mahasiswa/WelcomeBanner";
import FeatureCards from "@/components/mahasiswa/FeatureCards";
import StatusTracker from "@/components/mahasiswa/StatusTracker";

export default function DashboardMahasiswa() {
  return (
    <div className="p-8 space-y-8">
      <WelcomeBanner />
      <FeatureCards />
      <StatusTracker />
    </div>
  );
}
