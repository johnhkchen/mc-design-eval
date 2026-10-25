import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499497";
const W = 55, H = 29, D = 57;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, rf] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) cell.set(key(x, z), { x, z, g: Math.round(gr), r: rf });
}
const has = (x, z) => cell.has(key(x, z));
const isRing = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));

const NORM = { S: [0, 1], N: [0, -1], E: [1, 0], W: [-1, 0] };
const FACING = { S: "south", N: "north", E: "east", W: "west" };
function faceOf(x, z) {
  if (!has(x, z + 1)) return "S";
  if (!has(x, z - 1)) return "N";
  if (!has(x + 1, z)) return "E";
  if (!has(x - 1, z)) return "W";
  return null;
}
const faceIdx = (f, x, z) => (f === "S" || f === "N" ? x : z);

// smooth roof into flat tiers; parapet sits 2 blocks above the deck
const top = new Map();
for (const c of cell.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const c2 = cell.get(key(c.x + dx, c.z + dz));
    if (c2) { sum += c2.r; n++; }
  }
  const avg = sum / n;
  top.set(key(c.x, c.z), Math.min(26, Math.max(c.g + 12, Math.round(avg) - 2)));
}

// entrance: middle of the first face (S, N, E, W) that has ring cells
const doorFace = ["S", "N", "E", "W"].find(f =>
  [...cell.values()].some(c => isRing(c.x, c.z) && faceOf(c.x, c.z) === f));
let doorKey = null, doorIdx = null;
if (doorFace) {
  const ringOnFace = [...cell.values()].filter(c => isRing(c.x, c.z) && faceOf(c.x, c.z) === doorFace);
  const idxs = ringOnFace.map(c => faceIdx(doorFace, c.x, c.z)).sort((a, b) => a - b);
  doorIdx = idxs[Math.floor(idxs.length / 2)];
  const hit = ringOnFace.find(c => faceIdx(doorFace, c.x, c.z) === doorIdx);
  if (hit) doorKey = key(hit.x, hit.z);
}

const g = new Voxels([W, H, D]);
const S = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};
const paneNS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneEW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const hash = (x, z, k) => (x * 31 + z * 17 + k * 7) % 5;

for (const c of cell.values()) {
  const { x, z, g: gr } = c;
  const t = top.get(key(x, z));
  const ring = isRing(x, z);

  // foundation
  for (let y = 0; y < gr; y++) S(x, y, z, "stone");

  if (!ring) {
    // interior: floors and roof deck only; air between (no interiors)
    S(x, gr, z, "smooth_stone");
    for (const f of [gr + 5, gr + 10]) if (f < t) S(x, f, z, "smooth_stone");
    S(x, t, z, "smooth_stone");
    // rooftop plant block
    if (x >= 20 && x <= 33 && z >= 22 && z <= 35) {
      S(x, t + 1, z, "light_gray_concrete");
      S(x, t + 2, z, "light_gray_concrete");
    }
    continue;
  }

  const face = faceOf(x, z);
  const idx = faceIdx(face, x, z);
  const pane = (face === "S" || face === "N") ? paneNS : paneEW;
  const [nx, nz] = NORM[face];
  const isDoor = doorKey === key(x, z);
  const nearDoor = doorFace === face && doorIdx !== null && Math.abs(idx - doorIdx) === 1;
  const isPier = idx % 3 === 0;

  // facade: solid from base to roof
  S(x, gr, z, "polished_granite");
  for (let y = gr + 1; y <= t; y++) {
    S(x, y, z, isPier ? "quartz_pillar" : "smooth_quartz", isPier ? { axis: "y" } : undefined);
  }
  // ground-floor fascia band
  S(x, gr + 4, z, "red_concrete");
  // parapet and cornice
  S(x, t + 1, z, "smooth_quartz");
  S(x, t + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });

  // windows in bays that are not piers
  if (!isPier) {
    const rowsFor = (k) => (k === 1 ? [gr + 1, gr + 2, gr + 3] : [gr + 5 * (k - 1) + 2, gr + 5 * (k - 1) + 3]);
    for (let k = 1; k <= 3; k++) {
      const f = gr + 5 * (k - 1);
      for (const y of rowsFor(k)) S(x, y, z, "glass_pane", pane);
      // warm light on the floor behind some windows
      const ix = x - nx, iz = z - nz;
      if (has(ix, iz) && !isRing(ix, iz) && hash(x, z, k) === 0) {
        S(ix, f + 1, iz, "glowstone");
      }
    }
  }

  // entrance surround: granite jambs beside the door
  if (nearDoor) {
    for (let y = gr + 1; y <= gr + 3; y++) S(x, y, z, "polished_granite");
  }

  // entrance door, two blocks tall, glass transom above
  if (isDoor) {
    const facing = FACING[face];
    S(x, gr + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 3, z, "glass_pane", pane);
  }
}

g.save(`${DIR}/${ID}.nbt`);
