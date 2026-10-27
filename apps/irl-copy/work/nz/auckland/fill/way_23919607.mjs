// Aon Centre, Auckland (Customs St, CBD), as seen from Maungawhau. Lidar roof ~110-113 blocks over a 17-block
// podium: a 1980s-style glass-and-concrete office tower (white concrete mullions, light-grey floor bands, blue-grey
// tinted glazing), 4-block storeys on a 5-block plinth. Every layer stands on a solid layer below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23919607.cells.json`, "utf8"));

const X = 70, Z = 69, Y = 126;
const BASE = 5;                       // podium floor: foundation fills y 0..4 under every cell
const PODIUM = 17, BODY = 109, CROWN = 113;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const at = (x, z) => x * Z + z;
const inside = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;

// footprint and lidar roof per cell
const roofAt = new Map(), groundAt = new Map();
for (const [x, z, g, r] of cells) { roofAt.set(at(x, z), r); groundAt.set(at(x, z), g); }
const footprint = (x, z) => roofAt.has(at(x, z));

// tower mask: lidar roof >= 60, with single-cell spikes dropped (a tower cell needs 2 tower neighbours)
const towerRaw = (x, z) => footprint(x, z) && roofAt.get(at(x, z)) >= 60;
const tower = (x, z) => towerRaw(x, z) && DIRS.filter(([dx, dz]) => towerRaw(x + dx, z + dz)).length >= 2;

// clean tiers: podium 9 / 13 / 17 for the low wings and podium, body 109, crown 113 where the lidar reads >= 111
const top = new Int16Array(X * Z).fill(-1);
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!footprint(x, z)) continue;
  const r = roofAt.get(at(x, z));
  if (tower(x, z)) top[at(x, z)] = r >= 111 ? CROWN : BODY;
  else top[at(x, z)] = r <= 11 ? 9 : r <= 15 ? 13 : PODIUM;
}
const topAt = (x, z) => (inside(x, z) ? top[at(x, z)] : -1);

// storey rows: from BASE, a solid floor row, two window rows, a solid row (the next floor's support)
const isSlab = (y) => ((y - BASE) % 4 === 0 || (y - BASE) % 4 === 3);
// exposed faces of a cell at height y: neighbours that are outside the footprint or lower than y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => topAt(x + dx, z + dz) <= y);
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([X, Y, Z]);

// pass 1: foundation, floors, facade
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const t = topAt(x, z); if (t < 0) continue;
  for (let y = 0; y < BASE; y++) g.set(x, y, z, "stone_bricks");
  for (let y = BASE; y < t; y++) {
    const ex = exposed(x, z, y);
    if (isSlab(y)) {
      g.set(x, y, z, y === BASE && ex.length ? "polished_andesite" : "light_gray_concrete");
    } else if (ex.length >= 2) {
      g.set(x, y, z, "white_concrete");                                  // corner column
    } else if (ex.length === 1) {
      const [dx] = ex[0];
      const along = dx !== 0 ? z : x;                                    // position along the face
      if (along % 3 === 0) g.set(x, y, z, "white_concrete");           // mullion
      else if (dx !== 0) g.set(x, y, z, "light_blue_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
      else g.set(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    }
  }
}

// pass 2: warm light behind some glass (interior air next to a pane), and roof edges
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const t = topAt(x, z); if (t < 0) continue;
  for (let y = BASE; y < t; y++) {
    if (isSlab(y) || exposed(x, z, y).length) continue;                 // interior air only
    const behindPane = DIRS.some(([dx, dz]) => {
      const nx = x + dx, nz = z + dz, ex = exposed(nx, nz, y);
      if (ex.length !== 1 || topAt(nx, nz) <= y) return false;         // a pane (not a corner) on the outer face
      return (ex[0][0] !== 0 ? nz : nx) % 3 !== 0;                      // not a mullion
    });
    if (behindPane && hash(x, y, z) % 6 === 0) g.set(x, y, z, "glowstone");
  }
  // parapet on the roof edge: a cell's top edge where a neighbour is lower or outside
  if (DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) < t)) g.set(x, t, z, "white_concrete");
}

// pass 3: entrances, one on each of the two long faces, in the middle of the ground-floor run
const doorOn = (dir) => {
  const cand = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (topAt(x, z) < 0) continue;
    const ex = exposed(x, z, BASE + 1).filter(([dx, dz]) => dx === dir[0] && dz === dir[1]);
    if (ex.length && exposed(x, z, BASE + 1).length === 1) cand.push([x, z]);
  }
  if (!cand.length) return;
  const mid = cand[Math.floor(cand.length / 2)];
  const [x, z] = mid;
  const facing = dir[1] === 1 ? "south" : dir[1] === -1 ? "north" : dir[0] === 1 ? "east" : "west";
  g.set(x, BASE + 1, z, "iron_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, BASE + 2, z, "iron_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
};
doorOn([0, 1]);
doorOn([0, -1]);

// roof plant: a service box on the crown (stands on the crown's solid top), and a few units on the podium roof
let cx = 0, cz = 0, nc = 0;
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) if (topAt(x, z) === CROWN) { cx += x; cz += z; nc++; }
if (nc) {
  cx = Math.round(cx / nc); cz = Math.round(cz / nc);
  for (let x = cx - 4; x <= cx + 4; x++) for (let z = cz - 3; z <= cz + 3; z++) {
    if (topAt(x, z) !== CROWN || DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) !== CROWN)) continue;
    for (let y = CROWN; y < CROWN + 3; y++) g.set(x, y, z, y === CROWN + 2 ? "white_concrete" : "light_gray_concrete");
  }
}
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (topAt(x, z) !== PODIUM || DIRS.some(([dx, dz]) => topAt(x + dx, z + dz) !== PODIUM)) continue;
  if (x % 9 === 4 && z % 7 === 3) g.set(x, PODIUM, z, "smooth_stone");
}

const counts = g.save(`${DIR}/way_23919607.nbt`);
console.log(JSON.stringify({ blocks: counts.blocks, palette: counts.palette, crown: nc, size: g.size }));
