import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi-area commercial block, c. 1990s: two storeys of white-tiled
// concrete over a grey stone plinth, blue-tinted glazing, a shopfront ground
// storey with a central entrance, a stone cornice, and a plant penthouse.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538618847";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 23, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const ROOF_Y = 11;      // roof deck, ~11 blocks above lowest ground
const FLOOR_Y = 5;      // storey line between the two storeys
const CORNICE_Y = 11;
const PARAPET_Y = 12;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward face of a perimeter cell: first missing neighbour in N, S, W, E order.
const FACES = [
  { dir: "north", dx: 0, dz: -1, inX: 0, inZ: 1, t: "x" },
  { dir: "south", dx: 0, dz: 1, inX: 0, inZ: -1, t: "x" },
  { dir: "west", dx: -1, dz: 0, inX: 1, inZ: 0, t: "z" },
  { dir: "east", dx: 1, dz: 0, inX: -1, inZ: 0, t: "z" },
];
function outFace(x, z) {
  for (const f of FACES) if (!has(x + f.dx, z + f.dz)) return f;
  return null;
}

// Bay rhythm along the facade: two glass bays out of every four.
const isBay = (t) => t % 4 === 1 || t % 4 === 2;

for (const [x, z, gr] of cells) {
  // Foundation: solid plinth from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (gr >= ROOF_Y) continue;

  const face = outFace(x, z);
  const perimeter = face !== null;
  const t = face ? (face.t === "x" ? x : z) : 0;

  // Walls, floors and roof, bottom-up. Everything sits on the course below it.
  for (let y = gr; y <= PARAPET_Y; y++) {
    // Roof deck over the whole footprint.
    if (y === ROOF_Y) {
      put(x, y, z, perimeter ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    // Parapet on the outer ring only.
    if (y === PARAPET_Y) {
      if (perimeter) put(x, y, z, "white_concrete");
      continue;
    }
    // Floor slab at the storey line, across the whole footprint.
    if (y === FLOOR_Y) {
      put(x, y, z, perimeter ? "white_concrete" : "smooth_stone");
      continue;
    }
    // Interiors: air behind the glass, nothing else to place.
    if (!perimeter) continue;

    // Facade of the outer ring.
    if (y < FLOOR_Y) {
      // Ground storey: shopfront.
      if (y === gr) {
        put(x, y, z, "polished_andesite");              // base course
      } else if (y === 4) {
        put(x, y, z, "white_concrete");                 // lintel band
      } else if (y === gr + 3 && gr + 3 >= FLOOR_Y) {
        put(x, y, z, "white_concrete");
      } else {
        // Entrance: centred bay on the north and south faces, ground level only.
        const isDoorCell = (face.dir === "north" || face.dir === "south") && t % 8 === 0 && gr <= 3;
        if (isDoorCell && (y === gr || y === gr + 1)) {
          const half = y === gr ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", {
            facing: face.dir,
            half,
            hinge: "left",
            open: "false",
            powered: "false",
          });
        } else if (isBay(t)) {
          put(x, y, z, "light_blue_stained_glass");     // shop glazing
        } else {
          put(x, y, z, "white_concrete");               // pier
        }
      }
    } else if (y < CORNICE_Y) {
      // Upper storey.
      if (y === 10) {
        put(x, y, z, "smooth_quartz");                  // spandrel under cornice
      } else if (isBay(t)) {
        put(x, y, z, "light_blue_stained_glass");
      } else {
        put(x, y, z, "white_concrete");
      }
    } else if (y === CORNICE_Y) {
      put(x, y, z, "smooth_quartz");
    }
  }

  // Warm light behind selected upper-storey bays: glowstone panel on the
  // inner cell, lantern in the ground storey.
  if (perimeter && t % 8 === 2) {
    const ix = x + face.inX, iz = z + face.inZ;
    if (has(ix, iz)) {
      put(ix, 7, iz, "glowstone");
      put(ix, 8, iz, "glowstone");
    }
  }
  if (perimeter && t % 8 === 5 && gr <= 3) {
    const ix = x + face.inX, iz = z + face.inZ;
    if (has(ix, iz)) {
      put(ix, 2, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Plant penthouse on the roof, centred on the footprint.
let cx = 0, cz = 0, n = 0;
for (const [x, z] of cells) { cx += x; cz += z; n++; }
cx = Math.round(cx / n); cz = Math.round(cz / n);

for (let x = cx - 3; x <= cx + 3; x++) {
  for (let z = cz - 3; z <= cz + 3; z++) {
    if (!has(x, z)) continue;
    const edge = Math.abs(x - cx) === 3 || Math.abs(z - cz) === 3;
    put(x, ROOF_Y + 1, z, edge ? "smooth_quartz" : "light_gray_concrete");
    put(x, ROOF_Y + 2, z, edge ? "white_concrete" : "light_gray_concrete");
  }
}
// Mast on the penthouse.
for (let y = ROOF_Y + 3; y <= ROOF_Y + 6; y++) put(cx, y, cz, "iron_block");

g.save(`${DIR}/${ID}.nbt`);
