// Live BAML material-map bridge, run via tsx (T-071-01 / E-21 — the `.mjs ↔ .mts` bridge, mirroring
// src/sculptor/baml-review.mts). Reads {conceptPath, docPath?} on stdin; BAML renders the MaterialMap
// prompt with the concept image (+ design doc as a prior), pipes it through claude -p (subscription),
// and SAP-parses the reply to a MaterialMapResult. Maps each placementRule from BAML's PascalCase enum
// to the kebab vocabulary src/form/material-map.mjs validates on, and writes {materials:[…]} to stdout.
// NOT exercised by `npm test` (metered claude -p + BAML render); its consumer is benchmarks/.../material-map.mjs.

import { readFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import bamlpkg from "@boundaryml/baml"; // CJS: `Image` is on the default export, not an ESM named export
const { Image } = bamlpkg as any;
import { requestTextWithImage } from "../sdk-binding.mjs";
import { PHASE1_MODEL_ID } from "../config.mjs";
import { PLACEMENT_RULE_MAP } from "./material-map.mjs";

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

const { conceptPath, docPath } = JSON.parse(await readStdin());
const b64 = readFileSync(conceptPath).toString("base64");
const ip = String(conceptPath).toLowerCase();
const mediaType =
  ip.endsWith(".jpg") || ip.endsWith(".jpeg") ? "image/jpeg" : ip.endsWith(".webp") ? "image/webp" : "image/png";

// The design doc is a PRIOR; the concept image is the primary signal. Tolerate a missing doc.
const designDoc = docPath
  ? readFileSync(docPath, "utf8")
  : "(no design document supplied — infer the materials from the concept image alone)";

// BAML needs a key to RENDER the prompt (never sent); drop it before the claude -p (subscription) call.
const hadKey = "ANTHROPIC_API_KEY" in process.env;
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.MaterialMap(designDoc, Image.fromBase64(mediaType, b64));
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
const parsed: any = b.parse.MaterialMap(cleaned);

const materials = (parsed.materials ?? []).map((m: any) => ({
  role: m.role ?? "",
  block: m.block ?? "",
  placementRule: PLACEMENT_RULE_MAP[String(m.placementRule)] ?? String(m.placementRule),
  rationale: m.rationale ?? "",
}));

process.stdout.write(JSON.stringify({ materials }));
