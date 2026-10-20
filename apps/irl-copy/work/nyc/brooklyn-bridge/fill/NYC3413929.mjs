import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3413929";
const W = 28, H = 46, D = 17;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint map -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  cellMap.set(key(x, z), { x, z, g: Math.round(gr), roof: Number(roof) });
}
const has = (x, z) => cellMap.has(key(x, z));
const even = (v) => 2 * Math.round(v / 2);

// ---- depth from the outside (0 = perimeter wall cell) --------------------
const depth = new Map();
const queue = [];
for (const c of cellMap.values()) {
  const perim = !has(c.x + 1, c.z) || !has(c.x - 1, c.z) || !has(c.x, c.z + 1) || !has(c.x, c.z - 1);
  if (perim) { depth.set(key(c.x, c.z), 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const k = key(c.x + dx, c.z + dz);
    if (cellMap.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(cellMap.get(k));
    }
  }
}

// ---- smoothed tier height (follow the lidar roof, flatten noise) ----------
const roofs = [...cellMap.values()].map((c) => c.roof).sort((a, b) => a - b);
const medRoof = even(roofs[Math.floor(roofs.length / 2)]);

for (const c of cellMap.values()) {
  let t = even(c.roof);
  t = Math.max(medRoof - 12, Math.min(medRoof + 12, t));
  const d = depth.get(key(c.x, c.z));
  if (d === 0) t -= 4;        // perimeter steps in
  else if (d === 1) t -= 2;   // next ring steps in
  t = Math.max(c.g + 8, Math.min(44, t));
  c.t = t;
  c.d = d;
  c.perim = d === 0;
}

// ---- outward direction and door placement --------------------------------
const OFF = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const outward = (x, z) => {
  if (!has(x, z + 1)) return "south";
  if (!has(x, z - 1)) return "north";
  if (!has(x + 1, z)) return "east";
  return "west";
};

const mid = Math.floor(W / 2);
let doorCell = null;
let bestScore = Infinity;
for (const c of cellMap.values()) {
  if (!c.perim) continue;
  const o = outward(c.x, c.z);
  const preferred = o === "south" || o === "north" ? 0 : 10;
  const score = preferred + Math.abs(c.x - mid);
  if (score < bestScore) { bestScore = score; doorCell = c; }
}
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;
const doorFacing = doorCell ? outward(doorCell.x, doorCell.z) : null;

// ---- materials ------------------------------------------------------------
const GLASS = "light_gray_stained_glass";
const BRICK = "bricks";
const STONE = "stone_bricks";
const CAP = "smooth_stone";
const FLOOR = "smooth_stone";
const ROOF = "stone";            // lit, readable roof membrane (not black holes)
const PH = "light_gray_concrete";
const TRIM = "stone_brick_slab";

// ---- build each footprint column -----------------------------------------
for (const c of cellMap.values()) {
  const { x, z, g: gy, t, perim } = c;

  // foundation from y0 up to the cell's ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, STONE);
  // base course
  g.set(x, gy, z, perim ? CAP : STONE);

  if (perim) {
    const isDoorCell = key(x, z) === doorKey;
    const pier = (x + z) % 3 === 0;

    // ground storey shopfront: rows gy+1 .. gy+2 glass, gy+3 lintel
    for (let y = gy + 1; y <= gy + 2; y++) {
      if (isDoorCell) {
        const half = y === gy + 1 ? "lower" : "upper";
        g.set(x, y, z, "dark_oak_door", {
          facing: doorFacing, half, hinge: "left", open: "false", powered: "false",
        });
      } else {
        g.set(x, y, z, pier ? STONE : GLASS);
      }
    }
    // lintel band; over the entrance a dark canopy course reads as a marquee
    g.set(x, gy + 3, z, isDoorCell ? TRIM : CAP);
    if (isDoorCell) {
      // flanking piers so the entrance reads as a portal
      g.set(x, gy + 1, z, STONE);
      g.set(x, gy + 2, z, STONE);
    }
  }

  // floor slabs every storey: rows gy+4, gy+6, ...
  for (let y = gy + 4; y < t; y += 2) {
    g.set(x, y, z, perim ? BRICK : FLOOR);
  }

  // window rows between slabs (perimeter only), with warm lights behind glass
  if (perim) {
    for (let y = gy + 5; y < t - 1; y += 2) {
      const mullion = (x + z) % 3 === 0;
      g.set(x, y, z, mullion ? BRICK : GLASS);

      if (!mullion && (x * 3 + z * 5 + y) % 7 === 0) {
        const o = outward(x, z);
        const [ox, oz] = OFF[o];
        const ix = x - ox, iz = z - oz;
        if (has(ix, iz) && depth.get(key(ix, iz)) === 1) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // roof / cornice cap at the top row of the column
  g.set(x, t - 1, z, perim ? CAP : ROOF);
  // a slab course on the perimeter parapet for a crisp edge
  if (perim) g.set(x, t - 1, z, TRIM);
}

// ---- roof equipment: a penthouse core on the tallest tier -----------------
let maxT = 0;
for (const c of cellMap.values()) if (c.t > maxT) maxT = c.t;

if (maxT + 3 <= H - 1) {
  for (const c of cellMap.values()) {
    if (c.d >= 5 && c.t >= maxT - 2) {
      const base = c.t;
      g.set(c.x, base, c.z, PH);
      g.set(c.x, base + 1, c.z, PH);
      g.set(c.x, base + 2, c.z, CAP);
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
