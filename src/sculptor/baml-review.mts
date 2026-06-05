// Live BAML diagnostic critic, run via tsx (T-026-01 — the `.mjs ↔ .mts` bridge, mirroring
// benchmarks/temple-facade/baml-judge.mts). Reads {imagePath, brief} on stdin; BAML renders the
// DiagnoseFacade prompt (enum-constrained output_format) with the render image, pipes it through
// claude -p (subscription), and SAP-parses the reply to a FacadeDiagnosis. Maps each defect from
// BAML's PascalCase enum to the kebab vocabulary src/sculptor/review.mjs routes on, and writes
// {defects:[{defect, where}]} to stdout. Single sample — diagnosis is categorical, not scored.
// NOT exercised by `npm test` (metered claude -p + BAML render); its consumer is defaultDiagnose.

import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml"; // CJS: `Image` is on the default export, not an ESM named export
const { Image } = bamlpkg as any;
import { requestTextWithImage } from "../sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";

/** BAML enum (PascalCase) → the kebab defect vocabulary in review.mjs. */
const DEFECT_MAP: Record<string, string> = {
  Flat: "flat",
  Ringing: "ringing",
  UnderDetailedFocal: "under-detailed-focal",
  Proportion: "proportion",
};

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

const { imagePath, brief } = JSON.parse(await readStdin());
const b64 = readFileSync(imagePath).toString("base64");
const ip = String(imagePath).toLowerCase();
const mediaType =
  ip.endsWith(".jpg") || ip.endsWith(".jpeg") ? "image/jpeg" : ip.endsWith(".webp") ? "image/webp" : "image/png";

// BAML needs a key to RENDER the prompt (never sent); drop it before the claude -p (subscription) call.
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.DiagnoseFacade(brief, Image.fromBase64(mediaType, b64));
if (!hadKey) delete process.env.ANTHROPIC_API_KEY;

const content = (req.body.json().messages ?? []).flatMap((m: any) =>
  Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }],
);
const textBlock = content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
const imgBlock = content.find((c: any) => c.type === "image");

const { text } = await requestTextWithImage({
  prompt: textBlock,
  images: [{ base64: imgBlock.source.data, mediaType: imgBlock.source.media_type }],
  model: PHASE1_MODEL_ID,
});

let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
const lo = cleaned.indexOf("{");
const hi = cleaned.lastIndexOf("}");
if (lo >= 0 && hi > lo) cleaned = cleaned.slice(lo, hi + 1);
const parsed: any = b.parse.DiagnoseFacade(cleaned);

const defects = (parsed.defects ?? []).map((d: any) => ({
  defect: DEFECT_MAP[String(d.defect)] ?? String(d.defect).toLowerCase(),
  where: d.where ?? "",
}));

process.stdout.write(JSON.stringify({ defects }));
