import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi-district office/retail block, c. 1985-1995: two storeys over a
// glazed shopfront, white-tile piers, stone cornice and a plant box on the roof.
// Roof deck at y=11, parapet to y=12 (about 11-12 blocks above lowest ground).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538119880";
const W = 25, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Lookup of footprint cells and their ground heights.
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const groundAt = (x, z) => ground.get(`${x},${z}`);

// Storey levels (absolute y).
const GROUND_TOP = 4;   // top of shopfront band; lintel sits here
const FLOOR_2 = 5;      // storey-2 floor line
const CORNICE = 10;     // cornice course
const ROOF = 11;        // roof deck
const PARAPET = 12;     // parapet course

// Materials.
const FOUNDATION = "stone_bricks";
const PLINTH = "stone_bricks";
const PIER = "smooth_quartz";
const SHOP_GLASS = "glass";
const WIN_GLASS = "glass_pane";
const BAND = "smooth_quartz";
const LINTEL = "red_terracotta";
const CORNICE_MAT = "stone_bricks";
const ROOF_MAT = "light_gray_concrete";
const PARAPET_MAT = "stone_bricks";
const LIGHT = "shroomlight";

// Outward faces: [dx, dz, name]. A face is exposed when the neighbour is missing.
const FACES = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// 1. Foundation, floor slabs and roof deck over every footprint cell.
for (const [x, z, G] of cells) {
  for (let y = 0; y < G; y++) g.set(x, y, z, FOUNDATION);
  if (G <= FLOOR_2) g.set(x, FLOOR_2, z, BAND);   // storey-2 floor slab
  g.set(x, ROOF, z, ROOF_MAT);                    // roof deck
}

// 2. Facades on exposed edge cells.
const edgeFaces = new Map(); // "x,z" -> [faceName...]
for (const [x, z, G] of cells) {
  const faces = [];
  for (const [dx, dz, name] of FACES) {
    if (!has(x + dx, z + dz)) faces.push(name);
  }
  if (faces.length) edgeFaces.set(`${x},${z}`, faces);

  for (const face of faces) {
    // Along-face index and whether this face runs east-west.
    const alongX = face === "north" || face === "south";
    const t = alongX ? x : z;
    const pier = t % 3 === 0 || faces.length > 1; // corners and piers in solid stone
    const paneProps = alongX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    // Plinth.
    g.set(x, G, z, PLINTH);

    // Shopfront band, only where the ground is low enough to fit it.
    for (let y = G + 1; y < GROUND_TOP; y++) {
      if (y > G && y <= GROUND_TOP - 1) {
        g.set(x, y, z, pier ? PIER : SHOP_GLASS);
      }
    }
    if (G < GROUND_TOP) g.set(x, GROUND_TOP, z, LINTEL);

    // Storey-2 band line.
    g.set(x, FLOOR_2, z, BAND);

    // Upper-storey windows (6..9) with pier columns between.
    for (let y = FLOOR_2 + 1; y <= CORNICE - 1; y++) {
      if (pier) g.set(x, y, z, PIER);
      else g.set(x, y, z, WIN_GLASS, paneProps);
    }

    // Cornice, roof edge and parapet.
    g.set(x, CORNICE, z, CORNICE_MAT);
    g.set(x, ROOF, z, ROOF_MAT);
    g.set(x, PARAPET, z, PARAPET_MAT);
  }
}

// 3. Entrance: centred door on the north (minimum-z) street face.
const northCells = cells.filter(([, z]) => z === Math.min(...cells.map(c => c[1])));
if (northCells.length) {
  const xs = northCells.map(c => c[0]);
  const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const [dx0, dz0, G0] = northCells.reduce((best, c) =>
    Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best
  );
  g.set(dx0, G0 + 1, dz0, "dark_oak_door", {
    facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(dx0, G0 + 2, dz0, "dark_oak_door", {
    facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

// 4. Warm lights behind the glass: shroomlights on the inner side of some bays.
for (const [x, z, G] of cells) {
  const faces = edgeFaces.get(`${x},${z}`);
  if (!faces) continue;
  for (const face of faces) {
    const alongX = face === "north" || face === "south";
    const t = alongX ? x : z;
    const inX = face === "west" ? 1 : face === "east" ? -1 : 0;
    const inZ = face === "north" ? 1 : face === "south" ? -1 : 0;
    const ix = x + inX, iz = z + inZ;
    if (!has(ix, iz)) continue;
    // Do not overwrite a wall cell with a light.
    if (edgeFaces.has(`${ix},${iz}`)) continue;

    // Upper-storey light in roughly one bay in six.
    if (t % 6 === 2 && G < GROUND_TOP) g.set(ix, 7, iz, LIGHT);
    // Shopfront light, one bay in six.
    if (t % 6 === 4 && G + 2 < GROUND_TOP) g.set(ix, G + 2, iz, LIGHT);
  }
}

// 5. Roof plant: a central box and two AC units.
for (const [x, z] of cells) {
  if (edgeFaces.has(`${x},${z}`)) continue;
  if (x >= 8 && x <= 16 && z >= 5 && z <= 12) {
    g.set(x, ROOF + 1, z, CORNICE_MAT);
    g.set(x, ROOF + 2, z, CORNICE_MAT);
  }
}
for (const [x, z] of [[9, 6], [15, 11]]) {
  if (has(x, z)) g.set(x, ROOF + 1, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
