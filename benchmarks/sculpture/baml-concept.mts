// Stage-2 concept-art generator for vConcept SCULPTURE mode (T-035-01 / E-13), run via tsx.
// Sibling of benchmarks/temple-facade/baml-concept.mts — identical transport, swapping the
// BAML fn to SculptureConceptPrompt (3/4 freestanding object, not a head-on facade). Reads a
// JSON job on stdin:
//   { designDocPath, images?: [paths], targetBlocks, model: "flash"|"pro", outPath, attached? }
// BAML renders the SculptureConceptPrompt request; we extract the composed prompt TEXT (b.parse
// is never called — image output isn't a BAML parse target), attach any reference image(s) as
// multimodal inputs (the sculpture concept is doc-ONLY, so images is normally []), and call Nano
// Banana (Gemini). The concept image is written to outPath; a small result record on stdout.

import { readFileSync, writeFileSync } from "node:fs";
import { b } from "../../baml_client/index.ts";
import { generateImage, NANO_BANANA_PRO, NANO_BANANA_FLASH } from "../../src/nano-banana.mjs";

function readStdin(): Promise<string> {
  return new Promise((r) => {
    let d = "";
    process.stdin.on("data", (c) => (d += c));
    process.stdin.on("end", () => r(d));
  });
}

const { designDocPath, images = [], targetBlocks = 32, model = "pro", outPath, attached = "" } = JSON.parse(await readStdin());
const designDoc = readFileSync(designDocPath, "utf8");

// BAML needs a key to RENDER (never sent here); the real concept call is Nano Banana below.
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.SculptureConceptPrompt(designDoc, targetBlocks, attached);
const promptText = (req.body.json().messages ?? [])
  .flatMap((m: any) => (Array.isArray(m.content) ? m.content : [{ type: "text", text: m.content }]))
  .filter((c: any) => c.type === "text")
  .map((c: any) => c.text)
  .join("\n");

const mimeOf = (p: string) => {
  const l = p.toLowerCase();
  return l.endsWith(".jpg") || l.endsWith(".jpeg") ? "image/jpeg" : l.endsWith(".webp") ? "image/webp" : "image/png";
};
const imgs = (images as string[]).map((p) => ({ base64: readFileSync(p).toString("base64"), mediaType: mimeOf(p) }));

const modelId = model === "flash" ? NANO_BANANA_FLASH : NANO_BANANA_PRO;
const res = await generateImage({ prompt: promptText, images: imgs, model: modelId });
writeFileSync(outPath, Buffer.from(res.base64, "base64"));

process.stdout.write(
  JSON.stringify({ outPath, ms: res.ms, model: res.model, mediaType: res.mediaType, promptChars: promptText.length, imageCount: imgs.length }),
);
