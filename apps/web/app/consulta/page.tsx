import { Suspense } from "react";
import { ConsultaInner } from "./consulta-inner";

export default function ConsultaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <ConsultaInner />
    </Suspense>
  );
}
