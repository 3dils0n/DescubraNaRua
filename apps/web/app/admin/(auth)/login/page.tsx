"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GoldButton } from "@/components/gold-button";
import { SiteLogo } from "@/components/site-logo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@rifa.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      setErr("Credenciais inválidas");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A0A0A] px-4 py-10">
      <SiteLogo href="/" heightClass="h-12 md:h-14" className="opacity-95" />
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-6 rounded-3xl border border-[#D4AF37]/30 bg-[#101010] p-10"
      >
        <h1 className="font-display text-center text-2xl text-[#F2C94C]">Painel administrativo</h1>
        <label className="block text-sm text-[#BDBDBD]">
          Email
          <input
            type="email"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm text-[#BDBDBD]">
          Senha
          <input
            type="password"
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-[#F5F5F5]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {err && <p className="text-center text-sm text-[#EF4444]">{err}</p>}
        <GoldButton type="submit">Entrar</GoldButton>
      </form>
    </main>
  );
}
