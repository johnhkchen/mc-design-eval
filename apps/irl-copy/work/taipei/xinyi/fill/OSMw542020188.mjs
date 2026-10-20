import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020188";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 2-storey red-brick shophouse with white concrete storey bands and a parapet.
const W = 11, H = 23, D = 14;
const ROOF = 11;   // roof surface sits 11 blocks above lowest ground
const CAP = 10;    // top course of walls / roof deck
const BAND = 5;    // storey line (floor level 2)
const SILL = 9;    // upper-storey lintel band
const g = new Voxels([W, H, D]);

const S = new Map();
for (const [x, z, gr] of cells) S.set(`${x},${z}`, gr);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const OPP = { north: "south", south: "north", west: "east", east: "west" };
const exposed = (x, z) =>
  Object.keys(DIRS).filter(d => !S.has(`${x + DIRS[d][0]},${z + DIRS[d][1]}`));
const isEdge = (x, z) => exposed(x, z).length > 0;

// Entrance on the south facade, at the median x of south-exposed cells.
const southXs = cells
  .filter(([x, z]) => exposed(x, z).includes("south"))
  .map(c => c[0])
  .sort((a, b) => a - b);
const entX = southXs.length ? southXs[Math.floor(southXs.length / 2)] : -1;
const entZ = Math.max(...cells.map(c => c[1]));

const facade = new Map(); // "x,z" -> { face, along }

for (const [x, z, grRaw] of cells) {
  const gr = Math.max(0, Math.min(grRaw, ROOF - 2));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);

  if (ex.length === 0) {
    // Interior: floor slabs per storey, roof deck, no air-filled walls.
    if (gr < BAND) g.set(x, gr, z, "smooth_stone");
    if (BAND >= gr) g.set(x, BAND, z, "smooth_stone");
    g.set(x, CAP, z, "smooth_quartz");
    // Roof equipment: a few AC plant boxes standing on the roof deck.
    if ((x * 7 + z * 3) % 9 === 0) {
      g.set(x, ROOF, z, "light_gray_concrete");
      g.set(x, ROOF + 1, z, "light_gray_concrete");
    }
    continue;
  }

  // Facade choice: south/north win over east/west for corners.
  const face = ex.includes("south") ? "south"
    : ex.includes("north") ? "north"
    : ex.includes("east") ? "east" : "west";
  const ns = face === "north" || face === "south";
  const along = ns ? x : z;
  facade.set(`${x},${z}`, { face, along });

  const isEntry = face === "south" && x === entX && z === entZ;

  for (let y = gr; y <= CAP; y++) {
    let b;
    if (y === CAP) b = "smooth_quartz";                 // parapet cap / roof deck
    else if (y === SILL || y === BAND) b = "white_concrete"; // storey lines
    else if (y >= 6 && y <= 8) {
      b = along % 2 === 1 ? "glass_pane" : "bricks";    // upper window grid
    } else if (y < BAND) {                               // ground-floor shopfront
      if (y === gr) b = "stone_bricks";                  // base course
      else if (y === 4) b = "smooth_quartz";             // fascia
      else b = along % 3 === 0 ? "dark_oak_planks" : "glass_pane";
    } else b = "bricks";
    g.set(x, y, z, b);
  }

  if (isEntry && gr + 1 < BAND) {
    g.set(x, gr, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// Warm light behind some upper windows, in the interior air gap.
for (const [key, info] of facade) {
  const [x, z] = key.split(",").map(Number);
  if (info.along % 4 !== 1) continue;
  const [dx, dz] = DIRS[OPP[info.face]];
  const nx = x + dx, nz = z + dz;
  if (!S.has(`${nx},${nz}`) || isEdge(nx, nz)) continue;
  g.set(nx, 7, nz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
