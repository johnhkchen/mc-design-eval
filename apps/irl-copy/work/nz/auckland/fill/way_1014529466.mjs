// way 1014529466: a 1930s brick shop-top block (Eden Terrace / Mt Eden type), three storeys over a
// downhill basement on the south side, red brick walls on a basalt plinth, cream concrete floors,
// stone quoins and string courses, a stone cornice and parapet, a dark-timber shopfront, a door on
// the north face and a small roof penthouse. The massing follows the lidar roof (median-smoothed
// over the 3x3 neighbourhood) into one flat tier at y 15; the floors sit on y 3/7/11 from the uphill ground.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529466.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1014529466.nbt";

const FLOOR = 3;                       // the ground-floor slab, on the uphill ground
const SLABS = new Set([3, 7, 11]);     // floor slabs; the roof slab is each cell's top
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const k = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, G, R] of cells) byKey.set(k(x, z), { x, z, G, R });
const at = (x, z) => byKey.get(k(x, z));

// Median of the 3x3 neighbourhood's lidar roof (noise out), then one of three flat tiers:
// roof slab at y 15 (three storeys), 11 (two), 7 (one). The roof surface is top + 1.
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
for (const c of byKey.values()) {
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n) near.push(n.R); }
  const R = median(near);
  c.top = R >= 15 ? 15 : R >= 9 ? 11 : 7;
}

// A wall face is open where the neighbour is outside the footprint or stands lower than this height.
const openFaces = (c, y) => DIRS.filter(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || y > n.top; });
// The edge of a tier: outside the footprint, or beside a lower tier (the cornice and parapet run along it).
const edge = (c) => DIRS.some(([dx, dz]) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; });

// The glass runs along its wall: a pane joins its neighbours on the two sides of the face.
const pane = (faces) => faces[0][0] !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function skin(c, y, faces) {
  const along = faces[0][0] !== 0 ? c.z : c.x;
  const win = faces.length === 1 && along % 3 !== 0;           // glazed bays, with a pier every third cell and brick corners
  if (y < FLOOR) return win ? ["glass_pane", pane(faces)] : ["stone_bricks"];   // downhill basement storey
  const rel = (y - FLOOR) % 4;                                 // 1 sill or bulkhead, 2 and 3 glass
  if (rel === 1) return y < 7 ? ["dark_oak_planks"] : win ? ["stone_brick_slab"] : ["bricks"];   // shopfront bulkhead below the first floor
  return win ? ["glass_pane", pane(faces)] : ["bricks"];
}

const g = new Voxels([11, 29, 11]);
const put = (x, y, z, spec) => { if (spec) g.set(x, y, z, spec[0], spec[1]); };
const doorCell = [2, 0];                   // the north face, door faces south

for (const c of byKey.values()) {
  const { x, z, G, top } = c;
  for (let y = 0; y < G; y++) put(x, y, z, [y === FLOOR - 1 && edge(c) ? "polished_andesite" : "stone"]);  // foundation, base course at the street
  for (let y = G; y <= top + 1; y++) {
    if (y === top + 1) { if (top !== 7 && edge(c)) put(x, y, z, ["stone_bricks"]); continue; }   // parapet
    if (y === top) { put(x, y, z, edge(c) ? ["stone_bricks"] : ["smooth_stone"]); continue; }      // roof slab, cornice on the edge
    if (y === G && G < FLOOR) { put(x, y, z, ["smooth_stone"]); continue; }                       // basement floor
    if (SLABS.has(y)) { put(x, y, z, [edge(c) ? "stone_bricks" : "smooth_stone"]); continue; }    // floor slab, string course on the edge
    const faces = openFaces(c, y);
    if (!faces.length) continue;                                                                    // interior air behind the wall
    if (x === doorCell[0] && z === doorCell[1] && (y === 4 || y === 5)) {
      const half = y === 4 ? "lower" : "upper";
      put(x, y, z, ["oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" }]);
      continue;
    }
    if (x === doorCell[0] && z === doorCell[1] && y === 6) { put(x, y, z, ["bricks"]); continue; }   // door lintel
    put(x, y, z, skin(c, y, faces));
  }
}

// Lanterns and shroomlights standing on the floor just inside some glazed bays (warm light in some windows).
let lit = 0;
for (const c of byKey.values()) {
  for (const s of [4, 8, 12]) {
    const faces = openFaces(c, s + 1);
    if (faces.length !== 1) continue;
    const along = faces[0][0] !== 0 ? c.z : c.x;
    if (along % 3 === 0) continue;
    const [dx, dz] = faces[0];
    const inside = at(c.x - dx, c.z - dz);
    if (!inside || openFaces(inside, s).length) continue;
    const pick = (along + s) % 4;
    if (pick === 0) { g.set(inside.x, s, inside.z, "lantern"); lit++; }
    else if (pick === 2 && s === 4) { g.set(inside.x, s, inside.z, "shroomlight"); lit++; }
  }
}

// Roof penthouse: a 3 x 2 brick box on the roof's middle, glazed on its north and south faces.
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 5; z++) for (const y of [16, 17]) g.set(x, y, z, "bricks");
for (let x = 4; x <= 6; x++) for (let z = 4; z <= 5; z++) g.set(x, 18, z, "stone_bricks");
for (const y of [16, 17]) { g.set(5, y, 4, "glass_pane", pane([[0, -1]])); g.set(5, y, 5, "glass_pane", pane([[0, 1]])); }

const { blocks, palette } = g.save(OUT);
console.log(`way_1014529466: ${blocks} blocks, palette ${palette}, ${lit} lights`);
