"use client";

import { useState, useRef } from "react";
import { FileText, X, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

interface ProjectReportButtonProps {
  projects: any[];
}

export function ProjectReportButton({ projects }: ProjectReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  async function generatePDF() {
    setGenerating(true);
    try {
      const jsPDF = (await import("jspdf")).default;
      const html2canvas = (await import("html2canvas")).default;
      if (!reportRef.current) return;

      const canvas = await html2canvas(reportRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
      heightLeft -= pageHeight - 20;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight - 20;
      }

      pdf.save(`Consulaw-Project-Report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <FileText className="w-3.5 h-3.5" /> Report
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="glass rounded-2xl w-full max-w-[700px] mx-4 overflow-hidden shadow-[0_24px_48px_rgba(0,0,0,0.15)] flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/50 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-[8px] bg-[rgba(27,63,238,0.1)] flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-[#1B3FEE]" />
                </div>
                <span className="text-[15px] font-bold text-[#0f172a]">Project Status Report</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-7 h-7 rounded-[8px] bg-white/60 border border-white/50 flex items-center justify-center hover:bg-white/80 cursor-pointer transition-colors">
                <X className="w-3.5 h-3.5 text-[#475569]" />
              </button>
            </div>

            {/* Report content (for PDF capture) */}
            <div className="flex-1 overflow-y-auto p-6">
              <div ref={reportRef} className="bg-white rounded-xl p-8 shadow-sm">
                {/* Report Header */}
                <div className="text-center mb-8 pb-6 border-b border-slate-200">
                  <div className="text-[24px] font-extrabold text-[#0f172a] mb-1">Consulaw Tech · Forge</div>
                  <div className="text-[14px] text-[#475569]">Project Status Report</div>
                  <div className="text-[12px] text-[#94a3b8] mt-1">Generated on {today}</div>
                </div>

                {/* Summary */}
                <div className="mb-6">
                  <h2 className="text-[16px] font-bold text-[#0f172a] mb-3">Summary</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-[20px] font-extrabold text-[#1B3FEE]">{projects.length}</div>
                      <div className="text-[11px] text-[#475569]">Total Projects</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-[20px] font-extrabold text-[#10b981]">
                        {projects.reduce((sum, p) => sum + ((p.milestones ?? []).flatMap((m: any) => m.tasks ?? []).filter((t: any) => t.status === "done").length), 0)}
                      </div>
                      <div className="text-[11px] text-[#475569]">Checkpoints Done</div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                      <div className="text-[20px] font-extrabold text-[#f59f00]">
                        {projects.reduce((sum, p) => sum + ((p.milestones ?? []).flatMap((m: any) => m.tasks ?? []).filter((t: any) => t.status === "late").length), 0)}
                      </div>
                      <div className="text-[11px] text-[#475569]">Overdue</div>
                    </div>
                  </div>
                </div>

                {/* Projects */}
                <div>
                  <h2 className="text-[16px] font-bold text-[#0f172a] mb-3">Projects</h2>
                  <div className="space-y-4">
                    {projects.map((project: any) => {
                      const allTasks = (project.milestones ?? []).flatMap((m: any) => m.tasks ?? []);
                      const doneTasks = allTasks.filter((t: any) => t.status === "done").length;
                      const progress = allTasks.length > 0 ? Math.round((doneTasks / allTasks.length) * 100) : 0;
                      return (
                        <div key={project.id} className="border border-slate-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <div className="text-[14px] font-bold text-[#0f172a]">{project.name}</div>
                              <div className="text-[11px] text-[#475569]">Client: {project.client?.name ?? "—"}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-[16px] font-extrabold text-[#1B3FEE]">{progress}%</div>
                              <div className="text-[10px] text-[#94a3b8]">complete</div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                            <div className="h-full bg-[#1B3FEE] rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="text-[11px] text-[#475569]">
                            {allTasks.length} checkpoint{allTasks.length !== 1 ? "s" : ""} · {doneTasks} done · {(project.milestones ?? []).length} task{(project.milestones ?? []).length !== 1 ? "s" : ""}
                          </div>
                          {project.target_date && (
                            <div className="text-[11px] text-[#94a3b8] mt-1">
                              Target: {formatDate(project.target_date, { month: "long", day: "numeric", year: "numeric" })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                  <div className="text-[11px] text-[#94a3b8]">
                    © {new Date().getFullYear()} Consulaw Tech. Confidential — For internal use only.
                  </div>
                </div>
              </div>
            </div>

            {/* Footer actions */}
            <div className="px-6 py-4 border-t border-white/50 flex gap-2 flex-shrink-0">
              <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button variant="primary" className="flex-1" loading={generating} onClick={generatePDF}>
                <Download className="w-3.5 h-3.5" />
                {generating ? "Generating…" : "Download PDF"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
