import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020161";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 17;

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inF = (x, z) => ground.has(`${x},${z}`);
const outDirs = (x, z) => {
  const o = [];
  if (!inF(x, z - 1)) o.push([0, -1]); // north (street frontage, z = 0)
  if (!inF(x, z + 1)) o.push([0, 1]);  // south
  if (!inF(x - 1, z)) o.push([-1, 0]); // west
  if (!inF(x + 1, z)) o.push([1, 0]);  // east
  return o;
};
const isBoundary = (x, z) => outDirs(x, z).length > 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Glass panes: connections depend on which way the wall runs
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Design: 2-storey mid-century Taipei shophouse-style block with a shopfront,
// light-coloured concrete, glazed bays, cornice and a rooftop unit.
// Layers relative to each cell's ground G:
//   r0 plinth, r1-3 shopfront / ground-floor glazing, r4 fascia band,
//   r5 upper-floor spandrel (floor slab inside), r6-8 upper glazing,
//   r9 sill band, r10 cornice/roof deck (roof top = G+11).

for (const [key, G] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  const top = Math.min(G + 11, H);
  const out = outDirs(x, z);
  const boundary = out.length > 0;
  const corner = out.length > 1;
  const [fx, fz] = boundary ? out[0] : [0, 0];
  // Position along the facade: x for north/south faces, z for east/west faces
  const t = fz !== 0 ? x : z;
  const front = out.some(([dx, dz]) => dx === 0 && dz === -1);

  for (let r = 0; r <= 10; r++) {
    const y = G + r;
    if (y >= top) break;

    if (!boundary) {
      // Interior: floor slabs only, air elsewhere (no interiors)
      if (r === 0 || r === 5 || r === 10) put(x, y, z, "smooth_stone");
      continue;
    }

    let id, p;
    if (corner) {
      id = r === 0 ? "stone_bricks"
        : (r === 4 || r === 9) ? "light_gray_concrete"
        : r === 10 ? "smooth_stone"
        : "white_concrete";
    } else if (r === 0) {
      id = "stone_bricks";
    } else if (r === 4 || r === 9) {
      id = "light_gray_concrete";
    } else if (r === 10) {
      id = "smooth_stone";
    } else if (r === 5) {
      id = "white_concrete";
    } else {
      const groundFloor = r <= 3;
      if (front && groundFloor && t === 5) {
        // Entrance: double-height door, stone lintel above
        if (r === 1) { id = "oak_door"; p = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }; }
        else if (r === 2) { id = "oak_door"; p = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }; }
        else id = "stone_bricks";
      } else if (t % 3 === 0) {
        id = "white_concrete"; // pier
      } else {
        id = "glass_pane";
        p = fz !== 0 ? PANE_EW : PANE_NS;
      }
    }

    put(x, y, z, id, p);

    // Warm light in the air gap behind some glazed bays
    if (!corner && id === "glass_pane" && (r === 2 || r === 7) && (t % 6 === 1 || t % 6 === 4)) {
      const ix = x - fx, iz = z - fz;
      if (inF(ix, iz) && !isBoundary(ix, iz)) put(ix, y, iz, "glowstone");
    }
  }

  // Rooftop unit on the rear part of the roof, if it fits in the volume
  if (!boundary && G + 11 < H && x >= 2 && x <= 4 && z >= 12 && z <= 14) {
    put(x, G + 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
