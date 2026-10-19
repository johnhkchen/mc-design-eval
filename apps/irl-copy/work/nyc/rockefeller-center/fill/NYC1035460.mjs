// 18 East 50th Street, 1916 commercial and office building (NYC individual landmark): a 14 x 28 footprint, a 15-storey
// limestone Renaissance-palazzo front block on the 50th Street frontage (z 0, along x), a set-back core that rises to the
// roof at 49 and two lower wings at 43, and a single-storey rear court at street-level paving. Front and wings have
// pale limestone (smooth quartz) with pilasters, a granite base course and a stone string course at every floor, glass
// panes set in the bays (windows at x 1-2, 4-5, 7-8, 10-11), a recessed entrance with a granite canopy and an iron door
// pair, a parapet and a copper-capped cornice on the core. Blank brick party walls on the east and west lot lines; the
// lidar's 1-cell rear strip at x 0 is read as that party wall. Lidar tiers are smoothed: the front block is 46 across,
// its 6-cell core 49, the wings 43; lidar spikes (40, 31, 42, 6 in row 0 and the isolated 49 at (5,12)) are ignored.
// Floor slabs at every storey line (y = 1, 4, 7 ...), air behind the glass, glowstone behind some lower panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035460.cells.json`, "utf8"));
const X = 14, Y = 52, Z = 28;

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && cell.has(`${x},${z}`);
const lidar = (x, z) => (inFoot(x, z) ? cell.get(`${x},${z}`).roof : 0);

// Roof tiers, block heights above y 0 (the roof surface; blocks 0..top-1 are built). 0 = open court at street level.
const top = (x, z) => {
  if (!inFoot(x, z) || lidar(x, z) <= 2) return 0;
  if (z <= 3) return 46;                          // front block on 50th Street, full width
  if (x >= 4 && x <= 9 && z <= 11) return 49;     // set-back core, the tallest part
  return 43;                                      // wings either side of the core, and the rear party-wall strip
};
// Solid at (x, y, z): the foundation (y 0), the street-level court (y 1) and every built block below its roof.
// The front block is set back one cell above a granite-and-limestone base (y 13-42 on the 50th Street line), so its
// upper floors stand on a projecting cornice at y 12 and under the top string course at y 43.
const recessed = (z, y) => z === 0 && y >= 13 && y < 43;
const solid = (x, z, y) => inFoot(x, z) && (y <= 1 || (top(x, z) > y && !recessed(z, y)));
const exposed = (x, z, y) => ({
  N: !solid(x, z - 1, y), S: !solid(x, z + 1, y), W: !solid(x - 1, z, y), E: !solid(x + 1, z, y),
});
const perim = (x, z, y) => Object.values(exposed(x, z, y)).some(Boolean);

const glass = (axis) => (axis === "x"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }    // pane on a face along x
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });  // pane on a face along z
const lit = (x, y, z) => (x * 5 + y * 7 + z * 3) % 9 === 0;   // sparse, deterministic warm panes on the lower glass row

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const [key, { roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const t = top(x, z);
  put(x, 0, z, "stone_bricks");                       // foundation under every footprint cell
  if (t === 0) { put(x, 1, z, "smooth_stone"); continue; }   // rear court paving, level with the first floor slab

  for (let y = 1; y < t; y++) {
    if (recessed(z, y)) continue;
    const slabLine = y % 3 === 1;
    const ex = exposed(x, z, y);
    const n = Object.values(ex).filter(Boolean).length;
    if (y === t - 1) { put(x, y, z, "smooth_quartz"); continue; }          // roof slab, full cell
    if (n === 0) { if (slabLine) put(x, y, z, "smooth_quartz"); continue; } // floor slab, air inside
    if (y === t - 2) {                                                     // parapet on the perimeter
      put(x, y, z, t === 49 ? "oxidized_cut_copper" : "quartz_bricks");
      continue;
    }
    if (y === 1) { put(x, y, z, "polished_granite"); continue; }           // granite base course
    if (z === 0 && y === 12) { put(x, y, z, "smooth_quartz"); continue; }  // cornice over the base, the front steps back
    if (slabLine) { put(x, y, z, "quartz_bricks"); continue; }             // string course at each storey line
    // Window rows of a storey: pilasters, blank party walls on the lot lines, or glass in the bays.
    if (n >= 2) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }
    if (ex.N || ex.S) {
      const u = x;
      if (u % 3 === 0 || u >= 13) put(x, y, z, "quartz_pillar", { axis: "y" });
      else { put(x, y, z, "glass_pane", glass("x")); lightBehind(x, y, z, 0, ex.N ? 1 : -1); }
    } else {
      if (x === 0 || x === X - 1) { put(x, y, z, "bricks"); continue; }     // blank party wall
      if (z % 3 === 0) put(x, y, z, "quartz_pillar", { axis: "y" });
      else { put(x, y, z, "glass_pane", glass("z")); lightBehind(x, y, z, ex.W ? 1 : -1, 0); }
    }
  }
}

// A warm light set just inside a lit pane: glowstone on the interior cell behind it, only where that cell is interior.
// (dx, dz) points from the pane into the building; the pane's outward side is the opposite way.
function lightBehind(x, y, z, dx, dz) {
  if (y % 3 !== 2 || !lit(x, y, z)) return;
  const xi = x + dx, zi = z + dz;
  if (!solid(xi, zi, y) || perim(xi, zi, y)) return;
  put(xi, y, zi, "glowstone");
}

// The recessed entrance on 50th Street (x 6-7): a porch cut one cell into the front, a granite canopy over it, a
// hanging lantern, and an iron door pair set one cell back in the lobby.
for (const x of [5, 6, 7, 8]) put(x, 4, 0, "polished_granite");
for (const x of [6, 7]) for (const y of [2, 3]) put(x, y, 0, "air");
put(6, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
for (const [x, hinge] of [[6, "left"], [7, "right"]]) {
  put(x, 2, 1, "iron_door", { facing: "north", half: "lower", hinge, open: "false", powered: "false" });
  put(x, 3, 1, "iron_door", { facing: "north", half: "upper", hinge, open: "false", powered: "false" });
}

// Roof plant: a plant room on the front roof and a cooling tower on the core roof, both standing on the roof slab.
for (let x = 2; x <= 3; x++) for (let z = 1; z <= 2; z++) for (let y = 46; y <= 47; y++) put(x, y, z, "smooth_stone");
for (let x = 6; x <= 7; x++) for (let z = 6; z <= 7; z++) for (let y = 49; y <= 50; y++) put(x, y, z, "stone_bricks");

const report = g.save(`${DIR}/NYC1035460.nbt`);
console.log(report);
