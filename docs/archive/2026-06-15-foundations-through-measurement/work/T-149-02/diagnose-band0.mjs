// Throwaway diagnostic (T-149-02 Step 1): reproduce the gate's band0 zone derivation offline and
// print the band yRanges + per-azimuth own/dominant fractions, against the build's stone/white split.
// No model, no GL — decodeImage is a PNG decode. Run from benchmarks/sculpture/.
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
const R = "../../../../";
const { deriveZones } = await import(R + "benchmarks/sculpture/multi-angle-gate.mjs");
const { reviveComponentPlan } = await import(R + "src/view/component-plan.mjs");
const { artifactOccupancy } = await import(R + "src/view/occupancy.mjs");
const { decodeImage } = await import(R + "src/color/palette-extract.mjs");
const { surfaceZoneHistogram, ownCoverage } = await import(R + "src/view/zone-fill.mjs");

const HERE = process.cwd();
const ART = "workshop/cottage/final-artifact.json";
const CONCEPT = "runs/014-vConcept-a-cottage/concept.png";
const MAP = "material-map/cottage.json";
const PLAN = "workshop/cottage/component-plan.json";
const AZIMUTHS = ["+x+z", "+x-z", "-x-z", "-x+z"];

const fallbackPolicy = {
  band0: { dominant: "stone_bricks", preserve: ["cobblestone", "dark_oak_log"] },
  band1: { dominant: "white_terracotta", preserve: ["dark_oak_log", "spruce_planks"] },
  roof: { dominant: "spruce_planks", preserve: ["dark_oak_planks", "cobblestone", "bricks"] },
};

const artifact = JSON.parse(await readFile(join(HERE, ART), "utf8"));
const occ = artifactOccupancy(artifact);
const matMap = JSON.parse(await readFile(join(HERE, MAP), "utf8"));
const conceptImg = await decodeImage(join(HERE, CONCEPT));
const componentPlan = existsSync(join(HERE, PLAN))
  ? reviveComponentPlan(JSON.parse(await readFile(join(HERE, PLAN), "utf8")))
  : null;

const derived = deriveZones({ occ, conceptImg, matMap, fallbackPolicy, componentPlan });
console.log("source:", derived.source, derived.reason ?? "");
console.log("upperTop:", derived.sz?.upperTop, "wallTop(plan):", componentPlan?.wallTopEffective ?? componentPlan?.wallTop);
console.log("bands:");
for (const b of derived.bands ?? []) {
  console.log(`  ${b.name}: yRange ${JSON.stringify(b.yRange)} dominant ${b.dominantBlock} share ${b.share}`);
}

// build's stone/white transition
const byY = {};
for (const c of artifact.placements) {
  const y = c.pos[1];
  const blk = c.block.replace("minecraft:", "");
  (byY[y] ??= {})[blk] = (byY[y][blk] || 0) + 1;
}
const domAt = (y) => Object.entries(byY[y] ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
console.log("\nbuild per-y dominant (wall):");
for (let y = 0; y <= (derived.sz?.upperTop ?? 20); y++) console.log(`  y${y}: ${domAt(y)}`);

// per-azimuth own/dominant for band0 (must reproduce committed ~0.40)
console.log("\nband0 coverage per azimuth (reproduce committed):");
const zonesForCov = Object.fromEntries(Object.entries(derived.zones).map(([z, p]) => [z, { dominant: p.dominant, preserve: p.preserve }]));
for (const a of AZIMUTHS) {
  const hist = surfaceZoneHistogram(occ, derived.zoneOf, { faces: [a], skin: "projection" });
  const cov = ownCoverage(hist, zonesForCov);
  const b0 = cov.band0;
  console.log(`  ${a}: own ${b0?.ownFraction} dominant ${b0?.dominantFraction} total ${b0?.total}`);
}
