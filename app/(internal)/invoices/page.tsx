import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/layout/Topbar";
import { InvoiceGeneratorButton } from "@/components/invoices/InvoiceGeneratorButton";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

function fmt(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
}

export default async function InvoicesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = await createClient() as any;

  const [{ data: invoicesRaw }, { data: proposalsRaw }] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("proposals")
      .select("id, title, slug, recipient_email, client:clients(name), status")
      .order("created_at", { ascending: false }),
  ]);

  const invoices = invoicesRaw ?? [];
  const proposals = (proposalsRaw ?? []).map((p: any) => ({
    id: p.id,
    title: p.title,
    slug: p.slug,
    clientName: p.client?.name ?? "Client",
    recipientEmail: p.recipient_email ?? "",
  }));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-4 md:p-6 [scrollbar-width:thin]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Invoices</h1>
            <p className="text-[13px] text-[#94a3b8] mt-1">
              {invoices.length} invoice{invoices.length !== 1 ? "s" : ""} sent
            </p>
          </div>
          <InvoiceGeneratorButton proposals={proposals} />
        </div>

        {invoices.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center text-[#94a3b8] text-sm">
            No invoices yet. Open a proposal and click &quot;Invoice&quot;, or use &quot;+ New Invoice&quot; above.
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/40">
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Invoice #</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Client</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Sent to</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Due</th>
                  <th className="text-right px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Total</th>
                  <th className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-[0.07em] text-[#94a3b8]">Date</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} className="border-b border-white/30 last:border-0 hover:bg-white/20 transition-colors">
                    <td className="px-5 py-3.5 text-[13px] font-mono font-semibold text-[#0f172a]">
                      {inv.invoice_number}
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[#0f172a] font-medium">
                      {inv.client_name}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[#64748b]">
                      {inv.recipient_email}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[#64748b]">
                      {inv.due_date ? formatDate(inv.due_date) : <span className="text-[#94a3b8]">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-[14px] font-bold text-[#1B3FEE] text-right">
                      {fmt(inv.amount_total, inv.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[#94a3b8]">
                      {formatDate(inv.sent_at ?? inv.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      {inv.proposal_id && (
                        <Link
                          href={`/proposals/${inv.proposal_id}`}
                          className="text-[11.5px] font-semibold text-[#1B3FEE] hover:opacity-75 transition-opacity"
                        >
                          View proposal →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
