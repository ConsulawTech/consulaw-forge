import { Topbar } from "@/components/layout/Topbar";
import { TimelineReplay } from "@/components/timeline/TimelineReplay";

export default function TimelinePage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar />
      <div className="flex-1 overflow-y-auto p-6 [scrollbar-width:thin]">
        <div className="mb-5">
          <h1 className="text-[22px] font-extrabold text-[#0f172a] tracking-tight">Timeline Replay</h1>
          <p className="text-[13px] text-[#475569] mt-0.5">
            Drag tasks between phases, then play to watch progress animate
          </p>
        </div>
        <TimelineReplay />
      </div>
    </div>
  );
}
