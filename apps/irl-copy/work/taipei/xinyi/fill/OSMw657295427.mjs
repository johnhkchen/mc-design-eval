// 清園華廈 (Qingyuan Huadu / Qingyuan Apartments), Xinyi, Taipei.
// Read as a late-1970s to 1980s Taipei residential mid-rise: four storeys of
// about 5 blocks, a roof about 21 blocks above the lowest ground, white tiled
// concrete walls with light grey string courses, grey window frames, iron
// security grilles at the entrance, and a blue water tank on the roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw657295427";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 29, H = 33, D = 50;
const ROOF = 20;      // roof deck / top cornice course (storey lines at 5, 10, 15)
const PARAPET = 21;   // parapet cap on the outer walls; roof reads about 21 above lowest ground

const g = new Voxels([W, H, D]);

const inB = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, p) => {
  if (!inB(x, y, z)) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup
const ground = new Map();
let minx = Infinity, maxx = -Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  if (x < minx) minx = x;
  if (x > maxx) maxx = x;
}
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);
const exposure = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isEdge = (x, z) => {
  const e = exposure(x, z);
  return e.N || e.S || e.W || e.E;
};

// Main entrance: north-facing edge cell closest to the centre line of the footprint.
const cx = (minx + maxx) / 2;
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!exposure(x, z).N) continue;
    const score = Math.abs(x - cx) * 100 + z;
    if (score < best) { best = score; door = { x, z }; }
  }
}

const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pass 1: foundation, floors, walls, windows, entrance, parapet
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  const edge = e.N || e.S || e.W || e.E;
  const corner = (e.N || e.S) && (e.W || e.E);
  const alongX = e.N || e.S;
  const isDoor = door && door.x === x && door.z === z;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (gr >= ROOF) continue;

  if (!edge) {
    // interior: air between storeys, a floor slab per storey, roof deck on top
    for (let y = gr; y < ROOF; y++) {
      if (y === gr || y % 5 === 0) put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF, z, "gray_concrete");
    continue;
  }

  // outer shell
  for (let y = gr; y < ROOF; y++) {
    const r = y % 5;
    let id = "white_concrete";
    let p = null;

    if (y === gr) {
      id = "stone_bricks";                       // base course
    } else if (r === 0) {
      id = "light_gray_concrete";                // storey string course
    } else if (r === 4) {
      id = "white_concrete";                     // spandrel
    } else if (corner) {
      id = "light_gray_concrete";                // corner pier
    } else {
      const bay = alongX ? x : z;
      if (bay % 4 === 0) {
        id = "light_gray_concrete";              // pilaster between bays
      } else if (r === 1) {
        id = "white_concrete";                   // window sill
      } else {
        id = "glass_pane";                       // window glass in grey frame
        p = alongX ? paneAlongX : paneAlongZ;
      }
    }
    put(x, y, z, id, p);
  }

  // entrance: iron door with a light grey lintel above
  if (isDoor) {
    put(x, gr, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 1, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gr + 2 < ROOF) put(x, gr + 2, z, "light_gray_concrete");
  }

  // roof cornice course and parapet cap on the outer walls
  put(x, ROOF, z, "light_gray_concrete");
  put(x, PARAPET, z, "smooth_stone");
}

// Pass 2: warm lights behind some windows (air gap inside, glowstone in the room)
for (const [x, z, gr] of cells) {
  const e = exposure(x, z);
  const edge = e.N || e.S || e.W || e.E;
  if (!edge) continue;
  const corner = (e.N || e.S) && (e.W || e.E);
  if (corner) continue;
  const alongX = e.N || e.S;
  const bay = alongX ? x : z;
  if (bay % 4 === 0) continue;
  if (door && door.x === x && door.z === z) continue;

  // inward neighbour direction
  let ix = x, iz = z;
  if (alongX) iz = e.N ? z + 1 : z - 1;
  else ix = e.W ? x + 1 : x - 1;

  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  for (let y = gr; y < ROOF; y++) {
    const r = y % 5;
    if (r !== 2 && r !== 3) continue;
    if (((x * 3 + z * 5 + y * 7) % 5) !== 0) continue;
    if (gnd(ix, iz) > y) continue;
    put(ix, y, iz, "glowstone");
  }
}

// Pass 3: roof water tank on the roof deck, on interior cells only
for (const [x, z, gr] of cells) {
  if (isEdge(x, z)) continue;
  if (x < minx + 7 || x > minx + 14) continue;
  if (z < 18 || z > 27) continue;
  if (gr > PARAPET) continue;
  put(x, PARAPET, z, "light_blue_concrete");
  put(x, PARAPET + 1, z, "light_blue_concrete");
  put(x, PARAPET + 2, z, "light_gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
