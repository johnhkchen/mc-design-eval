// 30 Rockefeller Plaza: lay the ground, then run every part in plan.md's order. Usage: node build.mjs <out.nbt>
import { Grid, runParts } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { DATA_VERSIONS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/structure.mjs";
import { SITE, inLot, groundLevel } from "./vocab/base.mjs";

const out = process.argv[2];
if (!out) { console.error("usage: node build.mjs <out.nbt>"); process.exit(2); }

const PARTS = [
  ["Massing and shell", "./parts/massing.mjs"],
  ["Tower facades", "./parts/tower-facade.mjs"],
  ["Wings and shopfronts", "./parts/wings.mjs"],
  ["Setbacks, decks and crown", "./parts/crown.mjs"],
  ["GE crown sign", "./parts/ge-sign.mjs"],
  ["East entrance, marquee and flags", "./parts/entrance.mjs"],
  ["Roof gardens and grounds", "./parts/grounds.mjs"],
  ["Lamplighting and checks", "./parts/lights.mjs"],
];

// A part whose file is missing or fails to load (its worker is still writing it) is left empty, not fatal.
// A part that throws keeps what it placed and says so.
async function loadPart(name, file) {
  let build;
  try { ({ build } = await import(file)); } catch (e) {
    console.log(`part ${name}: not loaded (${String(e.message).split("\n")[0]}); left empty`);
    return () => {};
  }
  return (g) => {
    try { build(g); } catch (e) { console.log(`part ${name}: FAILED (${String(e.message).split("\n")[0]}); kept what it placed`); }
  };
}

// Ground: stone below the walk level, a smooth stone skin at it, only inside the lot.
function ground() {
  const g = new Grid(SITE, { dataVersion: DATA_VERSIONS["1.21.1"] });
  for (let x = 0; x < SITE[0]; x++) for (let z = 0; z < SITE[2]; z++) {
    if (!inLot(x, z)) continue;
    const walk = groundLevel(x, z);
    for (let y = 0; y < walk; y++) g.set(x, y, z, y === walk - 1 ? "smooth_stone" : "stone");
  }
  return g;
}

const parts = [];
for (const [name, file] of PARTS) parts.push([name, await loadPart(name, file)]);
const run = (roof) => {
  const g = ground();
  runParts(g, parts, { palette: "palette.json", roof });
  return g;
};
// The roof is laid right after the massing part, and the toolkit needs walls to roof: while the massing is still a
// stub there are none, so the build goes on without the roof rather than failing.
let g;
try { g = run("roof.json"); } catch (e) {
  // the toolkit's roof preset has no rectangle to work from on this tower's stepped flat tops (roofs.mjs presetOptions
  // reduces an empty list): the crown and setbacks part lays the flat roofs and decks itself, so build without it
  console.log(/no walls found/.test(e.message) ? "roof: no walls yet (massing not built); this build has no roof" : `roof: toolkit roof failed (${e.message}); the parts' own roofs stand`);
  g = run(undefined);
}
g.save(out);
console.log(`saved ${out}`);
