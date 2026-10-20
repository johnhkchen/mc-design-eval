import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1083350";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 40, H = 66, D = 25;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const cellMap = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity, maxRoof = 0;
for (const [x, z, gr, r] of cells) {
  cellMap.set(key(x, z), { g: gr, r: Math.max(r, gr + 2) });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
  maxRoof = Math.max(maxRoof, r);
}
const has = (x, z) => cellMap.has(key(x, z));
const exposed = (x, z) => ({
  n: !has(x, z - 1), // street face (low z)
  s: !has(x, z + 1),
  w: !has(x - 1, z),
  e: !has(x + 1, z),
});
const isEdge = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };
const hash = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 13 + 13) % 13;

const midX = Math.floor((minX + maxX) / 2);

// ---- massing ----------------------------------------------------------------
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const { g: ground, r: roof } = cellMap.get(key(x, z));
  const ex = exposed(x, z);
  const edge = ex.n || ex.s || ex.w || ex.e;
  const xr = x - minX;
  const zr = z - minZ;
  // mullion bays every 3 blocks along each exposed face
  const mullion = ((ex.n || ex.s) && xr % 3 === 0) || ((ex.w || ex.e) && zr % 3 === 0);
  // entrance: street face, wider lobby centred on midX
  const entranceCell = ex.n && Math.abs(x - midX) <= 2;
  const doorCell = ex.n && x === midX;

  // foundation fill from 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < roof; y++) {
    const h = y - ground;
    if (edge) {
      if (y === roof - 1) {
        g.set(x, y, z, "smooth_stone"); // parapet cap
      } else if (h === 0) {
        g.set(x, y, z, "stone_bricks"); // base course
      } else if (entranceCell && h === 3) {
        g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // canopy
      } else if (doorCell && h === 1) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (doorCell && h === 2) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (entranceCell && (h === 1 || h === 2)) {
        if (x === midX - 2 && h === 2) {
          g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); // hanging lantern under canopy
        } else {
          g.set(x, y, z, "light_blue_stained_glass"); // lobby glazing
        }
      } else if (h % 2 === 0) {
        g.set(x, y, z, "light_gray_concrete"); // spandrel panel
      } else if (mullion) {
        g.set(x, y, z, "white_concrete"); // window mullion
      } else {
        g.set(x, y, z, "gray_stained_glass"); // darker glazing for contrast
      }
    } else {
      // interior: floor slabs per storey, air between, roof deck on top
      if (y === roof - 1) {
        g.set(x, y, z, "gray_concrete");
      } else if (h % 2 === 0 || y === roof - 2) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (h === 1) {
        // warm light just behind a window bay
        const nearEdge = isEdge(x - 1, z) || isEdge(x + 1, z) || isEdge(x, z - 1) || isEdge(x, z + 1);
        if (nearEdge && hash(x, y, z) === 0) g.set(x, y, z, "glowstone");
      }
    }
  }
}

// ---- roof plant: elevator/mechanical bulkhead on the tallest interior block --
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const r = cellMap.get(key(x, z)).r;
  if (r !== maxRoof || isEdge(x, z)) continue;
  if (x < midX - 4 || x > midX + 4) continue;
  const zc = Math.floor((minZ + maxZ) / 2);
  if (z < zc - 3 || z > zc + 3) continue;
  for (let y = r; y < r + 3 && y < H; y++) g.set(x, y, z, "stone_bricks");
}

g.save(`${DIR}/${ID}.nbt`);
