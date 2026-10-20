import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE92-0057-1F-6: 2003 Xinyi commercial midrise, 8 x 5 footprint, roof about 21 blocks
// above lowest ground. Four storeys of about 5 blocks, white tiled concrete with
// blue-tinted glazing, stone base and cornice, shopfront at grade, rooftop plant.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0057-1F-6";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 33, D = 5;
const ROOF = 21;          // top of wall ring / roof slab, absolute y
const PARAPET = 22;       // parapet course on the perimeter
const STOREY_LINES = [5, 10, 15];
const CORNICE = 20;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const vox = new Voxels([W, H, D]);

// Outward-facing edges of a cell (neighbour missing from the footprint or off-grid)
function facesOf(x, z) {
  const f = [];
  if (!has(x, z - 1)) f.push({ axis: "x", i: x, n: W, out: "north", inw: [0, 0, 1] });
  if (!has(x, z + 1)) f.push({ axis: "x", i: x, n: W, out: "south", inw: [0, 0, -1] });
  if (!has(x - 1, z)) f.push({ axis: "z", i: z, n: D, out: "west", inw: [1, 0, 0] });
  if (!has(x + 1, z)) f.push({ axis: "z", i: z, n: D, out: "east", inw: [-1, 0, 0] });
  return f;
}

// Bays: piers at the ends and every third bay, glazing between them
const glassCol = (f) => f.i > 0 && f.i < f.n - 1 && f.i % 3 !== 0;

function paneProps(face) {
  const along = face.axis === "x" ? { east: "true", west: "true", north: "false", south: "false" }
                                  : { north: "true", south: "true", east: "false", west: "false" };
  return { ...along, waterlogged: "false" };
}

// Surface id for a perimeter wall voxel. Piers are quartz, spandrels white concrete,
// so the bay rhythm reads on a flat facade.
function facadeId(y, gr, glass, pier) {
  if (y === ROOF) return "smooth_quartz";
  if (y === CORNICE) return "smooth_stone";
  if (y === gr) return "polished_granite";                 // base course
  if (y > gr && y <= gr + 3) return glass ? "light_blue_stained_glass_pane" : "stone_bricks"; // shopfront
  if (STOREY_LINES.includes(y)) return "smooth_stone";     // storey lines
  const sec = Math.floor(y / 5), within = y % 5;
  if (sec >= 1 && within >= 1 && within <= 3) {
    if (glass) return "light_blue_stained_glass_pane";
    return pier ? "smooth_quartz" : "white_concrete";
  }
  return "white_concrete";                                 // spandrel
}

const lateGlow = [];

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;

  if (perimeter) {
    const glass = faces.every(glassCol);
    const pier = !glass;
    for (let y = gr; y <= ROOF; y++) {
      const id = facadeId(y, gr, glass, pier);
      if (id.endsWith("_pane")) {
        vox.set(x, y, z, id, paneProps(faces[0]));
      } else {
        vox.set(x, y, z, id);
      }
    }
    vox.set(x, PARAPET, z, "smooth_stone");

    // Warm light behind some glazed bays, in the interior cell one step in
    if (glass) {
      const [dx, , dz] = faces[0].inw;
      for (let y = 6; y <= 18; y++) {
        if (![1, 2, 3].includes(y % 5)) continue;
        const sec = Math.floor(y / 5);
        if ((x + z + sec) % 3 === 0 && y % 5 === 2) lateGlow.push([x + dx, y, z + dz]);
      }
    }
  } else {
    // Interior cell: floor slabs and roof only, air between
    for (const fy of [gr, ...STOREY_LINES, CORNICE]) {
      if (fy >= gr && fy <= ROOF) vox.set(x, fy, z, "smooth_stone");
    }
    vox.set(x, ROOF, z, "light_gray_concrete");
  }
}

// Warm glow behind selected windows (interior air gap, one block deep)
for (const [x, y, z] of lateGlow) {
  if (has(x, z)) vox.set(x, y, z, "glowstone");
}

// Entrance on the north face, centred on the street frontage
if (has(3, 0)) {
  const gr = ground.get("3,0");
  vox.set(3, gr + 1, 0, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  vox.set(3, gr + 2, 0, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  vox.set(3, gr + 3, 0, "stone_bricks");
}

// Rooftop plant: a central mechanical room with a vent grille
for (let x = 2; x <= 4; x++) {
  if (!has(x, 2)) continue;
  vox.set(x, PARAPET, 2, "light_gray_concrete");
  vox.set(x, PARAPET + 1, 2, "light_gray_concrete");
}
if (has(3, 2)) vox.set(3, PARAPET + 2, 2, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });

vox.save(`${DIR}/${ID}.nbt`);
