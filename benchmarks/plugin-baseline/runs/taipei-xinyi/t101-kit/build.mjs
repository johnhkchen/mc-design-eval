// Builds the Taipei 101 site: full-size grid, ground, then the six parts in plan.md order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, PLOTS, POLISHED_ANDESITE, SMOOTH_STONE } from "./vocab/base.mjs";

const PARTS = [
  ["Tower pedestal", "./parts/pedestal.mjs"],
  ["Segment", "./parts/segment.mjs"],
  ["Crown and spire", "./parts/crown.mjs"],
  ["Podium mall", "./parts/mall.mjs"],
  ["Medallions, canopies, grounds", "./parts/grounds.mjs"],
  ["Dusk lighting", "./parts/dusk.mjs"],
];

// Ground top y for a world column (plan.md SITE): plot 0 is 2 over most of the lot, 4 on the west street x 0..14,
// 3 at x 15..19, 1 on the east side and the north forecourt; plots 1 and 2 stand on y 0 (their foot floor).
function groundTop(x, z) {
  const p0 = PLOTS[0];
  if (x >= p0.x0 && x <= p0.x1 && z >= p0.z0 && z <= p0.z1) {
    let top = 2;
    if (x <= 14) top = 4;
    else if (x <= 19) top = 3;
    if (x >= 165 || (x >= 65 && x <= 99 && z <= 9)) top = 1;
    return top;
  }
  for (const p of [PLOTS[1], PLOTS[2]]) if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return 0;
  return null;
}

function layGround(g) {
  for (let x = 0; x < SITE[0]; x++) for (let z = 0; z < SITE[2]; z++) {
    const top = groundTop(x, z);
    if (top === null) continue;
    for (let y = 0; y < top; y++) g.set(x, y, z, SMOOTH_STONE);
    g.set(x, top, z, POLISHED_ANDESITE);
  }
}

// A part whose file isn't written yet (its worker still building it in another copy) is an empty build, not a failure.
// Only a missing module is skipped; a syntax or runtime error still fails the build.
async function partBuild(file, name) {
  try {
    return (await import(file)).build;
  } catch (e) {
    if (e.code !== "ERR_MODULE_NOT_FOUND") throw e;
    console.log(`part ${name}: ${file} not found (${String(e.message).split("\n")[0]}); built as empty`);
    return () => {};
  }
}

const out = process.argv[2];
if (!out) {
  console.error("usage: node build.mjs <out.nbt>");
  process.exit(2);
}

const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
layGround(g);
const list = [];
for (const [name, file] of PARTS) list.push([name, await partBuild(file, name)]);
// roof.json: absent on purpose. plan.md's only roof preset (flat-parapet-modern) is per mall terrace at three deck
// heights (y 35, 46, 68), and the mall part lays those through mallMass, so no single roof spec applies to the site.
runParts(g, list, { palette: "palette.json", roof: "roof.json" });
g.save(out);
console.log(`saved ${out}`);
