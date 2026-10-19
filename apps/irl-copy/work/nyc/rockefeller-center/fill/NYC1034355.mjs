// 1188 Avenue of the Americas, a 1920 commercial and office building: a five-storey brick block on a granite plinth,
// limestone storey bands and quoins, and a three-storey wing to the east (the lidar's step from 14-16 down to 7-9).
// Footprint 27 x 7 (x along the street, low z = north = the principal frontage). Ground storey: a shopfront of glass
// in dark-wood piers with a recessed entrance at x 6 (door, lantern on the limestone band over it). Above: brick piers
// between paired windows, a limestone band at every third block (the storey lines), and a roof of smooth stone with a
// limestone cornice. A penthouse sits on the main mass, and a small mechanical box on the wing roof. Lidar roof is read
// as clean tiers, not cell by cell; open lidar cells are court paving. Glass sits one block out from the solid core,
// with air behind it (a few with warm glowstone), and a floor slab in each storey (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034355.cells.json`, "utf8"));
const X = 27, Y = 20, Z = 7;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Block tops above y 0: the main mass to 16 over x 0..14 (the lidar's 13-16, read as one tier), the east wing to 10
// over x 15..26 (the lidar's 7-9, and its 16 strip on the north edge), a 19-block penthouse on the main mass. 0 = nothing.
const PENT = (x, z) => x >= 3 && x <= 5 && z >= 2 && z <= 4;
const topOf = (x, z) => {
  if (!inFoot(x, z) || lidar(x, z) === 0) return 0;
  if (PENT(x, z)) return 19;
  return x <= 14 ? 16 : 10;
};

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };   // outward; N = low z, the frontage
const isNS = (d) => d === "N" || d === "S";                        // a face running along x
const PANE_NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });   // on the north wall
const LANTERN = { hanging: "true", waterlogged: "false" };

// Exposed faces at height y: an outward neighbour that is open there (outside the footprint, unbuilt, or lower).
const facesAt = (x, y, z) => Object.keys(DIRS).filter((d) => topOf(x + DIRS[d][0], z + DIRS[d][1]) <= y);
const isEntrance = (x, y, z) => z === 0 && x === 6 && (y === 1 || y === 2);

const g = new Voxels([X, Y, Z]);
const windows = [];   // [x, y, z, outward dir] of every glass pane, so the air behind it can be cut after

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const top = topOf(x, z);
  if (!top) { g.set(x, 0, z, "stone_bricks"); continue; }   // open lot: court paving at the ground
  for (let y = 0; y < top; y++) {
    const faces = facesAt(x, y, z);
    if (isEntrance(x, y, z)) { g.set(x, y, z, "dark_oak_door", DOOR(y === 1 ? "lower" : "upper")); continue; }
    if (!faces.length) { g.set(x, y, z, y === top - 1 ? "smooth_stone" : "stone_bricks"); continue; }   // core and roof
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }                                       // plinth
    // Quoins at a corner (a north or south face meeting an east or west one); a one-block-thick wall is exposed on
    // both sides, so it takes the windows of its first face and the pane shows from either side.
    const corner = faces.some(isNS) && faces.some((f) => !isNS(f));
    if (corner || y % 3 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }                        // quoins, storey bands
    const d = faces[0], u = isNS(d) ? x : z, pier = u % 3 === 0, ground = y < 3;
    const block = pier ? (ground ? "dark_oak_planks" : "bricks") : "glass_pane";
    g.set(x, y, z, block, block === "glass_pane" ? (isNS(d) ? PANE_NS : PANE_EW) : undefined);
    if (block === "glass_pane") windows.push([x, y, z, d]);
  }
}

// Air behind each pane (a few hold a warm glowstone), and the entrance passage two cells deep.
for (const [x, y, z, d] of windows) {
  const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
  if (!inFoot(ix, iz) || topOf(ix, iz) <= y) continue;
  g.set(ix, y, iz, (x * 5 + y * 7 + z * 3) % 9 === 0 ? "glowstone" : "air");
}
for (const y of [1, 2]) for (const z of [1, 2]) g.set(6, y, z, "air");
g.set(6, 3, 0, "lantern", LANTERN);   // hangs from the brick pier above the door

// Roof plant on the wing: a light concrete box with a smooth stone cap, standing on the wing roof.
for (const x of [18, 19]) for (const z of [2, 3]) { g.set(x, 10, z, "light_gray_concrete"); g.set(x, 11, z, "smooth_stone"); }

const { blocks, palette } = g.save(`${DIR}/NYC1034355.nbt`);
console.log(`NYC1034355.nbt: ${blocks} blocks, palette ${palette}, size ${X} x ${Y} x ${Z}`);
