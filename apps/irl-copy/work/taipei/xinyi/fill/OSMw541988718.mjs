import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988718.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw541988718.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 19, H = 23, D = 19;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gnd = (x, z) => ground.get(`${x},${z}`);

// Era: 1990s Xinyi mid-rise commercial/office block. Two storeys of 5 blocks,
// cornice at y=10, parapet at y=11, roof plant above.
const STOREY_LINE = 5;   // floor line between storeys
const CORNICE = 10;      // roof cornice / top of body
const PARAPET = 11;      // parapet on wall cells
const CX = 9, CZ = 9;    // centre of the 19 x 19 footprint

const OUTWARD = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
};
const OPPOSITE = { north: "south", south: "north", east: "west", west: "east" };

// Classify each footprint cell
const info = new Map();
for (const [x, z, gr] of cells) {
  const missing = [];
  for (const [dir, [dx, dz]] of Object.entries(OUTWARD)) {
    if (!has(x + dx, z + dz)) missing.push(dir);
  }
  info.set(`${x},${z}`, {
    x, z, gr,
    missing,
    isWall: missing.length > 0,
    isCorner: missing.length >= 2,
  });
}

// 1) Foundation: solid stone from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2) Body: walls, windows, floor slabs, roof
for (const c of info.values()) {
  const { x, z, gr, missing, isWall, isCorner } = c;

  for (let y = gr; y <= CORNICE; y++) {
    if (!isWall) {
      // Interior: floors and roof only; air in between (no interiors)
      if (y === gr || y === STOREY_LINE) g.set(x, y, z, "smooth_stone");
      else if (y === CORNICE) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // Wall cells
    if (y === gr) {
      g.set(x, y, z, "stone_bricks");                 // base course
    } else if (y === STOREY_LINE) {
      g.set(x, y, z, "light_gray_concrete");          // storey line
    } else if (y === CORNICE) {
      g.set(x, y, z, "light_gray_concrete");          // cornice
    } else if (y === 4 || y === 9) {
      g.set(x, y, z, "light_gray_concrete");          // lintel bands
    } else {
      // Storey rows: 1..3 (storey 1) and 6..8 (storey 2)
      const inWindowRow = (y >= gr + 1 && y <= 3) || (y >= 6 && y <= 8);
      const isWindowCol = !isCorner && ((x + z) % 3 !== 0);
      if (inWindowRow && isWindowCol) {
        // Glass pane, connected along the wall run
        const runsEW = missing.includes("north") || missing.includes("south");
        g.set(x, y, z, "light_blue_stained_glass_pane", {
          north: runsEW ? "false" : "true",
          south: runsEW ? "false" : "true",
          east: runsEW ? "true" : "false",
          west: runsEW ? "true" : "false",
          waterlogged: "false",
        });
      } else {
        g.set(x, y, z, "white_concrete");             // piers / spandrels
      }
    }
  }

  // Parapet on wall cells
  if (isWall) g.set(x, PARAPET, z, "smooth_quartz");

  // Corners get a quartz pillar column for a clean read from the street
  if (isCorner) {
    for (let y = gr + 1; y <= PARAPET; y++) {
      if (y === STOREY_LINE || y === CORNICE) continue;
      g.set(x, y, z, "smooth_quartz");
    }
  }
}

// 3) Entrance on the street face nearest the centre
let doorCell = null, bestScore = Infinity;
for (const c of info.values()) {
  if (!c.isWall || c.isCorner || c.missing.length === 0) continue;
  const outward = c.missing[0];
  const score = Math.abs(c.x - CX) + (outward === "north" ? 0 : 5);
  if (score < bestScore) { bestScore = score; doorCell = { c, outward }; }
}

if (doorCell) {
  const { c, outward } = doorCell;
  const { x, z, gr } = c;
  g.set(x, gr + 1, z, "dark_oak_door", {
    facing: outward, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  g.set(x, gr + 2, z, "dark_oak_door", {
    facing: outward, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  // Glazed transom above the door
  g.set(x, gr + 3, z, "light_blue_stained_glass_pane", {
    north: "false", south: "false", east: "false", west: "false", waterlogged: "false",
  });
  // Hanging lantern in the entry hall, under the storey line
  const [dx, dz] = OUTWARD[OPPOSITE[outward]];
  const ix = x + dx, iz = z + dz;
  if (has(ix, iz)) {
    g.set(ix, 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4) Warm light behind some storey-2 windows (glowstone in the interior cell)
for (const c of info.values()) {
  if (!c.isWall || c.isCorner || c.missing.length !== 1) continue;
  if (((c.x * 3 + c.z * 5) % 7) !== 0) continue;
  if ((c.x + c.z) % 3 === 0) continue; // only on window columns
  const inward = OPPOSITE[c.missing[0]];
  const [dx, dz] = OUTWARD[inward];
  const ix = c.x + dx, iz = c.z + dz;
  if (has(ix, iz)) g.set(ix, 7, iz, "glowstone");
}

// 5) Roof plant: a central penthouse on interior cells, with a capped top and a lightning rod
for (const c of info.values()) {
  if (c.isWall) continue;
  if (Math.abs(c.x - CX) > 3 || Math.abs(c.z - CZ) > 3) continue;
  g.set(c.x, 11, c.z, "white_concrete");
  g.set(c.x, 12, c.z, "white_concrete");
  g.set(c.x, 13, c.z, "smooth_quartz");
}
if (has(CX, CZ) && !info.get(`${CX},${CZ}`).isWall) {
  g.set(CX, 14, CZ, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(OUT);
