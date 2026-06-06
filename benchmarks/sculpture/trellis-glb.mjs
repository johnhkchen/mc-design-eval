// TRELLIS-2 image→3D client (E-09 stage-2 seed; feeds the E-15 form-target seam).
//
// Replicates plant-model-studio's proven Modal contract (backend/cmd/generate-models/main.go
// `generateViaModal`): POST JSON { image: <b64 png>, decimation_target, texture_size, seed }
// to MODAL_ENDPOINT_URL → raw GLB bytes. The concept PNGs we already generate (3/4 view, solid
// black background) are ideal TRELLIS input — clean, segmentable, single subject.
//
// SECRET HYGIENE: the endpoint URL is read from process.env (sourced from the gitignored .env);
// it is NEVER printed. Errors report status/sizes only.
//
// Usage:  node benchmarks/sculpture/trellis-glb.mjs <input.png> <output.glb>

import { readFile, writeFile } from "node:fs/promises";

const GLTF_MAGIC = 0x46546c67; // "glTF" — little-endian u32 at byte 0 of a binary glTF (.glb)
const DEFAULTS = { decimationTarget: 150000, textureSize: 1024, seed: 42 };

/** POST one image to the TRELLIS Modal endpoint, return GLB bytes (Uint8Array). Throws on non-200
 *  or an implausibly small body. The endpoint URL is never included in thrown messages. */
export async function generateGlb(pngBytes, { endpoint, decimationTarget, textureSize, seed } = {}) {
  const url = endpoint ?? process.env.MODAL_ENDPOINT_URL;
  if (!url) throw new Error("MODAL_ENDPOINT_URL not set (source the gitignored .env)");
  const body = JSON.stringify({
    image: Buffer.from(pngBytes).toString("base64"),
    decimation_target: decimationTarget ?? DEFAULTS.decimationTarget,
    texture_size: textureSize ?? DEFAULTS.textureSize,
    seed: seed ?? DEFAULTS.seed,
  });
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
  const buf = new Uint8Array(await res.arrayBuffer());
  if (res.status !== 200) {
    const text = new TextDecoder().decode(buf).slice(0, 200);
    throw new Error(`TRELLIS HTTP ${res.status}: ${text}`); // url deliberately omitted
  }
  if (buf.length < 100) throw new Error(`TRELLIS response too small (${buf.length} bytes) — likely an error`);
  return buf;
}

/** Validate a .glb: magic header + report version/length. Returns {ok, version, length}. */
export function inspectGlb(buf) {
  if (buf.length < 12) return { ok: false, reason: "shorter than a glTF header" };
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const magic = dv.getUint32(0, true);
  const version = dv.getUint32(4, true);
  const length = dv.getUint32(8, true);
  return { ok: magic === GLTF_MAGIC, magicOk: magic === GLTF_MAGIC, version, length, bytes: buf.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [, , inPath, outPath] = process.argv;
  if (!inPath || !outPath) {
    console.error("usage: node benchmarks/sculpture/trellis-glb.mjs <input.png> <output.glb>");
    process.exit(2);
  }
  const t0 = Date.now();
  const png = await readFile(inPath);
  console.error(`→ TRELLIS: ${inPath} (${png.length} bytes) … (cold start can take a few minutes)`);
  const glb = await generateGlb(png);
  await writeFile(outPath, glb);
  const info = inspectGlb(glb);
  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.error(`✓ wrote ${outPath} — ${glb.length} bytes, glTF v${info.version}, magic ${info.magicOk ? "OK" : "BAD"}, ${secs}s`);
  if (!info.ok) process.exit(1);
}
