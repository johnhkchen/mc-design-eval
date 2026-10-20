import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001365";
const W = 7, D = 22, H = 29;

// 300 Pearl Street, 1882: five-storey red-brick walk-up with brownstone belts,
// a dark storefront at street level, and a stone cornice.
const STONE_BASE = "stone_bricks";
const BELT = "smooth_sandstone";
const TRIM = "chiseled_sandstone";
const BRICK = "bricks";
const GLASS = "glass";
const FRAME = "dark_oak_planks";
const ROOF = "stone";
const CAP = "smooth_sandstone";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, ro] of cells) {
  map.set(key(x, z), { x, z, gr: Math.round(gr), ro: Math.round(ro) });
}
const has = (x, z) => map.has(key(x, z));
const cellAt = (x, z) => map.get(key(x, z));

// Shell depth: 1 = exterior wall ring, 2 = room ring (air behind glass), 3+ = solid core
const depth = new Map();
const queue = [];
for (const c of map.values()) {
  const edge = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  if (edge) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz;
    if (has(nx, nz) && !depth.has(key(nx, nz))) {
      depth.set(key(nx, nz), d + 1);
      queue.push(cellAt(nx, nz));
    }
  }
}

const B = Math.min(...[...map.values()].map((c) => c.gr));

// One shared roof level for the body (lidar noise flattened), lower wings only where clearly lower
const nCellOf = (c) => Math.round((c.ro - B - 5) / 3);
const sorted = [...map.values()].map(nCellOf).sort((a, b) => a - b);
const nG = Math.max(0, sorted[Math.floor(sorted.length / 2)]);

function plan(c) {
  const nc = nCellOf(c);
  const n = Math.max(0, nc < nG - 1 ? nG - 1 : nG);
  const R = Math.max(B + 5 + 3 * n, c.gr + 4);
  const storeys = [{ s: B, h: 4, k: 0 }];
  for (let i = 1; i <= n; i++) storeys.push({ s: B + 4 + 3 * (i - 1), h: 3, k: i });
  return { n, R, storeys };
}
function storeyAt(storeys, y) {
  for (const s of storeys) if (y >= s.s && y < s.s + s.h) return { ...s, r: y - s.s };
  return null;
}

// Facade: which face a wall cell is on, and its position along that face
function faceOf(x, z) {
  const xface = !has(x - 1, z) || !has(x + 1, z);
  return xface ? { xface: true, u: z } : { xface: false, u: x };
}
const isPier = (u) => u % 3 === 0;

// Wall cell behind which a room-air cell sits (for lighting)
function wallNeighbour(x, z) {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && depth.get(key(nx, nz)) === 1) return { x: nx, z: nz };
  }
  return null;
}

// Main massing, column by column
const plans = new Map();
for (const c of map.values()) {
  const d = depth.get(key(c.x, c.z));
  const p = plan(c);
  plans.set(key(c.x, c.z), p);
  const G = c.gr;

  for (let y = 0; y < p.R && y < H; y++) {
    let id = null;
    let props;

    if (y < G) {
      id = STONE_BASE; // foundation fill up to this cell's ground
    } else if (y === p.R - 1) {
      if (d === 1) {
        const f = faceOf(c.x, c.z);
        id = isPier(f.u) ? TRIM : CAP; // cornice with pier brackets
      } else {
        id = ROOF;
      }
    } else if (d === 1) {
      const f = faceOf(c.x, c.z);
      const pier = isPier(f.u);
      const s = storeyAt(p.storeys, y);
      if (!s) {
        id = BRICK;
      } else if (s.r === 0) {
        id = s.k === 0 ? STONE_BASE : BELT; // base course / storey belt
      } else if (s.k === 0) {
        // Ground storey: dark storefront, sign band, centred entrance
        if (s.r === 3) id = FRAME;
        else if (pier) id = FRAME;
        else id = GLASS;
        const isEntrance = !f.xface && c.z === 0 && f.u === 3;
        if (isEntrance && (s.r === 1 || s.r === 2)) {
          id = "dark_oak_door";
          props = {
            facing: "north",
            half: s.r === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          };
        }
        if (isEntrance && s.r === 3) {
          id = "lantern";
          props = { hanging: "true", waterlogged: "false" };
        }
      } else {
        // Upper storeys: brick piers capped with stone at the lintel line, one glass row
        if (pier) id = s.r === 2 ? TRIM : BRICK;
        else if (s.r === 1) id = GLASS;
        else id = BELT;
      }
    } else if (d === 2) {
      const s = storeyAt(p.storeys, y);
      const isRoomRow = s && s.r >= 1 && s.r <= s.h - 2;
      if (isRoomRow) {
        // Air gap behind the glass; some windows lit warm
        const w = wallNeighbour(c.x, c.z);
        let lit = false;
        if (w && s.r === 1) {
          const f = faceOf(w.x, w.z);
          lit = !isPier(f.u) && ((f.u + s.k) % 4 === 1);
        }
        id = lit ? "glowstone" : null;
      } else {
        id = BRICK; // floor slabs and lintel ceilings
      }
    } else {
      id = BRICK; // solid core
    }

    if (id) {
      if (props) g.set(c.x, y, c.z, id, props);
      else g.set(c.x, y, c.z, id);
    }
  }
}

// Stair/elevator bulkhead on the roof, only where the 3x3 block shares one roof height
const bulk = [];
for (let x = 2; x <= 4; x++) for (let z = 9; z <= 11; z++) bulk.push([x, z]);
const bulkR = bulk.map(([x, z]) => (has(x, z) ? plans.get(key(x, z)).R : null));
if (bulkR.every((r) => r !== null && r === bulkR[4])) {
  const R = bulkR[4];
  for (const [x, z] of bulk) {
    for (let y = R; y <= R + 1 && y < H; y++) {
      if (z === 9 && x === 3) g.set(x, y, z, GLASS);
      else g.set(x, y, z, BRICK);
    }
    if (R + 2 < H) g.set(x, R + 2, z, CAP);
  }
}

g.save(`${DIR}/${ID}.nbt`);
