import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001564";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 6, H = 26, D = 11;
const g = new Voxels([W, H, D]);

const inside = (x, y, z) => x >= 0 && x < W && z >= 0 && z < D && y >= 0 && y < H;
const put = (x, y, z, id, props) => {
  if (!inside(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const rows = cells.map(([x, z, g0, r]) => ({ x, z, g0: Math.round(g0), r: Math.round(r) }));
const footprint = new Set(rows.map(c => `${c.x},${c.z}`));
const has = (x, z) => footprint.has(`${x},${z}`);
const cellAt = (x, z) => rows.find(c => c.x === x && c.z === z);

const DIRS = [
  { dx: 1, dz: 0 },
  { dx: -1, dz: 0 },
  { dx: 0, dz: 1 },
  { dx: 0, dz: -1 },
];

// One common roofline (median of lidar roof heights) so the massing has clean tiers, not jagged tops
const sortedR = rows.map(c => c.r).sort((a, b) => a - b);
const TOP = sortedR[Math.floor(sortedR.length / 2)];

// Per-cell plan: storey slab rows sit on a common 2-block grid that ends under the cornice
const plan = rows.map(c => {
  const gT = Math.max(TOP - 2, c.g0 + 2); // cornice band rows gT and gT+1
  const S = [c.g0];
  for (let y = gT; y > c.g0; y -= 2) S.push(y);
  return { ...c, gT, S, slabs: new Set(S) };
});

// Pass 1: foundation, floor slabs, roof deck
for (const c of plan) {
  for (let y = 0; y < c.g0; y++) put(c.x, y, c.z, "stone_bricks");
  for (const y of c.S) put(c.x, y, c.z, "smooth_stone");
  put(c.x, c.gT, c.z, "gray_concrete"); // roof deck
}

// Pass 2: perimeter walls
let chimneyCell = null;
for (const c of plan) {
  const out = DIRS.filter(d => !has(c.x + d.dx, c.z + d.dz));
  if (out.length === 0) {
    if (!chimneyCell || c.gT > chimneyCell.gT) chimneyCell = c;
    continue;
  }
  const corner = out.length > 1;
  const zWall = out.some(d => d.dz !== 0); // wall runs along x
  const t = zWall ? c.x : c.z;
  const outDir = out[0];

  for (let y = c.g0; y <= c.gT + 1; y++) {
    if (y >= c.gT) {
      put(c.x, y, c.z, "stone_bricks"); // cornice band and solid parapet
    } else if (y === c.g0) {
      put(c.x, y, c.z, "stone_bricks"); // base course
    } else if (c.slabs.has(y)) {
      put(c.x, y, c.z, "smooth_stone"); // storey string course
    } else if (corner || t % 3 === 0) {
      put(c.x, y, c.z, "bricks"); // pier; windows come in pairs between piers
    } else {
      put(c.x, y, c.z, "glass_pane");
      // warm light behind some glass, in the air gap
      const off = y - c.g0;
      if (off >= 3 && ((c.x * 5 + c.z * 3 + off) % 5 === 0)) {
        const ix = c.x - outDir.dx, iz = c.z - outDir.dz;
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }
}

// Front entrance on the lowest-z street wall, centred, flanked by piers, with a lintel
const zMin = Math.min(...rows.map(c => c.z));
const mid = (W - 1) / 2;
const doorCands = plan
  .filter(c => c.z === zMin && !has(c.x, c.z - 1) && has(c.x - 1, c.z) && has(c.x + 1, c.z))
  .sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));

if (doorCands.length) {
  const d = doorCands[0];

  // Flanking piers on the same wall
  for (const dx of [-1, 1]) {
    const n = cellAt(d.x + dx, d.z);
    if (n && !has(n.x, n.z - 1)) {
      for (let y = n.g0 + 1; y <= Math.min(n.g0 + 3, n.gT - 1); y++) put(n.x, y, n.z, "bricks");
    }
  }

  // Door (two blocks tall) in a stone surround
  put(d.x, d.g0 + 1, d.z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, d.g0 + 2, d.z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel over the door
  put(d.x, d.g0 + 3, d.z, "stone_bricks");
  // Lit vestibule behind the door
  if (has(d.x, d.z + 1)) put(d.x, d.g0 + 1, d.z + 1, "lantern", { hanging: "false" });
}

// Rooftop chimney on an interior cell of the roof
if (chimneyCell) {
  const { x, z, gT } = chimneyCell;
  put(x, gT + 2, z, "bricks");
  put(x, gT + 3, z, "bricks");
  put(x, gT + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
