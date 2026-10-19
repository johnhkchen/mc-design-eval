// 140 West 46 Street, 1920: a five-storey Midtown mixed-use building in brick over a stone base, with a street-level shopfront
// on its west face (the street), a stone cornice and parapet, and a penthouse bulkhead. The lidar's 14-16 block roof is
// smoothed to one 15-block tier; the 7-block rear wing at the south end steps down to two storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC1022648.cells.json`, "utf8"));

// Massing: each footprint cell rises to its tier (the lidar roof, smoothed); cells outside the footprint have top 0.
const top = new Map();
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, roof <= 9 ? 7 : 15);
const inF = (x, z) => top.has(`${x},${z}`);
const topAt = (x, z) => top.get(`${x},${z}`) ?? 0;

// A block's face is exposed when the air beside it at its height is open: outside the footprint, or above a lower neighbour.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const exposed = (x, y, z) => Object.keys(DIRS).filter((f) => { const [dx, dz] = DIRS[f]; return y >= topAt(x + dx, z + dz); });

// Storey rows: base 0, shop 1-3, floors 5-6, 8-9, 11-12 with slabs at 4, 7, 10; cornice 13, parapet/roof deck at top-1.
// The wing (top 7) has one floor above its shop: slab 4, window row 5, parapet 6.
function rowOf(y, t) {
  if (y === 0) return "base";
  if (y === t - 1) return "roof";
  if (y === 13 && t === 15) return "cornice";
  if (y === 4 || (t === 15 && (y === 7 || y === 10))) return "slab";
  if (y <= 3) return "ground";
  return "upper";
}

const DOOR_Z = 4;            // the entrance on the west (street) face
const STREET_Z_MAX = 11;     // the street face runs where the footprint reaches x = 0
const PENT = (x, z) => x >= 1 && x <= 3 && z >= 9 && z <= 11;   // rooftop bulkhead

const paneAlong = (face) => (face === "W" || face === "E"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

// The facade of one exposed block: [block, state]. a is the index along the facade: z on W/E, x on N/S.
function facade(x, y, z, t, face) {
  const row = rowOf(y, t);
  const a = face === "W" || face === "E" ? z : x;
  const pier = a % 3 === 0;
  if (row === "base") return ["stone_bricks"];
  if (row === "roof") return ["stone_bricks"];
  if (row === "cornice") return ["stone_bricks"];
  if (row === "slab") return ["smooth_stone"];
  if (row === "ground" && face === "W" && z <= STREET_Z_MAX) {
    if (z === DOOR_Z && y === 1) return ["dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" }];
    if (z === DOOR_Z && y === 2) return ["dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" }];
    if (y === 3 && z === DOOR_Z) return ["lantern", { hanging: "true", waterlogged: "false" }];
    if (pier) return ["stone_bricks"];
    if (y === 1) return ["polished_granite"];
    if (y === 2) return ["glass"];
    return ["dark_oak_planks"];                   // the fascia band over the shopfront
  }
  if (row === "ground") {                         // non-street ground floor: windows over a brick lintel
    if (y === 3 || pier) return ["bricks"];
    return ["glass_pane", paneAlong(face)];
  }
  if (pier) return ["bricks"];                    // upper floors: brick piers and spandrels, panes between
  return ["glass_pane", paneAlong(face)];
}

const g = new Voxels([5, 28, 24]);
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = topAt(x, z);
  for (let y = 0; y < t; y++) {
    const faces = exposed(x, y, z);
    const row = rowOf(y, t);
    if (faces.length) {
      const [block, state] = facade(x, y, z, t, faces[0]);
      g.set(x, y, z, block, state);
    } else if (row === "base") {
      g.set(x, y, z, "stone_bricks");
    } else if (row === "roof" || row === "slab" || row === "cornice") {
      g.set(x, y, z, "smooth_stone");
    }
    // Otherwise interior air: the gap behind the glass.
  }
  if (t === 15 && PENT(x, z)) {
    const ring = !(x === 2 && z === 10);
    g.set(x, 15, z, ring ? "bricks" : "stone_bricks");
  }
}

// Warm light behind some upper-floor panes: a glowstone in the air just inside the glass.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = topAt(x, z);
  for (let y = 5; y < t - 1; y++) {
    const faces = exposed(x, y, z);
    if (!faces.length || rowOf(y, t) !== "upper") continue;
    const a = faces[0] === "W" || faces[0] === "E" ? z : x;
    if (a % 3 === 0 || (a * 5 + y) % 7 !== 0) continue;
    const [dx, dz] = DIRS[faces[0]];
    const ix = x - dx, iz = z - dz;
    if (inF(ix, iz) && topAt(ix, iz) > y && rowOf(y, topAt(ix, iz)) === "upper") g.set(ix, y, iz, "glowstone");
  }
}

const out = `${dir}/NYC1022648.nbt`;
const { blocks, palette } = g.save(out);
console.log(`wrote ${out}: ${blocks} blocks, ${palette} palette entries`);
