import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466767";
const W = 30, H = 38, D = 43;

// Record: roof ~26 above lowest ground; ~5 storeys of 5 blocks; 1990s-2000s
// Taipei commercial/office block: white-tile piers, glass bands, stepped top tier,
// plant penthouse and a mast.
const STOREY = 5;
const ROOF_Y = 25;      // roof deck
const PARAPET_Y = 26;   // parapet on roof edge
const TIER_Y = 20;      // setback tier starts (storey 4)
const TIER_INSET = 3;   // setback depth in cells

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Set();
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || z < 0 || x >= W || z >= D) continue;
  const k = key(x, z);
  fp.add(k);
  ground.set(k, Math.max(0, Math.min(H - 1, Math.round(gr))));
}

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the outer boundary of the footprint (boundary cells = 1).
const dist = new Map();
const queue = [];
for (const k of fp) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !fp.has(key(x + dx, z + dz)))) {
    dist.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (fp.has(nk) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}

// A cell exists at height y if it is in the footprint and, from the setback
// height upward, sits at least TIER_INSET cells in from the outer edge.
const inSet = (x, z, y) => {
  const k = key(x, z);
  if (!fp.has(k)) return false;
  const need = y >= TIER_Y ? TIER_INSET : 0;
  return dist.get(k) >= need;
};

const isEdge = (x, z, y) =>
  inSet(x, z, y) && NB.some(([dx, dz]) => !inSet(x + dx, z + dz, y));

const isCorner = (x, z, y) =>
  (!inSet(x - 1, z, y) || !inSet(x + 1, z, y)) &&
  (!inSet(x, z - 1, y) || !inSet(x, z + 1, y));

// Inward direction from an edge cell (toward the building interior).
const inward = (x, z, y) => {
  if (!inSet(x - 1, z, y)) return [1, 0];
  if (!inSet(x + 1, z, y)) return [-1, 0];
  if (!inSet(x, z - 1, y)) return [0, 1];
  if (!inSet(x, z + 1, y)) return [0, -1];
  return null;
};

// Pending writes: key "x,y,z" -> [id, props] (id null = air). Later writes win.
const writes = new Map();
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  writes.set(`${x},${y},${z}`, [id, props]);
};

const hash = (x, z, s) => (x * 31 + z * 17 + s * 7) % 7;

// Foundation: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Building shell.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = gr; y <= PARAPET_Y; y++) {
    const ins = inSet(x, z, y);

    if (!ins) {
      // Terrace deck where the setback tier steps back.
      if (y === TIER_Y && dist.get(k) < TIER_INSET) put(x, y, z, "gray_concrete");
      continue;
    }

    const edge = isEdge(x, z, y);
    const s = Math.floor(y / STOREY);
    const o = y % STOREY;
    const isFloor = y === gr || (y < ROOF_Y && o === 0);

    if (isFloor) {
      put(x, y, z, edge && o === 0 ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    if (y === ROOF_Y) {
      put(x, y, z, edge ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }

    if (y === PARAPET_Y) {
      if (edge) put(x, y, z, "quartz_block");
      continue;
    }

    if (!edge) continue; // interior air gap

    if (o === 4) {
      put(x, y, z, "light_gray_concrete"); // spandrel band
      continue;
    }

    // o in 1..3: window zone with piers.
    const pier = (x + z) % 3 === 0 || isCorner(x, z, y);
    if (pier) {
      put(x, y, z, s === 0 ? "smooth_stone" : "white_concrete");
    } else {
      const id = s >= 4 ? "cyan_stained_glass" : "light_blue_stained_glass";
      put(x, y, z, id);
      // Warm light behind some glass.
      if (o === 2 && hash(x, z, s) === 0) {
        const d = inward(x, z, y);
        if (d) {
          const ix = x + d[0], iz = z + d[1];
          if (inSet(ix, iz, y) && !isEdge(ix, iz, y)) put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Ground-floor entrance on the street-facing (lowest z) edge, near centre.
{
  let best = null;
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    if (!isEdge(x, z, gr + 1)) continue;
    const score = [z, Math.abs(x - Math.floor(W / 2))];
    if (!best || score[0] < best.score[0] ||
        (score[0] === best.score[0] && score[1] < best.score[1])) {
      best = { x, z, gr, score };
    }
  }
  if (best) {
    put(best.x, best.gr, best.z, null);
    put(best.x, best.gr + 1, best.z, null);
    const d = inward(best.x, best.z, best.gr + 1);
    if (d && inSet(best.x + d[0], best.z + d[1], best.gr + 1)) {
      put(best.x + d[0], best.gr + 1, best.z + d[1], "lantern", { hanging: "false" });
    }
  }
}

// Plant penthouse on the roof, centred and set back from the edges.
const px0 = Math.round(W * 0.3), px1 = Math.round(W * 0.7);
const pz0 = Math.round(D * 0.35), pz1 = Math.round(D * 0.65);
const penthouse = (x, z) =>
  x >= px0 && x < px1 && z >= pz0 && z < pz1 &&
  inSet(x, z, ROOF_Y) && (dist.get(key(x, z)) ?? 0) >= 5;

for (let x = px0; x < px1; x++) {
  for (let z = pz0; z < pz1; z++) {
    if (!penthouse(x, z)) continue;
    const ring = x === px0 || x === px1 - 1 || z === pz0 || z === pz1 - 1;
    const corner = (x === px0 || x === px1 - 1) && (z === pz0 || z === pz1 - 1);
    for (let y = PARAPET_Y; y <= 28; y++) {
      if (!ring) { put(x, y, z, null); continue; }
      if (y === 27 && !corner && (x + z) % 3 !== 0) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, 29, z, "smooth_quartz");
  }
}

// Mast on the penthouse roof.
{
  const cx = Math.floor((px0 + px1) / 2), cz = Math.floor((pz0 + pz1) / 2);
  if (penthouse(cx, cz)) {
    for (let y = 30; y <= 34; y++) put(cx, y, cz, "lightning_rod");
  }
}

// Flush to the volume.
for (const [k, [id, props]] of writes) {
  const [x, y, z] = k.split(",").map(Number);
  if (id === null) {
    g.set(x, y, z, "air");
  } else if (props) {
    g.set(x, y, z, id, props);
  } else {
    g.set(x, y, z, id);
  }
}

g.save(`${DIR}/${ID}.nbt`);
