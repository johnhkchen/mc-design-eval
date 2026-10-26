import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// State, War and Navy Building (Old Executive Office Building), 1871-1888.
// Second Empire: grey granite base and piano nobile, rhythmic window bays,
// a stringcourse per storey, a projecting cornice, and a slate mansard with
// dormer windows. Footprint 37 x 67, roof about 17 blocks above y0.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC62396";
const W = 37, H = 29, D = 67;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const P = {
  found: "stone_bricks",
  base: "polished_andesite",   // grey granite wall
  trim: "stone_bricks",        // mullions, stringcourses, cornice
  glass: "glass",
  floor: "smooth_stone",
  roof: "deepslate_tiles",
  rod: "lightning_rod",
  light: "glowstone",
  step: "smooth_stone_slab",
  canopy: "stone_brick_slab",
};

const MAX_Y = H - 2;
const key = (x, z) => `${x},${z}`;
const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const facingName = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

const foot = new Map();
for (const [x, z, gr, rf] of cells) foot.set(key(x, z), { x, z, gr, rf });
const inF = (x, z) => foot.has(key(x, z));

// Distance from the outside (1 = facade cell).
const dist = new Map();
const queue = [];
for (const c of foot.values()) {
  const edge = dirs.some(([dx, dz]) => !inF(c.x + dx, c.z + dz));
  if (edge) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of dirs) {
    const k = key(c.x + dx, c.z + dz);
    const n = foot.get(k);
    if (n && !dist.has(k)) { dist.set(k, d + 1); queue.push(n); }
  }
}

// Smoothed roof: average the lidar roof over a 7x7 neighbourhood.
function smoothRoof(c) {
  let s = 0, n = 0;
  for (let dx = -3; dx <= 3; dx++) for (let dz = -3; dz <= 3; dz++) {
    const m = foot.get(key(c.x + dx, c.z + dz));
    if (m) { s += m.rf; n++; }
  }
  return Math.round(s / n);
}

function setB(x, y, z, id, st) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (st) g.set(x, y, z, id, st); else g.set(x, y, z, id);
}

const isBand = (r) => r >= 2 && (r - 2) % 3 === 0;
const isGlassRow = (r) => r >= 3 && !isBand(r);
const pOf = (x, z) => ((x + z) % 4 + 4) % 4;

function outDir(c) {
  for (const [dx, dz] of dirs) if (!inF(c.x + dx, c.z + dz)) return [dx, dz];
  return null;
}

// Entrances sit at the centre of each facade: north/south walls at x=18,
// east/west walls at z=33. Returns true if this facade cell is an entrance.
function isEntrance(c, out) {
  if (!out) return false;
  const alongX = out[0] === 0; // wall runs east-west, door column is x=18
  return alongX ? c.x === 18 : c.z === 33;
}

for (const c of foot.values()) {
  const d = dist.get(key(c.x, c.z)) ?? 1;
  const gr = c.gr;
  let rt = Math.max(smoothRoof(c), gr + 11);
  rt = Math.min(rt, MAX_Y - 1);
  const wt = rt - 4; // wall top / cornice; mansard is 4 levels above
  const p = pOf(c.x, c.z);
  const corner = (!inF(c.x - 1, c.z) || !inF(c.x + 1, c.z)) &&
                 (!inF(c.x, c.z - 1) || !inF(c.x, c.z + 1));

  // Foundation fill up to this cell's ground.
  for (let y = 0; y < gr; y++) setB(c.x, y, c.z, P.found);

  // Walls, floors and interior.
  for (let y = gr; y <= wt; y++) {
    const r = y - gr;

    if (d === 1) {
      const out = outDir(c);
      const entrance = r < 2 && isEntrance(c, out);
      if (entrance) {
        const facing = facingName[`${out[0]},${out[1]}`];
        const half = r === 0 ? "lower" : "upper";
        setB(c.x, y, c.z, "dark_oak_door", {
          facing, half, hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (y === wt) { setB(c.x, y, c.z, P.trim); continue; }
      if (corner) { setB(c.x, y, c.z, P.trim); continue; }
      if (r < 2) {
        // Entrance surround: the two cells either side of the door get
        // a canopy-height slab course so the door reads from the street.
        setB(c.x, y, c.z, (p === 0 || p === 3) ? P.trim : P.base);
        continue;
      }
      if (isBand(r)) { setB(c.x, y, c.z, P.trim); continue; }
      // Glass rows: framed bays with mullions at p 0 and 3.
      if (p === 1 || p === 2) setB(c.x, y, c.z, P.glass);
      else setB(c.x, y, c.z, P.trim);
    } else {
      // Interior: floor slabs only, air between, glowstone behind some windows.
      if (r === 0 || y === wt || (isBand(r) && y < wt)) {
        setB(c.x, y, c.z, P.floor);
        continue;
      }
      if (d === 2 && isGlassRow(r) && y < wt) {
        for (const [dx, dz] of dirs) {
          const n = foot.get(key(c.x + dx, c.z + dz));
          if (n && dist.get(key(n.x, n.z)) === 1) {
            const pn = pOf(n.x, n.z);
            if ((pn === 1 || pn === 2) && ((c.x * 5 + c.z * 3 + r) % 4 === 0)) {
              setB(c.x, y, c.z, P.light);
            }
            break;
          }
        }
      }
    }
  }

  // Entrance canopy: a slab hood over each door, projecting one block
  // from the band above the door, reading as a portico at street level.
  if (d === 1) {
    const out = outDir(c);
    if (isEntrance(c, out) && wt >= gr + 3) {
      const inX = c.x - out[0], inZ = c.z - out[1];
      // Hood just outside the wall line, one storey up over the door.
      const hx = c.x + out[0], hz = c.z + out[1];
      if (!inF(hx, hz)) {
        setB(hx, gr + 2, hz, P.canopy, { type: "bottom", waterlogged: "false" });
      }
      void inX; void inZ;
    }
  }

  // Mansard: solid where d >= k, so every tier stands on the one below.
  for (let y = wt + 1; y <= rt; y++) {
    const k = y - wt;
    if (d < k) continue;
    if (d === 1 && k === 1) { setB(c.x, y, c.z, P.trim); continue; }
    if (d === k && (k === 2 || k === 3) && (p === 1 || p === 2)) {
      setB(c.x, y, c.z, P.glass); // dormer windows in the slope
      continue;
    }
    setB(c.x, y, c.z, P.roof);
  }

  // Roof equipment: lightning rods on a sparse grid across the flat roof.
  if (d >= 8 && c.x % 9 === 4 && c.z % 9 === 4 && rt + 1 <= MAX_Y) {
    setB(c.x, rt + 1, c.z, P.rod, { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
