import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const W = 12, H = 17, D = 13;
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335854.cells.json", "utf8"));
const g = new Voxels([W, H, D]);

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const key = (x, z) => `${x},${z}`;

const cellMap = new Map();
for (const [x, z, ground, roof] of cells) {
  cellMap.set(key(x, z), { ground: Math.round(ground), roof: Math.round(roof) });
}
const inside = (x, z) => cellMap.has(key(x, z));

// Main roof tier = median lidar roof. Only a tier that covers a real cluster
// of cells (>= 6) becomes a setback; lidar noise is absorbed into the main tier.
const roofVals = [...cellMap.values()].map(c => c.roof).sort((a, b) => a - b);
const Rb = roofVals[Math.floor(roofVals.length / 2)];
const tierCount = new Map();
for (const c of cellMap.values()) {
  if (Math.abs(c.roof - Rb) >= 2) tierCount.set(c.roof, (tierCount.get(c.roof) || 0) + 1);
}
const realTiers = new Set([...tierCount.entries()].filter(([, n]) => n >= 6).map(([r]) => r));

const setSafe = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Per-cell geometry
const info = new Map();
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const c = cellMap.get(key(x, z));
  const gr = clamp(c.ground, 0, H - 8);
  const r = realTiers.has(c.roof) ? c.roof : Rb;
  const R = clamp(r, gr + 4, H - 4);
  const exposedZ = !inside(x, z - 1) || !inside(x, z + 1);
  const exposedX = !inside(x - 1, z) || !inside(x + 1, z);
  info.set(key(x, z), { x, z, g: gr, R, exposedZ, exposedX, perim: exposedZ || exposedX, floorYs: [] });
}

// Pass 1: foundations, walls, interior air, storey floors, roof deck
for (const cell of info.values()) {
  const { x, z, g: gr, R, exposedZ, exposedX, perim } = cell;
  for (let y = 0; y < gr; y++) setSafe(x, y, z, "stone_bricks");

  const floorYs = [];
  for (let fy = gr + 2; fy < R - 2; fy += 2) floorYs.push(fy);
  cell.floorYs = floorYs;

  if (perim) {
    const corner = exposedZ && exposedX;
    const windowCol = corner ? false
      : exposedZ ? (x % 3 !== 0)
      : (z % 3 !== 0);
    for (let y = gr; y <= R - 1; y++) {
      let id = "bricks", props = null;
      if (y === gr) id = "stone_bricks";
      else if (y === R - 1) id = "bricks";
      else if (y === R - 2) id = "smooth_stone";
      else if (floorYs.includes(y)) id = "smooth_stone";
      else if (windowCol) {
        id = "glass_pane";
        props = exposedZ && !exposedX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      }
      setSafe(x, y, z, id, props);
    }
  } else {
    for (const fy of floorYs) setSafe(x, fy, z, "smooth_stone");
  }
  setSafe(x, R - 1, z, perim ? "bricks" : "stone");
}

// Pass 2: warm lights behind some windows (inside neighbour cell)
for (const cell of info.values()) {
  if (!cell.perim) continue;
  const { x, z, g: gr, R, exposedZ, exposedX } = cell;
  if (exposedZ && exposedX) continue;
  let ix = 0, iz = 0;
  if (exposedZ && !exposedX) iz = inside(x, z + 1) ? 1 : -1;
  else if (exposedX && !exposedZ) ix = inside(x + 1, z) ? 1 : -1;
  const windowCol = exposedZ ? (x % 3 !== 0) : (z % 3 !== 0);
  if (!windowCol || (ix === 0 && iz === 0)) continue;
  for (let y = gr + 1; y < R - 2; y++) {
    if (cell.floorYs.includes(y)) continue;
    if (((x * 3 + z * 5 + y) % 7) !== 0) continue;
    if (!inside(x + ix, z + iz)) continue;
    setSafe(x + ix, y, z + iz, "glowstone");
  }
}

// Pass 3: entrance on the street face, with stone surround and canopy band
let door = null;
for (const cell of info.values()) {
  if (cell.exposedZ && !cell.exposedX) {
    if (!door || cell.z < door.z || (cell.z === door.z && Math.abs(cell.x - W / 2) < Math.abs(door.x - W / 2))) {
      door = cell;
    }
  }
}
if (door && door.g + 3 < door.R - 1) {
  const { x, z, g: gr } = door;
  const facing = inside(x, z - 1) ? "south" : "north";
  // stone surround: jambs and lintel
  for (const px of [x - 1, x + 1]) {
    if (!inside(px, z)) continue;
    setSafe(px, gr + 1, z, "stone_bricks");
    setSafe(px, gr + 2, z, "stone_bricks");
    setSafe(px, gr + 3, z, "stone_bricks");
  }
  setSafe(x, gr + 3, z, "stone_bricks");
  setSafe(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  setSafe(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // canopy band as a bottom-half slab course above the door
  for (const px of [x - 1, x, x + 1]) {
    if (inside(px, z)) setSafe(px, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 4: at most two low rooftop bulkheads on the interior roof, away from the edges
let bulkheads = 0;
for (const cell of info.values()) {
  if (cell.perim || bulkheads >= 2) continue;
  const { x, z, R } = cell;
  if (x >= 3 && x <= 8 && z >= 4 && z <= 8 && ((x * 5 + z * 3) % 13) === 0 && R + 1 < H) {
    setSafe(x, R, z, "bricks");
    setSafe(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    bulkheads++;
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335854.nbt");
