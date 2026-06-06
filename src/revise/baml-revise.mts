// Live BAML form-editor, run via tsx (T-046-01 — the `.mjs ↔ .mts` bridge, mirroring
// src/sculptor/baml-review.mts). Reads {imagePath, subject, defect, region, placements} on stdin; BAML
// renders the ReviseRegion prompt (op-union output_format) with the region CROP image, pipes it through
// claude -p (subscription), and SAP-parses the reply to a RegionEdit. Writes {ops:[...]} to stdout — the
// bounded edit-op list src/revise/form-edit.mjs applies under the region-lock + AJV. NOT exercised by
// `npm test` (metered claude -p + BAML render); its consumer is defaultProposeEdit.

import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml"; // CJS: `Image` is on the default export, not an ESM named export
const { Image } = bamlpkg as any;
import { requestTextWithImage } from "../sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

const { imagePath, subject, defect, region, placements } = JSON.parse(await readStdin());
const b64 = readFileSync(imagePath).toString("base64");
const ip = String(imagePath).toLowerCase();
const mediaType =
  ip.endsWith(".jpg") || ip.endsWith(".jpeg") ? "image/jpeg" : ip.endsWith(".webp") ? "image/webp" : "image/png";

// BAML needs a key to RENDER the prompt (never sent); drop it before the claude -p (subscription) call.
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.ReviseRegion(subject, defect, region, placements, Image.fromBase64(mediaType, b64));
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
const parsed: any = b.parse.ReviseRegion(cleaned);

process.stdout.write(JSON.stringify({ ops: parsed.ops ?? [] }));
