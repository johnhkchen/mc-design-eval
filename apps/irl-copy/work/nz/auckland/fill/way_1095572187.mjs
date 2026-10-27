// Way 1095572187: a two-storey brick commercial block (c. 1920s-30s, Auckland's Karangahape / Eden Terrace
// streetscape): a shopfront on the ground floor with a stone base course and a dark fascia, an upper storey of
// punched brick-and-glass windows between stone quoins, a stone cornice-parapet and a flat roof with a small plant box.
// Walls are one block thick on the footprint's edge; the interior is floor slabs and air, with glowstone behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572187.cells.json", "utf8"));

const g = new Voxels([7, 22, 10]);
const FP = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFP = (x, z) => FP.has(`${x},${z}`);

const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const exposed = (x, z) => DIRS.filter((d) => !inFP(x + d.dx, z + d.dz));

const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const glass = (y) => g.set(...y, "glass_pane", PANE);

// the walls and deck, cell by cell; each cell's lidar ground and roof come from the cells file
for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;                              // the parapet and roof deck: the top course of the cell
  const exp = exposed(x, z);
  // quoins only where the footprint turns at its outer extremes (the stepped edge makes most cells two-sided)
  const edge = exp.length > 0, corner = exp.length >= 2 && (x === 0 || x === 6 || z === 0 || z === 9);

  // stone base course and the floor slab under the ground storey (every cell, so nothing floats)
  g.set(x, ground, z, "stone_bricks");

  if (!edge) {
    g.set(x, 4, z, "smooth_stone");                  // upper floor slab; air above it is the room
    g.set(x, top, z, "gray_concrete");               // flat roof covering
    continue;
  }

  // storey line between the floors, a lintel band over the upper windows, and the parapet cap
  g.set(x, 4, z, "stone_bricks");
  g.set(x, 7, z, "stone_bricks");
  g.set(x, top, z, "stone_bricks");

  if (corner) {
    // quoins: stone at the corners, full height
    for (const y of [1, 2, 3, 5, 6]) g.set(x, y, z, "stone_bricks");
    continue;
  }

  const bay = (x + z) % 2;                           // alternating bays along each face
  // ground storey: shopfront glass between stone piers, dark fascia above
  for (let y = 1; y <= 2; y++) {
    if (bay === 1) glass([x, y, z]); else g.set(x, y, z, "bricks");
  }
  g.set(x, 3, z, "dark_oak_planks");

  // upper storey: window bays in brick, one per two cells
  for (let y = 5; y <= 6; y++) {
    if (bay === 1) glass([x, y, z]); else g.set(x, y, z, "bricks");
  }
}

// lights behind some glass: the inward cell must be interior (not an edge cell), so the bulb sits in the air gap
for (const [x, z] of cells) {
  const exp = exposed(x, z);
  if (exp.length !== 1 || (x + z) % 2 !== 1) continue;
  const d = exp[0], ix = x - d.dx, iz = z - d.dz;
  if (!inFP(ix, iz) || exposed(ix, iz).length) continue;
  const h = (x * 3 + z * 5) % 4;
  if (h === 0) g.set(ix, 5, iz, "glowstone");        // upper floor
  else if (h === 2) g.set(ix, 1, iz, "glowstone");   // shop, lit at dusk
}

// the shop door on the north edge, with its lintel band and piers beside it
g.set(2, 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(2, 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(2, 3, 0, "dark_oak_planks");

// roof plant box, standing on the deck at the back of the roof
for (const [x, z] of [[4, 5], [5, 5], [4, 6], [5, 6]]) {
  g.set(x, 9, z, "light_gray_concrete");
  g.set(x, 10, z, "light_gray_concrete");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572187.nbt");
