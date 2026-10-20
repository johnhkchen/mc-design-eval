import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001364.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001364.nbt";

// 324 Pearl Street: 1882 multi-family elevator building, South Street Seaport.
// Red brick commercial loft: granite base, sandstone sills and string courses,
// brick piers between window bays, stone cornice and parapet, shopfront with a
// central granite-framed entrance, and a rooftop water tower.
const W = 17, H = 31, D = 20;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr, roof] of cells) {
  fp.set(key(x, z), { g: Math.max(0, Math.round(gr)), r: Math.round(roof) });
}

// Base level: lowest ground under the footprint.
let B = Infinity;
for (const c of fp.values()) B = Math.min(B, c.g);
if (!isFinite(B)) B = 0;

const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];
const exposed = (x, z) => DIRS.filter((d) => !fp.has(key(x + d.dx, z + d.dz)));

// Smooth lidar roof noise: average each cell's roof over its footprint neighbourhood,
// then snap to whole tiers of 2 blocks so the massing reads as clean setbacks.
const smoothed = new Map();
for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nb = fp.get(key(x + dx, z + dz));
    if (nb) { sum += nb.r; n++; }
  }
  const avg = sum / n;
  let r = Math.round(avg / 2) * 2;
  r = Math.min(H - 6, Math.max(c.g + 6, r));
  smoothed.set(k, r);
}
for (const [k, c] of fp) c.r = smoothed.get(k);

// One entrance per long face: the middle exposed non-corner cell.
const doorCells = new Map();
const faceBuckets = { east: [], west: [], south: [], north: [] };
for (const [k] of fp) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  if (ex.length === 1) {
    const d = ex[0];
    faceBuckets[d.name].push({ along: d.dz !== 0 ? x : z, k });
  }
}
for (const name of Object.keys(faceBuckets)) {
  const arr = faceBuckets[name].sort((a, b) => a.along - b.along);
  if (arr.length >= 8) doorCells.set(arr[Math.floor(arr.length / 2)].k, name);
}

const lit = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 9 === 0);

for (const [k, c] of fp) {
  const [x, z] = k.split(",").map(Number);
  const gg = c.g;
  const top = c.r;
  const topRel = top - B;

  // Foundation.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const isFacade = ex.length > 0;
  const corner = ex.length >= 2;
  const face = ex[0];
  const u = face ? (face.dz !== 0 ? x : z) : 0;
  const pier = corner || (u % 3 === 0);
  const doorFace = doorCells.get(k);
  const isDoor = !!doorFace && isFacade && !corner && face && face.name === doorFace;
  // Granite surround: piers immediately beside the entrance.
  const beside = !!face && !corner && !isDoor && pier && [-1, 1].some((o) => {
    const ax = face.dz !== 0 ? x + o : x;
    const az = face.dz !== 0 ? z : z + o;
    const nb = fp.get(key(ax, az));
    return nb && doorCells.get(key(ax, az)) === undefined && false;
  });
  const doorNeighbour = !!face && [-1, 1].some((o) => {
    const ax = face.dz !== 0 ? x + o : x;
    const az = face.dz !== 0 ? z : z + o;
    return doorCells.get(key(ax, az)) === face.name;
  });

  for (let y = gg; y < top; y++) {
    const rel = y - B;
    const isBaseRow = rel === 0 || (rel >= 3 && (rel - 3) % 2 === 0);

    if (!isFacade) {
      if (y === top - 1) g.set(x, y, z, "smooth_stone"); // roof
      else if (isBaseRow) g.set(x, y, z, "stone_bricks"); // floor slab
      continue;
    }

    if (rel === topRel - 2) {
      g.set(x, y, z, "smooth_stone"); // cornice
    } else if (rel === topRel - 1) {
      g.set(x, y, z, "bricks"); // parapet
    } else if (rel === 0) {
      g.set(x, y, z, "polished_granite");
    } else if (rel === 1 || rel === 2) {
      if (isDoor) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face.name,
          half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false",
        });
      } else if (rel === 2 && doorNeighbour) {
        g.set(x, y, z, "polished_granite"); // entrance surround lintel
      } else if (rel === 1 && doorNeighbour) {
        g.set(x, y, z, "polished_granite"); // entrance surround jamb
      } else if (pier) {
        g.set(x, y, z, "bricks");
      } else if (rel === 1) {
        g.set(x, y, z, "glass");
        if (lit(x, y, z)) {
          const ix = x - face.dx, iz = z - face.dz;
          if (fp.has(key(ix, iz))) g.set(ix, y, iz, "glowstone");
        }
      } else {
        g.set(x, y, z, "smooth_sandstone"); // transom lintel
      }
    } else if (isBaseRow) {
      // String course between storeys: stone band over piers, sill under windows.
      g.set(x, y, z, pier ? "smooth_sandstone" : "smooth_sandstone");
    } else {
      if (pier) {
        g.set(x, y, z, "bricks");
      } else {
        g.set(x, y, z, "glass");
        if (lit(x, y, z)) {
          const ix = x - face.dx, iz = z - face.dz;
          if (fp.has(key(ix, iz))) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Rooftop water tower: a timber tank on a steel-banded stand over the central roof.
{
  const cx = Math.round((W - 1) / 2), cz = Math.round((D - 1) / 2);
  let best = null, bestD = Infinity;
  for (const [k, c] of fp) {
    const [x, z] = k.split(",").map(Number);
    if (exposed(x, z).length) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (d < bestD) { bestD = d; best = { x, z, top: c.r }; }
  }
  if (best && best.top + 6 < H) {
    const { x: tx, z: tz, top } = best;
    // Stand: four legs on the roof.
    for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
      const lx = tx + ox - (tx + 1 < W && fp.has(key(tx + 1, tz)) ? 0 : 0);
      for (let y = top; y < top + 2; y++) {
        const px = Math.min(W - 1, tx + ox), pz = Math.min(D - 1, tz + oz);
        if (fp.has(key(px, pz))) g.set(px, y, pz, "stone_bricks");
      }
    }
    // Tank: 2x2 timber box with iron hoops.
    for (let y = top + 2; y < top + 5; y++) {
      for (const [ox, oz] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const px = Math.min(W - 1, tx + ox), pz = Math.min(D - 1, tz + oz);
        if (fp.has(key(px, pz))) {
          g.set(px, y, pz, y === top + 3 ? "chain" : "spruce_planks");
        }
      }
    }
    // Conical cap.
    if (fp.has(key(tx, tz))) g.set(tx, top + 5, tz, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(OUT);
