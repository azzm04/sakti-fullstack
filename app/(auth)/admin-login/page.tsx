"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AdminLoginPage() {
  const [adminId, setAdminId] = useState("");
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
      body: JSON.stringify({ adminId, password }),
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
    <div className="min-h-screen flex items-center justify-center bg-background font-body">
      <div className="w-full max-w-sm px-4">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 rounded-2xl mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-headline font-extrabold text-primary">SAKTI</h1>
          <p className="text-sm text-muted-foreground mt-1">Panel Administrator DIRMAWA</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-tertiary p-8 rounded-2xl shadow-sm border border-border space-y-4"
        >
          <div>
            <h2 className="text-lg font-semibold text-foreground">Masuk sebagai Admin</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gunakan kredensial administrator Anda
            </p>
          </div>

          {/* Admin ID */}
          <div>
            <label
              htmlFor="adminId"
              className="block text-sm font-medium text-secondary mb-1.5"
            >
              Admin ID
            </label>
            <input
              id="adminId"
              type="text"
              value={adminId}
              onChange={(e) => setAdminId(e.target.value)}
              placeholder="username"
              required
              autoComplete="username"
              className="w-full border border-border rounded-xl px-4 py-2.5 text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                transition-colors"
            />
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
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full border border-border rounded-xl px-4 py-2.5 pr-11 text-sm
                  focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
                  transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground
                  hover:text-foreground transition-colors"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-destructive text-xs bg-destructive/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold
              hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
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
