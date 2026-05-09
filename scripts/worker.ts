import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import { getServerEnv } from "../src/lib/env";
import { PLANS } from "../src/lib/pricing";
import { getHeadshotProvider } from "../src/lib/ai/provider";
import { MockHeadshotProvider } from "../src/lib/ai/providers/mock";
import { DEFAULT_PROMPT_VERSION } from "../src/lib/ai/prompt-versions";
import { logger } from "../src/lib/logger";

type PresetRow = {
  id: string;
  name: string;
  outfit: string;
  background: string;
  lighting: string;
  mood: string;
  framing: string;
  prompt_template: string;
  negative_prompt: string;
};

async function processOne() {
  const supabase = createSupabaseAdminClient();
  const env = getServerEnv();

  const { data: job, error } = await supabase
    .from("generation_jobs")
    .select("*")
    .eq("status", "queued")
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!job) return false;

  const jobId = job.id as string;
  const userId = job.user_id as string;
  const selectedStyles = (job.selected_styles as string[]) ?? [];
  const inputImagePaths = (job.input_image_paths as string[]) ?? [];
  const orderId = job.order_id as string | null;
  const parentJobId = (job.parent_job_id as string | null) ?? null;
  const requestedImagesRaw = (job.requested_images as number | null) ?? 0;
  const alreadyCharged = (job.credits_charged as number | null) ?? 0;

  // Mark as training (best-effort "claim").
  const { error: claimErr } = await supabase
    .from("generation_jobs")
    .update({ status: "training" })
    .eq("id", jobId)
    .eq("status", "queued");
  if (claimErr) throw claimErr;
  logger.info("worker_job_claimed", { jobId, userId, provider: job.provider });

  const provider = getHeadshotProvider();

  const styleNameById = new Map<string, string>();
  const presetRows: PresetRow[] = selectedStyles.length
    ? (((await supabase
        .from("style_presets")
        .select(
          "id,name,outfit,background,lighting,mood,framing,prompt_template,negative_prompt",
        )
        .in("id", selectedStyles)).data ?? []) as unknown as PresetRow[])
    : [];

  const stylePresets = presetRows.map((p) => {
      styleNameById.set(p.id, p.name);
      return {
        id: p.id,
        name: p.name,
        outfit: p.outfit,
        background: p.background,
        lighting: p.lighting,
        mood: p.mood,
        framing: p.framing,
        promptTemplate: p.prompt_template,
        negativePrompt: p.negative_prompt,
      };
    });

  // Build reference URLs (signed) for provider calls.
  const referenceImageUrls: string[] = [];
  for (const p of inputImagePaths.slice(0, 10)) {
    const { data: signed, error: signedErr } = await supabase.storage
      .from("uploads")
      .createSignedUrl(p, 60 * 60);
    if (signedErr) {
      throw new Error(
        `Failed to create signed URL for upload. Ensure private 'uploads' bucket exists. (${signedErr.message})`,
      );
    }
    if (signed?.signedUrl) referenceImageUrls.push(signed.signedUrl);
  }

  let planId: string | null = null;
  if (orderId) {
    const { data: order } = await supabase.from("orders").select("plan_id").eq("id", orderId).maybeSingle();
    planId = (order?.plan_id as string) ?? null;
  }
  const planDef = PLANS.find((p) => p.id === planId) ?? PLANS[0]!;
  const total = requestedImagesRaw > 0 ? requestedImagesRaw : planDef.images;
  const perStyle = Math.max(1, Math.floor(total / Math.max(1, selectedStyles.length)));

  await supabase.from("generation_jobs").update({ status: "generating" }).eq("id", jobId);

  let creditsChargedForJob = 0;
  try {
    // Billing: deduct credits when generation starts (prod only).
    const billingEnabled = Boolean(env.STRIPE_SECRET_KEY) && (job.provider as string) !== "mock";
    let creditsCharged = 0;
    if (alreadyCharged > 0) {
      // Avoid double-charging on retries/reprocessing.
      creditsCharged = alreadyCharged;
      creditsChargedForJob = alreadyCharged;
      logger.warn("credits_already_charged_skip", { jobId, userId, credits: alreadyCharged });
    } else if (billingEnabled && total > 0) {
      const { data: creditsRow, error: creditsErr } = await supabase
        .from("user_credits")
        .select("balance,lifetime_used")
        .eq("user_id", userId)
        .maybeSingle();
      if (creditsErr) throw creditsErr;
      const balance = (creditsRow?.balance as number | null) ?? 0;
      if (balance < total) {
        const msg = `Insufficient credits. Need ${total}, have ${balance}.`;
        await supabase
          .from("generation_jobs")
          .update({ status: "failed", error_message: msg })
          .eq("id", jobId);
        return true;
      }

      await supabase
        .from("user_credits")
        .update({
          balance: balance - total,
          lifetime_used: ((creditsRow?.lifetime_used as number | null) ?? 0) + total,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);

      await supabase.from("credit_transactions").insert({
        user_id: userId,
        order_id: orderId,
        delta: -total,
        reason: `job_charge:${jobId}`,
      });
      logger.info("credits_charged", { jobId, userId, credits: total, orderId });

      creditsCharged = total;
      creditsChargedForJob = creditsCharged;
      await supabase
        .from("generation_jobs")
        .update({ credits_charged: creditsCharged })
        .eq("id", jobId);

      if (orderId) {
        const { data: orderRow } = await supabase
          .from("orders")
          .select("credits_used")
          .eq("id", orderId)
          .maybeSingle();
        await supabase
          .from("orders")
          .update({ credits_used: ((orderRow?.credits_used as number | null) ?? 0) + creditsCharged })
          .eq("id", orderId);
      }
    }

    const generated = await provider.generateHeadshots({
      userId,
      jobId,
      selectedStyleIds: selectedStyles,
      stylePresets,
      referenceImageUrls,
      imagesPerStyle: perStyle,
    });

    if (provider.name === "mock") {
      // Render and upload deterministic SVGs.
      let index = 0;
      for (const img of generated) {
        const parts = img.storagePath.split("/");
        const styleId = parts[2] ?? "style";
        const styleName = styleNameById.get(styleId) ?? styleId;
        const svg = MockHeadshotProvider.renderSvgWithName(
          styleId,
          styleName,
          index++,
        );
        const bytes = new TextEncoder().encode(svg);
        const { error: upErr } = await supabase.storage
          .from(img.storageBucket)
          .upload(img.storagePath, bytes, {
            contentType: "image/svg+xml",
            upsert: true,
          });
        if (upErr) {
          throw new Error(
            `Failed to upload mock output. Ensure private '${img.storageBucket}' bucket exists. (${upErr.message})`,
          );
        }
      }
    } else {
      for (const img of generated) {
        if (!img.sourceUrl) {
          throw new Error("Provider returned an image without sourceUrl.");
        }
        const res = await fetch(img.sourceUrl);
        if (!res.ok) {
          throw new Error(
            `Failed to download provider output (${res.status}).`,
          );
        }
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const contentType =
          img.contentType || res.headers.get("content-type") || "image/jpeg";

        const { error: upErr } = await supabase.storage
          .from(img.storageBucket)
          .upload(img.storagePath, bytes, { contentType, upsert: true });
        if (upErr) {
          throw new Error(
            `Failed to upload provider output. Ensure private '${img.storageBucket}' bucket exists. (${upErr.message})`,
          );
        }
      }
    }

    await supabase
      .from("generation_jobs")
      .update({ status: "enhancing" })
      .eq("id", jobId);

    const outputPaths = generated.map((g) => g.storagePath);
    await supabase
      .from("generation_jobs")
      .update({ status: "ready", output_image_paths: outputPaths })
      .eq("id", jobId);
    logger.info("job_ready", { jobId, userId, outputs: outputPaths.length });

    if (selectedStyles.length > 0) {
      const rows = generated.map((g) => {
        const parts = g.storagePath.split("/");
        const styleId = parts[2] ? parts[2] : selectedStyles[0]!;
        return {
          job_id: jobId,
          user_id: userId,
          style_id: styleId,
          storage_bucket: g.storageBucket,
          storage_path: g.storagePath,
          width: g.width,
          height: g.height,
          provider: provider.name,
          prompt_version: DEFAULT_PROMPT_VERSION,
          source_job_id: parentJobId ?? jobId,
          generation_seed: g.generationSeed,
        };
      });
      const { error: insErr } = await supabase.from("generated_images").insert(rows);
      if (insErr) throw insErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Generation failed.";
    const creditsCharged = creditsChargedForJob;
    const billingEnabled = Boolean(env.STRIPE_SECRET_KEY) && (job.provider as string) !== "mock";
    if (billingEnabled && creditsCharged > 0) {
      const { data: creditsRow } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();
      const balance = (creditsRow?.balance as number | null) ?? 0;
      await supabase
        .from("user_credits")
        .update({ balance: balance + creditsCharged, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      await supabase.from("credit_transactions").insert({
        user_id: userId,
        order_id: orderId,
        delta: creditsCharged,
        reason: `job_refund:${jobId}`,
      });
      logger.warn("credits_refunded", { jobId, userId, credits: creditsCharged, orderId });
      if (orderId) {
        const { data: orderRow } = await supabase
          .from("orders")
          .select("credits_refunded")
          .eq("id", orderId)
          .maybeSingle();
        await supabase
          .from("orders")
          .update({ credits_refunded: ((orderRow?.credits_refunded as number | null) ?? 0) + creditsCharged })
          .eq("id", orderId);
      }
      await supabase
        .from("generation_jobs")
        .update({ credits_charged: 0 })
        .eq("id", jobId);
    }
    await supabase
      .from("generation_jobs")
      .update({ status: "failed", error_message: message })
      .eq("id", jobId);
    logger.error("job_failed", { jobId, userId, error: message });
    throw err;
  }

  return true;
}

async function main() {
  console.log("Worker started. Processing one queued job...");
  const did = await processOne();
  console.log(did ? "Processed a job." : "No queued jobs.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
