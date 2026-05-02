"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked in insecure contexts — silent fail
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center bg-white/60 border border-white/50 hover:bg-white/80 transition-colors cursor-pointer"
      title={copied ? "Copied!" : "Copy link"}
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-[#10b981]" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-[#94a3b8]" />
      )}
    </button>
  );
}
