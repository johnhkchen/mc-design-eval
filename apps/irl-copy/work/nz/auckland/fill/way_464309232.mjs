// Way 464309232: an eight-storey concrete office block on a diagonal footprint (84 x 41 blocks, roof 34 above y 0).
// Read as a 1980s Auckland office: a basalt-stone plinth, precast-concrete piers and spandrels, bronze (tinted) glass
// above a glazed shopfront, a recessed-free entrance on the north face, a plant room and lift core on the roof.
// The lidar roof is 34 on 498 of 510 cells; the rest are edge noise, so the whole footprint takes one flat roof tier.
// Only footprint cells are built. Floors are full-footprint slabs; the facade is a one-cell shell with an air gap behind
// the glass, so nothing is solid inside the walls except the slabs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_464309232.cells.json`, "utf8"));

const ROOF = 34;               // the lidar's flat roof: the top block is y 33, the roof surface is y 34
const STOREYS = 8;             // floor slab at y = 2 + 4k, windows at +1,+2, spandrel at +3 (k = 7 spandrel = roof at 33)
const PLINTH = 2;              // y 0..1 solid: the foundation under every cell
const FACES = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const exposed = (x, z) => FACES.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isWall = (x, z) => exposed(x, z).length > 0;

// the band runs diagonally (about 29 degrees off x): bays are counted along that axis, so piers and glass stay in step
// on both long faces and the stepped ends
const along = (x, z) => Math.round(0.87 * x + 0.49 * z);
const across = (x, z) => -0.49 * x + 0.87 * z;
const isPier = (x, z) => ((along(x, z) % 3) + 3) % 3 === 0;
const lit = (x, z, k) => ((x * 31 + z * 17 + k * 13) % 7) === 0;

const cx = cells.reduce((s, [x]) => s + x, 0) / cells.length;
const cz = cells.reduce((s, [, z]) => s + z, 0) / cells.length;
const uc = along(cx, cz), vc = across(cx, cz);

// entrance: the middle non-pier glass cell on the north-facing wall, ground floor
const northWalls = cells.filter(([x, z]) => exposed(x, z).some(([, dz, n]) => dz === -1 && n === "north") && !isPier(x, z));
northWalls.sort((a, b) => a[0] - b[0]);
const [dx0, dz0] = northWalls[Math.floor(northWalls.length / 2)];

const g = new Voxels([84, 46, 41]);

for (const [x, z] of cells) {
  // plinth: basalt-stone base course, solid from the lowest ground up to the first floor
  for (const y of [0, 1]) g.set(x, y, z, "stone_bricks");

  const wall = isWall(x, z);
  const faces = exposed(x, z);

  for (let k = 0; k < STOREYS; k++) {
    const b = PLINTH + 4 * k;
    // floor slab, full footprint
    g.set(x, b, z, "light_gray_concrete");

    if (wall) {
      const ground = k === 0;
      const glazing = ground ? "glass" : "gray_stained_glass";
      const pier = isPier(x, z);
      for (const y of [b + 1, b + 2]) g.set(x, y, z, pier ? "white_concrete" : glazing);
      // spandrel band above the window, the storey line
      g.set(x, b + 3, z, k === STOREYS - 1 ? "white_concrete" : "light_gray_concrete");

      // warm light behind some glass: a glowstone on the room side, standing on the floor slab
      if (!pier && lit(x, z, k)) {
        const [dx, dz] = faces[0];
        const ix = x - dx, iz = z - dz;
        if (inFp(ix, iz) && !isWall(ix, iz)) g.set(ix, b + 1, iz, "glowstone");
      }
    } else if (k === STOREYS - 1) {
      g.set(x, b + 3, z, "light_gray_concrete");   // roof membrane is the top floor's spandrel row
    }
  }

  // roof: the cornice on the edge, roof membrane inside (y 33)
  if (wall) g.set(x, ROOF - 1, z, "white_concrete");
}

// entrance: a glazed door in the north wall, two high on the ground floor slab
g.set(dx0, PLINTH + 1, dz0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx0, PLINTH + 2, dz0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// lamps either side of the door, on the shopfront piers' line (warm, at eye height)
for (const [ox, oz] of [[dx0 - 1, dz0], [dx0 + 1, dz0]]) {
  if (inFp(ox, oz) && isWall(ox, oz) && !isPier(ox, oz)) g.set(ox, PLINTH + 1, oz, "glowstone");
}

// roof: a lift core and plant on the flat roof, standing on the roof slab
for (const [x, z] of cells) {
  const u = along(x, z) - uc, v = across(x, z) - vc;
  if (Math.abs(u) <= 2 && Math.abs(v) <= 1.5) {
    for (let y = ROOF; y < ROOF + 4; y++) g.set(x, y, z, "light_gray_concrete");
    if (Math.abs(u) <= 1 && Math.abs(v) <= 1) g.set(x, ROOF + 4, z, "stone_brick_slab", { type: "bottom" });
  }
  // condenser plant: iron-grilled boxes in two rows along the south-east end
  if (u >= 14 && u <= 17 && Math.abs(v) <= 1 && (x + z) % 2 === 0) g.set(x, ROOF, z, "iron_block");
}

g.save(`${DIR}/way_464309232.nbt`);
console.log(`built: ${cells.length} footprint cells, ${g.count()} blocks, palette ${g.palette.length}`);
