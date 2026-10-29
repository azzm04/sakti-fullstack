import { Suspense } from "react";
import EvaluasiClient from "@/components/admin/evaluasi/EvaluasiClient";

export default async function EvaluasiPage() {
  return (
    <Suspense>
      <EvaluasiClient />
    </Suspense>
  );
}
