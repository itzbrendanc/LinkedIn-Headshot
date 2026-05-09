import { cn } from "@/lib/utils";

const steps = [
  { id: "uploaded", label: "Uploaded" },
  { id: "queued", label: "Queued" },
  { id: "training", label: "Training" },
  { id: "training_identity", label: "Training identity" },
  { id: "generating", label: "Generating" },
  { id: "enhancing", label: "Enhancing" },
  { id: "ready", label: "Ready" },
  { id: "failed", label: "Failed" },
] as const;

export function JobStatusTimeline({ status }: { status: string }) {
  const currentIndex = steps.findIndex((s) => s.id === status);
  return (
    <div className="grid gap-3">
      <div className="text-sm text-white/65">Status</div>
      <div className="grid gap-2">
        {steps.map((s, idx) => {
          const done = currentIndex >= idx && currentIndex !== -1;
          const active = steps[currentIndex]?.id === s.id;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  done ? "bg-white" : "bg-white/20",
                  active ? "ring-4 ring-white/10" : "",
                )}
              />
              <div className={cn("text-sm", done ? "text-white" : "text-white/45")}>
                {s.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
