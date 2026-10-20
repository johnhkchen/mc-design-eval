import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 28 Old Fulton Street, Fulton Ferry Historic District.
// 1894 multi-family elevator building: red brick walls on a stone base,
// stone sill and lintel bands per storey, paired windows divided by brick
// mullions, a stone parapet, and a street-level stone-framed entrance.
// Storeys are 3 blocks (a spandrel row plus two glass rows).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001475";
const W = 36, H = 39, D = 26;
const MAX_TOP = H - 1;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;

// Raw lidar per cell.
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  raw.set(key(x, z), { gr: Math.max(0, Math.round(gr)), roof: Math.round(rf) });
}
const hasRaw = (x, z) => raw.has(key(x, z));

// Smooth roof: median of the 3x3 footprint neighbourhood, snapped to storeys.
const cm = new Map();
for (const [k, { gr, roof }] of raw) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      if (hasRaw(x + dx, z + dz)) vals.push(raw.get(key(x + dx, z + dz)).roof);
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let n = Math.round((med - gr) / 3);
  n = Math.max(2, Math.min(9, n));
  let top = gr + 3 * n;
  if (top > MAX_TOP) top = MAX_TOP;
  cm.set(k, { gr, top });
}
const has = (x, z) => cm.has(key(x, z));
const getc = (x, z) => cm.get(key(x, z));

const SIDES = [
  { dx: 0, dz: -1, facing: "north", axis: "x" }, // street side (low z)
  { dx: 0, dz: 1, facing: "south", axis: "x" },
  { dx: 1, dz: 0, facing: "east", axis: "z" },
  { dx: -1, dz: 0, facing: "west", axis: "z" },
];

// A side is exposed at height y if there is no footprint cell beyond it,
// or the neighbour is lower there (a setback face) or not yet started.
const exposedSides = (x, z, y) =>
  SIDES.filter(s => {
    const nb = getc(x + s.dx, z + s.dz);
    if (!nb) return true;
    return nb.top <= y || nb.gr > y;
  });

const glowCells = [];
const doorCandidates = [];

for (const [k, { gr, top }] of cm) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to street level.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top; y++) {
    // Parapet on true building edges only.
    if (y === top) {
      if (SIDES.some(s => !has(x + s.dx, z + s.dz))) g.set(x, y, z, "stone_bricks");
      continue;
    }

    const faces = exposedSides(x, z, y);
    const ring = faces.length > 0;

    if (!ring) {
      // Interior: floor slabs per storey and a roof deck; air between.
      if (y === top - 1) g.set(x, y, z, "stone");
      else if ((y - gr) % 3 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (faces.some(f => f.dz === -1) && y === gr && !has(x, z - 1)) {
      doorCandidates.push({ x, z, gr });
    }

    if (faces.length >= 2) {
      g.set(x, y, z, "stone_bricks"); // corner pilaster
      continue;
    }

    const face = faces[0];
    const off = (y - gr) % 3;
    const s = Math.floor((y - gr) / 3);

    if (off === 0) {
      g.set(x, y, z, "stone_bricks"); // sill / lintel band
      continue;
    }

    const u = face.axis === "x" ? x : z;
    if (u % 3 === 0) {
      g.set(x, y, z, "bricks"); // brick mullion
      continue;
    }

    const alongX = face.axis === "x";
    g.set(x, y, z, "glass_pane", {
      north: alongX ? "false" : "true",
      south: alongX ? "false" : "true",
      east: alongX ? "true" : "false",
      west: alongX ? "true" : "false",
      waterlogged: "false",
    });

    // Warm light behind some windows, standing on the interior floor slab.
    if (off === 1 && ((x * 7 + z * 13 + s * 5) % 6 === 0)) {
      const ix = x - face.dx, iz = z - face.dz;
      const inner = getc(ix, iz);
      if (inner && inner.top > y + 1 && inner.gr <= y &&
          exposedSides(ix, iz, y + 1).length === 0) {
        glowCells.push([ix, y + 1, iz]);
      }
    }
  }
}

// Street entrance: stone-framed bay with a door on the lowest street-side cell.
if (doorCandidates.length) {
  const minZ = Math.min(...doorCandidates.map(c => c.z));
  const row = doorCandidates.filter(c => c.z === minZ).sort((a, b) => a.x - b.x);
  const pick = row[Math.floor(row.length / 2)];
  const { x, z, gr } = pick;

  // Stone surround: flanking jambs and lintel over the door.
  for (const dx of [-1, 1]) {
    if (!has(x + dx, z)) continue;
    for (let y = gr; y <= gr + 2; y++) g.set(x + dx, y, z, "stone_bricks");
  }
  for (let dx = -1; dx <= 1; dx++) {
    if (!has(x + dx, z)) continue;
    g.set(x + dx, gr + 2, z, "stone_bricks");
    g.set(x + dx, gr + 3, z, "stone_bricks");
  }

  // Door (replaces the glass/mullion at street level).
  g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 2, z, "stone_bricks");
}

for (const [x, y, z] of glowCells) g.set(x, y, z, "glowstone");

g.save(`${DIR}/${ID}.nbt`);
