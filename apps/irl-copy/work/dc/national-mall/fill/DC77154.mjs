// 1711 Riggs Place NW (Dupont Circle): a 1910s-20s red-brick walk-up flat, a 3-storey shell on a stone plinth with
// brownstone (smooth sandstone) quoins, string course and cornice, a dark slate roof and two brick chimneys. The lidar
// roof is 7 blocks over most of the footprint and 5 on a lower rear wing; that step is kept as a second, lower mass.
// Interiors are air: only the outer shell, one floor slab per storey and the roof deck are built.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77154.cells.json`, "utf8"));   // [x, z, ground, roof]

const F = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => F.has(`${x},${z}`);
// a side is outside when no footprint cell is beside it, or the cell beside it stands lower (its wall then shows above that roof)
const outside = (x, z, nx, nz) => !has(nx, nz) || F.get(`${nx},${nz}`).roof < F.get(`${x},${z}`).roof;
const exposedX = (x, z) => outside(x, z, x - 1, z) || outside(x, z, x + 1, z);
const exposedZ = (x, z) => outside(x, z, x, z - 1) || outside(x, z, x, z + 1);
const edge = (x, z) => exposedX(x, z) || exposedZ(x, z);

const g = new Voxels([11, 19, 8]);

// the entrance: the middle even-numbered cell of the street row (z 0), off the corners so it has piers either side
const streetRow = cells.filter(([, z]) => z === 0).map(([x]) => x).sort((a, b) => a - b);
const doorX = streetRow.filter((x) => x % 2 === 0 && x > streetRow[0] && x < streetRow[streetRow.length - 1])[0];
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const pane = (exZ) => (exZ
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

for (const [x, z, , ] of cells) {
  const { ground, roof: r } = F.get(`${x},${z}`);
  const exX = exposedX(x, z), exZ = exposedZ(x, z), corner = exX && exZ;

  // stone plinth on every cell (and any foundation up to the lidar ground, though the site is level here)
  for (let y = 0; y < Math.max(1, ground); y++) g.set(x, y, z, "stone_bricks");

  if (!edge(x, z)) {
    // interior: a floor slab on the storey line and the roof deck, air between (no interiors)
    if (3 < r - 1) g.set(x, 3, z, "spruce_planks");
    g.set(x, r - 1, z, "deepslate_tiles");
    continue;
  }

  // inward neighbour (the room behind this wall), used for the lamps behind the glass
  const ix = outside(x, z, x - 1, z) ? x + 1 : outside(x, z, x + 1, z) ? x - 1 : x;
  const iz = outside(x, z, x, z - 1) ? z + 1 : outside(x, z, x, z + 1) ? z - 1 : z;
  const inwardInside = has(ix, iz) && !edge(ix, iz) && !(ix === x && iz === z) && !corner;
  const along = exZ ? x : z;

  for (let y = 1; y < r - 1; y++) {
    if (y === 3) { g.set(x, y, z, "smooth_sandstone"); continue; }     // string course: lintel and sill
    if (corner) { g.set(x, y, z, "smooth_sandstone"); continue; }       // brownstone quoins
    if (exZ && z === 0 && x === doorX && y <= 2) {                      // entrance door, lower and upper halves
      g.set(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    const windowSlot = along % 2 === 1;                                 // odd bays are windows, even ones are brick piers
    if (!windowSlot) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", pane(exZ));
    // a lit window: a lantern (lower row) or glowstone (upper row) in the room behind the glass
    if (inwardInside && r >= 7) {
      if (y === 1 && (along + 1) % 4 === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
      if (y === 4 && (along + 1) % 4 === 2) g.set(ix, 4, iz, "glowstone");
    }
  }
  // cornice at the top of this cell's wall (a parapet ring round the slate roof)
  g.set(x, r - 1, z, "smooth_sandstone");
}

// the roof deck is inside the parapet; two brick chimneys stand on it
for (const [cx, cz] of [[3, 5], [7, 5]]) {
  g.set(cx, 7, cz, "bricks");
  g.set(cx, 8, cz, "bricks");
  g.set(cx, 9, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

const out = g.save(`${DIR}/DC77154.nbt`);
console.log(`DC77154.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
