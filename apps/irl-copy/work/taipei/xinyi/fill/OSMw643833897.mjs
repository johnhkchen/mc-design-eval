import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no tagged use. Lidar roof about 11 blocks above lowest ground.
// Reading: a two-storey post-war concrete shophouse/office block typical of
// older Taipei (white tiled facade, ground-floor shopfront, flat roof with
// parapet, rooftop AC plant). Two storeys of about 5 blocks, roof deck at y10,
// parapet to y11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw643833897";
const W = 8, H = 23, D = 16;

const FLOOR_LINE = 5;   // storey 1 ceiling / storey 2 floor
const ROOF_DECK = 10;   // roof slab top layer
const PARAPET = 11;     // parapet top layer

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(([x, z, gr]) => ({ x, z, gr: Number(gr) || 0 }));

const key = (x, z) => `${x},${z}`;
const occ = new Map(cells.map((c) => [key(c.x, c.z), c.gr]));
const minX = Math.min(...cells.map((c) => c.x));
const maxX = Math.max(...cells.map((c) => c.x));
const minZ = Math.min(...cells.map((c) => c.z));
const maxZ = Math.max(...cells.map((c) => c.z));

const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },  // front (street-facing)
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

const g = new Voxels([W, H, D]);
const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade material for a non-corner exterior wall cell.
// u = position along the facade, L = facade length.
function facadeBlock(u, L, y, gr) {
  const pier = u === 0 || u === L - 1 || u % 4 === 0;
  if (y === gr) return "stone_bricks";              // base course
  if (y <= 3) return pier ? "white_concrete" : "glass_pane"; // shopfront storey
  if (y === 4) return "smooth_quartz";              // shopfront lintel
  if (y === FLOOR_LINE) return "smooth_quartz";     // storey line
  if (y === 6) return "light_gray_concrete";        // upper spandrel
  if (y <= 8) return pier ? "white_concrete" : "glass_pane"; // upper windows
  if (y === 9) return "smooth_quartz";              // upper lintel
  if (y === ROOF_DECK) return "white_concrete";     // parapet course
  return "smooth_quartz";                           // parapet cap (y 11)
}

for (const { x, z, gr } of cells) {
  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) set(x, y, z, "stone_bricks");

  const faces = DIRS.filter((d) => !occ.has(key(x + d.dx, z + d.dz)));

  // Interior cells: floor slab and roof deck only (no interiors, air behind glass).
  if (faces.length === 0) {
    if (FLOOR_LINE >= gr) set(x, FLOOR_LINE, z, "stone");
    if (ROOF_DECK >= gr) set(x, ROOF_DECK, z, "gray_concrete");
    continue;
  }

  const corner = faces.length >= 2;
  const f = faces[0];
  let u = 0, L = 1;
  if (f.dz !== 0) { u = x - minX; L = maxX - minX + 1; }
  else { u = z - minZ; L = maxZ - minZ + 1; }

  for (let y = gr; y <= PARAPET; y++) {
    // Entrance door on the street face, bay u=2, ground floor.
    if (!corner && f.name === "south" && u === 2 && y === gr + 1 && gr + 2 <= 3) {
      set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (!corner && f.name === "south" && u === 2 && y === gr + 2 && gr + 2 <= 3) {
      set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (corner) {
      set(x, y, z, y === gr ? "stone_bricks" : y === PARAPET ? "smooth_quartz" : "white_concrete");
      continue;
    }
    set(x, y, z, facadeBlock(u, L, y, gr));
  }

  // Warm light behind a few upper-storey windows on the street and rear faces.
  if (!corner && (f.name === "south" || f.name === "north") && u === 2 && 7 >= gr) {
    const ix = x - f.dx, iz = z - f.dz;
    if (occ.has(key(ix, iz))) set(ix, 7, iz, "glowstone");
  }
}

// Rooftop AC plant: two iron boxes standing on the roof deck.
for (let x = 2; x <= 3; x++) {
  for (let z = 5; z <= 6; z++) {
    if (occ.has(key(x, z)) && (occ.get(key(x, z)) ?? 0) <= ROOF_DECK) {
      set(x, ROOF_DECK + 1, z, "iron_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
console.log(`saved ${ID}.nbt  footprint=${cells.length} cells  size=${W}x${H}x${D}`);
