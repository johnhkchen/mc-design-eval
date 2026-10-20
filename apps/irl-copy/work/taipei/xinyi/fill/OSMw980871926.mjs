import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871926.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw980871926.nbt";
const W = 39, D = 44, H = 124;
const ROOF = 112; // top surface of the main roof, relative to lowest ground

const raw = JSON.parse(readFileSync(CELLS, "utf8"));
const key = (x, z) => `${x},${z}`;
const parse = (k) => k.split(",").map(Number);
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.max(0, Math.round(gr)));
}
const inFoot = (x, z) => ground.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from the footprint edge (edge cells = 1), for setbacks and facades.
const depth = new Map();
const queue = [];
for (const [k] of ground) {
  const [x, z] = parse(k);
  if (NB.some(([dx, dz]) => !inFoot(x + dx, z + dz))) {
    depth.set(k, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const nk = key(nx, nz);
    if (inFoot(nx, nz) && !depth.has(nk)) {
      depth.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dep = (x, z) => depth.get(key(x, z)) ?? 0;
const maxD = Math.max(1, ...depth.values());

// Era: late-1990s/2000s Xinyi office tower. Glazed podium, stepped glass tower,
// white concrete frame, mechanical crown. Setbacks scale with footprint depth.
const TIERS = [
  { base: null, top: 20, k: 0, glass: "light_blue_stained_glass" },
  { base: 20, top: 60, k: Math.round(0.25 * maxD), glass: "cyan_stained_glass" },
  { base: 60, top: 90, k: Math.round(0.5 * maxD), glass: "cyan_stained_glass" },
  { base: 90, top: ROOF, k: Math.round(0.7 * maxD), glass: "cyan_stained_glass" },
];

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

// Foundation: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = parse(k);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// Entrance: middle of the south (z+1) edge of the podium.
const southXs = [];
for (const [k] of ground) {
  const [x, z] = parse(k);
  if (!inFoot(x, z + 1)) southXs.push(x);
}
southXs.sort((a, b) => a - b);
const entranceX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;

// Tiers: podium, then three stepped tiers. Each tier is a subset of the one below.
TIERS.forEach((T, ti) => {
  for (const [k, gr] of ground) {
    const [x, z] = parse(k);
    if (dep(x, z) <= T.k) continue;
    const base = T.base === null ? gr : T.base;
    if (base >= T.top) continue;

    const inS = (xx, zz) => inFoot(xx, zz) && dep(xx, zz) > T.k;
    const faces = NB.filter(([dx, dz]) => !inS(x + dx, z + dz));
    const ext = faces.length > 0;
    const isEntrance = ti === 0 && ext && x === entranceX && faces.some(([dx, dz]) => dx === 0 && dz === 1);

    for (let y = base; y < T.top; y++) {
      const rel = y - base;

      // Roof slab / parapet cap.
      if (y === T.top - 1) {
        put(x, y, z, ext ? "white_concrete" : "gray_concrete");
        continue;
      }

      // Entrance doors, lintel.
      if (isEntrance && rel <= 1) {
        put(x, y, z, "dark_oak_door", {
          facing: "south",
          half: rel === 0 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (isEntrance && rel === 2) {
        put(x, y, z, "white_concrete");
        continue;
      }

      // Base course / storey base.
      if (rel === 0) {
        put(x, y, z, ext ? (ti === 0 ? "stone_bricks" : "white_concrete") : "light_gray_concrete");
        continue;
      }

      // Floor slabs / spandrels every storey (5 blocks).
      if (rel % 5 === 0) {
        put(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
        continue;
      }

      // Interior stays air behind the glass.
      if (!ext) continue;

      // Facade: mullions every 3 bays, tinted glass between.
      const [fdx, fdz] = faces[0];
      const bay = fdx !== 0 ? z : x;
      if (bay % 3 === 0) {
        put(x, y, z, "white_concrete");
        continue;
      }
      put(x, y, z, T.glass);

      // Warm lights behind some windows, inside the air gap.
      const ix = x - fdx, iz = z - fdz;
      if (bay % 6 === 1 && (rel % 5 === 2 || rel % 5 === 3) &&
          inS(ix, iz) && NB.every(([dx, dz]) => inS(ix + dx, iz + dz))) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
});

// Mechanical crown on the top tier, with a mast on the deepest core cells.
const pthr = Math.max(TIERS[3].k, Math.round(0.85 * maxD));
const P = (x, z) => inFoot(x, z) && dep(x, z) > pthr;
for (const [k] of ground) {
  const [x, z] = parse(k);
  if (!P(x, z)) continue;
  const faces = NB.filter(([dx, dz]) => !P(x + dx, z + dz));
  const ext = faces.length > 0;
  const [fdx, fdz] = faces[0] ?? [0, 0];
  const bay = fdx !== 0 ? z : x;

  for (let y = ROOF; y <= ROOF + 4; y++) {
    const rel = y - ROOF;
    if (rel === 0 || rel === 3) {
      put(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
    } else if (rel === 4) {
      put(x, y, z, ext ? "white_concrete" : "gray_concrete");
    } else if (ext) {
      put(x, y, z, bay % 3 === 0 ? "white_concrete" : "cyan_stained_glass");
    }
  }
  if (dep(x, z) === maxD) {
    for (let y = ROOF + 5; y <= ROOF + 9; y++) put(x, y, z, "light_gray_concrete");
    put(x, ROOF + 10, z, "end_rod");
  }
}

vox.save(OUT);
