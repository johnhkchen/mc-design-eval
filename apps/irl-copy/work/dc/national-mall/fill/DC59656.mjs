// DC59656: 550 1st St NW, an educational block on the lidar record. The cells file carries no era or name, so the
// typology is read from the massing: a ten-block brick block (about six storeys at 0.42 blocks a metre) on a
// shallow notch, with a three-block limestone-trimmed wing along its west side and the ground falling to the east.
// Red brick walls on a stone base, calcite corner quoins, brick piers every third cell, glass bays between them,
// smooth-stone string courses at each floor line, a cornice and parapet, and one recessed entrance on the north
// face with a calcite-trimmed lintel. Roof plant on the deck: a penthouse box and two chimney stacks.
//
// Storeys sit on absolute rows (base 1, string courses 4 and 7, cornice 8, deck 9), so every column lines up even
// where the ground steps. Each column fills from y 0 to its ground, then its rows up to the lidar roof. Interior
// cells are solid except behind the glass bays, where they are air with a floor and ceiling per storey and a lamp
// on the floor now and then; the entrance hall is a single air cell behind the door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59656.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inside = (x, z) => byXZ.has(key(x, z));
const roofAt = (x, z) => (byXZ.has(key(x, z)) ? byXZ.get(key(x, z)).r : -1);
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

// A face is any side with no footprint cell beside it, or with a lower roof beside it (the wing's west wall shows
// as a face of the main block above it).
const faces = (x, z, R) => FACES.filter(([, dx, dz]) => roofAt(x + dx, z + dz) < R).map(([f]) => f);
// Piers every third cell along each face (by x on the north and south faces, by z on the east and west).
const isPier = (fs, x, z) => fs.some((f) => ((f === "N" || f === "S") ? x : z) % 3 === 0);

const info = new Map();
for (const [x, z, G, R] of cells) {
  const fs = faces(x, z, R);
  const facade = fs.length > 0;
  const corner = fs.length >= 2;
  const door = x === 12 && z === 0;
  const hall = x === 12 && z === 1;
  info.set(key(x, z), { x, z, G, R, facade, corner, door, hall, pier: facade && (corner || isPier(fs, x, z)) });
}
const at = (x, z) => info.get(key(x, z));
// A bay is a glass facade cell: not pier, not door. A room is an interior cell one step behind a bay.
const isBay = (x, z) => { const c = at(x, z); return !!c && c.facade && !c.pier && !c.door; };
for (const c of info.values()) {
  c.room = !c.facade && [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => isBay(c.x + dx, c.z + dz));
}

const hash = (x, y, z) => Math.abs(((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0);
const DOOR = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
const LANTERN = { hanging: "false", waterlogged: "false" };

// Glass rows: the main block has two per storey (2-3, 5-6); the wing has one (1).
const WIN = (R) => (R === 10 ? [2, 3, 5, 6] : [1]);

// The block for one cell at height y: [id, state] or null for air.
const blockAt = (c, y) => {
  const { x, z, G, R } = c;
  if (y < G) return [c.facade ? "stone_bricks" : "stone"];           // foundation / plinth
  if (c.door) {
    if (y === G) return ["iron_door", DOOR("lower")];
    if (y === G + 1) return ["iron_door", DOOR("upper")];
    if (y === G + 2) return ["smooth_stone"];                       // calcite-trimmed lintel over the entrance
  }
  if (c.hall && (y === 2 || y === 3)) return null;                  // the hall behind the door
  const top = R - 1;
  if (y === top) return [c.facade ? "smooth_stone" : "stone"];      // parapet and roof deck
  if (c.facade) {
    if (R === 10) {
      if (y === 0 || y === 1) return ["stone_bricks"];              // plinth and base course
      if (y === 4 || y === 7) return ["smooth_stone"];              // floor-line string courses
      if (y === 8) return ["smooth_stone"];                         // cornice
    }
    if (WIN(R).includes(y)) {
      if (c.pier) return [c.corner ? "calcite" : "bricks"];         // brick piers, calcite quoins
      return ["glass_pane"];
    }
    return ["bricks"];
  }
  if (c.room && WIN(R).includes(y)) {
    if (y === WIN(R)[0]) {                                          // a lamp stands on the floor below
      const h = hash(x, y, z) % 19;
      if (h === 0) return ["lantern", LANTERN];
      if (h === 1) return ["shroomlight"];
      if (h === 2) return ["glowstone"];
    }
    return null;                                                    // air behind the glass
  }
  return ["stone"];                                                 // floors, ceilings and solid interior
};

const g = new Voxels([21, 22, 17]);
for (const c of info.values()) {
  for (let y = 0; y < c.R; y++) {
    const b = blockAt(c, y);
    if (b) g.set(c.x, y, c.z, b[0], b[1]);
  }
}

// Roof plant on the deck: a penthouse box (x 8-11, z 5-7) and two chimney stacks.
for (let x = 8; x <= 11; x++) for (let z = 5; z <= 7; z++) {
  g.set(x, 10, z, "stone_bricks");
  g.set(x, 11, z, "smooth_stone");
}
for (const [x, z] of [[5, 5], [16, 12]]) for (let y = 10; y <= 12; y++) g.set(x, y, z, "bricks");

g.save(`${DIR}/DC59656.nbt`);
