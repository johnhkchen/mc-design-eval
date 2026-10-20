import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. Footprint 18 x 23, roof ~26 blocks above lowest ground.
// Read as a 1990s-2000s Xinyi mid-rise office/retail block: five storeys of
// 5 blocks, white tiled piers and spandrels, blue-tinted glazing, a granite
// plinth, a stone base foundation, a central glass-and-iron door, and a
// plain rooftop plant box with a lightning-rod mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011409";
const W = 18, H = 38, D = 23;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, Math.round(gy));
const has = (x, z) => ground.has(`${x},${z}`);

// Materials
const FOUND = "stone_bricks";        // foundation below each cell's ground
const PLINTH = "polished_granite";   // base course at y 0
const PIER = "white_concrete";       // piers, spandrels, parapet
const LINE = "smooth_quartz";        // storey lines, cornice, floors
const GLASS = "light_blue_stained_glass_pane";
const DECK = "light_gray_concrete";  // roof deck and plant box
const CAP = "smooth_quartz";         // plant cap

const ROOF = 25;       // roof deck level (top surface at 26)
const PARAPET = 26;    // parapet course
const ENTRY_X = 9;     // entrance on the south (max z) face
const PLANT = { x0: 6, x1: 11, z0: 8, z1: 14 };

const g = new Voxels([W, H, D]);

const paneProps = (horizontalAlongX) => ({
  north: horizontalAlongX ? "false" : "true",
  south: horizontalAlongX ? "false" : "true",
  east: horizontalAlongX ? "true" : "false",
  west: horizontalAlongX ? "true" : "false",
  waterlogged: "false",
});

for (const [x, z, gr0] of cells) {
  const gr = Math.round(gr0);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  const nN = has(x, z - 1), nS = has(x, z + 1);
  const nW = has(x - 1, z), nE = has(x + 1, z);
  const perim = !(nN && nS && nW && nE);
  const onZFace = !nN || !nS; // wall runs along x
  const onXFace = !nW || !nE; // wall runs along z
  const corner = onZFace && onXFace;
  const idx = onZFace && !onXFace ? x : onXFace && !onZFace ? z : x + z;

  if (gr > ROOF) continue;

  for (let y = gr; y <= ROOF; y++) {
    if (!perim) {
      // Interior: floor slabs per storey and the roof deck; air between.
      if (y === gr || y % 5 === 0) g.set(x, y, z, LINE);
      else if (y === ROOF) g.set(x, y, z, DECK);
      continue;
    }

    // Exterior wall.
    if (y === 0) {
      g.set(x, y, z, PLINTH);
    } else if (y === ROOF || y % 5 === 0) {
      g.set(x, y, z, LINE);            // storey lines and cornice
    } else if (y % 5 === 4) {
      g.set(x, y, z, PIER);            // spandrel
    } else if (corner || idx % 3 === 0) {
      g.set(x, y, z, PIER);            // mullion / pier
    } else {
      g.set(x, y, z, GLASS, paneProps(onZFace && !onXFace));
    }
  }

  if (perim) g.set(x, PARAPET, z, PIER); // parapet course

  // Warm lanterns behind some window middles, on the floor's air layer.
  if (perim && gr <= ROOF) {
    for (let y = 1; y <= ROOF; y++) {
      const storeyRow = y % 5 === 2 && y < ROOF;
      if (!storeyRow || corner || idx % 6 !== 1 || y <= gr) continue;
      let ix = x, iz = z;
      if (onZFace && !onXFace) iz = z === 0 ? z + 1 : z - 1;
      else if (onXFace && !onZFace) ix = x === 0 ? x + 1 : x - 1;
      else continue;
      if (!has(ix, iz)) continue;
      g.set(ix, y - 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// Entrance: iron door on the south face, centred between piers.
{
  const z = D - 1;
  const gr = Math.round(ground.get(`${ENTRY_X},${z}`) ?? 0);
  const door = (half) => ({
    facing: "south", half, hinge: "left", open: "false", powered: "false",
  });
  // Clear the door opening and any stray glass at its base.
  g.set(ENTRY_X, gr, z, "iron_door", door("lower"));
  g.set(ENTRY_X, gr + 1, z, "iron_door", door("upper"));
  // Lintel above the door.
  g.set(ENTRY_X, gr + 2, z, LINE);
}

// Rooftop plant box: solid massing on the deck, capped flat.
for (let x = PLANT.x0; x <= PLANT.x1; x++) {
  for (let z = PLANT.z0; z <= PLANT.z1; z++) {
    if (!has(x, z)) continue;
    g.set(x, ROOF + 1, z, DECK);          // y 26
    g.set(x, ROOF + 2, z, DECK);          // y 27
    g.set(x, ROOF + 3, z, CAP);           // y 28 cap
  }
}

// Lightning-rod mast on the plant cap.
for (let y = ROOF + 4; y <= ROOF + 7; y++) {
  g.set(9, y, 11, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
console.log(`built ${ID}: ${cells.length} footprint cells, roof deck y=${ROOF}, mast top y=${ROOF + 7}`);
