import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Taipei commercial block, c. 1980s: two storeys over a plinth, pale
// tiled walls, concrete piers, tinted-glass upper windows, a shopfront ground
// floor with a central door, a flat roof with parapet and rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833584";
const W = 23, H = 23, D = 19;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : raw.cells;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const fp = new Map();
for (const [x, z, gr] of cells) fp.set(`${x},${z}`, gr);
const has = (x, z) => fp.has(`${x},${z}`);

const m = Math.min(...cells.map(c => c[2]));     // lowest ground under footprint
const minX = Math.min(...cells.map(c => c[0]));
const minZ = Math.min(...cells.map(c => c[1]));
const TOP = m + 11;                              // parapet top

// Entrance: north-face cell (missing z-1 neighbour) nearest the mid-width,
// avoiding pier bays.
const northCells = cells.filter(([x, z]) => !has(x, z - 1));
const midX = northCells.reduce((s, c) => s + c[0], 0) / Math.max(1, northCells.length);
let entrance = null;
for (const [x, z] of northCells.sort((a, b) => Math.abs(a[0] - midX) - Math.abs(b[0] - midX))) {
  if (((x - minX) % 3) !== 0) { entrance = [x, z]; break; }
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const n = !has(x, z - 1), s = !has(x, z + 1);
  const wf = !has(x - 1, z), e = !has(x + 1, z);
  const perim = n || s || wf || e;

  // Ground-level floor/plinth and the two floor slabs (rows m+5 and m+10).
  put(x, gr, z, perim ? "polished_andesite" : "smooth_stone");
  if (m + 5 > gr) put(x, m + 5, z, perim ? "smooth_quartz" : "gray_concrete");
  if (m + 10 > gr) put(x, m + 10, z, perim ? "smooth_quartz" : "gray_concrete");

  if (!perim) {
    // Interior: air between slabs; rooftop plant on the flat roof.
    if (((x * 2 + z) % 7) === 3) put(x, m + 11, z, "light_gray_concrete");
    continue;
  }

  // Facade orientation and bay index.
  let bay, inward;
  if (n || s) {
    bay = x - minX;
    inward = n ? [x, z + 1] : [x, z - 1];
  } else {
    bay = z - minZ;
    inward = wf ? [x + 1, z] : [x - 1, z];
  }
  const pier = bay % 3 === 0;
  const isEntrance = entrance && entrance[0] === x && entrance[1] === z;
  const facing = n ? "north" : s ? "south" : wf ? "west" : "east";

  // Walls: ground storey (gr+1 .. m+4), upper storey (m+6 .. m+9).
  for (let y = gr + 1; y <= m + 9; y++) {
    if (y === m + 5 || y === m + 10) continue; // slabs already placed
    if (y <= m + 4) {
      if (pier) put(x, y, z, "light_gray_concrete");
      else if (y === m + 4) put(x, y, z, "gray_concrete");          // lintel
      else put(x, y, z, "glass");                                    // shopfront
    } else {
      if (pier) put(x, y, z, "light_gray_concrete");
      else if (y === m + 6 || y === m + 9) put(x, y, z, "gray_concrete"); // sill/head
      else put(x, y, z, "cyan_stained_glass");                        // upper glazing
    }
  }

  // Parapet cap at the roof line.
  put(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

  // Entrance door (two blocks) in the shopfront.
  if (isEntrance && gr + 2 <= m + 4) {
    put(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    // Small canopy band above the door sits on the lintel row.
  }

  // Warm light behind glass (only where there is an interior cell behind).
  if (!pier && has(inward[0], inward[1])) {
    if (bay % 6 === 1 && m + 7 > gr) put(inward[0], m + 7, inward[1], "glowstone");
    if (bay % 6 === 2 && m + 2 > gr && !isEntrance) put(inward[0], m + 2, inward[1], "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
