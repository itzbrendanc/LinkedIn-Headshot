import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const checks = [
  "Clear face (no obstructions)",
  "Close-up (head and shoulders)",
  "No sunglasses",
  "No heavy filters",
  "Good lighting",
  "Different angles",
];

export function PhotoQualityChecklist() {
  return (
    <Card className="border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-white text-base">Photo quality checklist</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm text-white/65">
        {checks.map((c) => (
          <div key={c} className="flex items-start gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-white/50" />
            <span>{c}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

