"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, User, Lock, AlertCircle, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error);
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-background font-body overflow-hidden">
      {/* Ambient brand backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,19,73,0.08), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,19,73,0.14) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 55% 55% at 50% 35%, black, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 55% at 50% 35%, black, transparent 80%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 ring-8 ring-primary/5 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-primary">SAKTI</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel Administrator DIRMAWA</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-tertiary p-8 rounded-2xl border border-border/80 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_40px_-12px_rgba(15,23,42,0.15)] space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Masuk sebagai Admin</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gunakan kredensial administrator Anda
            </p>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-secondary mb-1.5"
            >
              Username
            </label>
            <div className="relative">
              <User
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={16}
              />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                required
                autoFocus
                autoComplete="username"
                className="w-full border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-secondary mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <Lock
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={16}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-border rounded-xl pl-10 pr-11 py-2.5 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                  hover:text-foreground transition-colors duration-200 rounded
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 px-3 py-2 rounded-lg"
            >
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold
              hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 disabled:cursor-not-allowed
              transition-[background-color,transform] duration-200 ease-out"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Memverifikasi..." : "Masuk"}
          </button>
        </form>

        {/* Link ke login mahasiswa */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Bukan admin?{" "}
          <a href="/login" className="text-primary hover:underline font-medium">
            Login sebagai mahasiswa
          </a>
        </p>
      </div>
    </div>
  );
}
