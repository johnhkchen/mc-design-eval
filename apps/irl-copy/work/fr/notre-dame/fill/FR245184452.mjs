// FR245184452: a commercial block on the Île de la Cité's quais, four storeys of pale limestone under a stepped
// mansard. The lidar roof is smoothed (3x3 median) and cut into flat tiers (19, 14, 9, 4 blocks). The facade is a
// two-cell shell: windows are glass with a one-cell air gap behind them (warm glowstone in some), and the interior
// is solid with a floor slab per storey, so nothing floats. Shopfront and a door sit on the lowest tall facade.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${HERE}/FR245184452.cells.json`, "utf8"));

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const k = (x, z) => `${x},${z}`;
const lidar = new Map(cells.map(([x, z, ground, roof]) => [k(x, z), { x, z, ground, roof }]));

// Massing: the 3x3 median of the lidar roof (cells under 2 blocks carry no building), cut into flat tiers.
const tierOf = (r) => (r >= 17 ? 19 : r >= 12 ? 14 : r >= 7 ? 9 : 4);
const B = new Map();
for (const { x, z, ground, roof } of lidar.values()) {
  if (roof < 2) continue;
  const near = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = lidar.get(k(x + dx, z + dz));
    if (n && n.roof >= 2) near.push(n.roof);
  }
  near.sort((a, b) => a - b);
  B.set(k(x, z), { x, z, ground, top: tierOf(near[near.length >> 1]), e: 3, out: null });
}

// Shell: e=1 is the facade (outside the footprint, or beside a lower tier), e=2 the cell just inside it.
for (const c of B.values()) {
  for (const [dx, dz] of DIRS) {
    const n = B.get(k(c.x + dx, c.z + dz));
    if (!n || n.top < c.top) { c.e = 1; c.out = [dx, dz]; break; }
  }
}
for (const c of B.values()) {
  if (c.e !== 3) continue;
  for (const [dx, dz] of DIRS) {
    const n = B.get(k(c.x + dx, c.z + dz));
    if (n && n.e === 1) { c.e = 2; break; }
  }
}

// Each facade cell's coordinate along its face: windows are two cells wide, every fourth cell a pier.
const coordOf = (c) => (c.out[0] !== 0 ? c.z : c.x);
const isOpening = (c) => coordOf(c) % 4 === 1 || coordOf(c) % 4 === 2;
const paneProps = (c) => (c.out[0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });

// The entrance: the middle of the facade on the footprint's low (north, z = 0) side.
const doorCands = [...B.values()].filter((c) => c.e === 1 && c.out[1] === -1 && c.top >= 9).sort((a, b) => a.x - b.x);
const door = doorCands.length ? doorCands[doorCands.length >> 1] : null;
const doorFacing = door ? "north" : null;

// The air gap: each interior cell behind a facade window, so the glass shows a room.
const gap = new Map();
for (const c of B.values()) {
  if (c.e !== 1) continue;
  const [dx, dz] = c.out;
  const inner = B.get(k(c.x - dx, c.z - dz));
  if (inner && inner.e === 2) {
    const list = gap.get(k(inner.x, inner.z)) || [];
    list.push(c);
    gap.set(k(inner.x, inner.z), list);
  }
}

const cornice = (c) => (c.top === 19 ? 15 : c.top - 1);

function blockAt(c, y) {
  const cor = cornice(c);
  if (y < c.ground) return ["stone_bricks"];                   // foundation under the lidar ground
  if (c.e === 1) {
    if (y === 0) return ["stone_bricks"];                      // plinth
    if (y > cor) return null;
    if (y === cor) return ["stone_brick_slab", { type: "bottom", waterlogged: "false" }];   // cornice
    if (y % 5 === 0) return ["stone_bricks"];                  // storey string course
    if (y % 5 <= 3 && isOpening(c)) {
      if (c === door && y <= 2) {
        return y === 1
          ? ["dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" }]
          : ["dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" }];
      }
      if (y < 5) return ["glass"];                             // shopfront glazing, ground storey
      return ["glass_pane", paneProps(c)];
    }
    return ["calcite"];
  }
  // e >= 2: the mansard (stepped back at 15 and 17) on the 19-tier, a flat cap on the others
  if (c.top === 19 && y >= 15) return y <= (c.e === 2 ? 16 : 18) ? ["deepslate_tiles"] : null;
  if (y === c.top - 1) return ["smooth_stone"];                // flat roof deck
  if (c.e === 2 && y % 5 >= 1 && y % 5 <= 3 && y < cor) {
    const srcs = gap.get(k(c.x, c.z)) || [];
    if (srcs.some((s) => s === door || isOpening(s))) {
      return y % 5 === 2 && (c.x * 3 + c.z * 5) % 3 === 0 ? ["glowstone"] : null;
    }
  }
  if (y % 5 === 0 && y > 0) return ["smooth_stone"];          // floor slab per storey
  return ["calcite"];
}

const g = new Voxels([27, 35, 17]);
for (const c of B.values()) {
  for (let y = 0; y < c.top; y++) {
    const r = blockAt(c, y);
    if (r) g.set(c.x, y, c.z, r[0], r[1]);
  }
}

// Two chimney stacks on the mansard's top, and one on the 19-tier's stepped-back attic.
for (const cx of [5, 13, 21]) {
  const cand = [...B.values()].filter((c) => c.top === 19 && c.e >= 3 && Math.abs(c.x - cx) <= 1)
    .sort((a, b) => Math.abs(a.z - 8) - Math.abs(b.z - 8))[0];
  if (!cand) continue;
  for (let y = 19; y <= 21; y++) g.set(cand.x, y, cand.z, "stone_bricks");
  g.set(cand.x, 22, cand.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${HERE}/FR245184452.nbt`);
console.log("FR245184452 built:", g.count(), "blocks");
