import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// A two-storey Federal-era limestone office block on a diagonal site: stone base, quartz walls with a belt course at
// y3, pilastered window bays, a cornice on every roof, lit windows with glowstone behind the glass, a door on the NE
// front and roof plant on the lower middle. Heights follow the lidar roof (3..7): the 7s are the tower, the 5s a wing,
// the 3 a one-storey corner.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC64194.cells.json`, "utf8"));

const roofAt = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inside = (x, z) => roofAt.has(`${x},${z}`);
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
const isWall = (x, z) => inside(x, z) && exposed(x, z).length > 0;

const BASE = "stone_bricks";
const WALL = "quartz_block";
const BELT = "smooth_quartz";
const CAP = "smooth_quartz";
const DECK = "smooth_stone";

const g = new Voxels([12, 19, 6]);

for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;                       // solid column up to the cornice course; the roof surface is at `roof`
  const faces = exposed(x, z);
  const perim = faces.length > 0;
  const corner = faces.length > 1;
  const bay = perim && !corner && (x + z) % 2 === 0;   // alternate bays are windows, the rest are piers
  for (let y = ground; y <= top; y++) {
    if (y === 0) { g.set(x, y, z, BASE); continue; }                     // base course
    if (y === top) { g.set(x, y, z, perim ? CAP : DECK); continue; }     // cornice / roof deck
    if (y === 3) { g.set(x, y, z, BELT); continue; }                     // storey line (floor slab inside)
    if (!perim) continue;                                                // interior: air behind the glass
    const band = y <= 2 || (y >= 4 && y < top);                          // window band on ground and upper storeys
    if (!band) { g.set(x, y, z, WALL); continue; }
    if (bay) {
      const lateral = faces[0] === "N" || faces[0] === "S";              // pane connects along the face it sits in
      const state = lateral
        ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      g.set(x, y, z, "gray_stained_glass_pane", state);             // dark glass so the bays read against the quartz
    } else {
      g.set(x, y, z, "quartz_pillar", { axis: "y" });                    // pier between bays
    }
  }
}

// The NE front door, flanked by piers (the cell at x 8, z 0 is the bay that gives way to the door)
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(8, 1, 0, "iron_door", door("lower"));
g.set(8, 2, 0, "iron_door", door("upper"));

// Warm light: glowstone in the room behind some lit windows (replaces the air gap for those few)
for (const [x, z, , roof] of cells) {
  const faces = exposed(x, z);
  if (faces.length !== 1 || (x + z) % 2 !== 0) continue;
  const [dx, dz] = DIRS[faces[0]];
  const ix = x - dx, iz = z - dz;                                       // inward, opposite the exposed face
  if (!inside(ix, iz) || isWall(ix, iz)) continue;
  for (const y of [1, 2, 4, 5]) {
    if (y >= roof - 1) continue;
    if ((x * 5 + z * 3 + y) % 3 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// Roof plant on the middle of the roof (interior cells), with a lantern on top of one unit
g.set(4, 6, 2, "chiseled_stone_bricks");
g.set(2, 6, 3, "chiseled_stone_bricks");
g.set(2, 7, 3, "lantern", { hanging: "false", waterlogged: "false" });

const info = g.save(`${DIR}/DC64194.nbt`);
console.log(JSON.stringify(info));
