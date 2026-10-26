// DC74205: a two-storey Beaux-Arts office block on the Mall, light stone walls over a granite-grey base.
// Lidar roof tiers (5 main, 4 wings, 3 at one corner) become the massing; every cell is solid from y 0 to its
// ground (foundation), walls rise to its roof, and the outside shell gets a facade grammar: base course, a
// ground-floor glass bay row with the entrance on the street face (z 0), a string course, upper window bays,
// and a cornice. Interior cells are air between floor and roof slabs, with glowstone behind some glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74205.cells.json", "utf8"));
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC74205.nbt";

const W = 11, D = 8;
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(`${x},${z}`, { ground, roof });
const at = (x, z) => fp.get(`${x},${z}`);
const inFp = (x, z) => fp.has(`${x},${z}`);

// a shell cell has at least one side open to the air (outside the footprint, or the south courtyard notch)
const exposed = (x, z) => ({ n: !inFp(x, z - 1), s: !inFp(x, z + 1), w: !inFp(x - 1, z), e: !inFp(x + 1, z) });
const isShell = (x, z) => { const e = exposed(x, z); return e.n || e.s || e.w || e.e; };

const BASE = "stone_bricks", WALL = "white_concrete", STONE = "smooth_stone", FLOOR = "smooth_stone";
const GLASS_Z = { east: "true", west: "true", north: "false", south: "false" };   // pane on a north/south face
const GLASS_X = { north: "true", south: "true", east: "false", west: "false" };   // pane on an east/west face
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };

const g = new Voxels([W, 17, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// the cell's wall rows: y 0 base, y 1 ground-floor glass, y 2 string course (5-high) or upper glass (4-high),
// upper glass y 3 (5-high), cornice on the top row
const rowOf = (y, R) => (y === R - 1 ? "cornice" : y === 0 ? "base" : y === 1 ? "ground" : y === 2 && R - 1 > 3 ? "belt" : "upper");

// interior floors and roof: a slab at y 0, a floor slab at y 2 when there is a storey above it, and the roof slab on top
const floorsOf = (R) => new Set([0, ...(R - 1 > 2 ? [2] : []), R - 1]);

// the glass bays and piers of the shell: bays on odd positions along a face, piers on even, quoins at corners
const isBay = (u) => u % 2 === 1;

const lamps = [];   // [x, y, z] of interior cells behind glass that will hold glowstone

for (const [key, { ground: G, roof: R }] of fp) {
  const [x, z] = key.split(",").map(Number);
  // foundation: solid from y 0 up to this cell's ground (the floor y 0 is always solid)
  for (let y = 0; y < G; y++) put(x, y, z, BASE);
  if (!isShell(x, z)) {
    for (const y of floorsOf(R)) put(x, y, z, y === 0 ? BASE : FLOOR);
    continue;
  }
  const e = exposed(x, z);
  const corner = (e.n || e.s) && (e.w || e.e);
  // the face the bay grid runs along: x on the north/south faces, z on the east/west faces
  const u = e.n || e.s ? x : z;
  // the cell just inside a glazed face, which may hold a lamp
  const inward = e.n ? [x, z + 1] : e.s ? [x, z - 1] : e.w ? [x + 1, z] : [x - 1, z];
  const front = e.n && x === 5;     // the entrance on the street face (z 0), at the middle bay
  for (let y = G; y < R; y++) {
    const row = rowOf(y, R);
    if (front && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { ...DOOR, half: y === 1 ? "lower" : "upper" });
      continue;
    }
    if (corner) { put(x, y, z, STONE); continue; }
    if (row === "base") { put(x, y, z, BASE); continue; }
    if (row === "cornice") { put(x, y, z, STONE); continue; }
    if (row === "belt") { put(x, y, z, STONE); continue; }
    if (isBay(u) && (row === "ground" || row === "upper")) {
      put(x, y, z, "glass_pane", e.n || e.s ? GLASS_Z : GLASS_X);
      // a lamp just inside a glazed bay, every third bay, where that inner cell is open air at this height
      const [ix, iz] = inward;
      const inner = at(ix, iz);
      if ((x + z) % 3 === 0 && inner && !isShell(ix, iz) && !floorsOf(inner.roof).has(y)) lamps.push([ix, y, iz]);
    } else {
      put(x, y, z, WALL);
    }
  }
}
for (const [x, y, z] of lamps) put(x, y, z, "glowstone");

// two lanterns on the roof of the main block, standing on the roof slab
for (const [x, z] of [[3, 2], [7, 2]]) if (at(x, z)?.roof === 5) put(x, 5, z, "lantern", { hanging: "false", waterlogged: "false" });

const res = g.save(out);
console.log(`saved ${out}: ${res.blocks} blocks, palette ${res.palette}`);
