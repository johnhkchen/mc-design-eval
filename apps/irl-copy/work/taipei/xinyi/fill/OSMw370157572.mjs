import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370157572";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 31, H = 159, D = 28;
const g = new Voxels([W, H, D]);

// Formosa B: residential/mixed tower of the Xinyi district. Glazed 4-storey podium
// with shopfronts, a shaft to y 130, a setback tier to the roof at 147, a small
// penthouse, and a spire. Storeys are 5 blocks; floor slabs sit on multiples of 5.
const PODIUM = 20;
const SETBACK = 130;
const ROOF = 147;
const PENT_TOP = 151;
const ANT_TOP = 158;

const key = (x, z) => `${x},${z}`;
const groundAt = new Map();
for (const [x, z, gr] of cells) groundAt.set(key(x, z), gr);
const inside = (x, z) => groundAt.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Depth = BFS steps from the outer edge (edge cells = 0). Nested setbacks follow from it,
// so every tier stands on the one below.
const depth = new Map();
const queue = [];
for (const [x, z] of cells) {
  if (NB.some(([dx, dz]) => !inside(x + dx, z + dz))) {
    depth.set(key(x, z), 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    const k = key(nx, nz);
    if (inside(nx, nz) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const depthOf = (x, z) => depth.get(key(x, z)) ?? 0;
const outsideCount = (x, z) => NB.filter(([dx, dz]) => !inside(x + dx, z + dz)).length;

// Entrance: outer-edge cell on the lowest-z side, near the middle of its x run.
const entrance = (() => {
  const edge = cells.filter(([x, z]) => depthOf(x, z) === 0);
  const minZ = Math.min(...edge.map(([, z]) => z));
  const row = edge.filter(([, z]) => z === minZ).map(([x]) => x).sort((a, b) => a - b);
  return { x: row[Math.floor(row.length / 2)], z: minZ };
})();

// Spire axis: the cell nearest the centroid of the penthouse zone.
const spire = (() => {
  const core = cells.filter(([x, z]) => depthOf(x, z) >= 6);
  const pool = core.length ? core : cells;
  const cx = pool.reduce((s, [x]) => s + x, 0) / pool.length;
  const cz = pool.reduce((s, [, z]) => s + z, 0) / pool.length;
  let best = Infinity, pick = null;
  for (const [x, z] of pool) {
    const dd = Math.abs(x - cx) + Math.abs(z - cz);
    if (dd < best) { best = dd; pick = { x, z }; }
  }
  return pick;
})();

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks");

  const d = depthOf(x, z);
  const corner = d === 0 && outsideCount(x, z) >= 2;

  for (let y = gr + 1; y <= PENT_TOP && y < H; y++) {
    let dmin;
    if (y <= SETBACK) dmin = 0;
    else if (y <= ROOF) dmin = 3;
    else dmin = 6;
    if (d < dmin) continue;

    const perimeter = d === dmin;
    const podium = y <= PODIUM;

    // Roof cap and penthouse cap.
    if (y === ROOF) {
      g.set(x, y, z, d === 3 ? "smooth_quartz" : "white_concrete");
      continue;
    }
    if (y === PENT_TOP) {
      g.set(x, y, z, "smooth_quartz");
      continue;
    }
    // Penthouse ceiling slab.
    if (y === 150) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    // Storey floor slabs every 5 blocks, across the full tier. Perimeter storey lines
    // are a stone band with a lighter lip so the floors read from the street.
    if (y % 5 === 0 && y <= ROOF) {
      let id;
      if (perimeter) id = podium ? "smooth_quartz" : "light_gray_concrete";
      else id = podium ? "smooth_quartz" : "white_concrete";
      g.set(x, y, z, id);
      continue;
    }

    if (!perimeter) {
      // Air gap behind the facade. Warm lights sit in the second bay behind glass.
      if (d === dmin + 1 && y % 5 === 2 && (x + z) % 4 === 1 && y > gr + 4 && y < ROOF - 1) {
        g.set(x, y, z, "glowstone");
      }
      continue;
    }

    // Perimeter facade.
    if (corner) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (podium && y === gr + 1) {
      g.set(x, y, z, "polished_granite");                        // base course
    } else if (podium && y <= gr + 4) {
      g.set(x, y, z, (x + z) % 3 === 0 ? "black_concrete" : "light_blue_stained_glass"); // shopfront
    } else if (y % 5 >= 1 && y % 5 <= 3) {
      // Window band: glazing with light-gray mullions every third bay.
      // Every fourth bay of the upper tower gets a dark glass pier so the wall reads in bays.
      if ((x + z) % 3 === 0) g.set(x, y, z, "light_gray_concrete");
      else if (!podium && (x + z) % 12 === 5) g.set(x, y, z, "gray_concrete");
      else g.set(x, y, z, "light_blue_stained_glass");
    } else {
      // Spandrel below each storey line.
      g.set(x, y, z, podium ? "smooth_quartz" : "white_concrete");
    }
  }

  // Parapet on the setback roof edge.
  if (d === 3) g.set(x, ROOF + 1, z, "smooth_quartz");
}

// Rooftop plant on the setback roof, standing on the roof cap at 147.
for (const [x, z] of cells) {
  const d = depthOf(x, z);
  if (d >= 4 && d <= 5 && (x + z) % 3 === 0) {
    g.set(x, ROOF + 1, z, "light_gray_concrete");
    g.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// Entrance: three-bay glazed lobby with granite reveals, a canopy, and a lit lobby behind.
for (const [x, z, gr] of cells) {
  const d = depthOf(x, z);
  if (d > 1) continue;
  const dx = Math.abs(x - entrance.x);
  const inRow = z >= entrance.z && z <= entrance.z + 1;
  if (!inRow) continue;

  if (dx <= 1 && d === 0) {
    // Glazed doors, with a granite threshold.
    g.set(x, gr + 1, z, "polished_granite");
    g.set(x, gr + 2, z, "glass");
    g.set(x, gr + 3, z, "glass");
  }
  if (dx === 2 && d === 0) {
    // Door reveals.
    g.set(x, gr + 1, z, "polished_granite");
    g.set(x, gr + 2, z, "polished_granite");
    g.set(x, gr + 3, z, "polished_granite");
  }
  if (dx <= 2) {
    // Canopy over the entrance, one slab deep across the first two cells.
    g.set(x, gr + 4, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  }
  if (dx === 0 && d === 1) {
    // Lobby light behind the doors.
    g.set(x, gr + 2, z, "glowstone");
  }
}

// Spire: lightning rod on the penthouse, shroomlights on the penthouse corners.
{
  const { x, z } = spire;
  for (let y = PENT_TOP + 1; y <= ANT_TOP; y++) g.set(x, y, z, "lightning_rod");
}
for (const [x, z] of cells) {
  if (depthOf(x, z) === 6 && outsideCount(x, z) >= 2) {
    g.set(x, PENT_TOP + 1, z, "shroomlight");
  }
}

g.save(`${DIR}/${ID}.nbt`);
