// 1200 16th St NW: a 1920s Beaux-Arts hotel. Pale limestone walls, a dark base, a 6-storey main block with a parapet
// at 12 blocks (the 1910 Height Act's ~90 ft limit), a 4-storey wing to the north and a 2-storey shoulder on the
// lower side. Storeys are 2 blocks: window rows at odd y, belt courses at even y. Walls are one block thick, so the
// glass has an air gap behind it and every storey has a floor slab.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86700.cells.json", "utf8"));
const X = 15, Z = 22, Y = 24;

const key = (x, z) => `${x},${z}`;
const foot = new Map();                       // "x,z" -> { ground, top }
// the lidar roof, smoothed into three flat tiers: a low shoulder (<= 4), a 4-storey wing (5-9), the main block (>= 10)
const tierOf = (r) => (r <= 4 ? 4 : r <= 9 ? 8 : 12);
for (const [x, z, g, r] of cells) foot.set(key(x, z), { ground: g, top: tierOf(r) });

const topAt = (x, z) => foot.get(key(x, z))?.top ?? -1;

// faces of a footprint cell at height y that show outside: a neighbour off the footprint, or one whose tier is below y
const DIRS = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] };
const exposed = (x, z, y) => Object.keys(DIRS).filter(d => {
  const [dx, dz] = DIRS[d];
  return !foot.has(key(x + dx, z + dz)) || topAt(x + dx, z + dz) <= y;
});

// the front door: south face (z = 21), the middle of the long side that faces the street
const DOOR_X = 7, DOOR_Z = Z - 1;
const LOBBY = [DOOR_X, 1, DOOR_Z - 1];

const g = new Voxels([X, Y, Z]);

for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  const { top } = foot.get(k);
  for (let y = 0; y < top; y++) {
    const ex = exposed(x, z, y);
    if (ex.length === 0) {                    // interior: floor slabs and roof, air between (the gap behind the glass)
      if (y === 0 || y === top - 1) g.set(x, y, z, "stone");
      else if (y % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    // the facade's along-index: x on a north/south face, z on an east/west face
    const onZFace = ex.includes("n") || ex.includes("s");
    const onXFace = ex.includes("e") || ex.includes("w");
    const corner = onZFace && onXFace;
    if (y === 0) { g.set(x, y, z, "polished_andesite"); continue; }
    if (y === top - 1) { g.set(x, y, z, "stone_bricks"); continue; }   // parapet cap
    if (y % 2 === 0) { g.set(x, y, z, "smooth_stone"); continue; }     // belt course at each storey line
    const along = onZFace ? x : z;
    const pane = !corner && along % 2 === 1;                           // window every other bay, piers between
    if (!pane) { g.set(x, y, z, "smooth_quartz"); continue; }
    const axisZ = onZFace;                                             // pane runs along a z face: links east/west
    g.set(x, y, z, "light_blue_stained_glass_pane", {
      north: String(!axisZ), south: String(!axisZ), east: String(axisZ), west: String(axisZ), waterlogged: "false",
    });
    // warm light in some windows: a glowstone in the air gap just inside the pane
    const [dx, dz] = DIRS[ex[0]];
    const ix = x - dx, iz = z - dz;
    if (foot.has(key(ix, iz)) && (x * 3 + y * 5 + z * 7) % 9 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// entrance: dark oak door on the street face, calcite piers either side, a lantern hung in the lobby
g.set(DOOR_X, 1, DOOR_Z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 2, DOOR_Z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 3, DOOR_Z, "smooth_quartz");
g.set(LOBBY[0], LOBBY[1], LOBBY[2], "lantern", { hanging: "true", waterlogged: "false" });

// roof plant: three weathered copper boxes on the main roof, well inside the block
for (const [x0, x1, z0, z1] of [[4, 5, 8, 9], [9, 10, 15, 16], [4, 5, 16, 17]]) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) g.set(x, 12, z, "weathered_copper");
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86700.nbt";
const stats = g.save(out);
console.log(JSON.stringify(stats));
