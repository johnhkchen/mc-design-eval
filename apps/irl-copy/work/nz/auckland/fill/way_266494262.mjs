// Way 266494262, Eden Terrace under Maungawhau: a 1970s concrete-frame office block, seven storeys on a basalt plinth.
// The lidar roof is 30 blocks above y 0 across the footprint; the 5x5 median snaps it to the storey grid (lines at
// 2, 6 ... 26, roof top 30), so it is one flat tier, no setbacks. The lowest 2 blocks are basalt plinth where the ground
// falls away: the storey grid runs from the roof, so the lowest line is the datum at y 2. Facade per storey: a light-grey
// spandrel band, two rows of tinted glass, white concrete piers on a 3-block bay (corners always piers). The ground
// storey is a shopfront of light-blue glass; the entrance is a recessed porch on the most open straight wall, a stone
// lintel over it and the glass door set back one cell. Structure is a column grid on the interior 3-block lines, so the
// floor slabs carry to the piers and the columns, and the interior stays air behind the glass. Warm lights (lanterns and
// glowstone) sit behind some windows. On the roof: a solid 5x5 lift overrun glazed on its faces, a stone cap, three
// iron HVAC units and a lightning rod.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_266494262.cells.json", "utf8"));
const W = 40, D = 40, H = 43, DATUM = 2, STOREY = 4;
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const G = grid(-1), R = grid(0);                                       // ground per cell (-1 = not footprint), lidar roof
for (const [x, z, g, r] of cells) { G[x][z] = g; R[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[x][z] >= 0;

// roof top per cell: 5x5 median of the lidar roof, snapped to the storey grid
const T = grid(0);
const median = (x, z) => {
  const v = [];
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) if (inside(x + dx, z + dz)) v.push(R[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) T[x][z] = DATUM + STOREY * Math.max(1, Math.round((median(x, z) - DATUM) / STOREY));

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const shell = (x, z) => inside(x, z) && exposed(x, z).length > 0;
const corner = (x, z) => {
  const e = exposed(x, z);
  return (e.includes("north") || e.includes("south")) && (e.includes("west") || e.includes("east"));
};
// piers on a 3-block bay along the wall (x on north/south faces, z on east/west), and at every corner
const pier = (x, z) => {
  const e = exposed(x, z), along = e.includes("north") || e.includes("south") ? x : z;
  return corner(x, z) || along % 3 === 0;
};

// the entrance: a straight wall cell with one open side, whose two flanks are wall on the same side and whose inner
// neighbour is building. Lowest ground first, then nearest the middle of the footprint
let sx = 0, sz = 0, n = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) { sx += x; sz += z; n++; }
const cx = sx / n, cz = sz / n;
const cand = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!shell(x, z)) continue;
  const e = exposed(x, z);
  if (e.length !== 1) continue;
  const d = e[0], [dx, dz] = DIRS[d], [ax, az] = dx === 0 ? [1, 0] : [0, 1];
  const f1 = [x - ax, z - az], f2 = [x + ax, z + az], inn = [x - dx, z - dz];
  const flankOk = (f) => shell(f[0], f[1]) && exposed(f[0], f[1]).includes(d);
  if (flankOk(f1) && flankOk(f2) && inside(inn[0], inn[1]) && !shell(inn[0], inn[1]))
    cand.push({ x, z, d, inn, f1, f2, score: G[x][z] * 100 + Math.hypot(x - cx, z - cz) });
}
cand.sort((a, b) => a.score - b.score);
const E = cand[0];
if (!E) throw new Error("no straight wall with room for a porch");
const porchKey = `${E.x},${E.z}`, doorKey = `${E.inn[0]},${E.inn[1]}`;
const flankKeys = new Set([`${E.f1[0]},${E.f1[1]}`, `${E.f2[0]},${E.f2[1]}`]);

// interior column grid on 3-block lines (never the door)
const column = (x, z) => !shell(x, z) && x % 3 === 0 && z % 3 === 0 && `${x},${z}` !== doorKey;

const PLINTH = "basalt", FLOOR0 = "polished_basalt", BAND = "light_gray_concrete", WALL = "white_concrete";
const SHOP = "light_blue_stained_glass", GLASS = "gray_stained_glass", COPING = "smooth_stone", DECK = "gray_concrete";
const LANTERN = "lantern", GLOW = "glowstone";

const g = new Voxels([W, H, D]);
const set = (x, y, z, b, st) => g.set(x, y, z, b, st);

for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!inside(x, z)) continue;
  const sh = shell(x, z), c = column(x, z), top = T[x][z], key = `${x},${z}`;
  const isPorch = key === porchKey, isFlank = flankKeys.has(key), isDoor = key === doorKey;

  // plinth from y 0 up to the cell's ground (and to the datum, so the floors have something under them)
  for (let y = 0; y < Math.max(G[x][z], DATUM); y++) set(x, y, z, PLINTH);

  for (let y0 = DATUM, s = 0; y0 < top; y0 += STOREY, s++) {
    const topStorey = y0 + STOREY >= top;

    // floor slab at the storey line (the base course on the ground storey)
    set(x, y0, z, c ? WALL : s === 0 ? FLOOR0 : BAND);

    // the two glass rows
    for (let y = y0 + 1; y <= y0 + 2; y++) {
      if (isDoor && s === 0) { set(x, y, z, "oak_door", { facing: E.d, half: y === y0 + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isPorch && s === 0) continue;                                // the porch is air under the lintel
      if (sh) {
        const frame = pier(x, z) || isFlank;
        set(x, y, z, frame ? WALL : s === 0 ? SHOP : GLASS);
        // a warm light behind some glass: on the floor slab of the cell inside
        if (!frame && y === y0 + 1 && (x * 5 + z * 3 + s * 7) % 6 === 0) {
          const inward = Object.values(DIRS).map(([dx, dz]) => [x + dx, z + dz])
            .find(([nx, nz]) => inside(nx, nz) && !shell(nx, nz) && !column(nx, nz) && `${nx},${nz}` !== doorKey);
          if (inward) set(inward[0], y, inward[1], (s === 0 || (x + z) % 2 === 0) ? LANTERN : GLOW, s === 0 || (x + z) % 2 === 0 ? { hanging: "false", waterlogged: "false" } : undefined);
        }
      } else if (c) set(x, y, z, WALL);
    }

    // the third row: the spandrel band, or the coping and roof deck under the roof
    const y3 = y0 + 3;
    if (topStorey) {
      if (sh) set(x, y3, z, COPING);
      else if (c) set(x, y3, z, WALL);
      else set(x, y3, z, DECK);
    } else if (sh) set(x, y3, z, (isPorch || isFlank) && s === 0 ? COPING : BAND);
    else if (c) set(x, y3, z, WALL);
  }
}

// roof: a solid 5x5 lift overrun on the deck, glazed on its faces, a stone cap and a lightning rod
const roof = Math.max(...T.flat());
const coreOk = (x, z) => {
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const X = x + dx, Z = z + dz;
    if (!inside(X, Z) || shell(X, Z) || T[X][Z] !== roof) return false;
  }
  return true;
};
let core = null;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (coreOk(x, z) && (!core || Math.hypot(x - cx, z - cz) < Math.hypot(core[0] - cx, core[1] - cz))) core = [x, z];
const [kx, kz] = core;
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) for (let y = roof; y < roof + 3; y++) {
  const ring = Math.max(Math.abs(dx), Math.abs(dz)) === 2, corner2 = Math.abs(dx) === 2 && Math.abs(dz) === 2;
  set(kx + dx, y, kz + dz, ring && y === roof + 1 && !corner2 ? GLASS : BAND);
}
for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) set(kx + dx, roof + 3, kz + dz, DECK);
set(kx, roof + 4, kz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// three HVAC units, 2x2 iron on the deck, at least 4 blocks from the overrun and 4 from each other
const hvac = [];
const spots = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) spots.push([x, z]);
spots.sort((a, b) => Math.hypot(a[0] - kx, a[1] - kz) - Math.hypot(b[0] - kx, b[1] - kz));
for (const [x, z] of spots) {
  if (hvac.length >= 3) break;
  if (Math.max(Math.abs(x - kx), Math.abs(z - kz)) < 4) continue;
  const block = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!block.every(([X, Z]) => inside(X, Z) && !shell(X, Z) && T[X][Z] === roof && `${X},${Z}` !== doorKey)) continue;
  if (hvac.some(([hx, hz]) => Math.max(Math.abs(hx - x), Math.abs(hz - z)) < 4)) continue;
  hvac.push([x, z]);
  for (const [X, Z] of block) set(X, roof, Z, "iron_block");
}

const file = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_266494262.nbt";
const out = g.save(file);
console.log(`entrance ${E.d} at ${E.x},${E.z} (door ${doorKey}); core at ${kx},${kz}; hvac ${hvac.length}; blocks ${out.blocks}, palette ${out.palette}`);
