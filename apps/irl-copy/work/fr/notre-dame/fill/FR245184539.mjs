// FR245184539: residential, 2009, five storeys on a stepped 45-cell footprint. Stone base storey, render above,
// a flat deck roof with a parapet and two brick flues. Each cell stands on its ground (foundation below), every
// storey is a floor slab across the whole footprint, walls and glass only on the outer faces, and the interior
// stays air except for lamps set behind some panes.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${HERE}/FR245184539.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inFoot = (x, z) => foot.has(key(x, z));
// outward face directions: north is -z (the street side, z 0), so a door on the north face faces north
const FACES = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exteriorFaces = (x, z) => Object.keys(FACES).filter(f => !inFoot(x + FACES[f][0], z + FACES[f][1]));

const FLOORS = [0, 5, 10, 15, 20];   // storey floor slabs, every 5 blocks from y 0
const DECK = 24;                     // the roof deck, which the lidar's roof height (25) sits on
const PARAPET = 25;

const v = new Voxels([13, 41, 8]);
const put = (x, y, z, block, state) => v.set(x, y, z, block, state);
const isFloor = y => FLOORS.includes(y);
const bandOf = y => Math.floor(y / 5);
// upper storeys: a 2-block window band at the middle of each storey, sill and lintel courses in wall
const windowRow = y => (y % 5 === 2 || y % 5 === 3) && y < DECK;

// the footprint is a sheared strip, so nearly every outer cell is a stepped corner: no quoins, one wall per cell
const wallFor = (x, z, y) => (bandOf(y) === 0 ? "stone_bricks" : "smooth_quartz");   // a stone base storey, render above
// the glass goes on the street-side (north/south) face where there is one, else the east/west face
const glassFace = faces => ["north", "south", "east", "west"].find(f => faces.includes(f));

// 1. foundation, floors, roof deck and the parapet on the outer ring
for (const [x, z, g] of cells) {
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (const y of FLOORS) put(x, y, z, "smooth_stone");
  put(x, DECK, z, "deepslate_tiles");
  if (exteriorFaces(x, z).length) put(x, PARAPET, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 2. walls and glass on the outer faces
for (const [x, z, g] of cells) {
  const faces = exteriorFaces(x, z);
  if (!faces.length) continue;
  for (let y = g; y < DECK; y++) {
    if (isFloor(y)) continue;
    put(x, y, z, wallFor(x, z, y));
  }
  const face = glassFace(faces);
  const along = face === "north" || face === "south" ? x : z;
  if (along % 2 !== 1) continue;                       // alternate glass and pillar along each face
  for (let y = Math.max(g, 1); y < DECK; y++) {
    if (!windowRow(y)) continue;
    const state = face === "north" || face === "south"
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "glass_pane", state);
  }
}

// 3. the entrance: a dark oak door on the north face at the ground, a lantern hanging above it
const doorCands = cells.filter(([x, z, g]) => z === 0 && g <= 1 && exteriorFaces(x, z).includes("north"));
const mid = cells.filter(([, z]) => z === 0).reduce((s, [x]) => s + x, 0) / Math.max(1, cells.filter(([, z]) => z === 0).length);
const [dx, dz] = doorCands.reduce((best, c) => (Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best));
put(dx, 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(dx, 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
put(dx, 3, dz, "lantern", { hanging: "true", waterlogged: "false" });

// 4. lamps behind some panes: an interior cell behind a window (not a wall, so the room is air) gets glowstone
for (const [x, z, g] of cells) {
  const face = glassFace(exteriorFaces(x, z));
  if (!face) continue;
  const [ox, oz] = FACES[face];
  const bx = x - ox, bz = z - oz;                       // the cell behind the glass
  if (!inFoot(bx, bz) || exteriorFaces(bx, bz).length) continue;
  const along = face === "north" || face === "south" ? x : z;
  if (along % 4 !== 1) continue;
  for (const y of [2, 7, 12, 17, 22]) {                // one lamp per storey's window band, where the room is air
    if (y < foot.get(key(bx, bz)).g || y >= DECK) continue;
    put(bx, y, bz, "glowstone");
  }
}

// 5. two brick flues rising from the deck, set on interior cells so they stand on the roof
const interior = cells.filter(([x, z]) => !exteriorFaces(x, z).length && !(x === dx && z === dz));
const flues = [interior[Math.floor(interior.length / 3)], interior[Math.floor((2 * interior.length) / 3)]].filter(Boolean);
for (const [x, z] of flues) for (let y = PARAPET; y <= 27; y++) put(x, y, z, "bricks");

const stats = v.save(`${HERE}/FR245184539.nbt`);
console.log(JSON.stringify({ footprint: cells.length, door: [dx, dz], flues: flues.map(([x, z]) => [x, z]), ...stats }));
