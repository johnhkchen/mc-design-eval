import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source record. Read as a 2-storey low-rise commercial block of
// reinforced concrete with a stone base, smooth-quartz cornice, white-concrete
// parapet and a shopfront on the ground floor (typical of older Xinyi-area
// blocks). Roof about 11 blocks above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw980871789";
const W = 14, H = 23, D = 17;

const TOP = 11;    // parapet course (top block of the building)
const LINE1 = 5;   // first floor slab / storey line
const LINE2 = 10;  // roof deck / cornice line
const MID_X = 6;   // entrance column on north/south faces
const MID_Z = 8;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Outward normals; "facing" names match block facing states.
const DIRS = [
  { n: "north", dx: 0, dz: -1 },
  { n: "south", dx: 0, dz: 1 },
  { n: "west", dx: -1, dz: 0 },
  { n: "east", dx: 1, dz: 0 },
];
const exposedFaces = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));
const isEdge = (x, z) => exposedFaces(x, z).length > 0;
const FRONT = "north";

// Pass 1: foundation fill from y 0 up to each cell's ground.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// Facade block for an edge cell at height y on face f.
function facadeBlock(f, x, z, y, gr) {
  const u = f.dz !== 0 ? x : z;
  const mull = u % 3 === 0;
  if (y === TOP) return "white_concrete";              // parapet
  if (y === LINE2) return "smooth_quartz";            // cornice
  if (y === LINE1) return "smooth_stone";             // storey line
  if (y === gr) return "stone_bricks";                // base course
  if (y < LINE1) {                                    // shopfront storey
    if (y === gr + 1) return "stone_bricks";          // kick plate
    return mull ? "gray_concrete" : "glass_pane";     // dark frames, glass
  }
  if (y === LINE1 + 1) return "white_concrete";       // spandrel
  return mull ? "white_concrete" : "glass_pane";      // upper windows
}

// Pass 2: body of each footprint cell.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr >= TOP) continue;
  const faces = exposedFaces(x, z);

  if (faces.length === 0) {
    // Interior: floor slabs, roof deck, and rooftop plant boxes. Air elsewhere.
    for (let y = gr; y <= LINE2; y++) {
      if (y === gr || y === LINE1) g.set(x, y, z, "smooth_stone");
      if (y === LINE2) g.set(x, y, z, "gray_concrete");
    }
    if (gr <= LINE2 && x % 5 === 2 && z % 5 === 2) {
      g.set(x, LINE2 + 1, z, "light_gray_concrete");
      g.set(x, LINE2 + 2, z, "light_gray_concrete");
    }
    // Warm interior glow, visible through the glass just inside the walls.
    if (gr <= 8) g.set(x, 8, z, "shroomlight");
    continue;
  }

  // Edge cells: walls on every exposed face.
  for (let y = gr; y <= TOP; y++) {
    for (const f of faces) {
      const u = f.dz !== 0 ? x : z;
      const isFront = f.n === FRONT;
      const mid = f.dz !== 0 ? MID_X : MID_Z;

      // Entrance door on the front face, centred.
      if (isFront && u === mid && y === gr + 1 && gr + 2 < LINE1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: f.n, half: "lower", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }
      if (isFront && u === mid && y === gr + 2 && gr + 2 < LINE1) {
        g.set(x, y, z, "dark_oak_door", {
          facing: f.n, half: "upper", hinge: "left", open: "false", powered: "false",
        });
        continue;
      }

      g.set(x, y, z, facadeBlock(f, x, z, y, gr));

      // Warm light behind some front-facing windows (interior cell inward).
      const isGlass = facadeBlock(f, x, z, y, gr) === "glass_pane";
      if (isFront && isGlass && y === 8) {
        const ix = x - f.dx, iz = z - f.dz;
        if (has(ix, iz) && !isEdge(ix, iz)) {
          g.set(ix, y, iz, u % 2 === 0 ? "glowstone" : "shroomlight");
        }
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
