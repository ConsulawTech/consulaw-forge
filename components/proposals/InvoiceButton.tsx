"use client";

import { createPortal } from "react-dom";
import { useState } from "react";
import { Receipt, Plus, Trash2, X, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { sendInvoiceAction, type InvoiceItem } from "@/app/actions/invoices";

interface Props {
  proposalId: string;
  proposalTitle: string;
  clientName: string;
  recipientEmail: string;
  submissionTemplate: string | null;
  submissionFeatures: string[];
}

function generateInvoiceNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = String(Math.floor(1000 + Math.random() * 9000));
  return `INV-${date}-${rand}`;
}

const CURRENCIES = ["USD", "EUR", "GBP", "NGN", "CAD", "AUD"];

function buildInitialItems(
  template: string | null,
  features: string[],
  fallbackTitle: string
): InvoiceItem[] {
  const items: InvoiceItem[] = [];
  if (template) items.push({ description: template, amount: 0 });
  for (const f of features) items.push({ description: f, amount: 0 });
  if (items.length === 0) items.push({ description: fallbackTitle, amount: 0 });
  return items;
}

export function InvoiceButton({ proposalId, proposalTitle, clientName, recipientEmail, submissionTemplate, submissionFeatures }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "emailFailed" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const [invoiceNumber, setInvoiceNumber] = useState(generateInvoiceNumber);
  const [email, setEmail] = useState(recipientEmail);
  const [currency, setCurrency] = useState("USD");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>(() =>
    buildInitialItems(submissionTemplate, submissionFeatures, proposalTitle)
  );

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  function addItem() {
    setItems((prev) => [...prev, { description: "", amount: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof InvoiceItem, value: string) {
    setItems((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, [field]: field === "amount" ? parseFloat(value) || 0 : value } : item
      )
    );
  }

  function handleOpen() {
    setInvoiceNumber(generateInvoiceNumber());
    setEmail(recipientEmail);
    setStatus("idle");
    setErrorMsg("");
    setItems(buildInitialItems(submissionTemplate, submissionFeatures, proposalTitle));
    setOpen(true);
  }

  async function handleSend() {
    setLoading(true);
    setStatus("idle");
    const result = await sendInvoiceAction({
      proposalId,
      invoiceNumber,
      recipientEmail: email,
      clientName,
      proposalTitle,
      items,
      currency,
      dueDate: dueDate || null,
      notes: notes || null,
    });
    setLoading(false);

    if (!result.success) {
      setStatus("error");
      setErrorMsg(result.error);
      return;
    }
    if (!result.emailSent) {
      setStatus("emailFailed");
      setErrorMsg(result.emailError);
      return;
    }
    setStatus("success");
  }

  const inputCls =
    "w-full px-3 py-2 text-[13px] rounded-xl bg-white/60 border border-white/50 outline-none focus:border-[#1B3FEE]/40 focus:ring-2 focus:ring-[#1B3FEE]/10 text-[#0f172a] placeholder:text-[#94a3b8]";

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] text-[13px] font-semibold bg-white/65 border border-white/60 text-[#475569] hover:bg-white/85 transition-all"
      >
        <Receipt className="w-3.5 h-3.5" /> Invoice
      </button>

      {open && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="glass rounded-2xl w-full max-w-[520px] flex flex-col max-h-[90vh] shadow-[0_24px_48px_rgba(0,0,0,0.15)]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-[#1B3FEE]" />
                <span className="text-[15px] font-bold text-[#0f172a]">Generate Invoice</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5 text-[#475569]" />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4 overflow-y-auto">
              {status === "success" && (
                <div className="flex items-center gap-2 text-[13px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  Invoice sent to {email}
                </div>
              )}
              {(status === "error" || status === "emailFailed") && (
                <div className="flex items-center gap-2 text-[13px] text-[#ef4444] bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errorMsg}
                </div>
              )}

              {/* Invoice meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[#0f172a]">Invoice #</label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[#0f172a]">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={inputCls}
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[#0f172a]">Send to</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className={inputCls}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12.5px] font-semibold text-[#0f172a]">
                    Due Date <span className="font-normal text-[#94a3b8]">(optional)</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Line items */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-[12.5px] font-semibold text-[#0f172a]">Line Items</label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-1 text-[11.5px] font-semibold text-[#1B3FEE] hover:opacity-75 transition-opacity"
                  >
                    <Plus className="w-3 h-3" /> Add item
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-[1fr_120px_28px] gap-2 px-1">
                    <span className="text-[11px] text-[#94a3b8] font-medium">Description</span>
                    <span className="text-[11px] text-[#94a3b8] font-medium">Amount ({currency})</span>
                    <span />
                  </div>

                  {items.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-[1fr_120px_28px] gap-2 items-center">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Service description"
                        className={inputCls}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.amount || ""}
                        onChange={(e) => updateItem(idx, "amount", e.target.value)}
                        placeholder="0.00"
                        className={inputCls}
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="w-7 h-7 flex items-center justify-center rounded-lg text-[#94a3b8] hover:text-[#ef4444] hover:bg-[rgba(239,68,68,0.08)] transition-colors disabled:opacity-30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="flex items-center justify-between px-1 pt-2 border-t border-white/50 mt-1">
                    <span className="text-[12.5px] font-bold text-[#0f172a]">Total</span>
                    <span className="text-[15px] font-extrabold text-[#1B3FEE]">
                      {new Intl.NumberFormat("en-US", { style: "currency", currency }).format(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[12.5px] font-semibold text-[#0f172a]">
                  Notes <span className="font-normal text-[#94a3b8]">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment instructions, thank you message…"
                  className={`${inputCls} resize-none`}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-2 px-6 py-4 border-t border-white/50 flex-shrink-0">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                className="flex-1"
                loading={loading}
                onClick={handleSend}
                disabled={status === "success"}
              >
                <Receipt className="w-3.5 h-3.5" />
                {loading ? "Sending…" : status === "success" ? "Sent!" : "Send Invoice"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
