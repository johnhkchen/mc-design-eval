// Way 162152705, Mt Eden / Eden Terrace: a c.1930 brick commercial block (Stripped Classical). Basalt plinth, shopfront
// at ground, three brick storeys with cream string courses and a cornice, a stepped tower on the west flank, and a
// lower wing to the south. Lidar roofs (cells' 4th number) are smoothed into the tiers below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152705.cells.json", "utf8"));
const g = new Voxels([14, 38, 31]);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const inFoot = (x, z) => ground.has(`${x},${z}`);

// Roof tiers (top = first y above the building): the lidar's 15-block main block, its 25-block west tower with a 20 setback,
// the 18 west flank ramp, a 14 south-east wing, an 8 south-west lower wing, and an 18 roof plant room. Lidar noise (+-1) flattened.
const roof = (x, z) => {
  if (x === 0 && z === 26) return 22;
  if (x === 0 && z >= 13 && z <= 25) return 25;
  if (x === 1 && z >= 13 && z <= 26) return 20;
  if (x <= 1 && z >= 27) return 10;
  if (x <= 1 && z >= 4 && z <= 12) return 18;
  if (x >= 3 && x <= 6 && z >= 3 && z <= 7) return 18;
  if (x <= 8 && z >= 22) return 8;
  if (z >= 22) return 14;
  return 15;
};
const R = (x, z) => (inFoot(x, z) ? roof(x, z) : 0);
const plant = (x, z) => x >= 3 && x <= 6 && z >= 3 && z <= 7;

// A face is open where the neighbour is outside the footprint or stands below this height: the cell is then skin.
const open = (x, z, y, nx, nz) => !inFoot(nx, nz) || R(nx, nz) <= y;
function faceAxis(x, z, y) {
  if (open(x, z, y, x - 1, z) || open(x, z, y, x + 1, z)) return "ew";
  if (open(x, z, y, x, z - 1) || open(x, z, y, x, z + 1)) return "ns";
  return null;
}

// Floor slabs run across the whole footprint (no interiors: air behind the glass). Ground storey base is y 2.
const SLABS = [6, 10, 14, 18, 22];
const storeyBase = (y) => SLABS.filter((f) => y >= f).pop() ?? 2;

// Facade by storey: shopfront glass with basalt piers, transom and fascia at ground; brick piers, paired windows with
// iron-bar mullions and brick spandrels above. k is the position along the face; piers every 4 blocks.
function skin(y, axis, z, x) {
  const k = axis === "ew" ? z : x, r = y - storeyBase(y);
  const pier = k % 4 === 0, mullion = k % 4 === 2;
  if (storeyBase(y) === 2) {
    if (r <= 1) return pier ? "polished_basalt" : mullion ? "iron_bars" : "glass_pane";
    return r === 2 ? "smooth_quartz" : "dark_oak_planks";
  }
  if (r === 3) return "bricks";
  return pier ? "bricks" : mullion ? "iron_bars" : "glass_pane";
}

for (const [x, z, gr] of cells) {
  const top = R(x, z);
  for (let y = 0; y < top; y++) {
    const axis = faceAxis(x, z, y);
    let b;
    if (y < gr) b = "stone";                                            // foundation fill below the ground
    else if (y < 2) b = axis ? "polished_basalt" : "stone";              // basalt base course above the ground
    else if (y === top - 1) b = axis ? "smooth_quartz" : "stone";        // roof deck and coping
    else if (SLABS.includes(y)) b = axis ? "smooth_quartz" : "stone";    // floor slab and string course
    else if (!axis) continue;                                            // interior air
    else if (y === top - 2) b = "smooth_quartz";                         // cornice
    else if (plant(x, z)) b = y === 15 && x % 2 === 0 ? "iron_bars" : "stone_bricks";
    else b = skin(y, axis, z, x);
    g.set(x, y, z, b);
  }
}

// Entrance on the east face at z 7: double door, a fascia canopy over it, and a hanging lantern under the canopy.
const door = (y, half) => g.set(13, y, 7, "dark_oak_door", { facing: "east", half, hinge: "left", open: "false", powered: "false" });
door(2, "lower"); door(3, "upper");
g.set(13, 4, 7, "lantern", { hanging: "true" });

// Warm lights standing just inside the glass (on a slab or the foundation), in some bays of both street faces.
const lamp = (x, y, z) => { if (y < R(x, z) && !faceAxis(x, z, y) && !g.get(x, y, z)) g.set(x, y, z, "lantern", { hanging: "false" }); };
for (const z of [1, 9, 17, 25]) for (const y of [2, 7, 11]) lamp(12, y, z);
for (const z of [5, 13, 21]) for (const y of [2, 7, 11]) lamp(1, y, z);

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162152705.nbt";
const info = g.save(out);
console.log(JSON.stringify(info));
