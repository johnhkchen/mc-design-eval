import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499501";
const W = 50, H = 22, D = 70;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const key = (x, z) => x + "," + z;
const raw = new Map();
for (const [x, z, gr, roof] of cells) raw.set(key(x, z), { x, z, g0: gr, r: roof });

// smooth roof heights into flat tiers (5x5 neighbourhood mean)
const info = new Map();
for (const c of raw.values()) {
  let sum = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++) {
      const o = raw.get(key(c.x + dx, c.z + dz));
      if (o) { sum += o.r; n++; }
    }
  const R = Math.min(H - 2, Math.round(sum / n));
  info.set(key(c.x, c.z), { x: c.x, z: c.z, g0: c.g0, R, d: Infinity });
}

// edge distance (0 = facade cell with a neighbour outside the footprint)
const q = [];
for (const c of info.values()) {
  const outside = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dz]) => !info.has(key(c.x + dx, c.z + dz)));
  if (outside) { c.d = 0; q.push(c); }
}
for (let i = 0; i < q.length; i++) {
  const c = q[i];
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const o = info.get(key(c.x + dx, c.z + dz));
    if (o && o.d > c.d + 1) { o.d = c.d + 1; q.push(o); }
  }
}
for (const c of info.values()) if (c.d === Infinity) c.d = 0;

// per-cell massing: eave height and roof top
for (const c of info.values()) {
  const rise = Math.min(4, Math.max(0, c.R - c.g0 - 5));
  c.rise = rise;
  c.eave = Math.max(c.g0 + 3, c.R - 1 - rise);
  c.top = Math.min(H - 2, c.eave + Math.min(c.d, rise));
}

// front door: facade cells on the largest-z edge, middle of that run
const facade = [...info.values()].filter(c => c.d === 0);
let door = null;
if (facade.length) {
  const maxZ = Math.max(...facade.map(c => c.z));
  const front = facade.filter(c => c.z === maxZ).sort((a, b) => a.x - b.x);
  if (front.length) door = front[Math.floor(front.length / 2)];
}
const isDoor = c => door && c.x === door.x && c.z === door.z;
const nearDoor = c => door && c.z === door.z && Math.abs(c.x - door.x) <= 1 && !isDoor(c);

// 1. foundations and envelope
for (const c of info.values()) {
  const { x, z, g0, eave, top, d } = c;
  for (let y = 0; y <= g0; y++) put(x, y, z, "stone");

  if (d === 0) {
    for (let y = g0 + 1; y <= eave; y++) {
      put(x, y, z, y === g0 + 1 ? "polished_andesite" : "stone_bricks");
    }
    if (isDoor(c)) {
      // door with a surround: lintel and lantern above, dark frame either side
      put(x, g0 + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, g0 + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      if (g0 + 3 <= eave) put(x, g0 + 3, z, "lantern", { hanging: "false", waterlogged: "false" });
    } else if (nearDoor(c)) {
      // stone-brick plinth and jambs framing the entrance
      put(x, g0 + 1, z, "stone_bricks");
      put(x, g0 + 2, z, "stone_bricks");
    } else if ((x + z) % 4 === 1) {
      for (let y = g0 + 2; y <= eave - 1; y++) {
        put(x, y, z, "glass_pane", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      }
    }
    if (eave + 1 < H) put(x, eave + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    // d=1 ring stays an air gap behind the facade; solid mass deeper in
    const startY = d === 1 ? eave : g0 + 1;
    for (let y = startY; y <= top; y++) {
      put(x, y, z, y <= eave ? "stone_bricks" : "deepslate_tiles");
    }
  }
  if (d === 0 && top > eave) {
    for (let y = eave + 1; y <= top; y++) put(x, y, z, "deepslate_tiles");
  }
}

// 2. skylights on the roof plateau (only where solid mass lies below)
for (const c of info.values()) {
  if (c.d < 3) continue;
  if (c.x % 7 !== 3 || c.z % 7 !== 3) continue;
  put(c.x, c.top, c.z, "glass");
}

// 3. warm light in the air gap behind some windows
for (const c of info.values()) {
  if (c.d !== 0 || isDoor(c) || nearDoor(c) || (c.x + c.z) % 4 !== 1) continue;
  if ((c.x * 7 + c.z * 3) % 5 !== 0) continue;
  for (const [dx, dz] of [[1,0],[-1,0],[0,1],[0,-1]]) {
    const n = info.get(key(c.x + dx, c.z + dz));
    if (n && n.d === 1) {
      put(n.x, c.g0 + 2, n.z, "glowstone");
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
