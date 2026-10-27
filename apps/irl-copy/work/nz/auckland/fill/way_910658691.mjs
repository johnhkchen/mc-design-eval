// way 910658691: a two-storey 1920s brick commercial block (Auckland's common masonry: red brick, stone trim, a
// shopfront with a striped awning on the street face, a tar-flat roof behind a parapet). Footprint and roof come from
// the cells file: every cell is ground 0, roof 10 (lidar), so the massing is one flat tier with no foundation.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_910658691.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const plan = new Map();                       // "x,z" -> { ground, roof }
for (const [x, z, ground, roof] of cells) plan.set(key(x, z), { ground, roof });
const inFP = (x, z) => plan.has(key(x, z));

// the block grid: every cell's blocks as { y: [block, state?] }, written to the Voxels at the end
const out = new Map();                        // "x,y,z" -> [block, state]
const put = (x, y, z, block, state) => out.set(`${x},${y},${z}`, [block, state]);
const H = (x, z) => plan.get(key(x, z)).roof;

// one-block-wide walls: the cell itself is the wall, so an exposed face is the facade
const FACE = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
const facesOf = (x, z) => Object.keys(FACE).filter((f) => !inFP(x + FACE[f][0], z + FACE[f][1]));

// the street face is the north (z 0) side; its door sits on the middle of its exposed cells
const northCells = cells.filter(([x, z]) => !inFP(x, z - 1)).map(([x, z]) => x).sort((a, b) => a - b);
const doorX = northCells[Math.floor(northCells.length / 2)];

const WALL = "bricks", TRIM = "stone_bricks", BASE = "polished_andesite", BAND = "smooth_stone", GLASS = "glass_pane";
const pane = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const lantern = { hanging: "false", waterlogged: "false" };

// interior cells: the floor slab of each storey and the roof deck; air behind the glass
const interior = [];
for (const [x, z, ground, roof] of cells) {
  const perim = facesOf(x, z).length > 0;
  const top = roof - 1;              // parapet course
  const deck = roof - 2;             // roof deck / cornice course
  if (!perim) {
    interior.push([x, z]);
    if (ground > 0) for (let y = 0; y < ground; y++) put(x, y, z, "stone");   // foundation under a sloped cell
    put(x, 0, z, "smooth_stone");                  // ground floor slab
    put(x, 4, z, "smooth_stone");                  // upper floor slab
    put(x, deck, z, "smooth_stone");               // flat roof deck, standing on the walls
    continue;
  }
  const faces = facesOf(x, z);
  const corner = (faces.includes("n") || faces.includes("s")) && (faces.includes("w") || faces.includes("e"));
  const axisU = faces.includes("n") || faces.includes("s") ? x : z;    // position along the wall
  const front = faces.includes("n");
  if (ground > 0) for (let y = 0; y < ground; y++) put(x, y, z, "stone");
  // base course, ground floor, fascia, string course, upper windows, lintel, cornice, parapet
  put(x, 0, z, BASE);
  for (let y = 1; y <= top; y++) {
    let b = WALL;                                                 // corners stay brick: a stepped outline has many convex cells
    if (y === 3) b = front ? (x % 2 ? "white_terracotta" : "red_terracotta") : BAND;   // striped awning band
    else if (y === 4) b = TRIM;                                   // string course (storey line)
    else if (y === 7) b = BAND;                                   // lintel band
    else if (y === deck) b = TRIM;                                // cornice
    else if (y === top) b = WALL;                                 // parapet
    else if (corner) b = WALL;                                    // solid brick at the corners, no glass
    else if (y <= 2) b = front || axisU % 2 ? GLASS : WALL;       // shopfront glazing on the street face
    else if (y <= 6) b = axisU % 2 ? GLASS : WALL;                // upper window grid, 1 glass : 1 brick
    if (b === GLASS) put(x, y, z, GLASS, { ...pane });
    else put(x, y, z, b);
  }
}

// the street door: two cells on the middle of the north face, a brick pier either side already in place
const doorCell = northCells.length ? [doorX, cells.find(([x, z]) => x === doorX && !inFP(x, z - 1))[1]] : null;
if (doorCell) {
  const [dx, dz] = doorCell;
  put(dx, 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
}

// a lantern behind every third upper window that has room inside (warm light; air stays around it)
const inside = new Set(interior.map(([x, z]) => key(x, z)));
let k = 0;
for (const [x, z] of cells) for (const f of facesOf(x, z)) {
  const [dx, dz] = FACE[f];
  const u = f === "n" || f === "s" ? x : z;
  if (facesOf(x, z).length > 1 || u % 2 === 0) continue;                // glass cells on plain walls only
  const ix = x - dx, iz = z - dz;
  if (!inside.has(key(ix, iz))) continue;
  if (k++ % 3 === 0) put(ix, 5, iz, "lantern", { ...lantern });
}

// roof equipment: two air-conditioning plants on the deck, away from the parapet
interior.slice(0, 2).forEach(([x, z]) => put(x, H(x, z) - 1, z, "iron_block"));

// connect the glass panes to whatever is beside them, so the panes read as a grid in the wall
for (const [id, [block, state]] of out) {
  if (block !== GLASS) continue;
  const [x, y, z] = id.split(",").map(Number);
  const nb = (dx, dz) => out.has(`${x + dx},${y},${z + dz}`);
  out.set(id, [GLASS, { north: String(nb(0, -1)), south: String(nb(0, 1)), east: String(nb(1, 0)), west: String(nb(-1, 0)), waterlogged: "false" }]);
}

const g = new Voxels([10, 23, 7]);
for (const [id, [block, state]] of out) {
  const [x, y, z] = id.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const r = g.save(`${DIR}/way_910658691.nbt`);
console.log(`way_910658691: ${r.blocks} blocks, ${r.palette} palette entries`);
