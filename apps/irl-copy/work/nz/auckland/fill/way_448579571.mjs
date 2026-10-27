// Way 448579571: a two-storey brick commercial block on a stepped plan, Mount Eden / Eden Terrace style (c. 1900-1930).
// Lidar roof heights become two flat tiers: the two-storey corner pavilions and a one-storey range with a parapet.
// Walls are one block of brick with stone string courses, white window heads and sills, glass panes, a dark timber door,
// a stone cornice, and warm lanterns behind some glass. Interiors are air with one floor deck per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_448579571.cells.json`, "utf8"));

const g = new Voxels([13, 21, 9]);

const WALL = "bricks", TRIM = "stone_bricks", FRAME = "white_concrete", ROOF = "stone", FLOOR = "smooth_stone";
const TALL = 8, LOW = 5, FLOOR_Y = 4;             // two storeys of 4 blocks; one storey plus parapet

// footprint → top of each column (a lidar roof of 0 is a no-return hole: it takes the low tier)
const top = new Map();
for (const [x, z, , roof] of cells) top.set(`${x},${z}`, roof >= 7 ? TALL : LOW);
const key = (x, z) => `${x},${z}`;
const inside = (x, z) => top.has(key(x, z));
const NORMAL = { east: [1, 0], west: [-1, 0], south: [0, 1], north: [0, -1] };
const exposed = (x, z) => Object.keys(NORMAL).filter((n) => !inside(x + NORMAL[n][0], z + NORMAL[n][1]));
const isWall = (x, z) => inside(x, z) && exposed(x, z).length > 0;
const quoin = (x, z) => exposed(x, z).length >= 2 && top.get(key(x, z)) === TALL;   // tower corners: stone quoins, no glass
const onGlassBay = (x, z, n) => n === doorFace || [1, 2].includes(((n === "north" || n === "south") ? x : z) % 4);  // the street face is a shopfront

// the street face: the outward normal with the most exposed wall cells (ties go to the first, east, west, south, north)
const counts = {};
for (const [k] of top) { const [x, z] = k.split(",").map(Number); for (const n of exposed(x, z)) counts[n] = (counts[n] ?? 0) + 1; }
const doorFace = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
const alongDoor = [];
for (const [k] of top) { const [x, z] = k.split(",").map(Number); if (exposed(x, z).includes(doorFace)) alongDoor.push([x, z]); }
alongDoor.sort((a, b) => (doorFace === "east" || doorFace === "west" ? a[1] - b[1] : a[0] - b[0]));
const [doorX, doorZ] = alongDoor[Math.floor(alongDoor.length / 2)];
const doorFacing = { east: "west", west: "east", south: "north", north: "south" }[doorFace];
const isDoor = (x, z) => x === doorX && z === doorZ;
const alongFace = (x, z) => (doorFace === "east" || doorFace === "west" ? z : x);
const doorSurround = (x, z) => exposed(x, z).includes(doorFace) && Math.abs(alongFace(x, z) - alongFace(doorX, doorZ)) === 1;

// glass pane connections: a pane joins the wall it sits in (its neighbours along the wall plane)
const paneState = (x, z, y, n) => {
  const along = n === "east" || n === "west" ? [[0, -1], [0, 1]] : [[-1, 0], [1, 0]];
  const sides = n === "east" || n === "west" ? ["north", "south"] : ["west", "east"];
  const st = { north: "false", south: "false", east: "false", west: "false" };
  along.forEach(([dx, dz], i) => { if (isWall(x + dx, z + dz) && top.get(key(x + dx, z + dz)) > y) st[sides[i]] = "true"; });
  return st;
};

// the wall's window bays: which cells carry glass in a band, and on which face
const windowFace = (x, z) => (quoin(x, z) ? undefined : exposed(x, z).find((n) => onGlassBay(x, z, n)));

let glazed = 0;
const lanternSpots = [];
for (const [k, H] of top) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const perim = ex.length > 0;
  const winFace = perim ? windowFace(x, z) : undefined;
  g.set(x, 0, z, TRIM);                                          // base course under every cell

  if (!perim) {                                                  // interior: air, one floor deck, a roof
    g.set(x, H - 1, z, ROOF);
    if (H === TALL) g.set(x, FLOOR_Y, z, FLOOR);
    continue;
  }

  for (let y = 1; y < H; y++) {
    if (y === H - 1) { g.set(x, y, z, TRIM); continue; }        // cornice / parapet course
    if (isDoor(x, z) && doorFace && ex.includes(doorFace)) {  // the entrance, with its surround and canopy
      if (y <= 2) { g.set(x, y, z, "dark_oak_door", { facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y === 3) { g.set(x, y, z, "dark_oak_slab", { type: "top" }); continue; }
    }
    if (doorSurround(x, z) && y <= 3 && ex.includes(doorFace)) {   // the door's stone surround; its canopy course at y 3
      if (y === 3) g.set(x, y, z, "dark_oak_slab", { type: "top" }); else g.set(x, y, z, TRIM);
      continue;
    }
    const glassBand = (y >= 1 && y <= 2) || (H === TALL && y >= 5 && y <= 6);
    const frameBand = y === 3 || (H === TALL && y === FLOOR_Y);
    if (glassBand && winFace) {
      g.set(x, y, z, "glass_pane", paneState(x, z, y, winFace)); glazed++;
      continue;
    }
    if (frameBand && winFace) { g.set(x, y, z, FRAME); continue; }
    const stoneQuoin = quoin(x, z) && y % 2 === 1;             // corner quoins alternate stone and brick
    g.set(x, y, z, frameBand || stoneQuoin ? TRIM : WALL);
  }
  if (winFace) {
    const [dx, dz] = NORMAL[winFace];
    const ix = x - dx, iz = z - dz;                            // the cell just inside the glass
    if (inside(ix, iz) && !isWall(ix, iz)) lanternSpots.push([ix, iz, (x + z) % 2 === 0, H]);
  }
}

// warm lanterns just inside some ground and upper windows (standing on the floor, air behind the glass)
for (const [ix, iz, lit, H] of lanternSpots) {
  if (!lit) continue;
  g.set(ix, 1, iz, "lantern", { hanging: "false" });
  if (H === TALL && top.get(key(ix, iz)) === TALL && !isWall(ix, iz)) g.set(ix, 5, iz, "lantern", { hanging: "false" });
}

// rooftop plant on the low tier: iron units on the roof deck, one cell in from the parapet
const roofPlant = [...top].map(([k]) => k.split(",").map(Number))
  .find(([x, z]) => top.get(key(x, z)) === LOW && !isWall(x, z) && !isWall(x + 1, z) && inside(x + 1, z));
if (roofPlant) { const [x, z] = roofPlant; g.set(x, LOW, z, "iron_block"); g.set(x + 1, LOW, z, "iron_block"); }

const out = g.save(`${DIR}/way_448579571.nbt`);
console.log(JSON.stringify({ doorFace, door: [doorX, doorZ], glazed, blocks: out.blocks, palette: out.palette }));
