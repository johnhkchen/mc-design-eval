import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343777";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 7;
const TOP = 11;               // parapet top, about 11 blocks above lowest ground
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gy] of raw) gmap.set(`${x},${z}`, Math.round(gy));
const has = (x, z) => gmap.has(`${x},${z}`);
const groundOf = (x, z) => gmap.get(`${x},${z}`);

const PANE_EW = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_NS = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// exterior test: any side open to air
const isExt = (x, z) =>
  !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// face classification: long faces (north/south, u = x), end faces (east/west, u = z)
const faceOf = (x, z) => {
  const missN = !has(x, z - 1), missS = !has(x, z + 1);
  const missW = !has(x - 1, z), missE = !has(x + 1, z);
  if (missN || missS) return { type: "long", u: x, pane: PANE_EW, missN, missS };
  if (missW || missE) return { type: "end", u: z, pane: PANE_NS, missW, missE };
  return null;
};

// Pass 1: columns, storeys, facades
for (const [x, z] of [...gmap.keys()].map(k => k.split(",").map(Number))) {
  const gr = groundOf(x, z);
  const ext = isExt(x, z);
  const face = ext ? faceOf(x, z) : null;

  // foundation fill from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP; y++) {
    if (!ext) {
      // interior: floor slabs per storey and roof deck; air otherwise
      if (y === gr || y === 5 || y === 10) put(x, y, z, "smooth_stone");
      if (y === TOP && z === 3 && x % 8 === 4) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const u = face ? face.u : x;
    let isWin = false;
    if (face) {
      if (face.type === "long") isWin = [1, 2].includes(u % 4);
      else isWin = u >= 1 && u <= 5 && [1, 2].includes(u % 4);
    }

    if (y === TOP) { put(x, y, z, "white_concrete"); continue; }        // parapet
    if (y === 10) { put(x, y, z, "stone_bricks"); continue; }          // cornice course
    if (y === 9 || y === 6 || y === 5 || y === 4) {                    // lintels, sills, string courses
      put(x, y, z, "smooth_quartz"); continue;
    }
    if (y === gr && gr <= 4) { put(x, y, z, "polished_andesite"); continue; } // base course

    const inGroundStorey = y > gr && y <= 3;
    const inUpperStorey = y === 7 || y === 8;
    if (inGroundStorey || inUpperStorey) {
      if (isWin && face) { put(x, y, z, "glass_pane", face.pane); continue; }
      put(x, y, z, u % 4 === 0 ? "stone_bricks" : "white_concrete");
      continue;
    }
    // any other exterior wall row
    put(x, y, z, u % 4 === 0 ? "stone_bricks" : "white_concrete");
  }
}

// Pass 2: entrance on the street face (z = 0), with a dark door
for (const [x, z] of [...gmap.keys()].map(k => k.split(",").map(Number))) {
  if (z !== 0 || x !== 13 || has(x, z - 1)) continue;
  const gr = groundOf(x, z);
  if (gr > 3) continue;
  const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  put(x, gr, z, "dark_oak_door", door("lower"));
  put(x, gr + 1, z, "dark_oak_door", door("upper"));
  put(x, gr + 2, z, "smooth_quartz");   // door head
}

// Pass 3: warm lights set behind some windows (interior air cell next to the glass)
for (const [x, z] of [...gmap.keys()].map(k => k.split(",").map(Number))) {
  if (!isExt(x, z)) continue;
  const face = faceOf(x, z);
  if (!face) continue;
  const gr = groundOf(x, z);
  const u = face.u;
  let win = face.type === "long" ? [1, 2].includes(u % 4)
    : (u >= 1 && u <= 5 && [1, 2].includes(u % 4));
  if (!win) continue;

  let ix = x, iz = z;
  if (face.type === "long") iz = face.missN ? z + 1 : z - 1;
  else ix = face.missW ? x + 1 : x - 1;
  if (!has(ix, iz) || isExt(ix, iz)) continue;

  if (u % 8 === 1) put(ix, 7, iz, "glowstone");        // upper storey, behind glass
  if (u % 8 === 5 && gr + 1 <= 3) put(ix, gr + 1, iz, "shroomlight"); // ground storey shopfront
}

g.save(`${DIR}/${ID}.nbt`);
