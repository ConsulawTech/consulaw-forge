"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { sendProposalAction } from "@/app/actions/proposals";
import { Send, Check, AlertTriangle } from "lucide-react";

interface SendProposalButtonProps {
  proposalId: string;
  hasClientEmail: boolean;
}

export function SendProposalButton({ proposalId, hasClientEmail }: SendProposalButtonProps) {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<"idle" | "success" | "email_failed" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSend() {
    setLoading(true);
    setState("idle");
    const result = await sendProposalAction(proposalId);
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

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant="primary"
        onClick={handleSend}
        loading={loading}
        disabled={!hasClientEmail || loading}
        title={!hasClientEmail ? "Link a client with an email address to send this proposal." : undefined}
      >
        <Send className="w-3.5 h-3.5" />
        {loading ? "Sending…" : "Send to Client"}
      </Button>
      {state === "success" && (
        <div className="flex items-center gap-1.5 text-[11.5px] text-[#10b981]">
          <Check className="w-3 h-3" /> Sent via email.
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
