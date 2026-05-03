"use client";

import { createPortal } from "react-dom";
import { useState, useRef } from "react";
import { X, User, Mail, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClientAction } from "@/app/actions/clients";

interface AddClientModalProps {
  onClose: () => void;
}

export function AddClientModal({ onClose }: AddClientModalProps) {
  const [step, setStep] = useState<"form" | "success" | "email_failed">("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setLoading(true);
    setError("");
    const result = await createClientAction(new FormData(formRef.current));
    setLoading(false);
    if (!result.success) {
      setError(result.error);
    } else if (!result.emailSent) {
      setEmailError(result.emailError);
      setStep("email_failed");
    } else {
      setStep("success");
    }
  }

  const inputCls = "w-full pl-9 pr-3 py-2.5 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="glass rounded-2xl w-full max-w-[440px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/50">
          <span className="text-[15px] font-bold text-[#0f172a]">
            {step === "form" ? "Add New Client" : step === "success" ? "Client Added" : "Client Added"}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5 text-[#475569]" />
          </button>
        </div>

        {step === "form" && (
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
                <input name="name" type="text" required placeholder="Acme Corp" className={inputCls} />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[12.5px] font-semibold text-[#0f172a]">Client Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94a3b8]" />
                <input name="email" type="email" required placeholder="client@company.com" className={inputCls} />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1" loading={loading}>
                {loading ? "Adding…" : "Create Client"}
              </Button>
            </div>
          </form>
        )}

        {step === "success" && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(16,185,129,0.1)] flex items-center justify-center">
              <Check className="w-7 h-7 text-[#10b981]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">Client created</div>
              <div className="text-[13px] text-[#475569] mt-1">
                A welcome email with their login details and portal link has been sent.
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          </div>
        )}

        {step === "email_failed" && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 rounded-full bg-[rgba(245,159,0,0.1)] flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-[#f59f00]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-[#0f172a]">Client created</div>
              <div className="text-[13px] text-[#475569] mt-1 leading-relaxed">
                The account was set up but the welcome email could not be delivered.
              </div>
              {emailError && (
                <div className="mt-2 text-[11.5px] text-[#94a3b8] font-mono bg-[rgba(0,0,0,0.04)] rounded-lg px-3 py-1.5">
                  {emailError}
                </div>
              )}
              <div className="mt-3 text-[12.5px] text-[#475569] bg-[rgba(245,159,0,0.08)] border border-[rgba(245,159,0,0.2)] rounded-xl px-3 py-2.5 text-left">
                Open the client page and click <span className="font-semibold text-[#0f172a]">Resend Login Details</span> once the email issue is resolved.
              </div>
            </div>
            <Button variant="primary" className="w-full" onClick={onClose}>
              Got it
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
