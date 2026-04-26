"use client";

import { useEffect } from "react";
import { FileText, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isMissingEnv = error.message?.includes("Supabase env vars");

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative z-10">
      <div className="w-full max-w-[420px]">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-[#1B3FEE] rounded-[11px] flex items-center justify-center shadow-[0_4px_16px_rgba(27,63,238,0.35)]">
            <FileText className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div>
            <div className="text-xl font-bold text-[#0f172a] tracking-tight">Forge</div>
            <div className="text-[11px] text-[#94a3b8]">Consulaw Tech</div>
          </div>
        </div>

        <div className="glass rounded-2xl p-8">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-[9px] bg-[rgba(239,68,68,0.1)] flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
            </div>
            <h1 className="text-[17px] font-extrabold text-[#0f172a]">
              {isMissingEnv ? "Setup required" : "Something went wrong"}
            </h1>
          </div>

          {isMissingEnv ? (
            <div className="text-[13px] text-[#475569] leading-relaxed space-y-3">
              <p>The Supabase environment variables are not configured. Add these to <strong className="text-[#0f172a]">Vercel → Project Settings → Environment Variables</strong>, then redeploy:</p>
              <div className="bg-[rgba(15,23,42,0.04)] rounded-xl p-3.5 space-y-1.5 font-mono text-[12px]">
                <div className="text-[#1B3FEE]">NEXT_PUBLIC_SUPABASE_URL</div>
                <div className="text-[#1B3FEE]">NEXT_PUBLIC_SUPABASE_ANON_KEY</div>
                <div className="text-[#1B3FEE]">SUPABASE_SERVICE_ROLE_KEY</div>
              </div>
              <p className="text-[12px]">Find these in your Supabase project under <strong>Settings → API</strong>.</p>
            </div>
          ) : (
            <p className="text-[13px] text-[#475569] leading-relaxed mb-4">
              {error.message ?? "An unexpected server error occurred."}
            </p>
          )}

          {!isMissingEnv && (
            <Button variant="primary" className="mt-5 w-full" onClick={reset}>
              Try again
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}
