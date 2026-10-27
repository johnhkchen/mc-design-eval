import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Way 332241921, Mt Eden: a 1930s brick-and-render commercial block. One flat-roofed storey on the lidar's 6, with
// a shopfront on its south side, a cream stringcourse and cornice; a tower on the north apex up to the lidar's 9 with
// a second and third row of windows and a lit penthouse; plant boxes on the flat roof. The cells are [x, z, ground, roof].
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241921.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_332241921.nbt";

const M = {
  foundation: "stone_bricks", base: "stone_bricks", brick: "bricks", cream: "smooth_quartz", glass: "glass_pane",
  fascia: "dark_oak_planks", floor: "smooth_stone", roofIn: "stone_slab", roofEdge: "smooth_quartz_slab",
};

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const fp = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const keys = [...fp.keys()].map((k) => k.split(",").map(Number));

// The massing: the tower is the north-apex cells the lidar reads at 8 to 9 (smoothed to one flat 9); everything else
// is the flat storey at 6 (the lidar's 6 to 7 along the edges is noise and is smoothed down to it).
const TOWER = new Set(["7,0", "6,1", "7,1", "8,1", "6,2", "7,2", "8,2"]);
const inFp = (x, z) => fp.has(`${x},${z}`);
const base = (x, z) => fp.get(`${x},${z}`).ground;                 // the lidar's ground: the foundation is solid below it
const top = (x, z) => (TOWER.has(`${x},${z}`) ? 9 : 6);            // the roof surface; blocks fill y in [base, top)

// Air beside a voxel at height y: outside the footprint, or above the neighbour's own roof.
const exposed = (x, y, z) => !inFp(x, z) || y >= top(x, z);
const DIRS = [[0, 1], [-1, 0], [1, 0], [0, -1]];                   // south (+z) first: the shopfront side
const outward = (x, y, z) => DIRS.filter(([dx, dz]) => exposed(x + dx, y, z + dz));
const inV = (x, y, z) => inFp(x, z) && y >= base(x, z) && y < top(x, z);
const shell = (x, y, z) => inV(x, y, z) && outward(x, y, z).length > 0;

// The door: the south-facing ground-storey cell nearest the middle of the front (the lower half of a door is one block
// above the ground, so the cell's ground must be one block or less).
const doorCell = keys
  .filter(([x, z]) => base(x, z) <= 1 && top(x, z) === 6 && outward(x, 1, z).some(([, dz]) => dz === 1))
  .sort((a, b) => Math.abs(a[0] - 5) - Math.abs(b[0] - 5))[0];
const door = doorCell && { x: doorCell[0], z: doorCell[1] };

function facade(x, y, z, [dx, dz], b, t) {
  const u = dx !== 0 ? z : x;                    // position along the face
  const shop = dz === 1;                         // south face: shopfronts
  const pier = u % 3 === 0;
  if (y === b) return { id: M.base };
  if (door && x === door.x && z === door.z && (y === b + 1 || y === b + 2)) {
    return { id: "dark_oak_door", state: { facing: "south", half: y === b + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  if (y < 4) {
    if (shop) {
      if (pier) return { id: M.cream };
      if (y === 3) return { id: M.fascia };
      return { id: M.glass, glass: true };
    }
    if (pier || y === 3) return { id: M.brick };
    return { id: M.glass, glass: true };
  }
  if (y === 4) return { id: M.cream };                                   // belt course: the sill of the upper windows
  if (y === 7 && t === 9) return { id: M.cream };                        // the tower's string course
  if (pier) return { id: M.cream };
  return { id: M.glass, glass: true };
}

// A pane connects to the solid wall beside it in its own plane.
function pane(x, y, z, [dx]) {
  const ns = dx !== 0;                           // east/west face: the wall runs along z
  const on = (v) => (v ? "true" : "false");
  return ns
    ? { north: on(shell(x, y, z - 1)), south: on(shell(x, y, z + 1)), east: "false", west: "false" }
    : { north: "false", south: "false", east: on(shell(x + 1, y, z)), west: on(shell(x - 1, y, z)) };
}

const g = new Voxels([12, 22, 12]);
const glazed = [];

for (const [x, z] of keys) {
  const b = base(x, z), t = top(x, z);
  for (let y = 0; y < b; y++) g.set(x, y, z, M.foundation);
  for (let y = b; y < t; y++) {
    const faces = outward(x, y, z);
    if (faces.length) {
      const face = faces.find(([, dz]) => dz === 1) ?? faces[0];
      const f = facade(x, y, z, face, b, t);
      const state = f.glass ? pane(x, y, z, face) : f.state;
      g.set(x, y, z, f.id, state);
      if (f.glass) glazed.push({ x, y, z, face });
    } else if (y === 4 || (y === 7 && t === 9) || (y === b && b === 0)) {
      g.set(x, y, z, M.floor);                                            // a floor slab per storey (and the ground under it)
    }
  }
  const edge = outward(x, t, z).length > 0;
  g.set(x, t, z, edge ? M.roofEdge : M.roofIn, { type: "bottom" });
}

// Warm light behind some panes: a glowstone or shroomlight on the room side of the glass.
for (const { x, y, z, face: [dx, dz] } of glazed) {
  const ix = x - dx, iz = z - dz;
  if (!inV(ix, y, iz) || shell(ix, y, iz)) continue;
  const h = (x * 7 + z * 11 + y * 5) % 7;
  if (h === 0) g.set(ix, y, iz, "glowstone");
  else if (h === 3) g.set(ix, y, iz, "shroomlight");
}

// Roof: the tower's penthouse with a lantern for dusk, and two plant boxes on the flat roof.
g.set(7, 9, 1, M.cream); g.set(7, 10, 1, M.cream); g.set(7, 11, 1, "lantern", { hanging: "false" });
for (const [x, z] of [[2, 5], [3, 5], [2, 7], [3, 7]]) g.set(x, 6, z, "light_gray_concrete");

const { blocks, palette } = g.save(OUT);
console.log(`way_332241921: ${blocks} blocks, ${palette} palette entries, door at ${door ? `${door.x},${door.z}` : "none"}`);
