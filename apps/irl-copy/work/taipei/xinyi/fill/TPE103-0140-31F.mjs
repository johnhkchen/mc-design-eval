import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE103-0140-31F";
const W = 56, H = 190, D = 38;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const e of raw) {
  const [x, z, gr] = Array.isArray(e) ? e : [e.x, e.z, e.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, gr | 0)));
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

// Tiers: absolute heights (storeys of 5 blocks), nested insets of the footprint bbox.
const TIERS = [
  { lo: 0,   hi: 25,  k: 0,  kind: "podium" },
  { lo: 25,  hi: 110, k: 4,  kind: "tower" },
  { lo: 110, hi: 150, k: 9,  kind: "tower" },
  { lo: 150, hi: 178, k: 13, kind: "crown" },
];

const inT = (t, x, z) => {
  if (!ground.has(`${x},${z}`)) return false;
  return x >= minX + t.k && x <= maxX - t.k && z >= minZ + t.k && z <= maxZ - t.k;
};

// Foundation: solid from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

function facade(t, x, y, z, idx) {
  const rel = y % 5;
  const frame =
    t.kind === "podium" ? "light_gray_concrete" :
    t.kind === "crown" ? "gray_concrete" : "white_concrete";
  if (rel === 4) { put(x, y, z, frame); return; }          // spandrel / storey line
  if (idx % 4 === 0) { put(x, y, z, frame); return; }      // mullion grid
  if (t.kind === "crown") {
    put(x, y, z, rel === 2 ? "light_blue_stained_glass" : "gray_concrete");
    return;
  }
  put(x, y, z, "light_blue_stained_glass");
  // warm light behind some glass
  if (rel === 2 && idx % 8 === 4) {
    let dx = 0, dz = 0;
    if (!inT(t, x - 1, z)) dx = 1;
    else if (!inT(t, x + 1, z)) dx = -1;
    else if (!inT(t, x, z - 1)) dz = 1;
    else dz = -1;
    if (inT(t, x + 2 * dx, z + 2 * dz)) put(x + dx, y, z + dz, "glowstone");
  }
}

// Build each tier.
TIERS.forEach((t, ti) => {
  const next = TIERS[ti + 1];
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (!inT(t, x, z)) continue;
    const gr = ground.get(key);
    const start = Math.max(t.lo, gr);
    if (start >= t.hi) continue;
    const perim = !inT(t, x - 1, z) || !inT(t, x + 1, z) || !inT(t, x, z - 1) || !inT(t, x, z + 1);
    const zFace = !inT(t, x, z - 1) || !inT(t, x, z + 1);
    const idx = zFace ? x : z;

    for (let y = start; y < t.hi; y++) {
      if (y === t.hi - 1) {
        put(x, y, z, "gray_concrete");                      // roof slab
      } else if (y % 5 === 0 || y === start) {
        put(x, y, z, "white_concrete");                     // floor slab
      } else if (perim) {
        facade(t, x, y, z, idx);
      }
      // interior stays air: no interiors
    }

    // Parapet / cornice on exposed roof ring (or the perimeter for the top tier).
    const exposed = next ? !inT(next, x, z) : perim;
    if (exposed) {
      put(x, t.hi, z, "light_gray_concrete");
      put(x, t.hi + 1, z, "light_gray_concrete");
    }
  }
});

// Entrance on the north face (minZ), centred on the footprint cells there.
{
  const t0 = TIERS[0];
  const xs = [];
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (z === minZ && inT(t0, x, z)) xs.push(x);
  }
  if (xs.length) {
    const mid = (minX + maxX) / 2;
    const cx = xs.reduce((a, b) => (Math.abs(b - mid) < Math.abs(a - mid) ? b : a));
    const gr = ground.get(`${cx},${minZ}`);
    const yd = gr + 1;
    if (yd + 2 < t0.hi) {
      const doorProps = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
      put(cx, yd, minZ, "dark_oak_door", doorProps("lower"));
      put(cx, yd + 1, minZ, "dark_oak_door", doorProps("upper"));
      for (const dx of [-2, -1, 1, 2]) {
        if (inT(t0, cx + dx, minZ)) {
          for (let y = yd; y <= yd + 2; y++) {
            if (Math.abs(dx) === 2) put(cx + dx, y, minZ, "light_gray_concrete");
          }
        }
      }
      for (let dx = -2; dx <= 2; dx++) {
        if (inT(t0, cx + dx, minZ)) put(cx + dx, yd + 2, minZ, "light_gray_concrete"); // canopy lintel
      }
    }
  }
}

// Roof mast on the crown centre.
{
  const crown = TIERS[3];
  const cx = Math.round((minX + maxX) / 2);
  const cz = Math.round((minZ + maxZ) / 2);
  if (inT(crown, cx, cz)) {
    for (let y = 178; y <= 185; y++) put(cx, y, cz, "iron_bars");
    put(cx, 186, cz, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
