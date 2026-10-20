import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540300021";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 21;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const inFp = (x, z) => ground.has(key(x, z));

// Lowest ground under the footprint is y 0 of the record.
const L = Math.min(...ground.values());
const FLOOR2 = L + 5;   // second-storey floor line
const ROOF = L + 10;    // roof surface course
const PAR = L + 11;     // parapet top
const TOP = PAR + 1;    // corner lanterns

const DIRS = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const faceList = (x, z) => DIRS.filter(([, dx, dz]) => !inFp(x + dx, z + dz));

// Facade groups: each single-face cell belongs to a run along one face.
const groups = new Map();
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  const faces = faceList(x, z);
  if (faces.length !== 1) continue;
  const [n, dx, dz] = faces[0];
  const line = dz !== 0 ? z : x;
  const t = dz !== 0 ? x : z;
  const gk = `${n}:${line}`;
  if (!groups.has(gk)) groups.set(gk, []);
  groups.get(gk).push(t);
}

// One entrance per long facade run, at its middle cell.
const entrances = new Set();
for (const [gk, arr] of groups) {
  if (arr.length < 5) continue;
  arr.sort((a, b) => a - b);
  entrances.add(`${gk}:${arr[Math.floor(arr.length / 2)]}`);
}

// Pass 1: foundations, ground floor slabs, second-floor slabs, roof slabs.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");
  if (FLOOR2 > gr) put(x, FLOOR2, z, "smooth_stone");
  if (ROOF > gr) put(x, ROOF, z, "light_gray_concrete");
}

// Pass 2: facades on footprint edge cells.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  const faces = faceList(x, z);
  if (faces.length === 0) continue;

  const corner = faces.length >= 2;
  if (corner) {
    for (let y = gr; y <= PAR; y++) {
      if (y === gr) put(x, y, z, "polished_granite");
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, TOP, z, "lantern", { hanging: "false" });
    continue;
  }

  const [n, dx, dz] = faces[0];
  const line = dz !== 0 ? z : x;
  const t = dz !== 0 ? x : z;
  const gk = `${n}:${line}`;
  const isEnt = entrances.has(`${gk}:${t}`);
  const pillar = t % 3 === 0;

  for (let y = gr; y <= PAR; y++) {
    if (y === gr) { put(x, y, z, "polished_granite"); continue; }
    if (y === PAR) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }

    if (y <= L + 4) {
      // Shopfront storey.
      if (isEnt) {
        if (y <= gr + 2) continue;               // doorway opening
        if (y === gr + 3) { put(x, y, z, "light_gray_concrete"); continue; }
      }
      if (y === L + 4) { put(x, y, z, "smooth_quartz"); continue; }
      if (pillar) put(x, y, z, "light_gray_concrete");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    if (y === FLOOR2) { put(x, y, z, "light_gray_concrete"); continue; }

    if (y >= L + 6 && y <= L + 9) {
      // Upper storey: piers, spandrels, and window glass.
      if (pillar) put(x, y, z, "light_gray_concrete");
      else if (y >= L + 7) put(x, y, z, "cyan_stained_glass");
      else put(x, y, z, "white_concrete");
      continue;
    }

    put(x, y, z, "white_concrete");
  }
}

// Pass 3: warm lights set in the air gap behind some glass.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  const faces = faceList(x, z);
  if (faces.length !== 1) continue;
  const [n, dx, dz] = faces[0];
  const line = dz !== 0 ? z : x;
  const t = dz !== 0 ? x : z;
  const gk = `${n}:${line}`;
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || faceList(ix, iz).length !== 0) continue;
  const igr = ground.get(key(ix, iz));

  if (t % 3 !== 0 && t % 6 === 1) put(ix, L + 8, iz, "shroomlight");
  if (!entrances.has(`${gk}:${t}`) && t % 6 === 4) {
    put(ix, igr + 1, iz, "lantern", { hanging: "false" });
  }
}

// Pass 4: roof plant on the deeper interior, a few pads and a stack.
for (const [key0, gr] of ground) {
  const [x, z] = key0.split(",").map(Number);
  if (faceList(x, z).length !== 0) continue;
  let deep = true;
  for (let a = -2; a <= 2 && deep; a++)
    for (let b = -2; b <= 2; b++)
      if (!inFp(x + a, z + b)) { deep = false; break; }
  if (!deep) continue;
  if (x % 5 === 2 && z % 4 === 1) {
    put(x, ROOF + 1, z, "gray_concrete");
    put(x, ROOF + 2, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
