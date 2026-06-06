// Live BAML material-correction bridge, run via tsx (T-073-01 / E-21 — the `.mjs ↔ .mts` bridge,
// mirroring src/revise/baml-revise.mts but with TWO images). Reads {renderPath, conceptPath, subject,
// region, currentPalette, placements} on stdin; BAML renders the CorrectRegion prompt with the concept
// image + the region render crop, pipes it through claude -p (subscription), and SAP-parses the reply to a
// RegionCorrection. Writes {swaps:[…], additions:[…]} to stdout — the recolor-only correction
// src/revise/material-edit.mjs applies under the region-lock + the palette policy + AJV. NOT exercised by
// `npm test` (metered claude -p + BAML render); its consumer is defaultProposeCorrection.

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

function imageFor(path: string) {
  const b64 = readFileSync(path).toString("base64");
  const ip = String(path).toLowerCase();
  const mediaType =
    ip.endsWith(".jpg") || ip.endsWith(".jpeg") ? "image/jpeg" : ip.endsWith(".webp") ? "image/webp" : "image/png";
  return Image.fromBase64(mediaType, b64);
}

const { renderPath, conceptPath, subject, region, currentPalette, placements } = JSON.parse(await readStdin());
const renderImg = imageFor(renderPath);
const conceptImg = imageFor(conceptPath);

// BAML needs a key to RENDER the prompt (never sent); drop it before the claude -p (subscription) call.
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.CorrectRegion(subject, region, currentPalette, placements, renderImg, conceptImg);
if (!hadKey) delete process.env.ANTHROPIC_API_KEY;

const content = (req.body.json().messages ?? []).flatMap((m: any) =>
  Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }],
);
const textBlock = content.filter((c: any) => c.type === "text").map((c: any) => c.text).join("\n");
const images = content
  .filter((c: any) => c.type === "image")
  .map((c: any) => ({ base64: c.source.data, mediaType: c.source.media_type }));

const { text } = await requestTextWithImage({
  prompt: textBlock,
  images,
  model: PHASE1_MODEL_ID,
});

let cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
const lo = cleaned.indexOf("{");
const hi = cleaned.lastIndexOf("}");
if (lo >= 0 && hi > lo) cleaned = cleaned.slice(lo, hi + 1);
const parsed: any = b.parse.CorrectRegion(cleaned);

const remaps = (parsed.remaps ?? []).map((r: any) => ({ fromBlock: r.fromBlock ?? "", toBlock: r.toBlock ?? "" }));
const swaps = (parsed.swaps ?? []).map((s: any) => ({ target: s.target, block: s.block ?? "" }));
const additions = (parsed.additions ?? []).map((a: any) => ({
  block: a.block ?? "",
  conceptMaterial: a.conceptMaterial ?? "",
  where: a.where ?? "",
  rationale: a.rationale ?? "",
}));

process.stdout.write(JSON.stringify({ remaps, swaps, additions }));
