// Way 1095572141, Mt Eden village: a two-storey brick shop block with a shopfront, a 1920s parapet and a flat roof.
// Lidar: every footprint cell is at ground 0 and roof 10, so the building sits flat and its roof top is y 10 (parapet).
// Storeys: ground y1-4 (base course, glass shopfront, lintel), string course y5, upper y6-8 (sills and paired panes),
// cornice y9 (corbelled), parapet y10. Interiors are air; floor slab at y5, roof deck at y9.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572141.cells.json", "utf8"));
const X = 7, Z = 10, Y = 23;
const top = Math.max(...cells.map((c) => c[3]));           // 10: the lidar roof height above y 0
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);

// outward neighbours: [dx, dz] of the missing neighbour (north = -z, south = +z, west = -x, east = +x)
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const outward = (x, z) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz));
const isExt = (x, z) => outward(x, z).length > 0;

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const pane = (dx) => (dx === 0   // along a north/south wall the pane joins its east and west neighbours; along an east/west wall, north and south
  ? { north: "false", south: "false", east: "true", west: "true" }
  : { north: "true", south: "true", east: "false", west: "false" });

// the door: the north tip cell (2, 0) faces the street through the base course
const doorCell = cells.find(([x, z]) => z === 0)[0] + ",0";
const interior = [];

for (const [x, z] of cells) {
  // one floor slab per storey and the roof deck, across the whole footprint
  put(x, 5, z, "stone_bricks");
  put(x, 9, z, "smooth_stone");
  if (!isExt(x, z)) { interior.push([x, z]); continue; }

  const [[dx, dz]] = outward(x, z);                         // the face this wall cell presents (first one for corners)
  const bay = dz !== 0 ? x : z;                             // bay index along that face
  const win = bay % 2 === 1;                                // odd bays are windows, even bays piers
  const inward = [x - dx, z - dz];                          // one cell in, behind the glass
  const lit = (x * 7 + z * 3) % 4 === 0 && inFp(...inward) && !isExt(...inward);

  put(x, 1, z, "polished_andesite");                        // base course
  if (`${x},${z}` === doorCell) {
    const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, 2, z, "dark_oak_door", { ...door, half: "lower" });
    put(x, 3, z, "dark_oak_door", { ...door, half: "upper" });
  } else {
    for (const y of [2, 3]) put(x, y, z, win ? "glass" : "bricks");
    if (win && lit) put(inward[0], 2, inward[1], "lantern", { hanging: "false" });   // lamp behind the shopfront glass
  }
  put(x, 4, z, "stone_bricks");                            // shopfront lintel
  put(x, 5, z, "stone_bricks");                            // string course
  put(x, 6, z, win ? "stone_bricks" : "bricks");           // sill or pier
  for (const y of [7, 8]) put(x, y, z, win ? "glass_pane" : "bricks", win ? pane(dx) : undefined);
  if (win && lit) put(inward[0], 7, inward[1], "glowstone");   // warm light behind the upper pane
  put(x, 9, z, bay % 2 === 0 ? "chiseled_stone_bricks" : "stone_bricks");   // corbelled cornice
  put(x, top, z, "bricks");                                 // parapet
}

// roof plant: two air-conditioning units on the flat roof, standing on the roof deck
const roofUnits = [interior[Math.floor(interior.length * 0.3)], interior[Math.floor(interior.length * 0.7)]];
for (const [x, z] of roofUnits) if (x !== undefined) put(x, top, z, "iron_block");

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572141.nbt";
console.log(g.save(out));
