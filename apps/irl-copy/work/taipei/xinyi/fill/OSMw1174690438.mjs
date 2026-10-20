import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const BASE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690438";
const cells = JSON.parse(readFileSync(`${BASE}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 29;
const v = new Voxels([W, H, D]);

// Footprint lookup: key "x,z" -> ground (clamped 0..10 so the 11-block roof stays in the volume)
const ground = new Map();
let minX = Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
  minX = Math.min(minX, x);
  minZ = Math.min(minZ, z);
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Outward directions per face
const DIRS = { south: [0, 1], north: [0, -1], east: [1, 0], west: [-1, 0] };
const facesOf = (x, z) =>
  Object.entries(DIRS).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([f]) => f);
const perimOf = (x, z) => facesOf(x, z).length > 0;

const keys = [...ground.keys()].map(k => k.split(",").map(Number));

// Main door: middle of the south (street-facing +z) face, else the next available face
let door = null;
for (const pref of ["south", "north", "east", "west"]) {
  const cand = keys
    .filter(([x, z]) => {
      const f = facesOf(x, z);
      return f.length === 1 && f[0] === pref;
    })
    .sort((a, b) => (pref === "south" || pref === "north") ? a[0] - b[0] : a[1] - b[1]);
  if (cand.length) {
    const [x, z] = cand[Math.floor(cand.length / 2)];
    door = { x, z, face: pref };
    break;
  }
}

// Pass 1: foundation, floors, walls, roof, parapet, door
for (const [x, z] of keys) {
  const gr = G(x, z);
  const faces = facesOf(x, z);
  const perim = faces.length > 0;
  const corner = faces.length >= 2;
  const face = faces[0];
  const u = (face === "north" || face === "south") ? x - minX : z - minZ;

  // foundation up to ground
  for (let y = 0; y < gr; y++) v.set(x, y, z, "stone_bricks");

  // ground-storey floor, interior mid floor, roof deck
  v.set(x, gr, z, "smooth_stone");
  if (!perim && gr < 5) v.set(x, 5, z, "smooth_stone");
  v.set(x, 11, z, "smooth_stone");

  if (perim) {
    v.set(x, 12, z, "white_concrete"); // parapet

    for (let y = gr; y <= 10; y++) {
      let b = null;
      if (y === gr) b = "stone_bricks";                       // base course
      else if (corner) b = "white_concrete";                  // corner pillar
      else if (y < 5) {                                       // shopfront storey
        if (u % 4 === 0) b = "white_concrete";
        else if (y === 4) b = "smooth_stone";                 // fascia
        else b = "glass";
      }
      else if (y === 5 || y === 10) b = "smooth_quartz";      // storey line / cornice
      else if (y === 6 || y === 9) b = "white_concrete";      // window head and sill
      else b = (u % 4 === 0) ? "white_concrete" : "glass_pane"; // upper windows
      if (b) v.set(x, y, z, b);
    }
  }
}

// Entrance door on the street face
if (door) {
  const gr = G(door.x, door.z);
  const dprops = (half) => ({ facing: door.face, half, hinge: "left", open: "false", powered: "false" });
  v.set(door.x, gr + 1, door.z, "oak_door", dprops("lower"));
  v.set(door.x, gr + 2, door.z, "oak_door", dprops("upper"));
}

// Pass 2: warm lights behind glass, rooftop plant room and lantern
for (const [x, z] of keys) {
  const gr = G(x, z);
  const faces = facesOf(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const [dx, dz] = DIRS[face];
  const u = (face === "north" || face === "south") ? x - minX : z - minZ;
  const ix = x - dx, iz = z - dz; // inward neighbour
  if (!has(ix, iz) || perimOf(ix, iz)) continue;
  if (door && door.x === x && door.z === z) continue;

  if (7 > gr && u % 8 === 2) v.set(ix, 7, iz, "glowstone");
  if (gr < 5 && gr + 1 < 5 && u % 8 === 6) v.set(ix, gr + 1, iz, "shroomlight");
}

// Rooftop plant room, centred and set back from the street face
for (let x = minX + 6; x <= minX + 14; x++) {
  for (let z = minZ + 10; z <= minZ + 18; z++) {
    if (!has(x, z) || perimOf(x, z)) continue;
    v.set(x, 12, z, "light_gray_concrete");
    v.set(x, 13, z, "light_gray_concrete");
  }
}
if (has(minX + 10, minZ + 14) && !perimOf(minX + 10, minZ + 14)) {
  v.set(minX + 10, 14, minZ + 14, "lantern", { hanging: "false", waterlogged: "false" });
}

v.save(`${BASE}/${ID}.nbt`);
