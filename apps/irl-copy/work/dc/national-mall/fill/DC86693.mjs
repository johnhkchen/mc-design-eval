// National Geographic Society Explorers Hall (1145 17th St NW), a 1960s-style office block on a granite plinth: a 14 x 37
// wing of six storeys (17 blocks to the parapet) with a centred eight-by-twenty tower rising three storeys more (20).
// Storeys are two blocks: a stone floor band (solid across the footprint) and a window row (glass panes between calcite
// piers, air behind them). Built only on the footprint cells, each column filled from y 0 up to its lidar ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86693.cells.json`, "utf8"));

const W = 14, D = 37, H = 32;
const WINGS = { x0: 0, x1: W - 1, z0: 0, z1: D - 1 };
const CORE = { x0: 3, x1: 10, z0: 8, z1: 27 };    // the lidar's roof >= 19 core, smoothed to one rectangle
const WING_TOP = 17, CORE_TOP = 20;                // roof surfaces, blocks at y < top

const BASE = "polished_andesite", WALL = "calcite", BAND = "smooth_stone", GLASS = "light_blue_stained_glass_pane";
const ROOF_UNIT = "light_gray_concrete";

const ground = new Map();
for (const [x, z, gr, roof] of cells) ground.set(`${x},${z}`, gr);

const inRect = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
const onRing = (r, x, z) => inRect(r, x, z) && (x === r.x0 || x === r.x1 || z === r.z0 || z === r.z1);
const isCorner = (r, x, z) => (x === r.x0 || x === r.x1) && (z === r.z0 || z === r.z1);
// along each face, calcite piers at the corners and every third cell; glass between
const isPier = (r, x, z) => {
  if (isCorner(r, x, z)) return true;
  const i = x === r.x0 || x === r.x1 ? z - r.z0 : x - r.x0;
  return i % 3 === 0;
};
// the cell just inside a ring cell (behind its glass)
const inward = (r, x, z) => (x === r.x0 ? [x + 1, z] : x === r.x1 ? [x - 1, z] : z === r.z0 ? [x, z + 1] : [x, z - 1]);
// a deterministic scatter of warm lights, so the same build comes out the same
const warm = (x, y, z) => (((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0) % 7 === 0;

const g = new Voxels([W, H, D]);
const windowRing = []; // [x, y, z] of every glass pane on a ring, for the connection pass

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gr = ground.get(`${x},${z}`);
  if (gr === undefined) continue;
  // foundation: solid from y 0 up to the lidar ground (at least the one-block plinth the ground floor stands on)
  for (let y = 0; y < Math.max(gr, 1); y++) g.set(x, y, z, BASE);

  const core = inRect(CORE, x, z);
  const top = core ? CORE_TOP : WING_TOP;
  const ringW = onRing(WINGS, x, z), ringC = core && onRing(CORE, x, z);
  const door = x === 0 && z === 18;

  for (let y = 1; y < top; y++) {
    if (y <= 2) {                                    // ground storey: shopfront glass, door at the entrance
      if (!ringW) continue;
      if (door) { g.set(x, y, z, "iron_door", { facing: "west", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isPier(WINGS, x, z)) g.set(x, y, z, WALL);
      else { g.set(x, y, z, GLASS); windowRing.push([x, y, z]); }
      if (ringW && !isPier(WINGS, x, z) && warm(x, y, z)) { const [ix, iz] = inward(WINGS, x, z); g.set(ix, y, iz, "glowstone"); }
    } else if (y <= 4) {                             // ground storey lintel band; porch cover inside the entrance
      if (ringW) g.set(x, y, z, BAND);
      else if (y === 4 && x === 1 && z >= 17 && z <= 19) g.set(x, y, z, BAND);
    } else if (y <= 15) {                            // office storeys: floor band (odd), window row (even)
      if (y % 2 === 1) { g.set(x, y, z, BAND); continue; }
      if (!ringW && !ringC) continue;
      const r = ringC ? CORE : WINGS;
      if (isPier(r, x, z)) g.set(x, y, z, WALL);
      else { g.set(x, y, z, GLASS); windowRing.push([x, y, z]); if (warm(x, y, z)) { const [ix, iz] = inward(r, x, z); g.set(ix, y, iz, "shroomlight"); } }
    } else if (y === 16) {                           // wing parapet and roof plant; the tower's window row
      if (core) {
        if (ringC) { if (isPier(CORE, x, z)) g.set(x, y, z, WALL); else { g.set(x, y, z, GLASS); windowRing.push([x, y, z]); if (warm(x, y, z)) { const [ix, iz] = inward(CORE, x, z); g.set(ix, y, iz, "shroomlight"); } } }
      } else if (ringW) g.set(x, y, z, WALL);
      else if ((x >= 2 && x <= 3 && z >= 29 && z <= 30) || (x >= 10 && x <= 11 && z >= 3 && z <= 4)) g.set(x, y, z, ROOF_UNIT);
    } else if (core) {                               // tower storeys 17-19: band, window row, parapet/roof deck
      if (y % 2 === 1) {
        if (y === 19 && ringC) g.set(x, y, z, WALL); else g.set(x, y, z, BAND);
      } else if (ringC) {
        if (isPier(CORE, x, z)) g.set(x, y, z, WALL);
        else { g.set(x, y, z, GLASS); windowRing.push([x, y, z]); if (warm(x, y, z)) { const [ix, iz] = inward(CORE, x, z); g.set(ix, y, iz, "shroomlight"); } }
      }
    }
  }
}

// lantern under the porch cover, so the entrance reads at dusk
g.set(1, 3, 18, "lantern", { hanging: "true", waterlogged: "false" });

// the panes join their neighbours on the same face (a bare pane would stand as a post)
for (const [x, y, z] of windowRing) {
  const link = (nx, nz) => {
    const b = g.get(nx, y, nz);
    return b && (b.block === `minecraft:${GLASS}` || b.block === `minecraft:${WALL}`) ? "true" : "false";
  };
  const north = link(x, z - 1), south = link(x, z + 1), west = link(x - 1, z), east = link(x + 1, z);
  g.set(x, y, z, GLASS, { north, south, east, west, waterlogged: "false" });
}

const out = `${DIR}/DC86693.nbt`;
const res = g.save(out);
console.log(JSON.stringify({ file: out, ...res, size: g.size }));
