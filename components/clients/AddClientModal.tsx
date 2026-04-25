"use client";

import { useState, useRef } from "react";
import { X, User, Mail, Check, Copy } from "lucide-react";
import { createClientAction } from "@/app/actions/clients";

interface AddClientModalProps {
  onClose: () => void;
}

export function AddClientModal({ onClose }: AddClientModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tempPassword, setTempPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");
    try {
      const result = await createClientAction(new FormData(formRef.current));
      setTempPassword(result.tempPassword);
      setStep("success");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyPassword() {
    navigator.clipboard.writeText(tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-[440px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
          <span className="text-[15px] font-bold text-[#0f172a]">
            {step === "form" ? "Add New Client" : "Client Created"}
          </span>
          <button onClick={onClose} className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>

        {step === "form" ? (
          <form ref={formRef} onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
            {error && (
              <div className="text-[12.5px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Client / Company Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Acme Corp"
                  className="w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Client Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="client@company.com"
                  className="w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]"
                />
              </div>
              <p className="text-[11.5px] text-[#94a3b8]">A portal account will be created and login details sent to this email.</p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-[10px] bg-white/65 border border-white/60 text-[13px] font-semibold text-[#475569] hover:bg-white/85 cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] disabled:opacity-60 transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.25)]"
              >
                {loading ? "Creating…" : "Create Client"}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 p-3.5 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.2)] rounded-xl">
              <div className="w-8 h-8 rounded-full bg-[rgba(16,185,129,0.15)] flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-[#10b981]" />
              </div>
              <div>
                <div className="text-[13px] font-semibold text-[#0f172a]">Client account created</div>
                <div className="text-[11.5px] text-[#475569]">A magic link was sent to their email for first login.</div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Temporary Password</label>
              <div className="flex items-center gap-2 p-3 bg-[rgba(15,23,42,0.04)] rounded-xl border border-[rgba(15,23,42,0.08)] font-mono text-[13px] text-[#0f172a]">
                <span className="flex-1 select-all">{tempPassword}</span>
                <button
                  onClick={copyPassword}
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-[#1B3FEE] hover:text-[#1535D4] transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <p className="text-[11.5px] text-[#94a3b8]">Share this with the client as a backup. They can change it after logging in.</p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-[10px] bg-[#1B3FEE] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#1535D4] transition-colors shadow-[0_2px_8px_rgba(27,63,238,0.25)]"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
