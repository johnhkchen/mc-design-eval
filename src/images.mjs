// One door for every image generation in this repo: providers in fallback order, a content-addressed CACHE (an
// identical request — provider-independent prompt + input images + size — never pays twice) and a LEDGER line per
// call (what, why, which provider, cost estimate, output), so a portfolio write-up can trace every picture.
//
//   import { makeImage } from "../src/images.mjs"
//   const r = await makeImage({ prompt, images: [{ base64, mediaType }], purpose: "charter-row concept tribunal c1" })
//   // r = { base64, mediaType, provider, model, cached, file, ms }
//
// Providers (MC_IMAGE_PROVIDERS, comma list, default "codex,gemini"):
//   codex   gpt-image via `codex exec` on the ChatGPT plan (no API key; plan limits apply)       src/codex-image.mjs
//   gemini  Nano Banana 2.1 on the Gemini API (GEMINI_API_KEY; pay per image)                  src/nano-banana.mjs
import { createHash } from "node:crypto";
import { mkdirSync, existsSync, readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const CACHE = process.env.MC_IMAGE_CACHE || join(homedir(), ".cache", "mc-design-eval", "images");
export const LEDGER = process.env.MC_IMAGE_LEDGER || join(HERE, "..", "ledger", "images.jsonl");
// rough list prices per ~1K image, for the ledger only (the plan-billed provider is marginal $0)
const COST = { codex: 0, gemini: 0.0336 };

const providers = {
  codex: async (req) => (await import("./codex-image.mjs")).codexImage(req),
  gemini: async ({ prompt, images }) => {
    const { generateImage } = await import("./nano-banana.mjs");
    const r = await generateImage({ prompt, images });
    return { base64: r.base64, mediaType: r.mediaType, model: r.model };
  },
};

const sha = (b) => createHash("sha256").update(b).digest("hex");
export function cacheKey({ prompt, images = [], size = "", provider = "" }) {
  return sha(JSON.stringify({ prompt, size, provider, images: images.map((i) => sha(Buffer.from(i.base64, "base64"))) })).slice(0, 32);
}

/** Generate (or fetch from cache) one image. `provider` pins one; otherwise the fallback order is tried. `variant`
 *  distinguishes deliberate re-rolls of the same prompt (c1, c2, c3) so they are cached separately. */
export async function makeImage({ prompt, images = [], size, purpose = "", provider, variant = "", noCache = false } = {}) {
  const order = provider ? [provider] : (process.env.MC_IMAGE_PROVIDERS || "codex,gemini").split(",").map((s) => s.trim()).filter(Boolean);
  mkdirSync(CACHE, { recursive: true });
  mkdirSync(dirname(LEDGER), { recursive: true });
  const t0 = Date.now();
  let lastErr;
  for (const p of order) {
    const key = cacheKey({ prompt: prompt + (variant ? `\n#variant ${variant}` : ""), images, size, provider: p });
    const hit = ["png", "jpg", "webp"].map((e) => join(CACHE, `${key}.${e}`)).find(existsSync);
    if (hit && !noCache) {
      const out = { base64: readFileSync(hit).toString("base64"), mediaType: hit.endsWith(".png") ? "image/png" : hit.endsWith(".webp") ? "image/webp" : "image/jpeg",
        provider: p, model: JSON.parse(readFileSync(hit + ".json", "utf8")).model, cached: true, file: hit, ms: Date.now() - t0 };
      appendFileSync(LEDGER, JSON.stringify({ t: new Date().toISOString(), purpose, provider: p, model: out.model, cached: true, key, costUsd: 0, file: hit }) + "\n");
      return out;
    }
    try {
      const r = await providers[p]({ prompt, images, size });
      const ext = r.mediaType === "image/png" ? "png" : r.mediaType === "image/webp" ? "webp" : "jpg";
      const file = join(CACHE, `${key}.${ext}`);
      writeFileSync(file, Buffer.from(r.base64, "base64"));
      writeFileSync(file + ".json", JSON.stringify({ model: r.model, provider: p, purpose, prompt, inputs: images.length, size, at: new Date().toISOString() }, null, 1) + "\n");
      const ms = Date.now() - t0;
      appendFileSync(LEDGER, JSON.stringify({ t: new Date().toISOString(), purpose, provider: p, model: r.model, cached: false, key, ms, costUsd: COST[p] ?? null, file }) + "\n");
      return { ...r, provider: p, cached: false, file, ms };
    } catch (e) {
      lastErr = e;
      appendFileSync(LEDGER, JSON.stringify({ t: new Date().toISOString(), purpose, provider: p, error: String(e).slice(0, 300) }) + "\n");
    }
  }
  throw lastErr || new Error("no image provider configured");
}
