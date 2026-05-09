import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { STYLE_PRESETS } from "../src/lib/styles/presets";

async function main() {
  const supabase = createSupabaseAdminClient();
  const rows = STYLE_PRESETS.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    outfit: s.outfit,
    background: s.background,
    lighting: s.lighting,
    mood: s.mood,
    framing: s.framing,
    prompt_template: s.promptTemplate,
    negative_prompt: s.negativePrompt,
  }));

  const { error } = await supabase.from("style_presets").upsert(rows, { onConflict: "id" });
  if (error) throw error;
  console.log(`Seeded ${rows.length} style presets.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
