import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540098125";
const W = 20, H = 23, D = 12;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const k = (x, z) => `${x},${z}`;
const groundAbs = new Map();
let minG = Infinity;
for (const [x, z, gr] of raw) {
  const r = Math.round(gr);
  groundAbs.set(k(x, z), r);
  minG = Math.min(minG, r);
}
const inside = (x, z) => groundAbs.has(k(x, z));
const G = (x, z) => groundAbs.get(k(x, z)) - minG; // ground relative to lowest ground

// Roof line: about 11 blocks above lowest ground; cells on higher ground keep at least one storey.
const ROOF = 11;
const topOf = (g) => Math.min(Math.max(g + 6, ROOF), H - 8);

const g3 = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g3.set(x, y, z, id, props);
  else g3.set(x, y, z, id);
};
const isPerim = (x, z) =>
  !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

const glassProps = (ns) =>
  ns
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, floors, walls
for (const [x, z] of raw.map(([a, b]) => [a, b])) {
  const g = G(x, z);
  const Tc = topOf(g);

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");

  const N = !inside(x, z - 1);
  const S = !inside(x, z + 1);
  const Wf = !inside(x - 1, z);
  const E = !inside(x + 1, z);
  const perim = N || S || Wf || E;

  if (!perim) {
    // Interior: floor slabs and roof deck only; air gap in between
    put(x, g, z, "smooth_stone");
    put(x, g + 5, z, "smooth_quartz");
    put(x, Tc, z, "gray_concrete");
    continue;
  }

  const corner = (N || S) && (Wf || E);
  const northSouth = N || S;
  const h = northSouth ? x : z;
  const pillar = corner || h % 3 === 0;
  const isDoor = N && x === 9;

  for (let y = g; y <= Tc; y++) {
    const off = y - g;
    if (y === g || y === Tc) {
      put(x, y, z, "stone_bricks"); // base course and coping
      continue;
    }
    if (y === Tc - 1 && Tc - 1 > g) {
      put(x, y, z, "smooth_quartz"); // parapet
      continue;
    }
    if (isDoor && (off === 1 || off === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "south",
        half: off === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (off >= 1 && off <= 4) {
      // Ground storey: shopfront glass under a quartz lintel
      if (off === 4 || pillar) put(x, y, z, "smooth_quartz");
      else put(x, y, z, "glass_pane", glassProps(northSouth));
      continue;
    }
    // Upper storeys: 5-block module: band, three window rows, lintel
    const r = (off - 5) % 5;
    if (r === 0) put(x, y, z, "stone_bricks");
    else if (r === 4) put(x, y, z, "smooth_quartz");
    else if (pillar) put(x, y, z, "smooth_quartz");
    else put(x, y, z, "glass_pane", glassProps(northSouth));
  }
}

// Pass 2: warm light behind some windows (inside the air gap)
for (const [x, z] of raw.map(([a, b]) => [a, b])) {
  const g = G(x, z);
  const N = !inside(x, z - 1);
  if (!N || isPerim(x, z + 1) || !inside(x, z + 1)) continue;
  if (x % 6 === 3) put(x, g + 7, z + 1, "glowstone");
  if (x % 6 === 0) put(x, g + 2, z + 1, "glowstone");
}

// Pass 3: roof equipment and planters, all standing on the roof deck
const roofY = topOf(G(0, 0));
const roofCell = (x, z) => inside(x, z) && !isPerim(x, z);
for (let x = 14; x <= 15; x++)
  for (let z = 3; z <= 4; z++) {
    if (!roofCell(x, z)) continue;
    const t = topOf(G(x, z));
    put(x, t + 1, z, "smooth_quartz");
    put(x, t + 2, z, "smooth_quartz");
    put(x, t + 3, z, "stone_bricks");
  }
for (let x = 4; x <= 5; x++)
  for (let z = 6; z <= 7; z++) {
    if (!roofCell(x, z)) continue;
    const t = topOf(G(x, z));
    put(x, t + 1, z, "iron_block");
    put(x, t + 2, z, "iron_block");
  }
for (const [x, z] of [[8, 9], [9, 9], [12, 8], [12, 9]]) {
  if (!roofCell(x, z)) continue;
  const t = topOf(G(x, z));
  put(x, t + 1, z, "flowering_azalea_leaves", { persistent: "true", distance: "1", waterlogged: "false" });
}

g3.save(`${DIR}/${ID}.nbt`);
