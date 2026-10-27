// Tinley Gatehouse (way 23907320): a two-storey rendered-plaster commercial front on a thin diagonal footprint.
// Ground is 0 under every cell, so there is no foundation. The lidar roof (7-9 above y 0) is smoothed to one flat roof
// at 8 with a stone parapet course on the street edge (top at 9, the lidar maximum). Each column is solid from y 0 up.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_23907320.cells.json`, "utf8"));

const ROOF = 8;       // solid body y 0..7: two storeys of 4
const PARAPET = 8;    // one stone course on the street edge
const BODY = "smooth_quartz";   // rendered plaster, cream
const BASE = "stone_bricks";    // plinth, storey line, parapet
const FRAME = "dark_oak_planks";// shopfront fascia, sash frames, piers in glazing
const GLASS = "glass_pane";

const F = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => F.has(`${x},${z}`);
// Minecraft north is -z. outward = the open side of a cell.
const DIRS = [
  { dx: -1, dz: 0, name: "west" },
  { dx: 1, dz: 0, name: "east" },
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
];
const exposed = (x, z) => DIRS.filter((d) => !inF(x + d.dx, z + d.dz));
const pier = (z) => z % 3 === 0;                 // every third row: a plaster pier between window bays
const lit = (z) => !pier(z) && z % 6 === 2;      // some upper windows lit from behind

const pane = (x, z) => ({
  north: String(inF(x, z - 1)), south: String(inF(x, z + 1)),
  east: String(inF(x + 1, z)), west: String(inF(x - 1, z)),
});

const g = new Voxels([10, 22, 27]);

// the body first: solid from y 0 up under every footprint cell
for (const [x, z] of cells) for (let y = 0; y < ROOF; y++) g.set(x, y, z, BODY);

// the door: the street-facing single-sided shell cell near the middle of the run
const doorCell = cells.find(([x, z]) => z >= 11 && z <= 16 && !pier(z) && exposed(x, z).length === 1);
const [dx0, dz0] = doorCell;
const doorDir = exposed(dx0, dz0)[0];

for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (!ex.length) continue;                      // interior: body only
  const isDoor = x === dx0 && z === dz0;

  // plinth, storey line, parapet
  g.set(x, 0, z, BASE);
  g.set(x, 4, z, BASE);
  g.set(x, PARAPET, z, BASE);

  // ground floor: glazed shopfront bays, framed piers, dark fascia over
  for (const y of [1, 2]) g.set(x, y, z, pier(z) ? FRAME : GLASS, pier(z) ? undefined : pane(x, z));
  g.set(x, 3, z, FRAME);

  // upper floor: glazed bays under a plaster head, plaster piers between
  if (!pier(z)) for (const y of [5, 6]) g.set(x, y, z, GLASS, pane(x, z));

  if (isDoor) {
    const facing = doorDir.name;
    g.set(x, 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });   // hangs from the storey line
  }
}

// warm light behind some upper glass: the cell on the inner side of a lit window
let lamps = 0;
for (const [x, z] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1 || !lit(z)) continue;
  const ix = x - ex[0].dx, iz = z - ex[0].dz;
  if (!inF(ix, iz)) continue;
  for (const y of [5, 6]) { g.set(ix, y, iz, "glowstone"); lamps++; }
}

const counts = g.save(`${DIR}/way_23907320.nbt`);
console.log(JSON.stringify({ cells: cells.length, door: doorCell, doorFacing: doorDir.name, lamps, ...counts }));
