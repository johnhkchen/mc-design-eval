import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw831859938";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 31 x 16. Era read: 1980s-90s Xinyi low-rise commercial block, two
// storeys of white-tiled concrete over a stone base, a shopfront on the street
// side, glazed upper bays with piers, flat parapet roof with HVAC plant.
const W = 31, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const xmin = Math.min(...xs), xmax = Math.max(...xs);
const zmin = Math.min(...zs);
const xmid = Math.floor((xmin + xmax) / 2);

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function pane(missN, missS) {
  // A pane in a wall running along x connects east/west; otherwise north/south.
  return (missN || missS)
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  const exterior = missN || missS || missW || missE;
  const front = exterior && missN && z === zmin;
  const corner = (missN || missS) && (missW || missE);

  // Along-wall bay index used for piers and windows.
  const bay = front || missN ? x - xmin : (missS ? x - xmin : z - zmin + x - xmin);
  const pier = corner || bay % 4 === 0;

  // Inward neighbour, used to put warm light behind a window.
  let inX = x, inZ = z;
  if (missN) inZ = z + 1;
  else if (missS) inZ = z - 1;
  else if (missW) inX = x + 1;
  else if (missE) inX = x - 1;
  const inward = has(inX, inZ) && !(!has(inX, inZ - 1) || !has(inX, inZ + 1) || !has(inX - 1, inZ) || !has(inX + 1, inZ));

  for (let r = 0; r <= 10; r++) {
    const y = gr + r;

    if (!exterior) {
      // Interior: floor slabs, roof deck, air between.
      if (r === 0 || r === 5 || r === 10) put(x, y, z, "smooth_stone");
      continue;
    }

    // Exterior shell.
    if (r === 0) {
      put(x, y, z, "polished_granite");                       // base course
      continue;
    }
    if (r === 5 || r === 9) {
      put(x, y, z, "smooth_stone");                           // sill / lintel band
      continue;
    }
    if (r === 10) {
      put(x, y, z, "white_concrete");                         // parapet cap
      continue;
    }

    if (front && r <= 4) {
      // Shopfront: piers, glass, central door, transom.
      if (r === 4) { put(x, y, z, "white_concrete"); continue; }
      if (pier) { put(x, y, z, "white_concrete"); continue; }
      if (x === xmid && r <= 2) {
        put(x, y, z, "birch_door", {
          facing: "north", half: r === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      put(x, y, z, "glass");
      continue;
    }

    if (r <= 4) {
      // Non-street ground floor: plain walls with a few windows.
      if (!pier && (r === 2 || r === 3)) {
        put(x, y, z, "glass_pane", pane(missN, missS));
      } else {
        put(x, y, z, "white_concrete");
      }
      continue;
    }

    // Upper storey (r 6..8): glazed bays between piers.
    if (r >= 6 && r <= 8 && !pier) {
      put(x, y, z, "glass_pane", pane(missN, missS));
      if (r === 7 && inward && bay % 3 === 0) put(inX, gr + 7, inZ, "glowstone");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Roof level (r 11): parapet is already at r 10 on the shell; interior roof
  // deck at r 10 carries plant boxes on a few interior cells.
  if (!exterior && (x % 7 === 3) && (z % 5 === 2)) {
    put(x, gr + 11, z, "light_gray_concrete");
    if (has(x + 1, z) && !has(x + 1, z - 1) === false) put(x + 1, gr + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
