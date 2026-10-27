// Auckland CBD glass-and-concrete office tower (way 479227312), c. 1990s: a white-concrete frame with blue-green
// glass in a 3-block bay rhythm, a stone plinth and a shopfront ground storey, a flush dark-oak entrance on the north
// face. Lidar roof readings are quantised into flat tiers on the storey grid (floor lines at y = 2 + 4k): wings at 62,
// a middle setback at 66, the main roof at 74, and a 110 crown (the lidar's 85-109 strip on the north-east edge), with a
// plant room on the main roof and a mast on the crown. Interiors are air with a floor slab per storey; glowstone sits
// behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_479227312.cells.json`, "utf8"));
const X = 41, Z = 37, Y = 122;

const key2 = (x, z) => `${x},${z}`, key3 = (x, y, z) => `${x},${y},${z}`;
const ground = new Map(), roof = new Map();
for (const [x, z, g, r] of cells) { ground.set(key2(x, z), g); roof.set(key2(x, z), r); }
const inFp = (x, z) => ground.has(key2(x, z));

// lidar roof -> tier top on the storey grid
const TIERS = [[63, 62], [68, 66], [84, 74]];
const topOf = (x, z) => {
  const r = roof.get(key2(x, z));
  if (r >= 85) return 110;
  for (const [lim, t] of TIERS) if (r <= lim) return t;
  return 74;
};

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
// the sides of a cell open to air at height y: outside the footprint, or over a neighbour whose tier top is below y
const sidesAt = (x, z, y) => Object.keys(DIRS).filter((n) => {
  const [dx, dz] = DIRS[n], nx = x + dx, nz = z + dz;
  return !inFp(nx, nz) || topOf(nx, nz) <= y;
});

// a facade layer: the storey rhythm (spandrel at each floor line, glass in 3-block bays with white mullions)
const blocks = new Map();
const put = (x, y, z, block, state, facade = false) => blocks.set(key3(x, y, z), { block, state, facade });

for (const [x, z] of cells) {
  const top = topOf(x, z);
  for (let y = 0; y < 2; y++) put(x, y, z, "stone_bricks");            // foundation to the ground
  for (let y = 2; y < top; y++) {
    const sides = sidesAt(x, z, y);
    const k = Math.floor((y - 2) / 4), l = y - 2 - 4 * k;             // storey k, level l within it
    if (sides.length) {
      if (y === top - 1) { put(x, y, z, "smooth_quartz", null, true); continue; }   // cap
      if (y === top - 2) { put(x, y, z, "white_concrete", null, true); continue; }  // parapet band
      const alongX = sides.includes("north") || sides.includes("south");
      const u = alongX ? x : z;                                           // coordinate along the wall
      if (k === 0) {
        if (l === 0) put(x, y, z, "polished_granite", null, true);      // base course
        else if (l === 3) put(x, y, z, "smooth_quartz", null, true);    // shopfront fascia
        else if (u % 3 === 0) put(x, y, z, "polished_granite", null, true);
        else put(x, y, z, "pane", { side: sides[0] }, true);
      } else if (l === 0) put(x, y, z, "white_concrete", null, true);   // spandrel at the floor line
      else if (u % 3 === 0) put(x, y, z, "smooth_quartz", null, true);  // mullion
      else put(x, y, z, "pane", { side: sides[0] }, true);
    } else if (y === top - 1) {
      put(x, y, z, "light_gray_concrete");                              // roof deck
    } else if (((y - 2) % 4) === 0) {
      put(x, y, z, "light_gray_concrete");                              // floor slab (air behind the glass)
    }
  }
}

// the entrance: the north-face ground bay nearest the footprint's middle, dark-oak door (lower and upper half)
const xs = cells.map((c) => c[0]), meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
const northDoor = cells.filter(([x, z]) => !inFp(x, z - 1) && blocks.get(key3(x, 2, z))?.facade)
  .sort((a, b) => Math.abs(a[0] - meanX) - Math.abs(b[0] - meanX))[0];
if (northDoor) {
  const [dx, dz] = northDoor;
  put(dx, 3, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }, true);
  put(dx, 4, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }, true);
  for (const s of [-1, 1]) {                                            // stone portal jambs flanking the door
    if (blocks.has(key3(dx + s, 3, dz))) for (const y of [3, 4, 5]) put(dx + s, y, dz, "polished_granite", null, true);
  }
}

// glowstone behind some centre-bay panes, in the air cell just inside the glass
for (const [key, cell] of blocks) {
  if (cell.block !== "pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const k = Math.floor((y - 2) / 4), l = y - 2 - 4 * k, u = cell.state.side === "north" || cell.state.side === "south" ? x : z;
  if (k < 1 || l !== 2 || u % 3 !== 1 || (Math.floor(u / 3) + k) % 4 !== 0) continue;
  const [dx, dz] = DIRS[cell.state.side];
  const ix = x - dx, iz = z - dz;
  if (inFp(ix, iz) && y < topOf(ix, iz) && !blocks.has(key3(ix, y, iz))) put(ix, y, iz, "glowstone");
}

// plant room on the main roof: a 5 x 5 box with a louvred top-of-wall, found where the roof is flat around it
const roofCells = cells.filter(([x, z]) => topOf(x, z) === 74).map(([x, z]) => [x, z]);
const cx0 = roofCells.reduce((a, c) => a + c[0], 0) / roofCells.length, cz0 = roofCells.reduce((a, c) => a + c[1], 0) / roofCells.length;
const flatAround = (x, z, r) => { for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (!inFp(x + i, z + j) || topOf(x + i, z + j) !== 74) return false; return true; };
const plant = roofCells.filter(([x, z]) => flatAround(x, z, 3))
  .sort((a, b) => Math.hypot(a[0] - cx0, a[1] - cz0) - Math.hypot(b[0] - cx0, b[1] - cz0))[0];
if (plant) {
  const [px, pz] = plant;
  for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
    const x = px + i, z = pz + j, edge = Math.abs(i) === 2 || Math.abs(j) === 2;
    for (let y = 74; y <= 76; y++) {
      if (y === 76) put(x, y, z, "smooth_stone");
      else if (edge) put(x, y, z, (y === 75 && (i === 0 || j === 0)) ? "iron_bars" : "light_gray_concrete");
    }
  }
}

// the crown's mast: a lightning rod stood on the 110 roof at the crown's middle
const crown = cells.filter(([x, z]) => topOf(x, z) === 110).map(([x, z]) => [x, z]);
if (crown.length) {
  const mx = crown.reduce((a, c) => a + c[0], 0) / crown.length, mz = crown.reduce((a, c) => a + c[1], 0) / crown.length;
  const [cx, cz] = crown.sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz))[0];
  for (let y = 110; y <= 112; y++) put(cx, y, cz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

// panes: the connections to the neighbours in the wall's plane
const g = new Voxels([X, Y, Z]);
for (const [key, cell] of blocks) {
  const [x, y, z] = key.split(",").map(Number);
  if (cell.block !== "pane") {
    g.set(x, y, z, cell.block, cell.state ?? undefined);
    continue;
  }
  const side = cell.state.side, alongX = side === "north" || side === "south";
  const plane = alongX ? [["west", -1, 0], ["east", 1, 0]] : [["north", 0, -1], ["south", 0, 1]];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [dir, dx, dz] of plane) if (blocks.has(key3(x + dx, y, z + dz))) state[dir] = "true";
  const pane = ((x + z + Math.floor(y / 4)) % 2) ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
  g.set(x, y, z, pane, state);
}
g.save(`${DIR}/way_479227312.nbt`);
