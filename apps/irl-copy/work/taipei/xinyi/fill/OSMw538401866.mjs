import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, c. 1980s: white-painted concrete frame,
// dark glass shopfronts, a red terracotta cornice and a flat roof with plant.
// Two storeys of ~5 blocks, parapet top at y = 11 above the lowest ground.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538401866";
const W = 28, H = 23, D = 17;
const ROOF = 11;            // absolute top of parapet (roof surface at 11)
const STOREY_LINE = 5;      // floor line between ground and upper storey
const CORNICE = 10;         // top course of the parapet band
const MAX_X = W - 1, MAX_Z = D - 1;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Outward faces of an edge cell
function faces(x, z) {
  return {
    n: !inside(x, z - 1),
    s: !inside(x, z + 1),
    w: !inside(x - 1, z),
    e: !inside(x + 1, z),
  };
}
const isEdge = (x, z) => {
  const f = faces(x, z);
  return f.n || f.s || f.w || f.e;
};

// 1. Foundations: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// 2. Facade and interior, per footprint cell
for (const [x, z, gr] of cells) {
  if (gr >= ROOF) continue;
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;

  if (edge) {
    const onXFace = f.n || f.s;               // wall runs along x
    const along = onXFace ? x : z;
    const corner = (f.n || f.s) && (f.e || f.w);
    const pier = corner || along % 4 === 0;
    const entranceCell = f.s && x >= 12 && x <= 14;
    const doorCell = f.s && x === 13;

    for (let y = gr; y <= CORNICE; y++) {
      if (y === CORNICE) {
        put(x, y, z, "red_terracotta");
        continue;
      }
      if (y === ROOF - 1 && false) continue;

      // Ground floor band
      if (y < STOREY_LINE) {
        if (y === gr && gr < STOREY_LINE) {
          put(x, y, z, "smooth_stone");           // base course
          continue;
        }
        if (y === 4) {                             // ground-floor lintel
          put(x, y, z, "white_concrete");
          continue;
        }
        if (doorCell && y < 4 && y <= gr + 1) {
          put(x, y, z, "dark_oak_door", {
            facing: "south",
            half: y === gr ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          });
          continue;
        }
        if (entranceCell && y === gr + 2 && y < 4) {
          put(x, y, z, "red_terracotta");          // entrance canopy
          continue;
        }
        if (pier) put(x, y, z, "white_concrete");
        else put(x, y, z, "glass");
        continue;
      }

      // Storey line
      if (y === STOREY_LINE) {
        put(x, y, z, "light_gray_concrete");
        continue;
      }

      // Upper storey: sill at 6, windows 6-8, head at 9
      if (y === 9) {
        put(x, y, z, "white_concrete");
        continue;
      }
      if (pier) put(x, y, z, "white_concrete");
      else put(x, y, z, "glass");
    }

    // Warm light behind some upper windows (inward interior cell is air)
    if (!pier) {
      const inX = f.n ? z + 1 : f.s ? z - 1 : z;
      const inZ = f.w ? x + 1 : f.e ? x - 1 : x;
      const lx = onXFace ? x : inZ;
      const lz = onXFace ? inX : z;
      if (along % 8 === 2 && inside(lx, lz)) {
        put(lx, 7, lz, along % 16 === 2 ? "shroomlight" : "glowstone");
      }
    }
  } else {
    // Interior: air, with a floor slab at the storey line and a roof slab
    for (let y = gr; y <= CORNICE; y++) {
      if (y === STOREY_LINE) put(x, y, z, "light_gray_concrete");
      if (y === CORNICE) put(x, y, z, "light_gray_concrete");
    }
    // Columns carrying the storey slab at a regular grid
    if (x % 6 === 3 && z % 6 === 3) {
      for (let y = gr; y < STOREY_LINE; y++) put(x, y, z, "white_concrete");
    }
  }
}

// 3. Edge cells on the mid-storey line: make sure the storey slab reads as a
//    continuous band over the interior (already set via facade). Roof plant:
//    two packaged units and a low screen, standing on the roof slab.
const plant = [
  { x0: 4, x1: 8, z0: 4, z1: 6 },
  { x0: 18, x1: 22, z0: 9, z1: 11 },
];
for (const p of plant) {
  for (let x = p.x0; x <= p.x1; x++) {
    for (let z = p.z0; z <= p.z1; z++) {
      if (!inside(x, z) || isEdge(x, z)) continue;
      put(x, ROOF, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
