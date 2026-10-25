import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR339519504.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR339519504.nbt";

const W = 17, H = 17, D = 19;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const c of cells) map.set(key(c[0], c[1]), { g: Math.round(c[2]), r: Math.round(c[3]) });

const grounds = [...map.values()].map(v => v.g);
const roofs = [...map.values()].map(v => v.r).sort((a, b) => a - b);
const maxG = Math.max(...grounds);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const TOP = Math.min(16, Math.max(medRoof, maxG + 4));

const has = (x, z) => map.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// door on the south (max z) face, nearest the middle
let doorCell = null;
{
  const zs = [...map.keys()].map(k => +k.split(",")[1]);
  const zMax = Math.max(...zs);
  let best = Infinity;
  for (const k of map.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === zMax && isEdge(x, z) && Math.abs(x - 8) < best) {
      best = Math.abs(x - 8);
      doorCell = [x, z];
    }
  }
}
const isDoor = (x, z) => doorCell && doorCell[0] === x && doorCell[1] === z;

// classify an edge cell: which face it is on, its index along that face, and corner status
function faceInfo(x, z) {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const zFace = missN || missS;   // north/south face: runs along x
  const xFace = missW || missE;   // east/west face: runs along z
  const corner = zFace && xFace;
  let index = zFace ? x : z;
  let dirIn = null; // inward neighbour offset
  if (missN) dirIn = [0, 1];
  else if (missS) dirIn = [0, -1];
  else if (missW) dirIn = [1, 0];
  else if (missE) dirIn = [-1, 0];
  return { zFace, xFace, corner, index, dirIn };
}

for (const [k, { g: g0 }] of map) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);

  // foundation and ground-floor slab
  for (let y = 0; y < g0; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, g0, z, "stone_bricks");

  if (edge) {
    const info = faceInfo(x, z);
    // wall column: granite-like stone with a stone-brick base course and lintel
    for (let y = g0 + 1; y <= TOP - 1; y++) {
      const block = (y === g0 + 1 || y === TOP - 1) ? "stone_bricks" : "stone";
      g.set(x, y, z, block);
    }

    // pilasters on the corners and every third cell, full height, to break the flat face
    const pilaster = info.corner || info.index % 3 === 0;
    if (pilaster && !isDoor(x, z)) {
      for (let y = g0 + 1; y <= TOP - 1; y++) g.set(x, y, z, "stone_bricks");
    }

    const winLevels = [g0 + 2, g0 + 3].filter(y => y <= TOP - 2);
    const isWindow = !info.corner && !pilaster && !isDoor(x, z) && winLevels.length > 0;
    if (isWindow) {
      const props = info.zFace
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      for (const y of winLevels) g.set(x, y, z, "glass_pane", props);
      // warm light on the floor just inside, behind every other window
      if (info.dirIn && ((x * 2 + z) % 4 === 0)) {
        const ix = x + info.dirIn[0], iz = z + info.dirIn[1];
        if (has(ix, iz) && !isEdge(ix, iz)) {
          g.set(ix, g0 + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
        }
      }
    }

    // cornice cap on top of the walls
    g.set(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

    // entrance: oak door on the south face with a stone lintel above
    if (isDoor(x, z)) {
      const dp = { facing: "south", hinge: "left", open: "false", powered: "false" };
      g.set(x, g0 + 1, z, "oak_door", { ...dp, half: "lower" });
      g.set(x, g0 + 2, z, "oak_door", { ...dp, half: "upper" });
      g.set(x, g0 + 3, z, "stone_bricks");
    }
  } else {
    // interior: air, hanging lanterns under the roof deck
    if ((x * 3 + z * 5) % 7 === 0 && TOP - 1 > g0) {
      g.set(x, TOP - 1, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // roof deck over the interior
    g.set(x, TOP, z, "smooth_stone");
  }
}

// one clean roof vent, centred on the roof, sitting on the deck
{
  const interior = [...map.keys()]
    .map(k => k.split(",").map(Number))
    .filter(([x, z]) => !isEdge(x, z));
  if (interior.length && TOP + 2 <= 16) {
    const cx = interior.reduce((s, p) => s + p[0], 0) / interior.length;
    const cz = interior.reduce((s, p) => s + p[1], 0) / interior.length;
    let best = interior[0], bd = Infinity;
    for (const p of interior) {
      const d = (p[0] - cx) ** 2 + (p[1] - cz) ** 2;
      if (d < bd) { bd = d; best = p; }
    }
    g.set(best[0], TOP + 1, best[1], "stone_brick_wall");
    g.set(best[0], TOP + 2, best[1], "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
