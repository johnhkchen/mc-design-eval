// 1700 18th St NW: a small brick office block (c. 1920-1950 Dupont Circle commercial, limestone trim, shopfront at street).
// Massing from the lidar: a 7-block ring over the whole footprint (the perimeter, one cell thick), an 8-block core inside
// where the lidar reads 8, and a 2-block one-storey wing on the east end. Every perimeter column is solid from y 0 to its
// top; the interior has floor slabs at the even rows and a roof at its top, with air between (no interiors, nothing floats).
// Articulation: stone base, storey lines (calcite) at y 2 and 4, window rows at y 1, 3, 5 (glass panes between brick piers,
// calcite quoins), a smooth-stone cornice at the ring top, a street-front shopfront with a centre door and lintel canopy,
// warm lanterns hanging behind some windows, and two HVAC units on the core roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC56732.cells.json`, "utf8"));

const W = 8, H = 20, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Map();                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) inside.set(key(x, z), { ground, roof });
const at = (x, z) => inside.has(key(x, z));

// A cell is on the envelope if any side opens to the outside of the footprint.
const exposed = (x, z) => ({ N: !at(x, z - 1), S: !at(x, z + 1), W: !at(x - 1, z), E: !at(x + 1, z) });
const isPerimeter = (x, z) => Object.values(exposed(x, z)).some(Boolean);

// Flat tiers: wing where lidar is low, core where the interior reads 8, otherwise the 7-block ring.
const heightOf = (x, z) => {
  const { roof } = inside.get(key(x, z));
  if (roof <= 3) return 2;                                   // one-storey east wing
  if (!isPerimeter(x, z) && roof >= 8) return 8;             // core
  return 7;                                                  // ring
};

// Map of placed blocks, so window panes can work out their connections after the walls are known.
const out = new Map();
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, { x, y, z, block, state });

for (const [x, z, ground] of cells) {
  const h = heightOf(x, z);
  const per = isPerimeter(x, z);
  const ex = exposed(x, z);
  const nFaces = Object.values(ex).filter(Boolean).length;
  const corner = nFaces >= 2;
  const street = ex.N && !corner;                             // the street front is the z = 0 side
  const outFace = ex.N ? "N" : ex.S ? "S" : ex.W ? "W" : "E";  // one primary outward face per envelope cell
  const u = outFace === "N" || outFace === "S" ? x : z;        // position along that face
  const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[outFace];

  // foundation: solid from y 0 to the cell's ground (zero on this footprint, kept for any lower-lying cell)
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y < h; y++) {
    if (!per) {
      // interior: floor slabs at the even rows, a roof at the top, air between
      if (y % 2 === 0 || y === h - 1) put(x, y, z, "smooth_stone");
      continue;
    }
    if (h === 2) {                                            // wing: base, then a flat smooth-stone roof
      put(x, y, z, y === 0 ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }  // base course
    if (y === h - 1) { put(x, y, z, "smooth_stone"); continue; }  // cornice
    if (corner) { put(x, y, z, "calcite"); continue; }        // limestone quoins
    if (street && x === 3 && (y === 1 || y === 2)) {          // centre entrance door, lower and upper halves
      put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (y % 2 === 0) { put(x, y, z, "calcite"); continue; }   // storey lines (calcite bands)

    // window rows, y 1 / 3 / 5
    if (street && y === 1) { put(x, y, z, "glass_pane"); continue; }   // shopfront glazing
    if (street && y === 3 && x >= 2 && x <= 4) { put(x, y, z, "smooth_stone"); continue; }   // entrance lintel canopy
    put(x, y, z, u % 2 === 0 ? "bricks" : "glass_pane");       // brick piers, glass bays between them
  }

  // roof: the core's HVAC units sit on the roof slab
  if (!per && h === 8 && (x === 2 && z === 3 || x === 4 && z === 6)) put(x, 8, z, "iron_block");
}

// Warm lanterns hanging inside, behind some window bays (the interior cell in front of the glass, under a floor slab).
for (const [k, c] of out) {
  const [x, y, z] = k.split(",").map(Number);
  if (c.block !== "glass_pane" || y % 2 === 0) continue;
  if (!isPerimeter(x, z)) continue;
  const ex = exposed(x, z);
  const outFace = ex.N ? "N" : ex.S ? "S" : ex.W ? "W" : "E";
  const u = outFace === "N" || outFace === "S" ? x : z;
  if ((u + (y >> 1)) % 2 !== 0) continue;
  const [dx, dz] = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }[outFace];
  const ix = x + dx, iz = z + dz;
  if (!at(ix, iz) || isPerimeter(ix, iz) || out.has(`${ix},${y},${iz}`)) continue;
  put(ix, y, iz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Window panes connect to neighbouring panes and solid faces (brick piers, calcite, stone).
const FULL = new Set(["glass_pane", "bricks", "calcite", "stone_bricks", "smooth_stone", "iron_block"]);
const conn = (x, y, z, dx, dz) => (FULL.has(out.get(`${x + dx},${y},${z + dz}`)?.block) ? "true" : "false");
for (const c of out.values()) {
  if (c.block !== "glass_pane") continue;
  const { x, y, z } = c;
  c.state = { north: conn(x, y, z, 0, -1), south: conn(x, y, z, 0, 1), west: conn(x, y, z, -1, 0), east: conn(x, y, z, 1, 0), waterlogged: "false" };
}

for (const c of out.values()) g.set(c.x, c.y, c.z, c.block, c.state);
const { blocks, palette } = g.save(`${DIR}/DC56732.nbt`);
console.log(`DC56732: ${blocks} blocks, ${palette} palette entries`);
