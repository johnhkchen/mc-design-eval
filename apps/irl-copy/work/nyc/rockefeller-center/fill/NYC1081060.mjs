// 59 West 44th Street, 1902 commercial and office building (NYC individual landmark): a 13-storey brick-and-granite loft
// office in the masonry Renaissance Revival manner of its year. Footprint 20 x 8 (x along the 44th Street front at low z,
// the north face). Granite plinth and shopfront up to y 3 with a granite entrance (iron double doors, x 8-9) and a
// granite band over it; buff-red brick piers between paired double-hung windows above it, a quartz spandrel at each
// floor line, a brick parapet and a quartz coping. Lidar reads 33-45 with a 2-cell light notch at the NE front
// (x 10-11, z 0, 33 high) and a rear penthouse (x 5-14, z 5-7) to 45; those are the only tiers, flattened from the
// noise. Ground is 0 under every cell, so nothing needs a foundation. Shell only: 1-block walls, floor slabs every
// 3 layers, a roof cap, air between. Glowstone sits behind some panes on the floor slab below, never hanging.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1081060.cells.json`, "utf8"));
const X = 20, Y = 46, Z = 8;

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot.has(`${x},${z}`);

// Roof tier per footprint cell (block layers above y 0; 0 = nothing built). Main roof 42 = ground storey plus 12 upper
// storeys of 3 blocks, a brick parapet and the coping. Notch and penthouse as above.
const MAIN = 42;
const roofAt = (x, z) => {
  if (!inFoot(x, z)) return 0;
  if (z === 0 && (x === 10 || x === 11)) return 33;
  if (z >= 5 && x >= 5 && x <= 14) return 45;
  return MAIN;
};
const solid = (x, z, y) => y < roofAt(x, z);
const FACE = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
// Faces at layer y whose neighbour is not solid there: the outside of the wall, a notch or a setback.
const exposed = (x, z, y) => Object.entries(FACE).filter(([, [dx, dz]]) => !solid(x + dx, z + dz, y)).map(([f]) => f);

// A glass pane on a north or south face connects along x, on an east or west face along z (as vanilla would).
const pane = (f) => (f === "N" || f === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
const lit = (u, y, f) => (u * 5 + y * 7 + "NSWE".indexOf(f) * 3) % 11 === 0;   // sparse, deterministic warm windows

const g = new Voxels([X, Y, Z]);
const glowAt = [];

for (const [x, z] of cells) {
  const R = roofAt(x, z);
  for (let y = 0; y < R; y++) {
    const faces = exposed(x, z, y);
    const edge = faces.length > 0;
    // Roof cap: quartz coping on the edge, tar-dark deck inside.
    if (y === R - 1) { g.set(x, y, z, edge ? "smooth_quartz" : "deepslate_tiles"); continue; }
    // Floor slabs every 3 layers, full footprint: granite under the shopfront, quartz spandrels above, stone inside.
    if (y % 3 === 0) { g.set(x, y, z, edge ? (y <= 3 ? "polished_granite" : "smooth_quartz") : "smooth_stone"); continue; }
    if (!edge) continue;   // interior air: no interiors, the glass has air behind it
    // Corner piers run the full height in brick, granite at the base.
    if (faces.length > 1) { g.set(x, y, z, y <= 3 ? "polished_granite" : "bricks"); continue; }
    const f = faces[0];
    const u = f === "N" || f === "S" ? x : z;
    // Parapet band under the coping (main roof only; the penthouse keeps its windows).
    if (R === MAIN && y === R - 2) { g.set(x, y, z, "bricks"); continue; }
    if (y <= 3) {
      // Shopfront: granite piers, glass between, an iron double door in the centre of the 44th Street front.
      if (f === "N" && (x === 8 || x === 9) && (y === 1 || y === 2)) {
        g.set(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
        continue;
      }
      if (f === "N" && (x === 7 || x === 10)) { g.set(x, y, z, "polished_granite"); continue; }
      if (u % 3 === 0) { g.set(x, y, z, "polished_granite"); continue; }
      g.set(x, y, z, "glass_pane", pane(f));
      if (y === 1) glowAt.push([x, y, z, f, u]);
      continue;
    }
    // Upper storeys: brick piers on every third bay, paired double-hung glass between.
    if (u % 3 === 0) { g.set(x, y, z, "bricks"); continue; }
    g.set(x, y, z, "glass_pane", pane(f));
    if (y % 3 === 1) glowAt.push([x, y, z, f, u]);
  }
}

// Warm light behind some panes: a glowstone in the air just inside the glass, on the floor slab below it.
let lamps = 0;
for (const [x, y, z, f, u] of glowAt) {
  if (!lit(u, y, f)) continue;
  const [dx, dz] = FACE[f];
  const ix = x - dx, iz = z - dz;   // one step inside the glass
  if (!inFoot(ix, iz) || y >= roofAt(ix, iz) || exposed(ix, iz, y).length) continue;
  g.set(ix, y, iz, "glowstone"); lamps++;
}

// Penthouse roof plant: two vents on the setback's cap, standing on the roof.
g.set(7, 45, 6, "smooth_stone");
g.set(12, 45, 6, "smooth_stone");

const r = g.save(`${DIR}/NYC1081060.nbt`);
console.log(JSON.stringify({ ...r, lamps }));
