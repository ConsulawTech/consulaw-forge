"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { sendProposalAction } from "@/app/actions/proposals";
import { Send, Check, AlertTriangle } from "lucide-react";

interface SendProposalButtonProps {
  proposalId: string;
  defaultEmail: string;
}

export function SendProposalButton({ proposalId, defaultEmail }: SendProposalButtonProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<"idle" | "success" | "email_failed" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSend() {
    setLoading(true);
    setState("idle");
    const result = await sendProposalAction(proposalId, email);
    setLoading(false);
    if (!result.success) {
      setState("error");
      setMessage(result.error);
    } else if (!result.emailSent) {
      setState("email_failed");
      setMessage(result.emailError);
    } else {
      setState("success");
    }
  }

  const inputCls =
    "flex-1 px-3 py-2 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
          placeholder="recipient@email.com"
          className={inputCls}
          disabled={loading}
        />
        <Button
          variant="primary"
          onClick={handleSend}
          loading={loading}
          disabled={loading || !email.trim()}
        >
          <Send className="w-3.5 h-3.5" />
          {loading ? "Sending…" : "Send"}
        </Button>
      </div>

      {state === "success" && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#10b981]">
          <Check className="w-3 h-3" /> Sent to {email}.
        </div>
      )}
      {state === "email_failed" && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#f59f00]">
          <AlertTriangle className="w-3 h-3" /> Status updated but email failed: {message}
        </div>
      )}
      {state === "error" && (
        <div className="text-[11.5px] text-[#ef4444]">{message}</div>
      )}
    </div>
  );
}
