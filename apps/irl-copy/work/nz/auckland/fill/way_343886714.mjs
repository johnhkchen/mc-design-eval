// way 343886714: a three-storey inter-war commercial block (Mt Eden / Newton edge), built from the lidar record.
// Massing: each footprint cell's roof is quantised to one of three flat tiers (7, 11, 15 blocks above y 0): a 3-storey
// core where the lidar reads 14-15, a 2-storey wing where it reads 11-13, and a 1-storey fringe. Storeys are on one
// datum (y 3, the highest ground under the footprint), so the downhill side shows a stone plinth up to it.
// Facades are 1-block walls on the footprint's edge and on the step-downs between tiers: stone base, shopfront glass
// with a dark fascia at street level, then per storey a cream string course, two rows of glass between white mullions,
// and a brick spandrel; a cream cornice and a stone parapet cap the tier. Interiors are an air gap with a floor slab per
// storey, glowstone behind a few windows, and a roof deck with AC units and a glazed penthouse on the core.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886714.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_343886714.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));    // [x, z, ground, roof]
const W = 35, H = 28, L = 41;
const DATUM = 3;                                          // the storey datum: the highest ground under the footprint
const FLOOR = [3, 7, 11];                                 // floor slab rows (datum + 4 per storey)

const key = (x, z) => `${x},${z}`;
const info = new Map();
for (const [x, z, g, roof] of cells) info.set(key(x, z), { g, roof, T: tierOf(roof) });
const inFp = (x, z) => info.has(key(x, z));
const tierAt = (x, z) => info.get(key(x, z))?.T ?? 0;

// lidar roof -> flat tier top: 3-storey core, 2-storey wing, 1-storey fringe
function tierOf(roof) { return roof >= 14 ? 15 : roof >= 10 ? 11 : 7; }

// outward directions in priority order: north, south, west, east (x, z step, and the name of the window axis)
const DIRS = [
  { n: "north", dx: 0, dz: -1, along: "x", pane: { east: "true", west: "true", north: "false", south: "false" } },
  { n: "south", dx: 0, dz: 1, along: "x", pane: { east: "true", west: "true", north: "false", south: "false" } },
  { n: "west", dx: -1, dz: 0, along: "z", pane: { north: "true", south: "true", east: "false", west: "false" } },
  { n: "east", dx: 1, dz: 0, along: "z", pane: { north: "true", south: "true", east: "false", west: "false" } },
];

// a face is walled when the neighbour is outside the footprint or stands lower (a setback step)
const exposedFaces = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz) || tierAt(x + d.dx, z + d.dz) < tierAt(x, z));
const isWall = (x, z) => exposedFaces(x, z).length > 0;

// the street entrance: a wall cell on the south face (else any face), away from a pier, nearest the middle of that face
const faceCells = (dir) => cells.filter(([x, z]) => exposedFaces(x, z).some((d) => d.n === dir.n) && (dir.along === "x" ? x : z) % 3 !== 0);
let doorCands = faceCells(DIRS[1]);
if (!doorCands.length) doorCands = cells.filter(([x, z]) => isWall(x, z));
const sList = doorCands.map(([x, z]) => x).sort((a, b) => a - b);
const midX = sList[Math.floor(sList.length / 2)];
const doorCell = doorCands.reduce((best, c) => (Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best));
const DOOR = { x: doorCell[0], z: doorCell[1], face: exposedFaces(doorCell[0], doorCell[1]).find((d) => d.n === "south") ?? exposedFaces(doorCell[0], doorCell[1])[0] };

// the glazed penthouse on the core: the deepest 5x5 (else 3x3) patch of 15-tier cells with no wall on it
const core15 = (x, z, r) => { for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) if (!inFp(x + i, z + j) || tierAt(x + i, z + j) !== 15 || isWall(x + i, z + j)) return false; return true; };
let penthouse = null;
for (const r of [2, 1]) {
  let best = null;
  for (const [x, z] of cells) if (tierAt(x, z) === 15 && core15(x, z, r)) {
    const score = -Math.abs(x - 17) - Math.abs(z - 20);   // nearest the middle of the core
    if (!best || score > best.score) best = { x, z, score };
  }
  if (best) { penthouse = { cx: best.x, cz: best.z, r }; break; }
}
const inPenthouse = (x, z) => penthouse && Math.abs(x - penthouse.cx) <= penthouse.r && Math.abs(z - penthouse.cz) <= penthouse.r;

const v = new Voxels([W, H, L]);
const put = (x, y, z, block, state) => { if (y >= 0 && y < H) v.set(x, y, z, block, state); };

// the face's pattern index: piers every third block along it
const pier = (s) => s % 3 === 0;

// one wall block: street storey (base course, shopfront glass, dark fascia), then upper storeys (cream band, two glass rows
// between white mullions, brick spandrel), capped by a cream cornice on the tier's top row
function wallBlock(x, z, y, T, face, isDoor) {
  if (y <= DATUM) return ["stone_bricks"];                 // foundation, plinth and base course
  if (y === T - 1) return ["white_concrete"];              // cornice
  if (y <= 5) {
    const s = face.along === "x" ? x : z;
    if (pier(s)) return ["white_concrete"];
    return ["glass"];                                      // shopfront
  }
  if (y === 6) return ["dark_oak_planks"];                 // street fascia / awning
  const r = (y - DATUM) % 4;
  const s = face.along === "x" ? x : z;
  if (r === 0) return ["white_concrete"];                  // string course
  if (r === 3) return ["bricks"];                          // spandrel
  if (pier(s)) return ["white_concrete"];
  return ["glass_pane", face.pane];
}

for (const [x, z, g, roof] of cells) {
  const { T } = info.get(key(x, z));
  // the ground: solid from 0 up to the cell's ground, then the plinth to the datum
  for (let y = 0; y <= DATUM - 1; y++) put(x, y, z, "stone_bricks");
  if (isWall(x, z)) {
    const face = exposedFaces(x, z)[0];
    const isDoorCell = DOOR.x === x && DOOR.z === z;
    for (let y = DATUM; y < T; y++) {
      if (isDoorCell && (y === 4 || y === 5)) {
        const facing = DOOR.face.n;
        put(x, y, z, "dark_oak_door", { facing, half: y === 4 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const [block, state] = wallBlock(x, z, y, T, face, isDoorCell);
      put(x, y, z, block, state);
    }
    // parapet on the tier's top
    put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    // glowstone behind the glass of an upper window (inward cell is interior air)
    for (let y = 8; y < T - 1; y++) {
      const r = (y - DATUM) % 4;
      if (r !== 1 && r !== 2) continue;
      if (((x * 7 + z * 13 + y * 5) % 11) !== 0) continue;
      const dir = face;
      const ix = x - dir.dx, iz = z - dir.dz;
      if (inFp(ix, iz) && !isWall(ix, iz) && tierAt(ix, iz) === T) put(ix, y, iz, "glowstone");
    }
  } else {
    // interior: an air gap with a floor slab per storey and a roof deck on top
    for (const f of FLOOR) if (f < T - 1) put(x, f, z, "smooth_stone");
    put(x, T - 1, z, "smooth_stone");
    // roof plant on the deck: AC units on a loose grid (never on the penthouse)
    if (!inPenthouse(x, z) && (x % 7 === 2) && (z % 6 === 1) && !isWall(x, z)) put(x, T, z, "iron_block");
  }
}

// the penthouse: a solid glazed box on the core's roof deck, glass on alternate blocks of its upper ring, capped
if (penthouse) {
  for (let x = penthouse.cx - penthouse.r; x <= penthouse.cx + penthouse.r; x++)
    for (let z = penthouse.cz - penthouse.r; z <= penthouse.cz + penthouse.r; z++) {
      put(x, 15, z, "white_concrete");
      put(x, 16, z, "white_concrete");
      const ring = Math.abs(x - penthouse.cx) === penthouse.r || Math.abs(z - penthouse.cz) === penthouse.r;
      if (ring && (x + z) % 2 === 0) put(x, 16, z, "glass");
      put(x, 17, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
}

const res = v.save(OUT);
console.log(`way_343886714: ${res.blocks} blocks, ${res.palette} palette; door at ${DOOR.x},${DOOR.z} facing ${DOOR.face.n}; penthouse ${JSON.stringify(penthouse)}`);
