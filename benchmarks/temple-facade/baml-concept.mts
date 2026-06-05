// Stage-1 concept-art generator (E-09), run via tsx. Reads a JSON job on stdin:
//   { designDocPath, images: [paths], targetBlocks, model: "flash"|"pro", outPath }
// BAML renders the FacadeConceptPrompt request; we extract the composed prompt TEXT
// (b.parse is never called — image output isn't a BAML parse target), attach the
// reference image(s) as multimodal inputs, and call Nano Banana (Gemini). The concept
// image is written to outPath; a small result record is emitted on stdout.

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

const { designDocPath, images = [], targetBlocks = 48, model = "flash", outPath } = JSON.parse(await readStdin());
const designDoc = readFileSync(designDocPath, "utf8");

// BAML needs a key to RENDER (never sent here); the real concept call is Nano Banana below.
if (!process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = "baml-render-only";
const req: any = await b.request.FacadeConceptPrompt(designDoc, targetBlocks);
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

const modelId = model === "pro" ? NANO_BANANA_PRO : NANO_BANANA_FLASH;
const res = await generateImage({ prompt: promptText, images: imgs, model: modelId });
writeFileSync(outPath, Buffer.from(res.base64, "base64"));

process.stdout.write(
  JSON.stringify({ outPath, ms: res.ms, model: res.model, mediaType: res.mediaType, promptChars: promptText.length, imageCount: imgs.length }),
);
