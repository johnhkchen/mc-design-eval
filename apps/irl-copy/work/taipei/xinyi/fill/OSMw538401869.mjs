import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401869.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538401869.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 22, H = 23, D = 18;
const ROOF = 11;          // roof deck surface from lidar record (~11 blocks above lowest ground)
const g = new Voxels([W, H, D]);

const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, Math.round(gr));
const inFoot = (x, z) => gmap.has(`${x},${z}`);
const groundAt = (x, z) => gmap.get(`${x},${z}`);

// Faces missing a neighbour => exterior faces
function missingFaces(x, z) {
  const m = [];
  if (!inFoot(x, z - 1)) m.push("N");
  if (!inFoot(x, z + 1)) m.push("S");
  if (!inFoot(x - 1, z)) m.push("W");
  if (!inFoot(x + 1, z)) m.push("E");
  return m;
}
const isEdge = (x, z) => missingFaces(x, z).length > 0;

const OUTWARD = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const FACING = { N: "north", S: "south", W: "west", E: "east" };

// Entrance: outward-facing edge cell on the lowest-z (north-most) street face, near centre x
let entry = null;
let best = Infinity;
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const mf = missingFaces(x, z);
  if (!mf.includes("N")) continue;
  const score = z * 1000 + Math.abs(x - W / 2);
  if (score < best) { best = score; entry = { x, z, face: "N" }; }
}
if (!entry) {
  // fallback: any edge cell
  for (const [x, z] of cells) {
    if (isEdge(x, z)) { entry = { x, z, face: missingFaces(x, z)[0] }; break; }
  }
}

const glassPane = (face) => {
  const ns = face === "N" || face === "S";
  return {
    north: ns ? "true" : "false",
    south: ns ? "true" : "false",
    east: ns ? "false" : "true",
    west: ns ? "false" : "true",
    waterlogged: "false",
  };
};

// 1) Foundations, walls, floors, roof, interiors per footprint cell
for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (isEdge(x, z)) {
    const mf = missingFaces(x, z);
    const corner = mf.length >= 2;
    const face = mf[0];
    const along = (face === "N" || face === "S") ? x : z;
    const pier = corner || along % 3 === 0;
    const isEntry = entry && entry.x === x && entry.z === z;

    for (let y = gr; y < ROOF; y++) {
      if (y === gr) { g.set(x, y, z, "stone_bricks"); continue; }          // base course
      if (y === 5) { g.set(x, y, z, "light_gray_concrete"); continue; }     // storey line
      if (y === 10) { g.set(x, y, z, "smooth_quartz"); continue; }          // cornice
      if (isEntry && (y === gr + 1 || y === gr + 2)) {
        // door handled below
        continue;
      }
      if (pier || !face) { g.set(x, y, z, "white_concrete"); continue; }
      g.set(x, y, z, "light_blue_stained_glass_pane", glassPane(face));
    }

    // Parapet on roof line
    g.set(x, ROOF, z, "white_concrete");

    // Entrance door and surround
    if (isEntry && entry.face) {
      const f = entry.face;
      const facing = FACING[f];
      g.set(x, gr + 1, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
      // Door lintel / transom above
      g.set(x, gr + 3, z, "white_concrete");
    }

    // Shopfront ground floor glass light and warm shroomlights behind glass
    if (!corner && face && !(isEntry)) {
      const along2 = (face === "N" || face === "S") ? x : z;
      if (!pier && along2 % 6 === 2) {
        const [dx, dz] = OUTWARD[face];
        const ix = x - dx, iz = z - dz;
        if (inFoot(ix, iz) && !isEdge(ix, iz)) {
          const gi = groundAt(ix, iz);
          if (gi <= gr + 2) g.set(ix, gr + 2, iz, "shroomlight");
        }
      }
    }
  } else {
    // Interior cell: floors and roof deck only, no interior partitions
    g.set(x, gr, z, "smooth_stone");                       // ground floor slab
    if (gr < 5) g.set(x, 5, z, "smooth_stone");            // storey 2 floor slab
    if (gr < ROOF - 1) g.set(x, ROOF - 1, z, "gray_concrete"); // roof deck (top at 11)
  }
}

// 2) Rooftop penthouse box and AC units (only on cells that exist and are interior)
const pentBox = (x, z) => x >= 7 && x <= 14 && z >= 5 && z <= 12;
for (const [x, z, gr0] of cells) {
  if (isEdge(x, z)) continue;
  if (pentBox(x, z)) {
    const wall = x === 7 || x === 14 || z === 5 || z === 12;
    if (wall) {
      g.set(x, ROOF, z, "light_gray_concrete");
      g.set(x, ROOF + 1, z, "light_gray_concrete");
      g.set(x, ROOF + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  } else if ((x + z) % 7 === 0) {
    g.set(x, ROOF, z, "iron_block");
  }
}

// Lightning rod on penthouse corner
g.set(7, ROOF + 2, 5, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(OUT);
