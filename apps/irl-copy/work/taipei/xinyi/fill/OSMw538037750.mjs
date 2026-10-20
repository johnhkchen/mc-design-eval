import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538037750";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 9, H = 23, D = 21;
const g = new Voxels([W, H, D]);

// Footprint helpers
const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const has = (x, z) => footprint.has(key(x, z));
const maxG = Math.max(...cells.map((c) => c[2]));

// Storey plan: ground floor 5, upper floor 5, cornice, parapet.
// FL = first floor level above the highest ground under the footprint.
const FL = maxG + 1;
const ROOF = FL + 10;   // cornice / roof surface
const PAR = FL + 11;    // parapet course
if (PAR > H - 1) throw new Error(`Building top ${PAR} exceeds grid height ${H}`);

// Street face = smallest z (north side). Door sits on the median x of that face.
const zMin = Math.min(...cells.map((c) => c[1]));
const northXs = cells.filter((c) => c[1] === zMin).map((c) => c[0]).sort((a, b) => a - b);
const doorX = northXs[Math.floor(northXs.length / 2)];

// 1. Foundation: solid from y0 up to each cell's ground, then plinth up to FL.
for (const [x, z, gr] of cells) {
  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone");
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  for (let y = gr + 1; y < FL; y++) g.set(x, y, z, perim ? "stone_bricks" : "stone");
}

// 2. Floor slabs and roof, on every footprint cell.
for (const [x, z] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  // Upper floor slab (interior); perimeter gets the spandrel course in step 3.
  if (!perim) g.set(x, FL + 5, z, "smooth_stone");
  // Roof: stone cornice on the edge, light concrete roof inside.
  g.set(x, ROOF, z, perim ? "stone_bricks" : "light_gray_concrete");
}

// 3. Facades: piers, glazing, bands, shopfront, door and lights.
for (const [x, z] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (!perim) continue;

  // Faces this cell is on, with the along-face coordinate and inward offset.
  const faces = [];
  if (!has(x, z - 1)) faces.push({ name: "north", along: x, dx: 0, dz: 1 });
  if (!has(x, z + 1)) faces.push({ name: "south", along: x, dx: 0, dz: -1 });
  if (!has(x - 1, z)) faces.push({ name: "west", along: z, dx: 1, dz: 0 });
  if (!has(x + 1, z)) faces.push({ name: "east", along: z, dx: -1, dz: 0 });
  const corner = faces.length > 1;
  const face = faces[0];
  const pierCol = corner || face.along % 2 === 0;
  const isFront = !!faces.find((f) => f.name === "north") && z === zMin;
  const isDoor = isFront && x === doorX;
  const inX = x + face.dx;
  const inZ = z + face.dz;
  const interiorOK = has(inX, inZ);

  // Ground floor, y = FL .. FL+4
  g.set(x, FL, z, "polished_andesite");                    // base course
  for (let y = FL + 1; y <= FL + 3; y++) {
    if (isDoor && y <= FL + 2) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === FL + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (isDoor && y === FL + 3) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
    } else if (isFront) {
      // Shopfront glazing on the street face, piers kept as mullions.
      g.set(x, y, z, pierCol ? "white_concrete" : "light_blue_stained_glass");
    } else {
      g.set(x, y, z, pierCol ? "white_concrete" : "light_blue_stained_glass");
    }
  }
  g.set(x, FL + 4, z, "stone_bricks");                     // ground-floor lintel

  // Upper floor, y = FL+5 .. FL+9
  g.set(x, FL + 5, z, "light_gray_concrete");              // spandrel
  for (let y = FL + 6; y <= FL + 8; y++) {
    g.set(x, y, z, pierCol ? "white_concrete" : "light_blue_stained_glass");
  }
  g.set(x, FL + 9, z, "light_gray_concrete");              // sill / head band

  // Warm lights behind some upper windows (interior side of the glass).
  if (!pierCol && interiorOK && (face.along + FL) % 4 === 1) {
    g.set(inX, FL + 7, inZ, "shroomlight");
  }

  // Parapet on the roof edge.
  g.set(x, PAR, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Roof equipment: a few plant boxes on the roof interior.
for (const [x, z] of cells) {
  const perim = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (perim) continue;
  if (x % 3 === 1 && z % 7 === 3) g.set(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
