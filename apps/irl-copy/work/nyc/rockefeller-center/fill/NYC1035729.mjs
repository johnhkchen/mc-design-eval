// 519 Madison Avenue, 1948 commercial and office block: a six-storey Late Moderne office front on the north (z 0..1)
// and the west corner (x 0..1), stepping down to a five-storey south wing (z 2..4). Lidar roof: 19 blocks on the
// front and corner, 16 on the wing, the south-east corner and a light court at x 8 open. Granite base and fascia,
// a limestone storey line and cornice, quartz spandrels and blue steel-sash windows in quartz piers, a shopfront on
// the ground floor. The walls are one block thick around hollow storeys (air behind the glass, a slab per floor),
// with glowstone behind some windows. Entrance on the south face, up a first-floor forecourt under a glass canopy.
// Roof: a penthouse on the west corner and two plant boxes on the wing. The open ground is a paved plaza with trees.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035729.cells.json`, "utf8"));
const X = 23, Y = 24, Z = 6;

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const inFoot = (x, z) => ground.has(`${x},${z}`);

// Roof tops (block count above y 0), smoothed from the lidar into tiers. 0 = no building.
const topOf = (x, z) => {
  if (!inFoot(x, z) || x > 12) return 0;
  if (x <= 1 && z <= 4) return 19;                  // west corner: six storeys
  if (x === 0 && z === 5) return 19;                // south-west corner cell
  if (z <= 1) return 19;                            // Madison-side front: six storeys
  if (z === 4 && (x === 8 || x === 12)) return 0;   // light court in the south face; open south-east corner
  if (z <= 4) return 16;                            // south wing: five storeys, stepped down from the front
  return 0;
};

const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const open = (x, y, z) => { const t = topOf(x, z); return !t || t <= y; };
// Outward faces a wall cell at height y shows (the cell's neighbour there is open), in N, S, W, E order.
const exposed = (x, y, z) => Object.keys(FACE).filter((d) => open(x + FACE[d][0], y, z + FACE[d][1]));

const FLOORS = new Set([1, 4, 7, 10, 13, 16]);   // floor slab at each storey's base (ground storey on y 1)
const PIER = (u) => u % 3 === 0;                 // quartz piers every third block along a face
const NS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a face along x
const EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // pane on a face along z
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows
const KIND = { N: 0, S: 1, W: 2, E: 3 };

// The skin of an exposed wall at height y: granite base and fascia, a limestone storey line and cornice, quartz
// spandrels, and the window row (glass in quartz piers). u is the block's place along the face.
const skin = (d, u, y, top) => {
  if (y === top - 1) return ["calcite"];                                   // cornice at the roof edge
  if (y === 1 || y === 3) return ["polished_andesite"];                     // base course, shopfront fascia
  if (y === 2) return PIER(u) ? ["polished_andesite"] : ["gray_stained_glass"];   // shopfront
  if (y % 3 === 1) return ["calcite"];                                     // storey line
  if (y % 3 === 0) return ["smooth_quartz"];                               // spandrel
  return PIER(u) ? ["smooth_quartz"] : ["light_blue_stained_glass_pane", d === "N" || d === "S" ? NS : EW];
};
const along = (d, x, z) => (d === "N" || d === "S" ? x : z);

const g = new Voxels([X, Y, Z]);

// 1. Footprint: foundation from y 0 up to each cell's ground; built cells get a foundation at y 0 so the storey
// floors sit on stone at one level, and open cells are paved at their ground.
for (const [x, z, gr] of cells) {
  const top = topOf(x, z);
  if (!top) {
    for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
    g.set(x, gr, z, "smooth_stone");
    continue;
  }
  for (let y = 0; y < Math.max(gr, 1); y++) g.set(x, y, z, "stone_bricks");
}

// 2. Walls, floors and roofs of each built column: exposed cells take the skin, interior cells are air except the
// floor slab per storey and the roof membrane under the cornice.
for (const [x, z] of cells) {
  const top = topOf(x, z);
  if (!top) continue;
  for (let y = 1; y < top; y++) {
    const d = exposed(x, y, z);
    if (d.length) {
      if (z === 4 && x === 5 && (y === 1 || y === 2)) {                    // entrance door, lower and upper halves
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      const [block, state] = skin(d[0], along(d[0], x, z), y, top);
      g.set(x, y, z, block, state);
    } else if (y === top - 1) g.set(x, y, z, "gray_concrete");              // roof membrane
    else if (FLOORS.has(y)) g.set(x, y, z, "smooth_stone");                 // storey slab
  }
}

// 3. Warm light behind some windows: glowstone in the air cell just inside a glass block.
for (const [x, z] of cells) {
  const top = topOf(x, z);
  if (!top) continue;
  for (let y = 2; y < top - 1; y += 3) {                                    // ground shop row and each window row
    const d = exposed(x, y, z);
    if (!d.length) continue;
    const u = along(d[0], x, z);
    if (PIER(u) || (z === 4 && x === 5)) continue;
    const [dx, dz] = FACE[d[0]];
    const ix = x - dx, iz = z - dz;
    if (!inFoot(ix, iz) || exposed(ix, y, iz).length || y === topOf(ix, iz) - 1) continue;
    if (lit(u, y, KIND[d[0]])) g.set(ix, y, iz, "glowstone");
  }
}

// 4. Roof: a penthouse on the west corner (glass band, calcite cap) and two plant boxes on the wing.
for (const x of [0, 1]) for (const z of [2, 3]) {
  g.set(x, 19, z, "smooth_quartz");
  g.set(x, 20, z, "gray_stained_glass");
  g.set(x, 21, z, "calcite");
}
for (const x of [3, 4]) for (const z of [2, 3]) for (const y of [16, 17]) g.set(x, y, z, "light_gray_concrete");

// 5. Entrance forecourt on the south: granite posts carry a glass canopy over the door, with a hanging lantern.
for (const [x, y] of [[4, 2], [4, 3], [6, 2], [6, 3]]) g.set(x, y, 5, "polished_andesite");
for (const x of [4, 5, 6]) g.set(x, 4, 5, "gray_stained_glass");
g.set(5, 3, 5, "lantern", { hanging: "true", waterlogged: "false" });

// 6. Plaza trees on the open ground to the east.
const tree = (x, z) => {
  for (let y = 1; y <= 4; y++) g.set(x, y, z, "oak_log", { axis: "y" });
  for (let y = 4; y <= 6; y++) {
    const r = y === 6 ? 1 : 2;
    for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) {
      if (r === 2 && Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;   // rounded crown
      if (y === 4 && dx === 0 && dz === 0) continue;                       // trunk
      g.set(x + dx, y, z + dz, "oak_leaves", { distance: "1", persistent: "true", waterlogged: "false" });
    }
  }
};
tree(15, 2);
tree(20, 2);

const stats = g.save(`${DIR}/NYC1035729.nbt`);
console.log(JSON.stringify(stats));
