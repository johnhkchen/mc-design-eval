// 530 Fifth Avenue, the Bank of New York Building (1957): a Modernist office block of the postwar Midtown curtain-wall
// years. A granite-clad podium of three storeys carries glass and light-grey spandrels above, with iron mullions on a
// three-block module. Footprint 48 x 37; the lidar roof is read as four flat tiers: a 36-block low wing (12 storeys), a
// 46-block setback, a 60-block mid wing (20 storeys) and the 86-block tower (28 storeys) with a mechanical penthouse on
// its roof. Each tier stands on the one below; the core is solid and every window sits one block out from it with an
// air gap behind the glass and a floor slab at each storey line (no interiors). The lobby is recessed on the north
// (low z) front, with a grey-granite portal, two doors and a hanging lantern. Warm glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034227.cells.json`, "utf8"));
const X = 48, Y = 98, Z = 37;

const lidar = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => lidar.has(`${x},${z}`);

// Lidar smoothed into four flat tiers (block heights above y 0). A zero return on a footprint cell gets the low wing.
const tierOf = (roof) => (roof < 41 ? 36 : roof < 53 ? 46 : roof < 73 ? 60 : 86);
const topAt = (x, z) => (inFoot(x, z) ? tierOf(lidar.get(`${x},${z}`).roof) : 0);
const groundAt = (x, z) => (inFoot(x, z) ? lidar.get(`${x},${z}`).ground : 0);

// N = low z, the north front with the lobby; S = high z; W = low x; E = high x. [dx, dz] points out of the building.
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const ORDER = ["N", "S", "W", "E"];
const K = { N: 0, S: 1, W: 2, E: 3 };
const exposed = (x, y, z, d) => {
  const [dx, dz] = DIRS[d], nx = x + dx, nz = z + dz;
  return !inFoot(nx, nz) || topAt(nx, nz) <= y;   // outside the footprint, or the neighbour's roof is at or below y
};
const faceOf = (x, y, z) => (y < topAt(x, z) ? (ORDER.find((d) => exposed(x, y, z, d)) ?? null) : null);

const ALONG_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a N/S face
const ALONG_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a E/W face
const DOOR = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });
const key = (x, y, z) => `${x},${y},${z}`;
const WINDOW = (y) => y % 3 !== 0;                  // storey lines at y = 0, 3, 6 ... are spandrels; the rest are glass
const PODIUM = 9;                                   // the first three storeys are grey granite (polished andesite)
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// Lobby on the north front: granite pilasters at x 31 and 36, glass at 32 and 35, doors at 33 and 34, and a recessed
// vestibule at z 1 (air, open to the lobby), so the portal lintel at y 3 stands over it.
const frontLobby = (x, y, z) => z === 0 && (y === 1 || y === 2) && x >= 31 && x <= 36;
const vestibule = (x, y, z) => z === 1 && (y === 1 || y === 2) && x >= 32 && x <= 35;

const cols = cells.map(([x, z]) => [x, z]);

// 1. Air behind the glass: the one-block gap inside every window (not the spandrel rows, not the lobby front).
const air = new Set();
for (const [x, z] of cols) {
  const T = topAt(x, z);
  for (let y = 0; y < T; y++) {
    if (vestibule(x, y, z)) air.add(key(x, y, z));
    const d = faceOf(x, y, z);
    if (!d || !WINDOW(y) || frontLobby(x, y, z)) continue;
    const [dx, dz] = DIRS[d], ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && topAt(ix, iz) - 1 > y && !faceOf(ix, y, iz)) air.add(key(ix, y, iz));
  }
}

const g = new Voxels([X, Y, Z]);

// 2. Solid core, facade and roofs. The foundation runs from y 0 up to each cell's ground (none here: the lot is flat).
for (const [x, z] of cols) {
  const T = topAt(x, z), G = groundAt(x, z);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");
  for (let y = G; y < T; y++) {
    if (air.has(key(x, y, z))) continue;
    const d = faceOf(x, y, z);
    if (y === T - 1) { g.set(x, y, z, d ? "polished_andesite" : "smooth_stone"); continue; }   // roof cover, cornice on the edge
    if (frontLobby(x, y, z)) {
      if (x === 31 || x === 36) g.set(x, y, z, "polished_andesite");
      else if (x === 33 || x === 34) g.set(x, y, z, "iron_door", DOOR(y === 1 ? "lower" : "upper", x === 33 ? "left" : "right"));
      else g.set(x, y, z, "cyan_stained_glass_pane", ALONG_X);
      continue;
    }
    if (!d) { g.set(x, y, z, "light_gray_concrete"); continue; }   // core
    const [dx] = DIRS[d], u = dx === 0 ? x : z;                       // position along the face
    if (!WINDOW(y)) { g.set(x, y, z, y < PODIUM ? "polished_andesite" : "light_gray_concrete"); continue; }
    if (u % 3 === 0) { g.set(x, y, z, "iron_block"); continue; }      // iron mullion on the module
    g.set(x, y, z, "cyan_stained_glass_pane", d === "N" || d === "S" ? ALONG_X : ALONG_Z);
  }
  // A one-block coping on the outer edge of each roof.
  if (T > 0 && (inFoot(x, z - 1) === false || inFoot(x, z + 1) === false || inFoot(x - 1, z) === false || inFoot(x + 1, z) === false)) {
    g.set(x, T, z, "polished_andesite");
  }
}

// 3. Warm light: glowstone in the air gap behind some panes, never in the lobby.
for (const [x, z] of cols) {
  const T = topAt(x, z);
  for (let y = 0; y < T - 1; y++) {
    if (!WINDOW(y)) continue;
    const d = faceOf(x, y, z);
    if (!d || frontLobby(x, y, z)) continue;
    const [dx, dz] = DIRS[d], u = dx === 0 ? x : z;
    if (u % 3 === 0 || !lit(u, y, K[d])) continue;
    const ix = x - dx, iz = z - dz;
    if (air.has(key(ix, y, iz))) g.set(ix, y, iz, "glowstone");
  }
}

// 4. Lobby lantern, hung from the portal lintel.
g.set(34, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });

// 5. Mechanical penthouse on the tower roof (y 86 to 89), a solid box with a granite cap.
for (let x = 30; x <= 39; x++) for (let z = 16; z <= 22; z++) {
  if (!inFoot(x, z) || topAt(x, z) !== 86) continue;
  for (let y = 86; y <= 88; y++) g.set(x, y, z, "light_gray_concrete");
  g.set(x, 89, z, "polished_andesite");
}

const stats = g.save(`${DIR}/NYC1034227.nbt`);
console.log(JSON.stringify({ ...stats, footprint: cols.length }));
