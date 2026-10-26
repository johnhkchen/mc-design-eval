import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// NW Washington DC 00000, Vacant: a 1920s Federal-style commercial block, buff brick on a stone base with limestone
// trim (quoins, string courses, a parapet with dentils). Three storeys over a stone plinth, the lidar roof record
// flat at 8 everywhere, so the massing is one tier. Vacant: the shopfront and some upper windows are boarded, no lamps.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC75309.cells.json`, "utf8")); // [x, z, ground, roof] per footprint cell

const g = new Voxels([17, 19, 7]);

// footprint: cell -> { ground, roof }
const S = new Map();
for (const [x, z, ground, roof] of cells) S.set(`${x},${z}`, { ground, roof });
const inS = (x, z) => S.has(`${x},${z}`);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(OUT).filter(d => !inS(x + OUT[d][0], z + OUT[d][1]));
const perimeter = (x, z) => exposed(x, z).length > 0;
// blocks that a pane joins to sideways
const JOIN = new Set(["glass_pane", "bricks", "smooth_quartz", "stone", "smooth_stone", "stone_bricks", "oak_planks"]);

// the lowest course: stone base, all the way under (the ground-0 cells start their walls at y 0 on the terrain)
for (const [key, c] of S) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const per = ex.length > 0;
  const corner = ex.includes("N") || ex.includes("S") ? ex.some(d => d === "W" || d === "E") : false;
  const face = ex.find(d => d === "N" || d === "S" || d === "W" || d === "E") ?? null;
  const onZ = ex.includes("N") || ex.includes("S");
  const t = onZ ? x : z; // along-the-face index for windows
  g.set(x, 0, z, "stone_bricks");
  if (!per) {
    // interior: floor slabs at storey lines, a roof deck; the air between is the gap behind the glass
    g.set(x, 1, z, "stone"); g.set(x, 3, z, "stone"); g.set(x, 5, z, "stone");
    g.set(x, 7, z, "smooth_stone");
    continue;
  }
  // roof deck is solid inside the parapet
  // the parapet ring is quartz; cornice dentils alternate on the ring
  const doorCell = ex.length === 1 && face === "N" && x === 3 && z === 0;
  if (doorCell) {
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "smooth_quartz");
    continue;
  }
  // plinth course (y 1)
  g.set(x, 1, z, "smooth_quartz");
  // ground floor (y 2): shopfront glass between quartz pillars (panes are joined in the second pass)
  if (corner || t % 3 === 0) g.set(x, 2, z, "smooth_quartz");
  else g.set(x, 2, z, "glass_pane");
  // storey line (y 3)
  g.set(x, 3, z, "smooth_quartz");
  // upper storeys (y 4, y 6): brick piers and windows; every other window boarded (vacant)
  for (const y of [4, 6]) {
    if (corner) g.set(x, y, z, "smooth_quartz");
    else if (t % 2 === 0) g.set(x, y, z, "bricks");
    else if ((t + y) % 4 === 1) g.set(x, y, z, "oak_planks");
    else g.set(x, y, z, "glass_pane");
  }
  // spandrel (y 5): brick between the upper windows, a limestone string course at the corners
  g.set(x, 5, z, corner ? "smooth_quartz" : "bricks");
  // parapet cornice (y 7): full quartz on the corners and every other cell, slab between for the dentil rhythm
  if (corner || t % 2 === 0) g.set(x, 7, z, "smooth_quartz");
  else g.set(x, 7, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
}

// roof equipment: two stone-brick plant boxes on the roof deck, only on cells where the deck is solid all round
for (const [x, z] of [[3, 2], [4, 2], [10, 2], [11, 2]]) {
  if (inS(x, z) && !perimeter(x, z)) g.set(x, 8, z, "stone_bricks");
}

// glass panes join to neighbours in the same wall: a second pass now every block is placed
for (let z = 0; z < 7; z++) for (let x = 0; x < 17; x++) {
  for (const y of [2, 4, 6]) {
    const here = g.get(x, y, z);
    if (!here || here.block !== "glass_pane") continue;
    const link = (dx, dz) => {
      const n = g.get(x + dx, y, z + dz);
      return !!n && JOIN.has(n.block.replace("minecraft:", ""));
    };
    g.set(x, y, z, "glass_pane", {
      north: String(link(0, -1)), south: String(link(0, 1)), east: String(link(1, 0)), west: String(link(-1, 0)), waterlogged: "false",
    });
  }
}

const out = `${DIR}/DC75309.nbt`;
const r = g.save(out);
console.log(`DC75309: ${r.blocks} blocks, ${r.palette} palette entries -> ${out}`);
