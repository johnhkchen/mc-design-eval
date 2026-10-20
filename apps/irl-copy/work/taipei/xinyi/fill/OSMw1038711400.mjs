import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Xinyi low-rise commercial block, c. 1990s: two storeys of white tiled
// concrete over a stone base, light-blue glass bays, a quartz cornice and
// parapet, a recessed shopfront with a red awning on the street face.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const id = "OSMw1038711400";
const cells = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));

const W = 28, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ROOF_DECK = 10;   // top of the roof slab (interior)
const PARAPET = 11;     // top of the parapet, about 11 blocks above lowest ground
const FLOOR_2 = 5;      // second-floor slab / storey line

const key = (x, z) => `${x},${z}`;
const S = new Map(cells.map(([x, z, gr]) => [key(x, z), gr]));
const has = (x, z) => S.has(key(x, z));
const groundAt = (x, z) => S.get(key(x, z));

const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isStreetFace = (x, z) => !has(x, z + 1); // south face of the footprint, faces the road

// Pass 1: foundations and the building envelope, cell by cell.
for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = Math.max(0, Math.min(gr0, PARAPET));

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (gr > ROOF_DECK) continue; // ground too high to carry the storeys; foundation only

  const edge = isEdge(x, z);
  const street = edge && isStreetFace(x, z);
  const frontEntrance = street && x >= 13 && x <= 14;

  if (!edge) {
    // Interior: floor slabs and roof deck, air between (no interiors).
    g.set(x, gr, z, "smooth_stone");
    if (FLOOR_2 > gr) g.set(x, FLOOR_2, z, "smooth_quartz");
    g.set(x, ROOF_DECK, z, "gray_concrete");
    continue;
  }

  // Edge: the facade.
  g.set(x, gr, z, "polished_andesite"); // base course

  // Ground storey: shopfront with glass bays and piers.
  for (let y = gr + 1; y <= FLOOR_2 - 1; y++) {
    const pier = (x + z) % 3 === 0;
    if (y <= gr + 2) {
      if (street) {
        g.set(x, y, z, pier ? "smooth_quartz" : "light_blue_stained_glass");
      } else {
        g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    } else {
      g.set(x, y, z, street ? "smooth_quartz" : "white_concrete");
    }
  }

  // Entrance: dark glass door and red awning over the shopfront.
  if (frontEntrance) {
    g.set(x, gr + 1, z, "tinted_glass");
    g.set(x, gr + 2, z, "tinted_glass");
  }
  if (street && x >= 10 && x <= 17) {
    g.set(x, gr + 3, z, "red_terracotta");
  }

  // Storey line.
  if (FLOOR_2 > gr) g.set(x, FLOOR_2, z, "smooth_quartz");

  // Upper storey: windows in white tile, with a sill band at the top.
  for (let y = FLOOR_2 + 1; y <= 8; y++) {
    const pier = (x + z) % 3 === 0;
    g.set(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
  }
  g.set(x, 9, z, "white_concrete");

  // Cornice and parapet.
  g.set(x, ROOF_DECK, z, "smooth_quartz");
  g.set(x, PARAPET, z, "smooth_quartz");
}

// Pass 2: warm lights behind some windows (inside the footprint, one cell in).
for (const [x, z, gr0] of cells) {
  if (!isEdge(x, z)) continue;
  const gr = Math.max(0, Math.min(gr0, PARAPET));
  if (gr > ROOF_DECK) continue;
  if ((x + z) % 9 !== 1) continue;

  // Inward direction: opposite the missing neighbour.
  let dx = 0, dz = 0;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  else if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;

  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;

  // Ground-storey lights at the shopfront, upper-storey lights at the window.
  const yLight = (x + z) % 2 === 0 ? gr + 2 : 7;
  g.set(ix, yLight, iz, "glowstone");
}

// Roof plant: a small enclosure in the middle of the roof.
for (let x = 10; x <= 13; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "light_gray_concrete");
  }
}

g.save(`${dir}/${id}.nbt`);
