// DC77288: a two-storey Federal-style brick townhouse with a limestone string course and cornice, a
// frontal door with quartz surround on the downhill (south, +z) face, and a brick flue. Roof cap sits at 6 blocks
// above y0 on every cell (the lidar's 5 vs 6 is noise, smoothed into one flat tier). Foundation: y0 stone on every
// footprint cell, so cells on the uphill (north) side sit on their ground and the south face shows the full height.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77288.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..7, z 0..7

const ROOF = 6;                       // flat roof cap: top of layer y5
const DOOR = [5, 7];                  // door cell on the south (+z, downhill, street) face
const inFp = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const has = (x, z) => inFp.has(`${x},${z}`);

const g = new Voxels([8, 18, 8]);

// exposure of a footprint cell on each side (no neighbour in the footprint = outside)
const exposed = (x, z) => ({ N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) });

// the cell's role on the outside face: "corner", "wall" (with the bay index along the face) or "inner"
function wallInfo(x, z) {
  const e = exposed(x, z);
  const zFace = e.N || e.S, xFace = e.W || e.E;
  if (!zFace && !xFace) return { role: "inner" };
  if (zFace && xFace) return { role: "corner" };
  // a face running along x (N/S) is bayed by x; one running along z (E/W) by z
  const bay = zFace ? x : z;
  const pier = bay % 3 === 0;
  return { role: "wall", bay, pier, face: zFace ? (e.N ? "N" : "S") : (e.W ? "W" : "E") };
}

const BRICK = "bricks", QUARTZ = "smooth_quartz", STONE = "smooth_stone", GLASS = "glass_pane";
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// layers: y0 base, y1 storey-one wall, y2 storey-one windows, y3 floor slab / stone string course, y4 storey-two
// windows, y5 cornice and roof deck
for (const [x, z] of cells) {
  g.set(x, 0, z, STONE);                                    // base and foundation, every footprint cell
  const w = wallInfo(x, z);
  const isWall = w.role !== "inner";

  // floor slab across the whole footprint; on the outside it is a stone string course between the brick storeys
  g.set(x, 3, z, w.role === "inner" ? QUARTZ : w.role === "corner" ? QUARTZ : "stone_bricks");
  // roof cap: cornice on the outside, roof deck inside
  g.set(x, ROOF - 1, z, w.role === "inner" ? "stone_bricks" : QUARTZ);

  if (!isWall) continue;

  for (const y of [1, 2, 4]) {
    if (w.role === "corner") { g.set(x, y, z, QUARTZ); continue; }
    if (y === 1 || w.pier) { g.set(x, y, z, BRICK); continue; }
    // windows in the bays between piers, at y2 and y4
    if (y === 2 && x === DOOR[0] && z === DOOR[1]) continue;     // the door takes this cell
    const zAxis = w.face === "N" || w.face === "S";
    const state = zAxis
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, GLASS, state);
  }
}

// the entrance on the south face: dark oak door, quartz surround, the lintel is the y3 course
const [dx, dz] = DOOR;
const doorBase = { facing: "south", hinge: "left", open: "false", powered: "false" };
g.set(dx, 1, dz, "dark_oak_door", { ...doorBase, half: "lower" });
g.set(dx, 2, dz, "dark_oak_door", { ...doorBase, half: "upper" });
g.set(dx - 1, 1, dz, QUARTZ); g.set(dx + 1, 1, dz, QUARTZ);
g.set(dx - 1, 2, dz, QUARTZ); g.set(dx + 1, 2, dz, QUARTZ);

// warm light behind some storey-one and storey-two windows: glowstone on the inner cell behind the glass
for (const [x, z] of cells) {
  const w = wallInfo(x, z);
  if (w.role !== "wall" || w.pier || (x === dx && z === dz)) continue;
  if (w.bay % 2 === 0) continue;                       // every other window
  const [ix, iz] = INWARD[w.face];
  if (!has(x + ix, z + iz)) continue;
  for (const y of [2, 4]) if ((x + z + y) % 2 === 0) g.set(x + ix, y, z + iz, "glowstone");
}

// a brick flue through the roof, on an interior cell
const [cx, cz] = [2, 4];
g.set(cx, ROOF, cz, "bricks");
g.set(cx, ROOF + 1, cz, "brick_slab", { type: "bottom", waterlogged: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC77288.nbt");
