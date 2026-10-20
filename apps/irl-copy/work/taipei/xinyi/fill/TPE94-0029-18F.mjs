import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0029-18F";
const W = 17, H = 23, D = 57;

// Record: built 2005, lidar roof ~11 blocks above lowest ground.
// Reads as a two-storey, cream-tiled Xinyi commercial block of the mid-2000s:
// stone plinth, white-clad storeys in 5-block bands with ribbon glazing and
// grey mullions, a dark-wood entrance under a canopy on the street face,
// a light cornice and white parapet, and a few rooftop plant units.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
const list = [];
for (const c of cells) {
  const x = c[0], z = c[1], gr = Math.round(c[2]);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const key = `${x},${z}`;
  if (ground.has(key)) continue;
  ground.set(key, gr);
  list.push({ x, z, gr });
}

if (list.length === 0) {
  g.save(`${DIR}/${ID}.nbt`);
} else {
  const grs = list.map((c) => c.gr);
  const minG = Math.min(...grs);
  const maxG = Math.max(...grs);

  // Roof: ~11 blocks above lowest ground, but never below the highest
  // ground plus a 1.5-storey shell, and inside the array.
  let T = Math.max(minG + 11, maxG + 7);
  T = Math.min(T, H - 1);
  T = Math.max(T, maxG + 1);

  const put = (x, y, z, id, props) => {
    if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
    if (props) g.set(x, y, z, id, props);
    else g.set(x, y, z, id);
  };

  const has = (x, z) => ground.has(`${x},${z}`);
  const DIRS = [
    { n: "north", dx: 0, dz: -1 },
    { n: "south", dx: 0, dz: 1 },
    { n: "west", dx: -1, dz: 0 },
    { n: "east", dx: 1, dz: 0 },
  ];
  const exposed = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
  const isEdge = (x, z) => exposed(x, z).length > 0;
  const isDepth1 = (x, z) =>
    !isEdge(x, z) && DIRS.some((d) => has(x + d.dx, z + d.dz) && isEdge(x + d.dx, z + d.dz));

  // Main entrance: on the north (street) face, nearest the centre of that run.
  const northCells = list.filter((c) => exposed(c.x, c.z).some((d) => d.n === "north"));
  const pool = northCells.length ? northCells : list.filter((c) => isEdge(c.x, c.z));
  const meanX = pool.reduce((s, c) => s + c.x, 0) / Math.max(1, pool.length);
  let ent = null;
  for (const c of pool) {
    if (!ent || Math.abs(c.x - meanX) < Math.abs(ent.x - meanX)) ent = c;
  }
  let entFace = null;
  let entAlong = null;
  if (ent) {
    const ex = exposed(ent.x, ent.z);
    entFace = (ex.find((d) => d.n === "north") || ex[0]);
    entAlong = entFace.dz !== 0 ? ent.x : ent.z;
  }
  const entKey = ent ? `${ent.x},${ent.z}` : null;

  for (const { x, z, gr } of list) {
    const key = `${x},${z}`;

    // Foundation: solid from y 0 up to this cell's ground.
    for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

    const edge = isEdge(x, z);
    const depth1 = isDepth1(x, z);

    if (edge) {
      const ex = exposed(x, z);
      const face = ex[0];
      const alongX = face.dz !== 0; // N/S face runs along x
      const along = alongX ? x : z;
      const glassProps = alongX
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

      const isEntrance = key === entKey;
      const isCanopy =
        entFace && ex.some((d) => d.n === entFace.n) &&
        Math.abs(along - entAlong) <= 1 && face.n === entFace.n;

      for (let y = gr; y <= T; y++) {
        const k = y - gr;
        if (y === T) { put(x, y, z, "white_concrete"); continue; }        // parapet
        if (y === T - 1) { put(x, y, z, "light_gray_concrete"); continue; } // cornice
        if (k === 0) { put(x, y, z, "polished_andesite"); continue; }      // base course

        if (isEntrance && (k === 1 || k === 2)) {
          const props = {
            facing: face.n,
            hinge: "left",
            open: "false",
            powered: "false",
            half: k === 1 ? "lower" : "upper",
          };
          put(x, y, z, "dark_oak_door", props);
          continue;
        }
        if (isEntrance && k === 3) { put(x, y, z, "light_gray_concrete"); continue; } // lintel
        if (isCanopy && k === 4) { put(x, y, z, "smooth_stone"); continue; }          // canopy

        const m = k % 5;
        if (m === 0) { put(x, y, z, "light_gray_concrete"); continue; }   // storey line
        if (m === 4) { put(x, y, z, "white_concrete"); continue; }        // spandrel
        // m in 1..3: glazing band with grey mullions every third cell
        if (along % 3 === 0) put(x, y, z, "gray_concrete");
        else put(x, y, z, "glass_pane", glassProps);
      }
    } else {
      // Interior: solid structure with a roof slab; depth-1 ring holds
      // air pockets behind the glazing, with a warm light in some.
      for (let y = gr; y < T; y++) {
        const k = y - gr;
        if (depth1 && k >= 1 && k % 5 >= 1 && k % 5 <= 3) {
          if (k === 2 && ((x * 3 + z * 5) % 7 === 0)) put(x, y, z, "glowstone");
          else if (k === 2 && ((x * 5 + z * 3) % 11 === 0)) put(x, y, z, "shroomlight");
          continue; // air gap behind the glass
        }
        put(x, y, z, "white_concrete");
      }
      put(x, T, z, "light_gray_concrete"); // roof slab
    }
  }

  // Rooftop plant units on the interior roof, standing on the roof slab.
  for (const { x, z } of list) {
    if (isEdge(x, z) || isDepth1(x, z)) continue;
    if (T + 2 > H - 1) break;
    if (x % 4 === 2 && z % 8 === 4 && x >= 4 && x <= 12 && z >= 10 && z <= 46) {
      put(x, T + 1, z, "gray_concrete");
      put(x, T + 2, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
