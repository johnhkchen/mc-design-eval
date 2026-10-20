import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 靈雲宮 (Lingyun Temple), Xinyi: a two-storey vermilion temple hall under a
// three-tier glazed-tile hip roof with a gold crown ridge.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw217769935";
const W = 34, H = 23, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
let G = 0;
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const h = Math.round(gr);
  ground.set(key(x, z), h);
  G = Math.max(G, h);
}
const inF = (x, z) => ground.has(key(x, z));

// [name, dx, dz]
const DIRS = [["north", 0, -1], ["east", 1, 0], ["south", 0, 1], ["west", -1, 0]];
const OPP = { north: "south", south: "north", east: "west", west: "east" };
const missingIn = (x, z, inSet) =>
  DIRS.filter(([, dx, dz]) => !inSet(x + dx, z + dz)).map(d => d[0]);

// Bounding box of footprint
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const midZ = Math.round((minZ + maxZ) / 2);
const midX = Math.round((minX + maxX) / 2);

// Level plan (absolute y, G = highest footprint ground):
//  0..G        podium (stone bricks, mossy variant for texture)
//  G+1         polished_granite base course / storey-1 floor slab
//  G+2..G+4    storey 1 walls (3 courses)
//  G+5         storey 2 floor slab
//  G+6..G+8    storey 2 walls (3 courses)
//  G+9         ceiling slab
//  G+10..G+12  three roof tiers, stepped inward by 3 blocks each

// 1. Podium and base course
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= G; y++) {
    const mossy = ((x * 7 + z * 3 + y * 5) % 9) === 0;
    g.set(x, y, z, mossy ? "mossy_stone_bricks" : "stone_bricks");
  }
  g.set(x, G + 1, z, "polished_granite");
}

// 2. Interior floor/ceiling slabs
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  g.set(x, G + 5, z, "polished_andesite");
  g.set(x, G + 9, z, "polished_andesite");
}

const isPerim = (x, z) => inF(x, z) && missingIn(x, z, inF).length > 0;

// Entrance face: the outward direction with the most single-sided wall cells
const faceCount = { north: 0, east: 0, south: 0, west: 0 };
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const m = missingIn(x, z, inF);
  if (m.length === 1) faceCount[m[0]]++;
}
const doorDir = Object.keys(faceCount).reduce((a, b) =>
  faceCount[b] > faceCount[a] ? b : a, "north");

// Door: cell on that face nearest the face's centre
let doorCell = null;
{
  let best = Infinity;
  const isHoriz = doorDir === "north" || doorDir === "south";
  const centre = isHoriz ? midX : midZ;
  for (const k of ground.keys()) {
    const [x, z] = k.split(",").map(Number);
    const m = missingIn(x, z, inF);
    if (m.length === 1 && m[0] === doorDir) {
      const d = Math.abs((isHoriz ? x : z) - centre);
      if (d < best) { best = d; doorCell = [x, z]; }
    }
  }
}

const paneProps = (m) => {
  const runsEW = m.includes("north") || m.includes("south");
  return {
    north: runsEW ? "false" : "true",
    south: runsEW ? "false" : "true",
    east: runsEW ? "true" : "false",
    west: runsEW ? "true" : "false",
    waterlogged: "false",
  };
};

// 3. Walls on the perimeter only (no interiors)
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const m = missingIn(x, z, inF);
  if (m.length === 0) continue;
  const isCorner = m.length >= 2;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  for (let s = 0; s < 2; s++) {
    const base = G + 2 + 4 * s;
    for (let r = 0; r < 3; r++) {
      const y = base + r;
      if (isDoor && s === 0 && r <= 1) continue; // door set below
      if (isCorner) { g.set(x, y, z, "yellow_terracotta"); continue; }
      if (r === 0) { g.set(x, y, z, "red_concrete"); continue; }
      if (r === 2) { g.set(x, y, z, "yellow_terracotta"); continue; }
      // r === 1: window row
      if ((x + z) % 4 === 0) {
        g.set(x, y, z, "glass_pane", paneProps(m));
      } else {
        g.set(x, y, z, "red_concrete");
      }
    }
  }
}

// 4. Entrance: crimson doors with a lit lantern pair flanking them inside
if (doorCell) {
  const [dx, dz] = doorCell;
  const props = { facing: doorDir, hinge: "left", open: "false", powered: "false" };
  g.set(dx, G + 2, dz, "crimson_door", { ...props, half: "lower" });
  g.set(dx, G + 3, dz, "crimson_door", { ...props, half: "upper" });
  // Interior lanterns just behind the door, on the storey-1 floor
  const d = DIRS.find(q => q[0] === OPP[doorDir]);
  const ix = dx + d[1], iz = dz + d[2];
  if (inF(ix, iz) && !isPerim(ix, iz)) {
    g.set(ix, G + 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Warm lanterns just inside some windows, both storeys
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const m = missingIn(x, z, inF);
  if (m.length !== 1) continue;
  if ((x + z) % 8 !== 0) continue;
  if (doorCell && doorCell[0] === x && doorCell[1] === z) continue;
  const opp = OPP[m[0]];
  const d = DIRS.find(q => q[0] === opp);
  const ix = x + d[1], iz = z + d[2];
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  for (let s = 0; s < 2; s++) {
    const floor = s === 0 ? G + 1 : G + 5;
    g.set(ix, floor + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 5. Three-tier hip roof, each tier inset 3 blocks from the one below
const L = (k) => {
  const set = new Set();
  for (const kk of ground.keys()) {
    const [x, z] = kk.split(",").map(Number);
    if (x >= minX + k && x <= maxX - k && z >= minZ + k && z <= maxZ - k) set.add(kk);
  }
  return set;
};
const inSetOf = (set) => (x, z) => set.has(key(x, z));

for (let k = 0; k < 3; k++) {
  const Lk = L(k * 3);
  const inSet = inSetOf(Lk);
  const y = G + 10 + k;
  for (const kk of Lk) {
    const [x, z] = kk.split(",").map(Number);
    const m = missingIn(x, z, inSet);
    if (m.length === 0) {
      if (k === 2 && z === midZ) g.set(x, y, z, "yellow_concrete");
      else g.set(x, y, z, "deepslate_tiles");
    } else {
      g.set(x, y, z, "deepslate_tile_stairs", {
        facing: m[0], half: "bottom", shape: "straight", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
