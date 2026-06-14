// One-off provisioning: a full-BUILDING concept via Nano Banana (flash), to de-risk E-20 / S-067
// (does TRELLIS reconstruct a whole building?). Mirrors the locked SculptureConceptPrompt recipe —
// single isolated subject, 3/4 view, solid-black background, bold block-scale detail — adapted to a
// building (four walls + roof, in the round, NOT a facade). Usage:
//   set -a; . ./.env; set +a; node benchmarks/sculpture/building-concept.mjs <out.png>
import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { generateImage, NANO_BANANA_FLASH } from "../../src/nano-banana.mjs";

const PROMPT = `Generate CONCEPT ART of a Minecraft-block BUILDING: a SINGLE ISOLATED COMPLETE building shown
in a clear THREE-QUARTER (3/4) VIEW — angled so two facades and the roof read at once, seen slightly from
above as if on a turntable — floating against a solid BLACK (#000000) background so it segments cleanly for
3D reconstruction. There is exactly ONE building and ONE view: no second copy, no turnaround sheet, no side
panels. No ground plane, no cast shadows, no sky, terrain, scenery, fence, path, or surroundings of any kind.
The whole building is CENTERED and FULLY VISIBLE (not cropped — a small margin on every side), filling most
of the frame, lit by bright even STUDIO lighting with no dramatic shadows.

Render it in authentic MINECRAFT BLOCK style — built from cubic blocks, block-scale detail ONLY, every
feature BOLD and chunky (the build is about 48 blocks along its longest dimension). Approximate any curve or
round form with stepped, faceted blocks; NO smooth surfaces, NO sub-block ornament, NO thin spikes or
filigree, NO text/letters/signs.

THE SUBJECT: a cozy two-story fantasy cottage — a weathered STONE ground floor, a TIMBER-FRAMED upper floor
(exposed dark oak beams over cream plaster infill), a STEEP gabled wooden-SHINGLE roof, a chunky STONE
CHIMNEY, shuttered windows, and a wooden door. It is a SOLID building IN THE ROUND with four real walls and a
full pitched roof — NOT a flat facade or a single wall. Commit to a clear material palette: weathered grey
stone, warm oak timber, cream plaster, dark roof shingles, with one small warm accent (a glowing lantern by
the door).

The background must be SOLID #000000 black — never white, grey, coloured, or gradient; the building floats on
pure black. Keep the building's OUTER SILHOUETTE (roof ridge, eaves, chimney top, wall corners) in BRIGHT
palette colours so the top and edges do not vanish into the black; reserve any dark tones for recessed or
interior areas only.`;

const out = process.argv[2];
if (!out) { console.error("usage: node building-concept.mjs <out.png>"); process.exit(2); }
const t0 = Date.now();
const res = await generateImage({ prompt: PROMPT, model: NANO_BANANA_FLASH });
await mkdir(dirname(out), { recursive: true });
await writeFile(out, Buffer.from(res.base64, "base64"));
console.error(`✓ ${out} — ${res.mediaType}, ${((Date.now() - t0) / 1000).toFixed(1)}s, model ${res.model}`);
