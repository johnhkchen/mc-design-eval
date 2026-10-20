import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541865179";
const W = 15, H = 23, D = 26;

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const [x, z, gy] of list) ground.set(`${x},${z}`, gy);

const keys = [...ground.keys()].map((k) => k.split(",").map(Number));
const inFp = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);

// Levels (absolute y). Two storeys of 5 blocks, roof deck, parapet.
const L0 = Math.min(...ground.values());
const S1 = L0 + 5;          // second-storey floor line
const DECK = L0 + 10;       // roof deck (top block)
const PAR = L0 + 11;        // parapet / coping course

const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
const faces = (x, z) => Object.keys(DIRS).filter((f) => !inFp(x + DIRS[f][0], z + DIRS[f][1]));

const pilaster = (x, z, fs) =>
  fs.length > 1 || ((fs[0] === "N" || fs[0] === "S") ? x % 3 === 0 : z % 3 === 0);

// Front entrance on the lowest-z (north) face, nearest the middle.
const minZ = Math.min(...keys.map(([, z]) => z));
const cx = (Math.min(...keys.map(([x]) => x)) + Math.max(...keys.map(([x]) => x))) / 2;
let front = keys.filter(([x, z]) => z === minZ && faces(x, z).includes("N"));
if (!front.length) front = keys.filter(([x, z]) => faces(x, z).includes("N"));
const doorCell = front.reduce((a, b) => (Math.abs(b[0] - cx) < Math.abs(a[0] - cx) ? b : a));
const doorKey = `${doorCell[0]},${doorCell[1]}`;
const canopy = new Set(
  front
    .filter(([x, z]) => z === doorCell[1] && Math.abs(x - doorCell[0]) <= 1)
    .map(([x, z]) => `${x},${z}`)
);

// Warm lights set in the interior cell behind some windows.
const lights = new Set();
for (const [x, z] of keys) {
  const fs = faces(x, z);
  if (!fs.length || pilaster(x, z, fs)) continue;
  const f = fs[0];
  const [dx, dz] = DIRS[f];
  const along = f === "N" || f === "S" ? x : z;
  if (along % 4 !== 1) continue;
  const gc = gOf(x, z);
  const ix = x - dx, iz = z - dz;
  if (!inFp(ix, iz) || faces(ix, iz).length) continue;
  const yMs = [S1 + 2];
  if (gc + 2 <= S1 - 2) yMs.push(gc + 2);
  for (const yM of yMs) lights.add(`${ix},${yM},${iz}`);
}

function edgeBlock(x, z, gc, y, fs) {
  if (y === gc) return ["polished_andesite"];                       // base course
  if (y === PAR) return ["smooth_stone_slab", { type: "top", waterlogged: "false" }]; // coping
  if (y === DECK) return ["smooth_stone"];                          // cornice
  if (y === S1) return ["light_gray_concrete"];                     // storey line
  if (y === S1 - 1) return ["gray_concrete"];                       // shopfront sign band
  if (y === DECK - 1) return ["white_concrete"];                    // upper lintel
  const ground = y < S1;
  const glass = ground ? (y > gc && y <= S1 - 2) : (y >= S1 + 1 && y <= DECK - 2);
  if (!glass) return ["white_concrete"];
  if (pilaster(x, z, fs)) return ["white_concrete"];
  const f = fs[0];
  const ns = f === "N" || f === "S";
  const c = ns
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  return ["light_blue_stained_glass_pane", { ...c, waterlogged: "false" }];
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

for (const [x, z] of keys) {
  const gc = gOf(x, z);
  const fs = faces(x, z);
  const edge = fs.length > 0;
  const key = `${x},${z}`;

  // Foundation under every cell, up to its own ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  if (!edge) {
    for (let y = gc; y <= DECK; y++) {
      if (y === gc || y === S1) put(x, y, z, "smooth_stone");   // floor slabs
      if (y === DECK) put(x, y, z, "gray_concrete");            // roof membrane
      if (lights.has(`${x},${y},${z}`)) put(x, y, z, "glowstone");
    }
    // Rooftop AC plant on a sparse grid of interior cells.
    if (x % 5 === 2 && z % 6 === 3) put(x, PAR, z, "iron_block");
  } else {
    for (let y = gc; y <= PAR; y++) {
      if (key === doorKey && (y === gc + 1 || y === gc + 2)) {
        const upper = y === gc + 2;
        put(x, y, z, "dark_oak_door", {
          facing: "north",
          half: upper ? "upper" : "lower",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (canopy.has(key) && y === gc + 3) {
        put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      } else {
        const [id, props] = edgeBlock(x, z, gc, y, fs);
        put(x, y, z, id, props);
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
