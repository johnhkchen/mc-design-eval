// T-208-01 deterministic probe (no spend, no GL): isolate which batch hand collapses eaveRingClosure to 0.068,
// and whether it is a TRUE reopen or a build-relative-floor measurement artifact (the proud-relief off-ring
// residual, T-202/T-206 lineage). Replicates the runner's close_shell → apply_gable_roof → relief_walls.
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { artifactOccupancy, occupancyFromCells } from "../../../../src/view/occupancy.mjs";
import { closeShell, eaveRingClosure } from "../../../../src/view/wall-generate.mjs";
import { buildWallRelief } from "../../../../src/view/wall-relief.mjs";
import { gableRecord, generateRoof } from "../../../../src/view/roof-generate.mjs";
import { roleBlock } from "../../../../src/recognition/compile.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
const SEED = "benchmarks/sculpture/generated/gatehouse/artifact.json";
const PROG = "benchmarks/sculpture/recognition/gatehouse.program.json";
const eaveY = 18;
const program = JSON.parse(readFileSync(join(ROOT, PROG), "utf8"));
const pack = program?.pack ? JSON.parse(readFileSync(join(ROOT, "packs", `${program.pack}.json`), "utf8")) : null;
const ridgeAxis = program?.masses?.[0]?.roof?.ridgeAxis ?? "z";

const cl = (o, floor) => eaveRingClosure(o, { floor, eaveY, program });
const show = (tag, o, seedFloor) =>
  console.log(`${tag.padEnd(28)} bounds.minY=${o.bounds.min[1]}  cl(bounds.minY)=${cl(o, o.bounds.min[1]).toFixed(3)}  cl(seedFloor=${seedFloor})=${cl(o, seedFloor).toFixed(3)}`);

const seed = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED), "utf8")));
const seedFloor = seed.bounds.min[1];
show("seed (open colonnade)", seed, seedFloor);

const groundRole = program?.masses?.[0]?.walls?.ground?.role;
const wallField = (pack && groundRole) ? roleBlock(pack, groundRole) : undefined;
const { occ: closed } = closeShell(seed, { program, floor: seed.bounds.min[1], eaveY, wallField });
show("after close_shell", closed, seedFloor);

// apply_gable_roof (runner lines 128-140): keep y ≤ eaveY, replace roof.
function gableRoof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const ridgeY = eaveY + Math.round(perp * 0.5);
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis, eaveY, ridgeY, pitch: 0.5, hip: { demanded: false } });
  const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
const gabled = gableRoof(closed);
show("after apply_gable_roof", gabled, seedFloor);

const { occ: relieved } = buildWallRelief(gabled, { program, pack, floor: gabled.bounds.min[1], eaveY });
show("after relief_walls", relieved, seedFloor);

// And relief applied with the FIXED seed floor (what the metric SHOULD reference):
const { occ: relievedFixed } = buildWallRelief(gabled, { program, pack, floor: seedFloor, eaveY });
show("relief (floor=seedFloor)", relievedFixed, seedFloor);
