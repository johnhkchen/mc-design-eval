// Close-up review of ONE change: render before/after, diff the pixels per view, crop tightly around the change, upscale,
// and ask a model whether it improves the build. No changed pixels = no visible change, without a model call.
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { requestTextWithImage } from "../../src/sdk-binding.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const MCD = join(HERE, "..", "..", "..", "minecraft-design", "tools", "bin", "mcd.mjs");
const { decodePng } = await import(join(HERE, "..", "..", "..", "minecraft-design", "tools", "src", "png.mjs"));
const img = (p) => ({ data: readFileSync(p), mediaType: /\.jpe?g$/i.test(p) ? "image/jpeg" : "image/png" });
export const VIEWS = ["street", "front-left", "front-right", "back-elevation", "front-elevation"];

export function renderTiles(nbt, tiles) {
  if (!existsSync(join(tiles, "street.png"))) execFileSync("node", [MCD, "render", nbt, "--front", "n", "--tiles", tiles, "--out", tiles + ".png"], { stdio: "ignore", env: { ...process.env, MCD_TILE_SCALE: "2" } });
  return tiles;
}

export async function reviewChange({ before, after, title, brief, concept, model = "claude-sonnet-5-5", workDir }) {
  const changed = VIEWS.map((v) => {
    const a = decodePng(readFileSync(join(before, `${v}.png`))), b = decodePng(readFileSync(join(after, `${v}.png`)));
    let n = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let y = 0; y < a.height; y++) for (let x = 0; x < a.width; x++) {
      const i = 4 * (y * a.width + x);
      if (Math.abs(a.rgba[i] - b.rgba[i]) + Math.abs(a.rgba[i + 1] - b.rgba[i + 1]) + Math.abs(a.rgba[i + 2] - b.rgba[i + 2]) > 30) { n++; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    }
    return { v, n, box: { x0, y0, x1, y1, w: a.width, h: a.height } };
  }).filter((d) => d.n > 30).sort((p, q) => q.n - p.n).slice(0, 2);
  if (!changed.length) return { verdict: "no-visible-change", why: "no pixels changed", cost: 0 };
  const pairs = changed.map(({ v, box }) => {
    const pad = Math.round(Math.max(box.x1 - box.x0, box.y1 - box.y0) * 0.4) + 30;
    const cx = Math.max(0, box.x0 - pad), cy = Math.max(0, box.y0 - pad), cw = Math.min(box.w, box.x1 + pad) - cx, ch = Math.min(box.h, box.y1 + pad) - cy;
    const f = join(workDir, `review-${v}.png`);
    execFileSync("magick", ["(", join(before, `${v}.png`), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", "700x700", ")",
      "(", join(after, `${v}.png`), "-crop", `${cw}x${ch}+${cx}+${cy}`, "+repage", "-resize", "700x700", ")", "-background", "white", "-splice", "12x0", "+append", f]);
    return { v, f };
  });
  const r = await requestTextWithImage({
    prompt: `${concept ? "Image 1 is the concept art (inspiration only). " : ""}${pairs.map((p, i) => `Image ${i + (concept ? 2 : 1)} is a close-up of the ${p.v} view: LEFT before, RIGHT after`).join("; ")}. ` +
      `The change is one improvement task ("${title}") on a Minecraft build (${brief}). Judge as a skilled builder: does it make the build better and ` +
      "more usable at a glance (it reads as what it is meant to be, crafted, not noise, clutter, a wrong colour or broken bits)? " +
      "Reply ONLY JSON: {\"verdict\": \"improves\"|\"neutral\"|\"worse\", \"why\": \"one sentence\"}",
    images: [...(concept ? [img(concept)] : []), ...pairs.map((p) => img(p.f))], model, effort: "low",
  });
  let j = {}; try { j = JSON.parse(r.text.slice(r.text.indexOf("{"), r.text.lastIndexOf("}") + 1)); } catch { j = { verdict: "neutral", why: r.text.slice(0, 160) }; }
  return { ...j, views: pairs.map((p) => p.v), cost: r.raw?.total_cost_usd || 0 };
}
