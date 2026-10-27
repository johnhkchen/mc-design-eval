// A 1920s-30s brick commercial block on Mt Eden's slope (Auckland's interwar main-street type): a two-storey red-brick
// core with single-storey shop wings, cream plaster string courses, caps and quoins, dark-timber shopfronts on the
// downhill east front (the lower ground), and a flat tar-and-gravel roof behind a plaster parapet. Storey lines stand
// at y 4 and y 8 everywhere; the floor of each cell is its own ground (foundations fill below it). Walls are one block
// thick with a one-block air gap behind each glass pane; glowstone lamps sit in some of the gaps.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_948317566";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));

const X = 21, Y = 22, Z = 24;
const STRING = 4;         // the storey line: string course over the ground storey, and the one-storey cap
const LINTEL = 7;         // window head on the upper storey
const SMOOTH_TOP = 6.5;   // a cell's lidar roof, averaged over its footprint neighbours, at or above this is two storeys

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k2 = (x, z) => `${x},${z}`;

// ---- footprint, lidar tiers, shell ---------------------------------------------------------------
const C = new Map();
for (const [x, z, ground, roof] of cells) C.set(k2(x, z), { x, z, g: ground, roof });
const at = (x, z) => C.get(k2(x, z));

// Lidar roofs are stair-stepped and noisy: average each cell over its neighbourhood, then two clean tiers.
// Top 5 = one storey and its cap; top 9 = two storeys and a cap, the 2-storey spine and the NE corner.
for (const c of C.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = at(c.x + dx, c.z + dz); if (o) { s += o.roof; n++; }
  }
  c.top = s / n >= SMOOTH_TOP ? 9 : 5;
}
// A face is exposed when the cell beside it is outside the footprint or lower, so every step is walled.
const exposed = (c, dx, dz) => { const o = at(c.x + dx, c.z + dz); return !o || o.top < c.top; };
const FACE = { "1,0": "E", "-1,0": "W", "0,1": "S", "0,-1": "N" };
for (const c of C.values()) {
  c.faces = DIRS.filter(([dx, dz]) => exposed(c, dx, dz)).map(([dx, dz]) => FACE[`${dx},${dz}`]);
  c.shell = c.faces.length > 0;
  // a quoin is a true outside corner (two faces onto open air), not a step in the footprint's edge
  const open = DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz)).map(([dx, dz]) => FACE[`${dx},${dz}`]);
  c.corner = open.length >= 2 && (open.includes("E") || open.includes("W")) && (open.includes("N") || open.includes("S"));
}
// Inward neighbour of a face: the cell whose air sits behind the glass.
const INWARD = { E: [-1, 0], W: [1, 0], S: [0, -1], N: [0, 1] };
const FACING_OUT = { E: "west", W: "east", S: "north", N: "south" };   // a door faces back into the building

// The front: the downhill east face (ground 0), where the shopfronts and the entrance are.
const FRONT_DOOR = { x: 20, z: 6 };

// Bays: along an east/west face a bay is picked by z, along a north/south face by x. Every third cell is a pier.
const alongFace = (c, face) => (face === "E" || face === "W" ? c.z : c.x);
const isWindow = (c, face) => alongFace(c, face) % 3 !== 0;
// The face a cell's window or pier shows: its first exposed face (a corner has two, and reads as a quoin).
const primaryFace = (c) => c.faces[0];

const glass = (face) => (face === "E" || face === "W"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// ---- build -----------------------------------------------------------------------------------------
const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => { if (g.inBounds(x, y, z)) g.set(x, y, z, block, state); };

for (const c of C.values()) {
  const { x, z, g: gr, top } = c;
  // foundations: solid from y 0 up to the cell's own ground, so nothing floats on the slope
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!c.shell) {
    // interior: a floor at each storey, a roof deck, and air between
    put(x, gr, z, "oak_planks");
    if (top === 9) put(x, STRING, z, "oak_planks");
    put(x, top - 1, z, "gray_concrete");
    continue;
  }

  const face = primaryFace(c);
  const win = isWindow(c, face);
  const quoin = c.corner;
  for (let y = gr; y < top; y++) {
    let block, state;
    if (y === top - 1) block = "white_concrete";                          // cap
    else if (top === 9 && y === STRING) block = "white_concrete";         // string course
    else if (quoin) block = "stone_bricks";                               // quoins
    else if (y < STRING) {                                                // ground storey
      if (y === 0 && gr === 0) block = "stone_bricks";                    // base course
      else if (win && y >= Math.max(gr, 1) && y <= 2) { block = "glass_pane"; state = glass(face); }
      else block = "dark_oak_planks";                                     // fascia, stallboard, shopfront piers
    } else {                                                              // upper storey
      if (win) { if (y === LINTEL) block = "white_concrete"; else { block = "glass_pane"; state = glass(face); } }
      else block = "bricks";
    }
    put(x, y, z, block, state);
  }
}

// Doors, canopy and the warm lamps behind the glass
const doorState = (half) => ({ facing: FACING_OUT.E, half, hinge: "left", open: "false", powered: "false" });
put(FRONT_DOOR.x, 1, FRONT_DOOR.z, "dark_oak_door", doorState("lower"));
put(FRONT_DOOR.x, 2, FRONT_DOOR.z, "dark_oak_door", doorState("upper"));
// canopy over the shopfront entrance: three slabs on the fascia line
for (let dz = -1; dz <= 1; dz++) put(20, 3, FRONT_DOOR.z + dz, "dark_oak_slab", { type: "top", waterlogged: "false" });

// glowstone behind some upper-storey panes, and some shopfront panes, in the interior air gap
for (const c of C.values()) {
  if (!c.shell || c.corner) continue;
  const face = primaryFace(c);
  if (!isWindow(c, face)) continue;
  const [ix, iz] = INWARD[face];
  const inner = at(c.x + ix, c.z + iz);
  if (!inner || inner.shell) continue;
  const lit = (c.x * 7 + c.z * 5) % 4 === 0;
  if (!lit) continue;
  if (c.top === 9) put(inner.x, 5, inner.z, "glowstone");
  else put(inner.x, c.g + 1, inner.z, "glowstone");
}

// roof plant: a few boxes on the two-storey roofs, set on the deck so nothing hangs
for (const c of C.values()) {
  if (c.shell || c.top !== 9) continue;
  if (c.x % 5 !== 2 || c.z % 5 !== 2) continue;
  put(c.x, 9, c.z, "smooth_stone");
  put(c.x, 10, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

const out = `${DIR}/${NAME}.nbt`;
const stats = g.save(out);
console.log(`saved ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
