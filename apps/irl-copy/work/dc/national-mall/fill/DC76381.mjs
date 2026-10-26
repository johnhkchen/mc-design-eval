// DC76381: a Neoclassical office block of the Federal Triangle sort (limestone, 1910s-30s, Height Act scale).
// Three tiers from the lidar: a 6-high wing, a 10-high three-storey ring, and a 12-high core with an attic row.
// The 13s in the lidar are isolated spikes inside the core, so they are smoothed into it.
// Each storey is 3 blocks: a string course (floor slab) and two rows of windows. The shell is one cell deep,
// with air behind the glass and a floor slab per storey, so nothing is solid inside but the floors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const X = 20, Z = 23, H = 25;
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${dir}/DC76381.cells.json`, "utf8"));

// roof[z][x] = height above y0 (0 = outside the footprint); 13 joins the 12 core
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, , r] of cells) roof[z][x] = Math.min(r, 12);

const R = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : roof[z][x]);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];                  // N S W E
// a face of (x, z) at height y is open to the street when the neighbour there is outside or lower than y
const open = (x, z, y, [dx, dz]) => R(x + dx, z + dz) <= y;

const plan = new Map();
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => plan.set(key(x, y, z), { x, y, z, block, state });

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const r = roof[z][x]; if (!r) continue;
  for (let y = 0; y < r; y++) {
    const kind = y === 0 ? "base" : y === r - 1 ? "top" : y % 3 === 0 ? "slab" : "win";
    const faces = DIRS.filter((d) => open(x, z, y, d));
    if (!faces.length) {                                          // inside the mass: floors and the roof plate, air behind glass
      if (kind !== "win") put(x, y, z, kind === "base" ? "stone_bricks" : "smooth_stone");
      continue;
    }
    const alongX = faces.some(([dx]) => dx === 0);                // exposed on a north or south face: the wall runs along x
    const corner = faces.some(([dx]) => dx === 0) && faces.some(([, dz]) => dz === 0);
    const along = alongX ? x : z;
    const pilaster = corner || along % 3 === 0;                   // a pilaster every third cell, and at each corner
    // the entrance: a double iron door on the north face, between calcite jambs
    const door = z === 0 && (x === 8 || x === 9) && (y === 1 || y === 2);
    const jamb = z === 0 && (x === 7 || x === 10) && (y === 1 || y === 2);
    if (door) {
      put(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (jamb) { put(x, y, z, "calcite"); continue; }
    if (kind === "base") put(x, y, z, "stone_bricks");
    else if (kind === "slab") put(x, y, z, pilaster ? "calcite" : "smooth_stone");
    else if (kind === "top") put(x, y, z, "smooth_stone");        // cornice
    else if (pilaster) put(x, y, z, "calcite");
    else put(x, y, z, "glass_pane");

    // a warm light behind about one window in seven: glowstone in the air cell just inside the glass
    if (kind === "win" && !pilaster) {
      const [dx, dz] = faces[0], ix = x - dx, iz = z - dz;
      if (R(ix, iz) > y && DIRS.every((d) => !open(ix, iz, y, d)) && (along + 2 * y) % 7 === 0)
        put(ix, y, iz, "glowstone");
    }
  }
}

// the parapet: a wall of stone brick on the outer edge of each tier, standing on its cornice
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const r = roof[z][x]; if (!r) continue;
  if (DIRS.some(([dx, dz]) => R(x + dx, z + dz) < r)) put(x, r, z, "stone_brick_wall", {});
}

// roof equipment: a calcite plant box on the core roof, two lanterns on it
for (let z = 9; z <= 10; z++) for (let x = 9; x <= 10; x++) {
  if (roof[z][x] !== 12) throw new Error(`plant box cell ${x},${z} is not on the core roof`);
  put(x, 12, z, "calcite");
}
put(9, 13, 9, "lantern", { hanging: "false" });
put(10, 13, 10, "lantern", { hanging: "false" });

// connections: panes and walls join whatever stands beside them in the plane (glowstone does not connect)
const joins = (x, y, z) => { const p = plan.get(key(x, y, z)); return !!p && p.block !== "glowstone"; };
for (const p of plan.values()) {
  const { x, y, z } = p;
  const link = (dx, dz) => (joins(x + dx, y, z + dz) ? "true" : "false");
  if (p.block === "glass_pane") {
    p.state = { north: link(0, -1), south: link(0, 1), west: link(-1, 0), east: link(1, 0) };
  } else if (p.block === "stone_brick_wall") {
    const low = (dx, dz) => (joins(x + dx, y, z + dz) ? "low" : "none");
    p.state = { up: "true", north: low(0, -1), south: low(0, 1), west: low(-1, 0), east: low(1, 0) };
  }
}

const g = new Voxels([X, H, Z]);
for (const p of plan.values()) g.set(p.x, p.y, p.z, p.block, p.state);
const out = g.save(`${dir}/DC76381.nbt`);
console.log(`DC76381.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
