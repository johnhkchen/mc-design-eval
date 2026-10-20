import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise, five storeys, 1980s Taipei commercial block: white tiled piers with
// light-blue glazing, grey spandrels, a stone-clad shopfront base, a quartz cornice
// and parapet, and a rooftop plant room with a short mast.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280203";
const W = 21, D = 12, H = 38;
const ROOF_Y = 25;     // roof slab / cornice row
const PARAPET_Y = 26;  // parapet course, roof surface reads ~26

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Exterior faces: N = z-1 side, S = z+1 side, W = x-1 side, E = x+1 side
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
}
const edgeSet = new Set();
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  if (facesOf(x, z).length) edgeSet.add(`${x},${z}`);
}
const isEdge = (x, z) => edgeSet.has(`${x},${z}`);

const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

const g = new Voxels([W, H, D]);

// ---- Pass 1: foundations, floor slabs, and facade walls ----
for (const [x, z, gr] of cells) {
  const base = Math.min(gr, H - 1);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  if (gr >= PARAPET_Y) continue;

  // interior floor slabs at ground and every storey line up to the roof
  const levels = new Set([gr, 5, 10, 15, 20, 25].filter((y) => y >= gr && y <= ROOF_Y));
  for (const y of levels) g.set(x, y, z, "light_gray_concrete");

  if (!isEdge(x, z)) continue;

  const faces = facesOf(x, z);
  const corner = faces.length >= 2;
  const onNS = faces[0] === "N" || faces[0] === "S";
  const i = onNS ? x : z;
  const pier = corner || i % 3 === 0;
  const paneProps = onNS
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

  // facade column from ground to parapet
  for (let y = gr; y <= PARAPET_Y; y++) {
    if (y === PARAPET_Y) {
      g.set(x, y, z, "white_concrete");                 // parapet
    } else if (y === gr) {
      g.set(x, y, z, "stone_bricks");                   // base course / shopfront plinth
    } else if (y === ROOF_Y) {
      g.set(x, y, z, "smooth_quartz");                  // roof cornice
    } else if (y % 5 === 0) {
      g.set(x, y, z, "smooth_quartz");                  // storey line
    } else {
      const r = y % 5;
      if (r === 4) {
        // spandrel; ground floor fascia is stone
        g.set(x, y, z, y < 5 ? "stone_bricks" : "light_gray_concrete");
      } else if (pier) {
        g.set(x, y, z, "white_concrete");               // tiled pier
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps);
        // warm light in some upper windows: glowstone just behind the glass
        const k = Math.floor(y / 5);
        if (faces.length === 1 && r === 2 && (i + k) % 4 === 1) {
          const [dx, dz] = INWARD[faces[0]];
          const ix = x + dx, iz = z + dz;
          if (has(ix, iz) && !isEdge(ix, iz)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// ---- Pass 2: entrance on the north (z-1) face, lowest ground, near centre ----
let entrance = null;
{
  const pool = [];
  for (const [x, z, gr] of cells) {
    if (gr < PARAPET_Y && facesOf(x, z).includes("N")) pool.push([x, z, gr]);
  }
  const cx = (W - 1) / 2;
  pool.sort((a, b) => a[2] - b[2] || Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
  entrance = pool[0] ?? null;
}
if (entrance) {
  const [ex, ez, eg] = entrance;
  // door: lower and upper halves, on the north facade
  g.set(ex, eg, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(ex, eg + 1, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // warm light over the door, in the air just inside the lobby
  if (has(ex, ez + 1)) g.set(ex, eg + 2, ez + 1, "shroomlight");
  // flanking glass beside the door at ground floor is left as shopfront panes
}

// ---- Pass 3: rooftop plant room and mast ----
{
  const x0 = 7, x1 = 13, z0 = 4, z1 = 8;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!has(x, z)) continue;
      const border = x === x0 || x === x1 || z === z0 || z === z1;
      if (border) {
        for (let y = PARAPET_Y; y <= 28; y++) g.set(x, y, z, "light_gray_concrete");
      }
      g.set(x, 29, z, "smooth_quartz"); // plant room cap
    }
  }
  if (has(10, 6)) {
    for (let y = 30; y <= 32; y++) g.set(10, y, 6, "iron_bars");
    g.set(10, 33, 6, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
