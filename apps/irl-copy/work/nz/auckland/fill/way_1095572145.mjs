// Way 1095572145: a two-storey Edwardian brick commercial block (c.1905-1930) on the Eden Terrace flat, 10 blocks
// to its parapet. Ground storey: a stone plinth, shopfront glazing between brick piers, a dark-oak fascia and one
// entrance; upper storey: sash bays in white surrounds with a stone cornice and parapet. Flat roof with a plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572145.cells.json", "utf8"));
const g = new Voxels([8, 22, 10]);

const inside = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => inside.has(`${x},${z}`);
// the four faces, with the step to the neighbour across each
const FACES = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };

const DOOR = [1, 0];                                  // the north face's entrance, on the Eden Terrace street side
const ROOF = 9;                                       // lidar roof height above y 0 (parapet top layer)

for (const [x, z, ground, roof] of cells) {
  // foundation: solid from y 0 up to the cell's ground (0 here, so nothing to add beneath)
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const exposed = Object.entries(FACES).filter(([, [dx, dz]]) => !has(x + dx, z + dz)).map(([f]) => f);
  const top = roof;

  if (exposed.length === 0) {
    // interior: a floor slab per storey, air behind the glass, a roof deck on top
    g.set(x, 0, z, "smooth_stone");
    g.set(x, 5, z, "smooth_stone");
    g.set(x, top, z, "smooth_stone");
    continue;
  }

  // the wall's along-run coordinate sets the bay rhythm; corners are always piers
  const along = exposed.includes("N") || exposed.includes("S") ? x : z;
  const corner = exposed.length >= 2;
  const pier = corner || along % 3 !== 1;
  const isDoor = x === DOOR[0] && z === DOOR[1];

  g.set(x, 0, z, "stone_bricks");                                      // plinth
  for (const y of [1, 2]) {
    if (isDoor) continue;                                              // the door is placed below
    g.set(x, y, z, pier ? "bricks" : "glass");                         // shopfront glazing between piers
  }
  g.set(x, 3, z, "dark_oak_planks");                                   // shop fascia
  g.set(x, 4, z, "polished_andesite");                                 // string course
  g.set(x, 5, z, pier ? "bricks" : "white_concrete");                  // sill
  g.set(x, 6, z, pier ? "bricks" : "glass");                           // sash
  g.set(x, 7, z, pier ? "bricks" : "glass");
  g.set(x, 8, z, pier ? "stone_bricks" : "white_concrete");            // lintel and cornice
  g.set(x, top, z, "stone_bricks");                                    // parapet coping

  if (isDoor) {
    g.set(x, 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // warm light behind some upper sash bays: a glowstone on the room side of the glass
  if (!pier && (along + z) % 4 === 0) {
    for (const f of exposed) {
      const [dx, dz] = FACES[f];
      const ix = x - dx, iz = z - dz;
      if (has(ix, iz) && isInterior(ix, iz)) g.set(ix, 6, iz, "glowstone");
    }
  }
}

// interior cells: exposed-face count is zero
function isInterior(x, z) {
  return Object.values(FACES).every(([dx, dz]) => has(x + dx, z + dz));
}

// lanterns on the ground-floor slab, behind some shop bays
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if ((x + z) % 5 === 0) g.set(x, 1, z, "lantern", { hanging: "false" });
}

// roof plant room: a small stone box on the roof deck, set well inside the parapet
for (const [x, z] of cells) {
  if (!isInterior(x, z)) continue;
  if (x >= 3 && x <= 4 && z >= 4 && z <= 5) {
    g.set(x, 10, z, "stone_bricks");
    g.set(x, 11, z, "smooth_stone_slab", { type: "bottom" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1095572145.nbt");
