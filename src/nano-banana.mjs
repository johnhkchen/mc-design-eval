// Nano Banana (Gemini image generation) client — the E-09 concept-art stage transport.
// Multimodal in (a text prompt + reference images), one image out. Proven contract:
// {BASE}/models/{model}:generateContent with parts (inlineData images + text) and
// generationConfig.responseModalities = ["IMAGE"]; the reply carries the image as an
// inlineData part (base64). Reads GEMINI_API_KEY from the env or the gitignored .env.

import { readFileSync } from "node:fs";

const BASE = "https://generativelanguage.googleapis.com/v1beta";
export const NANO_BANANA_21 = "gemini-nano-banana-2.1"; // default since 2026-10-08 (owner's pick in the concept bake-off)
export const NANO_BANANA_PRO = "gemini-3-pro-image-preview"; // richer color/composition
export const NANO_BANANA_FLASH = "gemini-3.1-flash-image-preview"; // faster/cheaper

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY.trim();
  try {
    const env = readFileSync(new URL("../.env", import.meta.url), "utf8");
    const m = env.match(/^GEMINI_API_KEY=(.*)$/m);
    if (m) return m[1].trim();
  } catch { /* fall through */ }
  throw new Error("GEMINI_API_KEY not set (process.env or .env)");
}

/**
 * Generate one image from a text prompt + optional reference images (multimodal).
 * @param {{prompt:string, images?:{base64:string,mediaType:string}[], model?:string, retries?:number}} p
 * @returns {Promise<{base64:string, mediaType:string, ms:number, model:string}>}
 */
export async function generateImage({ prompt, images = [], model = process.env.MC_IMAGE_MODEL || NANO_BANANA_21, retries = 2 } = {}) {
  const key = loadKey();
  const parts = [
    ...images.map((im) => ({ inlineData: { mimeType: im.mediaType, data: im.base64 } })),
    { text: prompt },
  ];
  const body = JSON.stringify({ contents: [{ parts }], generationConfig: { responseModalities: ["IMAGE"] } });
  const url = `${BASE}/models/${model}:generateContent?key=${key}`;
  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const t0 = Date.now();
    let r, j;
    try {
      r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body });
      j = await r.json();
    } catch (e) {
      lastErr = e;
      continue;
    }
    if (j.error) {
      lastErr = new Error(`nano-banana ${j.error.status || r.status}: ${(j.error.message || "").slice(0, 200)}`);
      if (r.status >= 500 || r.status === 429) continue;
      throw lastErr; // 4xx (bad request) won't fix on retry
    }
    const part = (j.candidates?.[0]?.content?.parts || []).find((p) => p.inlineData);
    if (!part) {
      lastErr = new Error(`nano-banana: no image part (finish=${j.candidates?.[0]?.finishReason})`);
      continue;
    }
    return { base64: part.inlineData.data, mediaType: part.inlineData.mimeType, ms: Date.now() - t0, model };
  }
  throw lastErr;
}
