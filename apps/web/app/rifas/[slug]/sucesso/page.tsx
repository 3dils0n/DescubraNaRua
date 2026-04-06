import { Suspense } from "react";
import { SucessoInner } from "./sucesso-inner";

export default function SucessoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0A0A0A]" />}>
      <SucessoInner />
    </Suspense>
  );
}
