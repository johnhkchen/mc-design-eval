import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A 1930s brick commercial block on a stone plinth, three storeys of 4 blocks with cream quoins and bands, a shopfront
// on the street (north) face and a parapet. Lidar: roof 12 above y0 on every cell, so the top is one flat level.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_521145049.cells.json`, "utf8"));

const foot = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => foot.has(`${x},${z}`);
const exposed = (x, z) => ({ n: !inF(x, z - 1), s: !inF(x, z + 1), w: !inF(x - 1, z), e: !inF(x + 1, z) });
const isPerim = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };

const ROOF = Math.max(...cells.map(c => c[3]));                 // 12: the roof deck sits at y 11, its top face at 12
const ROWS_GLASS = new Set([1, 2, 5, 6, 9, 10]);                // window rows in the three storeys
const ROWS_BAND = new Set([4, 8, 11]);                          // floor bands, and the cornice under the parapet
const DOOR = { x: 5, z: 0 }, SHOP = { x: 6, z: 0 };             // north (street) face, recessed entrance and shop glass

const g = new Voxels([9, ROOF + 2, 6]);

// 1. foundation: every cell is solid from y 0 up to its lidar ground; the plinth course sits on y 0 for all
for (const [x, z, ground] of cells) for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");
for (const [x, z] of cells) g.set(x, 0, z, "stone_bricks");

// 2. walls, bands, floor slabs and the roof deck, cell by cell
for (const [x, z] of cells) {
  const e = exposed(x, z);
  const perim = e.n || e.s || e.w || e.e;
  const corner = (e.n || e.s) && (e.w || e.e);
  const alongX = (e.n || e.s) && !corner;                       // a wall running east-west
  const alongZ = (e.w || e.e) && !corner;                       // a wall running north-south
  const bay = (alongX && x % 2 === 1) || (alongZ && z % 2 === 1);  // windows alternate with brick piers
  const isDoor = e.n && x === DOOR.x && z === DOOR.z;
  const isShop = e.n && x === SHOP.x && z === SHOP.z;

  // the roof deck and the floor slabs run the full footprint
  g.set(x, 11, z, perim ? "smooth_quartz" : "smooth_stone");
  g.set(x, 4, z, perim ? "smooth_quartz" : "smooth_stone");
  g.set(x, 8, z, perim ? "smooth_quartz" : "smooth_stone");

  if (perim) {
    // parapet on the perimeter, its corners capped
    g.set(x, ROOF, z, corner ? "chiseled_quartz_block" : "smooth_quartz");
  }

  for (let y = 1; y < 11; y++) {
    if (!perim) continue;                                       // interiors stay air: the gap behind the glass
    if (ROWS_BAND.has(y)) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (corner) { g.set(x, y, z, "smooth_quartz"); continue; }  // cream quoins
    if (!bay) { g.set(x, y, z, y <= 3 ? "dark_oak_planks" : "bricks"); continue; }  // piers: brick, timber on the shopfront
    if (ROWS_GLASS.has(y)) {
      if (isDoor && (y === 1 || y === 2)) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const pane = alongX ? { east: "true", west: "true", north: "false", south: "false" }
                          : { north: "true", south: "true", east: "false", west: "false" };
      g.set(x, y, z, "glass_pane", pane);
      continue;
    }
    g.set(x, y, z, "bricks");                                   // spandrel under each window row
  }
  if (isShop) for (const y of [1, 2]) g.set(x, y, z, "glass");   // shopfront glass beside the door
}

// 3. warm light: glowstone on the inside of some lower-row windows, and a lantern hung in the entrance hall
for (const [x, z] of cells) {
  if (!isPerim(x, z)) continue;
  const e = exposed(x, z);
  if ((e.n && e.s) || (e.w && e.e) || ((e.n || e.s) && (e.w || e.e))) continue;   // corners: no pane
  const bay = ((e.n || e.s) && x % 2 === 1) || ((e.w || e.e) && z % 2 === 1);
  if (!bay || (e.n && x === DOOR.x && z === DOOR.z)) continue;
  if ((x + z) % 2 !== 0) continue;
  const [ix, iz] = e.n ? [x, z + 1] : e.s ? [x, z - 1] : e.w ? [x + 1, z] : [x - 1, z];
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;
  for (const y of [1, 5, 9]) g.set(ix, y, iz, "glowstone");
}
g.set(DOOR.x, 3, 1, "lantern", { hanging: "true" });            // inside the entrance, under the lintel

// 4. roof plant on the deck: a low concrete housing with a vent
g.set(2, ROOF, 3, "light_gray_concrete");
g.set(3, ROOF, 3, "light_gray_concrete");

g.save(`${DIR}/way_521145049.nbt`);
