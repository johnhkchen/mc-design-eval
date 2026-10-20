import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw540883612";
const raw = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

// Normalise cells to [x, z, ground]; ground is relative to the lowest ground under the footprint.
const cells = raw.map((c) => (Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.y ?? 0]));
const minG = Math.min(...cells.map((c) => c[2]));
const map = new Map();
for (const [x, z, gr] of cells) map.set(`${x},${z}`, Math.min(gr - minG, 10));
const has = (x, z) => map.has(`${x},${z}`);
const baseOf = (x, z) => map.get(`${x},${z}`);

const W = 10, H = 23, D = 8;
const g = new Voxels([W, H, D]);

// Front = the z-minimum (north) street face. Entrance = median front cell.
const frontXs = cells.filter(([x, z]) => !has(x, z - 1)).map(([x]) => x).sort((a, b) => a - b);
const entX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

const DOOR = { hinge: "left", open: "false", powered: "false" };

for (const [x, z] of cells) {
  const B = baseOf(x, z);
  const edgeN = !has(x, z - 1), edgeS = !has(x, z + 1);
  const edgeW = !has(x - 1, z), edgeE = !has(x + 1, z);
  const boundary = edgeN || edgeS || edgeW || edgeE;
  const front = edgeN;
  const corner = (edgeN || edgeS) && (edgeW || edgeE);
  const t = (edgeN || edgeS) ? x : z;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone");

  // Ground-level slab (interior floor) and base course on the perimeter.
  g.set(x, B, z, boundary ? "polished_andesite" : "smooth_stone");

  if (boundary) {
    // Storey 1 (B+1..B+4)
    for (let y = B + 1; y <= B + 4; y++) {
      let blk = "smooth_quartz";
      let props;
      if (corner) {
        blk = "quartz_pillar";
      } else if (front) {
        if (x === entX && y === B + 1) { blk = "dark_oak_door"; props = { ...DOOR, facing: "north", half: "lower" }; }
        else if (x === entX && y === B + 2) { blk = "dark_oak_door"; props = { ...DOOR, facing: "north", half: "upper" }; }
        else if (y === B + 4) blk = "dark_oak_planks";
        else blk = "glass_pane";
      } else if (y >= B + 2 && y <= B + 3 && t % 2 === 1) {
        blk = "glass_pane";
      }
      g.set(x, y, z, blk, props);
    }

    // Storey line
    g.set(x, B + 5, z, "polished_andesite");

    // Storey 2 (B+6..B+9)
    for (let y = B + 6; y <= B + 9; y++) {
      let blk = "smooth_quartz";
      if (corner) blk = "quartz_pillar";
      else if (y >= B + 7 && y <= B + 8 && t % 2 === 1) blk = "glass_pane";
      g.set(x, y, z, blk);
    }

    // Cornice, parapet coping
    g.set(x, B + 10, z, "stone_bricks");
    g.set(x, B + 11, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // Interior: air gap, floor slab at storey line, roof deck above.
    g.set(x, B + 5, z, "smooth_stone");
    g.set(x, B + 10, z, "light_gray_concrete");
  }

  // Warm lights behind some upper-storey windows (inside the air gap).
  if (boundary && !front && t % 4 === 1 && !corner) {
    let dx = 0, dz = 0;
    if (edgeN) dz = 1; else if (edgeS) dz = -1; else if (edgeW) dx = 1; else if (edgeE) dx = -1;
    if (has(x + dx, z + dz)) g.set(x + dx, B + 7, z + dz, "glowstone");
  }

  // Rooftop: one small plant/mechanical block with a lantern on the central deck cell.
  if (!boundary && x === 4 && z === 3) {
    g.set(x, B + 11, z, "smooth_quartz");
    g.set(x, B + 12, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${dir}/${id}.nbt`);
