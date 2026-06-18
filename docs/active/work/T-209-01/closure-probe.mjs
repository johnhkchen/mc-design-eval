// T-209-01 evidence probe (no spend, no GL): replay the runner's close_shell → apply_gable_roof →
// relief_walls sequence and print eaveRingClosure at each stage UNDER THE NEW WALL-PLANE METRIC. The witness
// for AC4: the 1.000 → 0.068 collapse at the relief step (T-208) is gone — closure stays ≥0.9. Compare to
// docs/active/work/T-208-01/closure-probe.mjs, which captured the collapse before this fix.
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
const pack = JSON.parse(readFileSync(join(ROOT, "packs", `${program.pack}.json`), "utf8"));
const ridgeAxis = program?.masses?.[0]?.roof?.ridgeAxis ?? "z";
const wallField = roleBlock(pack, program.masses[0].walls.ground.role);

const cl = (o) => eaveRingClosure(o, { floor: o.bounds.min[1], eaveY, program });
const show = (tag, o) => console.log(`${tag.padEnd(28)} closure = ${cl(o).toFixed(3)}  ${cl(o) >= 0.9 ? "(form-ready)" : "(OPEN)"}`);

const seed = artifactOccupancy(JSON.parse(readFileSync(join(ROOT, SEED), "utf8")));
show("seed (open colonnade)", seed);

const { occ: closed } = closeShell(seed, { program, floor: seed.bounds.min[1], eaveY, wallField });
show("after close_shell", closed);

function gableRoof(occ) {
  const kept = []; let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [key, block] of occ.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (y >= eaveY + 1) continue;
    kept.push({ pos: [x, y, z], block, form: occ.forms.get(key), state: occ.states.get(key) });
    if (y === eaveY) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  }
  const perp = ridgeAxis === "z" ? x1 - x0 : z1 - z0;
  const gable = gableRecord({ footprint: { x0, x1, z0, z1 }, ridgeAxis, eaveY, ridgeY: eaveY + Math.round(perp * 0.5), pitch: 0.5, hip: { demanded: false } });
  const FAMILY = { field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab", findings: [] };
  return occupancyFromCells([...kept, ...generateRoof([gable], FAMILY).cells]);
}
const gabled = gableRoof(closed);
show("after apply_gable_roof", gabled);

const { occ: relieved } = buildWallRelief(gabled, { program, pack, floor: gabled.bounds.min[1], eaveY });
show("after relief_walls", relieved);
console.log("\nAC4 witness: relief no longer collapses the form reading (was 1.000 → 0.068 in T-208).");
