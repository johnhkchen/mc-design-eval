// DC86727: a three-storey Federal-style office block in Portland-type limestone (calcite walls, polished granite
// base, smooth quartz belts and cornice) with a four-storey central pavilion (roof 14) over a 12-high main body.
// Walls rise from a stone-brick foundation at y 0; every floor is a slab spanning the footprint (air gap behind the glass).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86727.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86727.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 20, D = 9, H = 26;
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFp = (x, z) => fp.has(`${x},${z}`);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };

const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inFp(x + DIRS[d][0], z + DIRS[d][1]));
const ext = (x, z) => exposed(x, z).length > 0;
// lidar noise smoothed into two flat tiers: the central pavilion (roof 14) and the main body (12)
const topOf = (x, z) => (fp.get(`${x},${z}`).roof >= 14 ? 14 : 12);
const cornerOf = (x, z) => new Set(exposed(x, z).map((d) => (d === "north" || d === "south" ? "z" : "x"))).size > 1;
// along a facade: a pier every third bay (corners always), windows between
const isPier = (x, z) => {
  if (cornerOf(x, z)) return true;
  const along = exposed(x, z).some((d) => d === "north" || d === "south") ? x : z;
  return along % 3 === 0;
};
// the penthouse on the main roof, east of the pavilion
const penthouse = (x, z) => x >= 14 && x <= 16 && (z === 4 || z === 5);
const isDoor = (x, y, z) => z === 0 && (x === 9 || x === 10) && (y === 2 || y === 3);
const isCanopy = (x, y, z) => z === 0 && x >= 8 && x <= 11 && y === 4;

const SLAB = { type: "bottom", waterlogged: "false" };
// one block per cell: [name, state?] or null for air; the pane states are resolved after all cells are placed
function blockAt(x, y, z) {
  const T = topOf(x, z), e = ext(x, z), pier = isPier(x, z);
  if (y === 0) return ["stone_bricks"];
  if (y === 1) return [e ? "polished_granite" : "smooth_stone"];
  if (isDoor(x, y, z)) return ["DOOR"];
  if (y === 2 || y === 3) return e ? [pier ? "calcite" : "glass_pane"] : null;
  if (y === 4) return e ? [isCanopy(x, y, z) ? "polished_granite" : "calcite"] : null;
  if (y === 5) return [e ? "smooth_quartz" : "smooth_stone"];
  if (y === 6 || y === 7) return e ? [pier ? "calcite" : "glass_pane"] : null;
  if (y === 8) return e ? ["calcite"] : null;
  if (y === 9) return [e ? "smooth_quartz" : "smooth_stone"];
  if (y === 10) return [e ? (pier ? "chiseled_stone_bricks" : "calcite") : "smooth_stone"];
  if (y === 11) {
    if (T === 12) return [e ? "smooth_quartz" : "smooth_stone"];
    return [e ? "calcite" : "smooth_stone"];
  }
  if (y === 12) {
    if (penthouse(x, z)) return ["calcite"];
    if (T === 14) return e ? [pier ? "calcite" : "glass_pane"] : null;
    return e ? ["stone_brick_slab", SLAB] : null;
  }
  if (y === 13) {
    if (penthouse(x, z)) return ["calcite"];
    if (T === 14) return [e ? "smooth_quartz" : "smooth_stone"];
    return null;
  }
  if (y === 14) {
    if (penthouse(x, z) || (T === 14 && e)) return ["stone_brick_slab", SLAB];
    return null;
  }
  return null;
}

const placed = new Map(); // "x,y,z" -> { block, state }
const key = (x, y, z) => `${x},${y},${z}`;
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= 14; y++) {
    const b = blockAt(x, y, z);
    if (!b) continue;
    if (b[0] === "DOOR") {
      const half = y === 2 ? "lower" : "upper", hinge = x === 9 ? "left" : "right";
      placed.set(key(x, y, z), { block: "dark_oak_door", state: { facing: "north", half, hinge, open: "false", powered: "false" } });
    } else {
      placed.set(key(x, y, z), { block: b[0], state: b[1] });
    }
  }
}
// the warm light sits in the air gap behind the glass, on the floor slab
for (const [x, y, z, block] of [[4, 2, 1, "glowstone"], [13, 2, 1, "glowstone"], [16, 2, 1, "glowstone"], [7, 6, 1, "shroomlight"], [16, 6, 1, "shroomlight"]]) {
  placed.set(key(x, y, z), { block });
}

const g = new Voxels([W, H, D]);
for (const [k, p] of placed) {
  const [x, y, z] = k.split(",").map(Number);
  if (p.block === "glass_pane") {
    // a pane joins its neighbours in the facade's plane (glass, piers, or a door), never the air gap behind
    const onZFace = exposed(x, z).some((d) => d === "north" || d === "south");
    const nb = (dx, dz) => placed.has(key(x + dx, y, z + dz));
    const st = onZFace
      ? { north: "false", south: "false", east: String(nb(1, 0)), west: String(nb(-1, 0)) }
      : { north: String(nb(0, -1)), south: String(nb(0, 1)), east: "false", west: "false" };
    g.set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
  } else {
    g.set(x, y, z, p.block, p.state);
  }
}

const res = g.save(OUT);
console.log(`saved ${OUT}: ${res.blocks} blocks, palette ${res.palette}`);
