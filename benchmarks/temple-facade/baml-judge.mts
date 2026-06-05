// BAML categorical judge, run via tsx. Reads {imagePath, brief, samples} on stdin; for each
// sample: BAML renders the JudgeFacade prompt (enum-constrained output_format) with the render
// image, pipes it through claude -p (subscription), and SAP-parses the reply to a Category enum.
// Aggregates by median category and writes the score JSON to stdout.

import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml"; // CJS: `Image` isn't an ESM named export, only on the default
const { Image } = bamlpkg as any;
import { requestTextWithImage } from "../../src/sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../../src/config.mjs";

const CATEGORIES = ["weak", "competent", "strong", "exceptional"];
const RANK: Record<string, number> = Object.fromEntries(CATEGORIES.map((c, i) => [c, i]));
const DIMS = ["proportion", "color", "detail", "fidelity", "overall"];

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

const { imagePath, brief, samples = 3 } = JSON.parse(await readStdin());
const b64 = readFileSync(imagePath).toString("base64");
const ip = imagePath.toLowerCase();
const mediaType = ip.endsWith(".jpg") || ip.endsWith(".jpeg") ? "image/jpeg" : ip.endsWith(".webp") ? "image/webp" : "image/png";

const hadKey = "ANTHROPIC_API_KEY" in process.env;
const runs: any[] = [];
const usage = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };

for (let i = 0; i < samples; i++) {
  // BAML needs a key to RENDER (never sent); drop it before the claude -p (subscription) call.
  if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
  const req: any = await b.request.JudgeFacade(brief, Image.fromBase64(mediaType, b64));
  if (!hadKey) delete process.env.ANTHROPIC_API_KEY;

  const content = (req.body.json().messages ?? []).flatMap((m: any) =>
    Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }],
  );
  const textBlock = content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
  const imgBlock = content.find((c: any) => c.type === "image");

  const { text, raw } = await requestTextWithImage({
    prompt: textBlock,
    images: [{ base64: imgBlock.source.data, mediaType: imgBlock.source.media_type }],
    model: PHASE1_MODEL_ID,
  });

  let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  const lo = cleaned.indexOf("{");
  const hi = cleaned.lastIndexOf("}");
  if (lo >= 0 && hi > lo) cleaned = cleaned.slice(lo, hi + 1);
  runs.push(b.parse.JudgeFacade(cleaned));

  const u = raw.usage || {};
  usage.input_tokens += u.input_tokens || 0;
  usage.output_tokens += u.output_tokens || 0;
  usage.cost_usd += raw.total_cost_usd || 0;
}

const lc = (v: any) => String(v).toLowerCase();
const median = (cats: string[]) => {
  const r = cats.map((c) => RANK[c]).sort((a, b) => a - b);
  return CATEGORIES[r[Math.floor(r.length / 2)]];
};
const agg: any = {};
for (const k of DIMS) agg[k] = median(runs.map((r) => lc(r[k])));

process.stdout.write(
  JSON.stringify({
    ...agg,
    notes: runs[0].notes,
    samples: runs.length,
    rubric: "v2-categorical-baml",
    perSample: runs.map((r) => lc(r.overall)),
    usage,
  }),
);
