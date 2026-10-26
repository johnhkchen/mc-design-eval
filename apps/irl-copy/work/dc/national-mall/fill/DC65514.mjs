import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 730 12th St NW: mid-century (c. 1960s) Commercial-Office, ~6 storeys.
// Pale calcite pilasters, light-concrete spandrels, tinted office glass,
// stone base course, smooth-stone cornice, lit lobby bay, rooftop penthouse.
// Shell is one cell thick with a one-cell air gap behind the glass, then a solid core.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC65514.cells.json`, "utf8"));

const W = 20, H = 32, D = 22;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const cmap = new Map();
for (const [x, z, gr, rf] of cells) cmap.set(key(x, z), { gr: Math.round(gr), rf: Math.round(rf) });

const has = (x, z) => cmap.has(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Depth from the outer skin (0 = perimeter), via BFS over footprint cells.
const depth = new Map();
{
  const queue = [];
  for (const [x, z] of cmap.keys().map(k => k.split(",").map(Number))) {
    if (isEdge(x, z)) { depth.set(key(x, z), 0); queue.push([x, z]); }
  }
  while (queue.length) {
    const [x, z] = queue.shift();
    const d = depth.get(key(x, z));
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (has(nx, nz) && !depth.has(key(nx, nz))) {
        depth.set(key(nx, nz), d + 1);
        queue.push([nx, nz]);
      }
    }
  }
}

// Smooth lidar roofs into one flat parapet line (median, clamped).
const roofs = cells.map(c => Math.round(c[3])).sort((a, b) => a - b);
let T = roofs[Math.floor(roofs.length / 2)];
T = Math.max(12, Math.min(26, T));

// Deterministic pseudo-random for lit windows and lamps.
const hash = (x, y, z) => Math.abs(Math.imul(x * 7 + y * 13 + z * 31, 2654435761)) % 97;

// Lobby entrance: street face (min z), nearest to centre.
let door = null;
{
  const pool = cells
    .map(([x, z]) => ({ x, z }))
    .filter(c => isEdge(c.x, c.z));
  const streetFace = pool.filter(c => !has(c.x, c.z - 1));
  const cand = (streetFace.length ? streetFace : pool)
    .sort((a, b) => Math.abs(a.x - W / 2) - Math.abs(b.x - W / 2));
  if (cand.length) {
    const c = cand[0];
    let facing = "north";
    if (!has(c.x, c.z - 1)) facing = "north";
    else if (!has(c.x, c.z + 1)) facing = "south";
    else if (!has(c.x - 1, c.z)) facing = "west";
    else facing = "east";
    door = { ...c, facing };
  }
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const { gr: gy } = cmap.get(key(x, z));
  const base = Math.max(0, gy);

  // 1. Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  // 2. Flat top at T (never below base+3).
  const top = Math.min(H - 4, Math.max(T, base + 3));
  const edge = isEdge(x, z);
  const d = depth.get(key(x, z)) ?? 0;

  // Solid core behind the air gap, so the glass has something to reflect and block the sky.
  if (!edge && d >= 2) {
    for (let y = base; y < top - 1; y++) g.set(x, y, z, "light_gray_concrete");
    g.set(x, top - 1, z, "light_gray_concrete"); // roof deck
    continue;
  }

  for (let y = base; y < top; y++) {
    const fromTop = top - y;

    // Cornice / roof deck on the top course.
    if (y === top - 1) {
      g.set(x, y, z, edge ? "smooth_stone" : "light_gray_concrete");
      continue;
    }

    if (!edge) {
      // Depth-1 air gap: floor slabs at storey lines, occasional lamps on the floor.
      if (y > base && fromTop % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if (y - 1 > base && (fromTop % 3) === 1 && hash(x, y, z) % 7 === 0) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter facade.
    if (y === base) {
      g.set(x, y, z, "stone_bricks"); // base course
    } else if (y < base + 3) {
      // Ground-floor glazing with calcite piers.
      g.set(x, y, z, (x + z) % 3 === 0 ? "calcite" : "light_blue_stained_glass_pane");
    } else if (fromTop % 3 === 0) {
      g.set(x, y, z, "light_gray_concrete"); // storey spandrel band
    } else {
      if ((x + z) % 3 === 0) {
        g.set(x, y, z, "calcite"); // pilaster
      } else if (hash(x, y, z) % 11 === 0) {
        g.set(x, y, z, "yellow_stained_glass_pane"); // lit office
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
      }
    }
  }
}

// 3. Lit lobby bay: calcite surround, door, lintel, and flanking lanterns.
if (door) {
  const gy = Math.max(0, cmap.get(key(door.x, door.z)).gr);
  if (T - gy > 4) {
    const alongX = door.facing === "north" || door.facing === "south";
    const side = alongX ? [[door.x - 1, door.z], [door.x + 1, door.z]] : [[door.x, door.z - 1], [door.x, door.z + 1]];

    // Calcite jambs and lintel across the bay.
    for (const [sx, sz] of [[door.x, door.z], ...side]) {
      if (!has(sx, sz) || !isEdge(sx, sz)) continue;
      g.set(sx, gy + 2, sz, "calcite");
    }

    // Door, two blocks tall.
    g.set(door.x, gy, door.z, "oak_door", {
      facing: door.facing, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(door.x, gy + 1, door.z, "oak_door", {
      facing: door.facing, half: "upper", hinge: "left", open: "false", powered: "false",
    });

    // Lanterns standing on the base course beside the door, for a warm street-level read.
    for (const [sx, sz] of side) {
      if (!has(sx, sz) || !isEdge(sx, sz)) continue;
      g.set(sx, gy + 1, sz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 4. Rooftop penthouse on the interior core.
const pTop = T + 2;
if (pTop < H - 1) {
  for (let x = 6; x <= 13; x++) {
    for (let z = 8; z <= 13; z++) {
      if (!has(x, z) || isEdge(x, z)) continue;
      const ring = x === 6 || x === 13 || z === 8 || z === 13;
      for (let y = T; y <= T + 1; y++) {
        if (ring) g.set(x, y, z, "light_gray_concrete");
      }
      g.set(x, pTop, z, "smooth_stone");
    }
  }
  // Mechanical grilles on the penthouse roof.
  for (let x = 8; x <= 11; x += 3) {
    for (let z = 10; z <= 11; z++) {
      if (has(x, z) && !isEdge(x, z) && pTop + 1 < H) g.set(x, pTop + 1, z, "iron_bars");
    }
  }
}

g.save(`${DIR}/DC65514.nbt`);
