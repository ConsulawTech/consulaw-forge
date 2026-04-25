"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, FileText, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .maybeSingle();

      const role = (profile as { role?: string } | null)?.role;
      router.push(role === "client" ? "/portal" : "/dashboard");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1B3FEE] rounded-[11px] flex items-center justify-center shadow-[0_4px_16px_rgba(27,63,238,0.35)]">
            <FileText className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0f172a] tracking-tight">Forge</div>
            <div className="text-[11px] text-[#94a3b8]">Consulaw Tech</div>
          </div>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-[#0f172a] tracking-tight mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-[#475569]">Sign in to your Forge account</p>
          </div>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <Input
              label="Email address"
              type="email"
              placeholder="you@consulawtech.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={Mail}
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-[#0f172a]">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-xl py-2.5 pl-9 pr-10 text-sm text-[#0f172a] placeholder:text-[#94a3b8] bg-white/60 backdrop-blur-md border border-white/50 outline-none transition-all duration-150 focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[13px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <Button type="submit" loading={loading} className="w-full justify-center mt-1">
              Sign in
            </Button>
          </form>

          <p className="text-[12px] text-[#94a3b8] text-center mt-5">
            Don&apos;t have an account?{" "}
            <span className="text-[#1B3FEE] font-semibold cursor-pointer">
              Contact your team lead
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
