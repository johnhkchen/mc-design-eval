import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3329403.cells.json`, "utf8"));

const W = 7, H = 18, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, r] of cells) {
  map.set(key(x, z), { x, z, g: Math.round(gr), r: Math.round(r) });
}
const has = (x, z) => map.has(key(x, z));

// Flat roof: lowest ground + 6 blocks (lidar noise smoothed into one parapet line).
const GMIN = Math.min(...[...map.values()].map((c) => c.g));
const ROOF = GMIN + 6;
for (const c of map.values()) c.r = ROOF;

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];
for (const c of map.values()) {
  c.ex = DIRS.filter((d) => !has(c.x + d.dx, c.z + d.dz));
  c.perim = c.ex.length > 0;
  // A true corner exposes one street-normal face and one cross face.
  const xExp = c.ex.some((d) => d.dx !== 0);
  const zExp = c.ex.some((d) => d.dz !== 0);
  c.corner = xExp && zExp;
}

// Storey bands: ground floor rows g+1..g+2, upper storey row g+4, storey line at g+3, cornice at R-1.
const storeyBases = (c) => {
  const bs = [];
  for (let b = c.g; b < c.r - 1; b += 3) bs.push(b);
  return bs;
};

// Pass 1: foundation, slabs, shell, base course, cornice, roof deck.
for (const c of map.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");

  for (const b of storeyBases(c)) {
    if (!c.perim) put(c.x, b, c.z, "smooth_stone"); // floor slab, interior air above
  }

  if (c.perim) {
    for (let y = c.g; y <= c.r - 1; y++) put(c.x, y, c.z, "bricks");
    if (c.corner) {
      for (let y = c.g; y <= c.r - 1; y++) put(c.x, y, c.z, "stone_bricks");
    }
    put(c.x, c.g, c.z, "stone_bricks"); // base course
    put(c.x, c.r - 1, c.z, "stone_bricks"); // cornice / coping line
    // Storey lines (spandrel bands) at upper floor bases.
    for (const b of storeyBases(c)) {
      if (b > c.g) put(c.x, b, c.z, "stone_bricks");
    }
  } else {
    put(c.x, c.r - 1, c.z, "smooth_stone"); // roof deck
  }
}

// Pass 2: windows, piers, warm glow.
for (const c of map.values()) {
  if (!c.perim || c.corner) continue;
  const face = c.ex[0];
  const idx = face.dx !== 0 ? c.z : c.x;

  for (const b of storeyBases(c)) {
    const rows = b === c.g ? [b + 1, b + 2] : [b + 1];
    for (const y of rows) {
      if (y > c.r - 2) continue;
      if (idx % 3 === 0) {
        put(c.x, y, c.z, "stone_bricks");
      } else {
        put(c.x, y, c.z, "glass");
        if (idx % 6 === 1 && y === b + 1) {
          const ix = c.x - face.dx;
          const iz = c.z - face.dz;
          const inner = map.get(key(ix, iz));
          if (inner && !inner.perim && inner.r - 1 >= y) {
            put(ix, y, iz, "glowstone");
          }
        }
      }
    }
  }
}

// Entrance: one door on the street-facing side near the middle of the frontage.
{
  let front = [...map.values()].filter(
    (c) => c.perim && !c.corner && c.ex.length === 1 && c.ex[0].dz !== 0
  );
  if (front.length === 0) {
    front = [...map.values()].filter((c) => c.perim && !c.corner && c.ex.length === 1);
  }
  if (front.length > 0) {
    const idxOf = (c) => (c.ex[0].dx !== 0 ? c.z : c.x);
    const idxs = front.map(idxOf);
    const mid = Math.floor((Math.min(...idxs) + Math.max(...idxs)) / 2);
    const door = front.reduce((best, c) =>
      Math.abs(idxOf(c) - mid) < Math.abs(idxOf(best) - mid) ? c : best
    );
    const facing = door.ex[0].facing;
    put(door.x, door.g, door.z, "oak_door", {
      facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(door.x, door.g + 1, door.z, "oak_door", {
      facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });
  }
}

g.save(`${DIR}/NYC3329403.nbt`);
