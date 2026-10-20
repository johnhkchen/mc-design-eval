import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397469";
const W = 33, H = 38, D = 18;
const TOP = 26;          // roof level above lowest ground (lidar)
const STOREY = 5;        // blocks per storey
const PARAPET_TOP = TOP + 1;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Faces: direction of the missing neighbour, the facing a door would use,
// and which footprint coordinate runs along that face.
const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north", along: "x" },
  { name: "south", dx: 0, dz: 1, facing: "south", along: "x" },
  { name: "west", dx: -1, dz: 0, facing: "west", along: "z" },
  { name: "east", dx: 1, dz: 0, facing: "east", along: "z" },
];

const exposed = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));

// Work out the main street frontage (the face with the most exposed cells)
// and put the entrance at the middle of it.
const faceCount = Object.fromEntries(FACES.map((f) => [f.name, []]));
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  for (const f of exposed(x, z)) faceCount[f.name].push(f.along === "x" ? x : z);
}
let doorFace = null;
for (const f of FACES) {
  if (!doorFace || faceCount[f.name].length > faceCount[doorFace.name].length) doorFace = f;
}
let doorIdx = -1;
if (faceCount[doorFace.name].length) {
  const vals = faceCount[doorFace.name];
  doorIdx = Math.floor((Math.min(...vals) + Math.max(...vals)) / 2);
}
const minAlong = {};
for (const f of FACES) {
  const vals = faceCount[f.name];
  minAlong[f.name] = vals.length ? Math.min(...vals) : 0;
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposed(x, z);
  const top = Math.min(gr + 0, TOP);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (ex.length === 0) {
    // Interior: floor slab per storey, air elsewhere, roof deck at TOP-1.
    for (let y = gr; y <= TOP - 1; y++) {
      const L = y - gr;
      if (L % STOREY === 0) {
        put(x, y, z, L === 0 ? "smooth_stone" : "light_gray_concrete");
      }
    }
    put(x, TOP - 1, z, "gray_concrete");

    // Roof plant: small mechanical units on a grid, not on the middle spine.
    if (x > 3 && x < 29 && z > 3 && z < 14 && (x * 5 + z * 3) % 9 === 0) {
      put(x, TOP, z, "iron_block");
      put(x, TOP + 1, z, "iron_block");
    }
    // Central antenna.
    if (x === 16 && z === 9) {
      for (let y = TOP; y <= TOP + 4; y++) put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
    }
    continue;
  }

  // Perimeter: the facade is the cell itself, with air behind the glass.
  const face = ex[0];
  const idx = face.along === "x" ? x : z;
  const col = idx - minAlong[face.name];
  const isDoorFace = face.name === doorFace.name && idx === doorIdx;

  for (let y = gr; y <= PARAPET_TOP; y++) {
    const L = y - gr;
    const s = Math.floor(L / STOREY);
    const r = L % STOREY;

    if (y === TOP - 1) { put(x, y, z, "smooth_stone"); continue; }     // cornice
    if (y >= TOP) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (L === 0) { put(x, y, z, "polished_andesite"); continue; }      // base course
    if (r === 0) { put(x, y, z, s === 0 ? "light_gray_concrete" : "light_gray_concrete"); continue; } // storey line
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }         // spandrel / lintel

    // Window zone (r = 1..3).
    if (col % 3 === 0) { put(x, y, z, "white_concrete"); continue; }   // frame mullion

    if (s === 0) {
      if (isDoorFace && (r === 1 || r === 2)) {
        put(x, y, z, "dark_oak_door", {
          facing: face.facing,
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isDoorFace && r === 3) {
        put(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }
      put(x, y, z, "tinted_glass");
      continue;
    }

    const warm = (x * 7 + z * 5 + s * 3 + r) % 11 === 0;
    put(x, y, z, warm ? "shroomlight" : "light_blue_stained_glass");
  }
}

g.save(`${DIR}/${ID}.nbt`);
