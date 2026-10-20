import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1339253356";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 9 x 19 x 10: 9 wide, 19 tall (roof ~7 above lowest ground plus downhill foundation), 10 deep
const W = 9, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const GROUND = new Map();
for (const [x, z, gr] of cells) GROUND.set(key(x, z), gr);
const has = (x, z) => GROUND.has(key(x, z));
const gr = (x, z) => GROUND.get(key(x, z));

// Outward directions: north = -z, south = +z, west = -x, east = +x
const FACES = [
  { name: "north", ox: 0, oz: -1 },
  { name: "south", ox: 0, oz: 1 },
  { name: "west", ox: -1, oz: 0 },
  { name: "east", ox: 1, oz: 0 },
];

// Exterior faces of each footprint cell (neighbour missing from footprint)
function exteriorFaces(x, z) {
  const out = [];
  if (!has(x, z - 1)) out.push({ name: "north", s: x });
  if (!has(x, z + 1)) out.push({ name: "south", s: x });
  if (!has(x - 1, z)) out.push({ name: "west", s: z });
  if (!has(x + 1, z)) out.push({ name: "east", s: z });
  return out;
}

// Pick the main entrance: south-facing exterior cell nearest the median x
const southCells = cells
  .filter(([x, z]) => !has(x, z + 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
let doorX = null, doorZ = null;
if (southCells.length) {
  const medX = southCells[Math.floor(southCells.length / 2)];
  const cand = cells.filter(([x, z]) => !has(x, z + 1));
  cand.sort((a, b) => Math.abs(a[0] - medX) - Math.abs(b[0] - medX));
  doorX = cand[0][0];
  doorZ = cand[0][1];
}

const isPerimeter = (x, z) => exteriorFaces(x, z).length > 0;

for (const [x, z, ground] of cells) {
  const faces = exteriorFaces(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length > 1;
  const face = faces[0];

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // Floor course at ground level
  g.set(x, ground, z, "stone_bricks");

  if (perimeter) {
    const bay = corner ? 0 : face.s % 3;
    const pier = corner || bay === 0;

    // Ground storey: shopfront with door on the main south entrance
    for (const dy of [1, 2]) {
      const y = ground + dy;
      if (x === doorX && z === doorZ && dy === 1) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (x === doorX && z === doorZ && dy === 2) {
        g.set(x, y, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (pier) {
        g.set(x, y, z, "polished_andesite");
      } else {
        g.set(x, y, z, "glass_pane");
      }
    }

    // Storey line / spandrel band
    g.set(x, ground + 3, z, "light_gray_concrete");
    if (x === doorX && z === doorZ) {
      g.set(x, ground + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
    }

    // Upper storey: window grid with white piers
    for (const dy of [4, 5, 6]) {
      const y = ground + dy;
      g.set(x, y, z, pier ? "white_concrete" : "glass_pane");
    }

    // Cornice / parapet
    g.set(x, ground + 7, z, "white_concrete");
  } else {
    // Interior: floor slab between storeys, roof slab on top, air between
    g.set(x, ground + 4, z, "white_concrete");
    g.set(x, ground + 7, z, "light_gray_concrete");
  }

  // Roof cap on perimeter already set; ensure interior roof too
  if (!perimeter) g.set(x, ground + 7, z, "light_gray_concrete");

  // Roof equipment on a sparse set of interior roof cells
  if (!perimeter && (x + 2 * z) % 5 === 0) {
    g.set(x, ground + 8, z, "iron_block");
  }
}

// Warm lights behind glass: shroomlights in the upper storey, glowstone behind shopfront
for (const [x, z, ground] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const face = faces[0];
  const f = FACES.find((d) => d.name === face.name);
  const ix = x - f.ox, iz = z - f.oz;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;
  const innerGround = gr(ix, iz);
  const s = face.s;
  if (s % 6 === 1) {
    g.set(ix, innerGround + 5, iz, "shroomlight");
  }
  if (s % 3 === 1 && !(x === doorX && z === doorZ)) {
    g.set(ix, innerGround + 2, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
