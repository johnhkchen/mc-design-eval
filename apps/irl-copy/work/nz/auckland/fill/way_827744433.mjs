// Auckland, way 827744433: a 1930s two-storey brick shop block with a flat roof behind a stone parapet. The lidar roof
// steps down from a two-storey core (9 blocks) to one-storey wings (6) and low edges (4); each cell is snapped to its tier,
// stands on a foundation from y 0 up to its ground, with a floor slab per storey and a solid roof deck under the parapet.
// Walls are one block of brick with glass panes in bays of three (brick piers between), an air gap behind the glass and
// lanterns hanging from the storey slabs in some bays. Shopfront glass and a dark-oak door under a canopy on the south
// (street) face; a planter on the core roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744433.cells.json", "utf8"));
const W = 18, D = 15, Y = 21;
const ix = (x, z) => z * W + x;
const NB = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const inF = new Uint8Array(W * D), gnd = new Int8Array(W * D), roof = new Float64Array(W * D);
for (const [x, z, g, r] of cells) { inF[ix(x, z)] = 1; gnd[ix(x, z)] = g; roof[ix(x, z)] = r; }
const inside = (x, z) => x >= 0 && x < W && z >= 0 && z < D && inF[ix(x, z)] === 1;
const gr = (x, z) => gnd[ix(x, z)];

// tiers: the 3x3 mean of the lidar roof, snapped to 9 (two storeys), 6 (one storey) or 4 (low); at least 4 above its ground
const TOP = new Int16Array(W * D);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) { s += roof[ix(x + dx, z + dz)]; n++; }
  const m = s / n, snap = m >= 7.5 ? 9 : m >= 5.5 ? 6 : 4;
  TOP[ix(x, z)] = Math.max(snap, gr(x, z) + 4);
}
const top = (x, z) => TOP[ix(x, z)];
// the faces to the outdoors (windows go here)
const outFaces = (x, z) => NB.filter(([dx, dz]) => !inside(x + dx, z + dz)).map(([, , n]) => n);
// perimeter: a face to the outdoors, or a face onto a lower tier (a setback's wall stands above the lower roof)
const perim = (x, z) => NB.some(([dx, dz]) => !inside(x + dx, z + dz) || top(x + dx, z + dz) < top(x, z));
// floor slabs: the ground, then one per 4-block storey below the roof deck
const floorsOf = (x, z) => { const g = gr(x, z), t = top(x, z), f = [g]; for (let k = 4; g + k < t - 1; k += 4) f.push(g + k); return f; };
const INWARD = { east: [-1, 0], west: [1, 0], south: [0, -1], north: [0, 1] };
const DOOR = { x: 10, z: 13, face: "south" };
const isDoorBay = (x, z, face) => face === DOOR.face && z === DOOR.z && Math.abs(x - DOOR.x) <= 1;

const g3 = new Voxels([W, Y, D]);
const put = (x, y, z, b, s) => g3.set(x, y, z, b, s);
const pane = (face) => (face === "east" || face === "west"
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inside(x, z)) continue;
  const gg = gr(x, z), t = top(x, z), p = perim(x, z), faces = outFaces(x, z), floors = floorsOf(x, z);
  // foundation under the cell, up to its ground
  for (let y = 0; y < gg; y++) put(x, y, z, "cobblestone");
  // floor slabs: the base course at the ground on the wall line, storey lines on the wall, smooth_stone inside
  for (const f of floors) put(x, f, z, f === gg && p ? "stone_bricks" : "smooth_stone");
  // roof deck under the parapet (cornice course on the edge)
  put(x, t - 1, z, p ? "smooth_stone" : "stone");
  if (p) put(x, t, z, "smooth_stone");
  if (!p) continue;
  // walls: brick with a head course over each storey's glass; faces to the outdoors get piers and panes
  for (let y = gg + 1; y <= t - 2; y++) {
    if (floors.includes(y)) continue;
    const sl = Math.max(...floors.filter((f) => f < y));
    const hd = [...floors, t - 1].find((f) => f > y) - 1;
    if (!faces.length) { put(x, y, z, "bricks"); continue; }
    const face = faces[0], along = face === "east" || face === "west" ? z : x;
    const corner = faces.length > 1, door = isDoorBay(x, z, face);
    if (y === hd) {
      if (door) put(x, y, z, "dark_oak_slab", { type: "top", waterlogged: "false" });  // canopy over the door bay
      else put(x, y, z, "bricks");
      // a lantern hangs from the storey slab in some bays, in the air gap behind the glass
      const storey = floors.indexOf(sl), [ox, oz] = INWARD[face], ax = x + ox, az = z + oz;
      const bay = !corner && along % 3 !== 0 && !door && (along + 2 * storey) % 4 === 1;
      if (bay && inside(ax, az) && !perim(ax, az) && top(ax, az) === t && gr(ax, az) === gg)
        put(ax, hd, az, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (door && y === gg + 1) { put(x, y, z, "dark_oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
    if (door && y === gg + 2) { put(x, y, z, "dark_oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    const pier = corner || along % 3 === 0;
    if (pier) put(x, y, z, "bricks");
    else put(x, y, z, "glass_pane", pane(face));
  }
}

// a planter with leaves on the core roof, in the middle of the two-storey core (interior cells only)
for (let z = 5; z <= 6; z++) for (let x = 9; x <= 11; x++) {
  if (!inside(x, z) || perim(x, z) || top(x, z) !== 9) continue;
  put(x, 9, z, "stone_bricks");
  put(x, 10, z, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
}

g3.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_827744433.nbt");
