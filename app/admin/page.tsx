"use client";

import { useState } from "react";
import DashboardHeader from "@/components/admin/DashboardHeader";
import StatsRow from "@/components/admin/StatsRow";
import UploadCard from "@/components/admin/UploadCard";
import BobotCard from "@/components/admin/BobotCard";
import RankingTable from "@/components/admin/RankingTable";

export default function AdminDashboard() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  return (
    <div className="p-5 md:p-8 lg:p-10 space-y-6 max-w-screen-xl mx-auto">
      <DashboardHeader />
      <StatsRow />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <UploadCard uploadedFile={uploadedFile} onFileChange={setUploadedFile} />
        <BobotCard />
      </div>
      <RankingTable />
    </div>
  );
}
