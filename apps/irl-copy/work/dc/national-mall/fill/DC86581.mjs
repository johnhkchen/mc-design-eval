import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86581.cells.json`, "utf8"));

const W = 15, H = 31, D = 13;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, g: Math.max(0, Math.round(gr)), r: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
const exterior = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

let minZ = Infinity;
for (const c of map.values()) minZ = Math.min(minZ, c.z);
const frontXs = [...map.values()].filter((c) => c.z === minZ).map((c) => c.x).sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;

// Massing: 3-block storeys quantised from lidar roof, cap = parapet/roof level
const massing = new Map();
let capMax = 0;
for (const c of map.values()) {
  const base = c.g;
  let n = Math.max(1, Math.round((c.r - base - 1) / 3));
  while (base + 3 * n >= H - 5 && n > 1) n--;
  const cap = base + 3 * n;
  massing.set(key(c.x, c.z), { ...c, n, cap });
  capMax = Math.max(capMax, cap);
}

for (const c of massing.values()) {
  const { x, z, g: base, n, cap } = c;
  const ext = exterior(x, z);
  const corner = isCorner(x, z);

  // Foundation / plinth
  for (let y = 0; y < base; y++) {
    g.set(x, y, z, ext ? "polished_andesite" : "stone_bricks");
  }

  // Floor slab at each storey base
  for (let k = 0; k < n; k++) {
    g.set(x, base + 3 * k, z, "light_gray_concrete");
  }

  // Roof slab / cornice
  g.set(x, cap, z, ext ? "smooth_quartz" : "light_gray_concrete");

  if (!ext) continue;

  const onNS = z === 0 || z === D - 1;
  const u = onNS ? x : z;

  for (let k = 0; k < n; k++) {
    for (let off = 0; off < 3; off++) {
      const y = base + 3 * k + off;
      const pier = corner || u % 3 === 0;
      let id;
      if (off === 0) {
        id = k === 0 ? "polished_andesite" : "stone_bricks";  // base course / storey band
      } else if (pier) {
        id = "smooth_quartz";                                   // precast piers
      } else {
        id = "light_blue_stained_glass";                        // glazing
      }
      g.set(x, y, z, id);
    }
  }

  // Sparse warm lights set behind some upper-floor windows
  const isWindow = !(corner || u % 3 === 0);
  if (isWindow && k0ok(n)) {
    let dx = 0, dz = 0;
    if (z === 0) dz = 1;
    else if (z === D - 1) dz = -1;
    else if (x === 0) dx = 1;
    else if (x === W - 1) dx = -1;
    const ix = x + dx, iz = z + dz;
    for (let k = 1; k < n; k++) {
      if (((u + k) % 5 === 0) && has(ix, iz) && !exterior(ix, iz)) {
        g.set(ix, base + 3 * k + 1, iz, "glowstone");
      }
    }
  }
}
function k0ok(n) { return n >= 2; }

// Entrance on the front face: doors, lintel, and a small canopy
{
  const c = massing.get(key(entranceX, minZ));
  if (c) {
    const { x, z, g: base } = c;
    g.set(x, base, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, base + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, base + 2, z, "polished_andesite");
  }
}

// Single setback penthouse core on the highest tier, instead of scattered blocks
for (const c of massing.values()) {
  const { x, z, cap } = c;
  if (cap !== capMax) continue;
  const inner = x >= 3 && x <= W - 4 && z >= 3 && z <= D - 4;
  if (!inner) continue;
  for (let dy = 1; dy <= 3; dy++) {
    const y = cap + dy;
    if (y >= H) continue;
    const edge = x === 3 || x === W - 4 || z === 3 || z === D - 4;
    if (dy === 3) g.set(x, y, z, "gray_concrete");              // penthouse roof
    else if (edge) g.set(x, y, z, dy === 1 ? "stone_bricks" : "light_blue_stained_glass");
    else g.set(x, y, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC86581.nbt`);
