// 677 Fifth Avenue, 1921: a mixed residential and commercial block of about nine storeys in the Renaissance Revival
// manner of the 1920s avenue. Footprint 27 x 14. Fifth Avenue is the x = 0 face (the 14-block side); the cross streets
// are the z = 0 (north) and z = 13 (south) faces. Granite base and shopfronts at ground level (glass blocks between
// granite piers, a dark awning band over the doors); brick walls with calcite (buff terracotta) storey bands and
// cornice, quoins at the corners; double-height windows in the bays between brick piers. Each window sits one block
// in front of an air pocket bounded by a floor slab below and the next band above; sparse glowstone is set behind
// some panes. Lidar roofs are read as four clean tiers (23, 24, 26, 29) that step down toward Fifth Avenue, and the
// lidar holes inside the footprint take their neighbours' tier. A water tower of spruce stands on the 26 roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035724.cells.json`, "utf8"));
const X = 27, Y = 41, Z = 14;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => cell.has(`${x},${z}`);
const lidarRaw = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);
// A lidar hole (0 inside the footprint) takes the highest neighbouring roof; 26 if it has none.
const lidar = (x, z) => {
  const v = lidarRaw(x, z);
  if (v) return v;
  const n = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dz]) => lidarRaw(x + dx, z + dz)).filter(Boolean);
  return n.length ? Math.max(...n) : 26;
};
// Clean tiers from the noisy lidar: the cross-street wing at 29, the body at 26, the Fifth Avenue setback at 24 and 23.
const tierOf = (L) => (L >= 28 ? 29 : L >= 26 ? 26 : L >= 24 ? 24 : 23);
const roofAt = (x, z) => (inFoot(x, z) ? tierOf(lidar(x, z)) : 0);

// Outward faces. A cell is open at height y when it is outside the footprint, unbuilt, or its roof is at or below y.
const DIRS = { W: [-1, 0], E: [1, 0], N: [0, -1], S: [0, 1] };
const open = (x, y, z) => roofAt(x, z) <= y;
const exposed = (x, y, z) => Object.keys(DIRS).filter((d) => open(x + DIRS[d][0], y, z + DIRS[d][1]));

// Along-face coordinate: z on the Fifth Avenue faces, x on the cross-street faces.
const along = (d, x, z) => (d === "W" || d === "E" ? z : x);
const paneState = (d) =>
  d === "W" || d === "E"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// Doors: the Fifth Avenue lobby and the South Street residential entrance. Facing is the way a player placing them
// would stand, so the door's thin edge sits in the wall.
const DOORS = [
  { d: "W", x: 0, z: 6, facing: "east" },
  { d: "S", x: 12, z: 13, facing: "north" },
];
const doorAt = (x, z) => DOORS.find((o) => o.x === x && o.z === z);

const g = new Voxels([X, Y, Z]);
const cols = [...cell.keys()].map((k) => k.split(",").map(Number));

// 1. Mass: foundation to each cell's ground (all 0 here), a solid brick core to the roof, and the roof surface, which
// is tar-and-gravel grey on the inside and calcite coping along the edge.
for (const [x, z] of cols) {
  const { ground } = cell.get(`${x},${z}`), T = roofAt(x, z);
  for (let y = 0; y < ground; y++) g.set(x, y, z, "polished_granite");
  for (let y = ground; y < T; y++) g.set(x, y, z, "bricks");
  g.set(x, T - 1, z, exposed(x, T - 1, z).length ? "smooth_stone" : "gray_concrete");
}

// 2. Faces, and the air behind the glass. Ground floor (y 1-2): granite piers, glass shopfronts, a door bay with a dark
// awning band at y 3. Upper storeys: a calcite band at every third row (y 3, 6, ...) and glass panes in the two rows
// above it between brick piers every third column. Cornice at T-2. Quoins at the corners.
for (const [x, z] of cols) {
  const T = roofAt(x, z);
  for (let y = 0; y < T - 1; y++) {
    const sides = exposed(x, y, z);
    if (!sides.length) continue;
    const d = sides[0];
    const [dx, dz] = DIRS[d];
    const u = along(d, x, z);
    const corner = sides.length >= 2;
    const door = y >= 1 && y <= 2 ? doorAt(x, z) : null;
    const k = Object.keys(DIRS).indexOf(d);
    let block = null, state = null, glass = false;

    if (y === 0) block = "polished_granite";
    else if (y === T - 2) block = "calcite";                                   // cornice course
    else if (door && y <= 2) block = "dark_oak_door", state = { facing: door.facing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
    else if (door && y === 3) block = "dark_oak_slab", state = { type: "bottom", waterlogged: "false" };
    else if (y <= 2) { if (u % 3 === 0) block = "polished_granite"; else { block = "glass"; glass = true; } }
    else if (y % 3 === 0) block = "calcite";                                  // storey band
    else if (corner) block = "calcite";                                       // quoin
    else if (u % 3 === 0) block = "bricks";                                   // pier
    else { block = "glass_pane"; state = paneState(d); glass = true; }

    if (block) g.set(x, y, z, block, state);

    // The air behind a window or shopfront: one block in, a floor slab at each band row (the pocket's floor and
    // ceiling), a warm light in some. Behind a door it is the lobby.
    if (glass || door) {
      const ix = x - dx, iz = z - dz;
      if (inFoot(ix, iz) && roofAt(ix, iz) > y) {
        if (y % 3 === 0 && y > 0) g.set(ix, y, iz, "smooth_stone");
        else if (!door && lit(u, y, k)) g.set(ix, y, iz, "glowstone");
        else g.set(ix, y, iz, "air");
      }
    }
  }
}

// 3. Roof equipment: a spruce water tower on the 26 roof, on four log legs over the tank's corners.
const TANK = { x0: 12, x1: 14, z0: 6, z1: 8 };
const roofY = roofAt(13, 7);   // 26
for (const x of [TANK.x0, TANK.x1]) for (const z of [TANK.z0, TANK.z1]) for (let y = roofY; y < roofY + 2; y++) g.set(x, y, z, "spruce_log", { axis: "y" });
for (let y = roofY + 2; y < roofY + 5; y++) for (let x = TANK.x0; x <= TANK.x1; x++) for (let z = TANK.z0; z <= TANK.z1; z++) g.set(x, y, z, "spruce_planks");
for (let x = TANK.x0; x <= TANK.x1; x++) for (let z = TANK.z0; z <= TANK.z1; z++) g.set(x, roofY + 5, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

const out = g.save(`${DIR}/NYC1035724.nbt`);
console.log(JSON.stringify({ footprint: cols.length, ...out }));
