import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86575";
const W = 12, H = 29, D = 10;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, gr, rf] of cells) byKey.set(key(x, z), { x, z, gr, rf });

// Datum: lowest ground under the footprint
const B = Math.min(...cells.map(c => c[2]));

// Exterior face of a perimeter cell (north = -z, south = +z, west = -x, east = +x)
function faceOf(x, z) {
  const has = (dx, dz) => byKey.has(key(x + dx, z + dz));
  if (!has(0, -1)) return { n: [0, -1], idx: x, name: "north" };
  if (!has(0, 1)) return { n: [0, 1], idx: x, name: "south" };
  if (!has(-1, 0)) return { n: [-1, 0], idx: z, name: "west" };
  if (!has(1, 0)) return { n: [1, 0], idx: z, name: "east" };
  return null;
}

// Palette: pale limestone piers, lighter stone spandrels so storey lines read
// as bands rather than dark stripes, bronze-grey tinted glazing, granite base.
const WALL = "calcite";
const SPANDREL = "smooth_stone";
const GLASS = "gray_stained_glass";
const CORNICE = "smooth_stone";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "polished_andesite";
const ROOF = "smooth_stone";

// Pass 1: solid body per cell
for (const { x, z, gr, rf } of byKey.values()) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const face = faceOf(x, z);
  const perim = face !== null;

  for (let y = gr; y < rf; y++) {
    const k = (y - B) % 3; // 0 = storey line, 1-2 = glazing band
    if (perim) {
      const f = face;
      const lastIdx = (f.name === "north" || f.name === "south") ? W - 1 : D - 1;
      const pier = f.idx % 2 === 0 || f.idx === 0 || f.idx === lastIdx;
      if (y === rf - 1) {
        // Cornice / parapet
        g.set(x, y, z, CORNICE);
      } else if (y === gr && y < B + 3) {
        // Ground course: granite base reads as a plinth at street level
        g.set(x, y, z, BASE);
      } else if (k === 0) {
        g.set(x, y, z, SPANDREL);
      } else if (pier) {
        g.set(x, y, z, WALL);
      } else {
        // Entrance bays on the south face are finished in pass 2
        const entrance = f.name === "south" && (f.idx === 5 || f.idx === 6);
        if (!(entrance && y - gr < 2)) g.set(x, y, z, GLASS);
      }
    } else {
      // Interior: floor slabs at storey lines and roof deck; otherwise an air gap
      if (y === rf - 1) g.set(x, y, z, ROOF);
      else if (k === 0 && y > gr) g.set(x, y, z, FLOOR);
    }
  }

  // Rooftop mechanical penthouse on the interior core (sits on the roof deck)
  if (!perim && x >= 3 && x <= 4 && z >= 3 && z <= 4 && rf + 1 <= H - 1) {
    g.set(x, rf, z, WALL);
    g.set(x, rf + 1, z, CORNICE);
  }
}

// Pass 2: entrances on the south face (centre bays), doors plus a canopy slab
for (const { x, z, gr, rf } of byKey.values()) {
  const face = faceOf(x, z);
  if (!face || face.name !== "south") continue;
  if (face.idx === 5 || face.idx === 6) {
    const hinge = face.idx === 5 ? "left" : "right";
    g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
    // Canopy band over the door, resting on the glazing course above it
    const cy = gr + 3;
    if (cy < rf - 1 && cy < H) {
      g.set(x, cy, z, "smooth_stone_slab", { type: "top", waterlogged: "false" });
    }
  }
}

// Pass 3: warm light behind some glazing (glowstone one bay inside the facade)
for (const { x, z, gr, rf } of byKey.values()) {
  const face = faceOf(x, z);
  if (!face) continue;
  const [nx, nz] = face.n;
  const ix = x - nx, iz = z - nz;
  if (!byKey.has(key(ix, iz))) continue;
  const inner = byKey.get(key(ix, iz));
  const lastIdx = (face.name === "north" || face.name === "south") ? W - 1 : D - 1;
  for (let y = gr; y < rf - 1; y++) {
    const k = (y - B) % 3;
    if (k === 0) continue;
    const pier = face.idx % 2 === 0 || face.idx === 0 || face.idx === lastIdx;
    if (pier) continue;
    if (face.name === "south" && (face.idx === 5 || face.idx === 6) && y - gr < 2) continue;
    if ((face.idx + y) % 7 === 3 && y >= inner.gr && y < inner.rf - 1) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
