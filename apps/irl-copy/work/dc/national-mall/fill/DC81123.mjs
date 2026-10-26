import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 801 P Street NW (DC81123): a 1900s-1920s Washington flats block, the row-house
// street type scaled up to a horizontal co-op. Red common brick walls on a stone
// base, smooth-stone storey lines and a parapet coping, a flat tar roof, a
// centred street door with stone surround, glazed bays on the odd columns, and
// warm lamps inside some windows. The lidar roof is 4 blocks: two storeys of one
// block each, with the base at y 0 and the parapet on top at y 3.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC81123.cells.json`, "utf8"));

const W = 13, HH = 16, D = 7;
const g = new Voxels([W, HH, D]);

const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, gr, r] of cells) cell.set(key(x, z), { G: gr, R: r });
const has = (x, z) => cell.has(key(x, z));

// Which outside faces each cell has (the footprint's edge).
const exposed = (x, z) => ({ n: !has(x, z - 1), s: !has(x, z + 1), w: !has(x - 1, z), e: !has(x + 1, z) });
const faceCount = (x, z) => Object.values(exposed(x, z)).filter(Boolean).length;

// A wall cell with one outward face: "z" (faces north or south, runs east-west) or "x".
const wallNormal = (x, z) => {
  const f = exposed(x, z), c = faceCount(x, z);
  if (c !== 1) return null;
  return f.n || f.s ? "z" : "x";
};

const STONE = "stone_bricks", BRICK = "bricks", COPING = "smooth_stone", ROOF = "gray_concrete";
const PANE = (normal) => normal === "z"
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Bays: glass on the odd columns of the street front and on every odd row of the end walls; the
// street door sits on the middle pier of the south front with its stone surround either side.
const DOOR = [6, 6];
const isWindow = (x, z, normal) => {
  if (normal === "z") return x % 2 === 1 && !(z === 6 && (x === 5 || x === 7));
  return z % 2 === 1;
};
const isDoorSurround = (x, z) => z === 6 && (x === 5 || x === 7);

// Storey floors and the bearing wall: a solid floor slab over the top storey's interior,
// a partition on the ground storey's centre line (z 3), and the ground-storey rooms left as air.
const bearing = (x, z) => z === 3;

// Which interior cells sit just inside an upper-storey window: these stay air (lit from above),
// the rest of the top storey is slab.
const upperAir = new Set();
const lamp1 = new Set(), lamp2 = new Set();
for (const [x, z] of [...cell.keys()].map((k) => k.split(",").map(Number))) {
  if (faceCount(x, z) !== 1) continue;
  const n = wallNormal(x, z); if (!n || !isWindow(x, z, n)) continue;
  const f = exposed(x, z);
  const [ix, iz] = f.n ? [x, z + 1] : f.s ? [x, z - 1] : f.w ? [x + 1, z] : [x - 1, z];
  if (has(ix, iz) && faceCount(ix, iz) === 0) upperAir.add(key(ix, iz));
}

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const c = faceCount(x, z), n = wallNormal(x, z);
  const interior = c === 0;
  const isWin = n && isWindow(x, z, n) && !isDoorSurround(x, z);

  // Base course and floor: stone from y 0 (ground is 0 here, so no foundation fill).
  g.set(x, 0, z, STONE);

  if (interior) {
    // Ground storey: a bearing partition on z 3, otherwise air.
    if (bearing(x, z)) g.set(x, 1, z, BRICK);
    // Top storey: slab except the air pockets behind upper windows.
    if (!upperAir.has(key(x, z))) g.set(x, 2, z, STONE);
    // Flat tar roof on top of the slab.
    g.set(x, 3, z, ROOF);
    continue;
  }

  // Walls: the ground and upper storeys, the parapet on top.
  if (c >= 2) {
    // Corners: stone quoins, in both storeys.
    g.set(x, 1, z, STONE); g.set(x, 2, z, STONE);
  } else if (isWin) {
    g.set(x, 1, z, "glass_pane", PANE(n));
    g.set(x, 2, z, "glass_pane", PANE(n));
  } else if (isDoorSurround(x, z)) {
    g.set(x, 1, z, STONE); g.set(x, 2, z, STONE);
  } else {
    g.set(x, 1, z, BRICK); g.set(x, 2, z, BRICK);
  }
  // Parapet coping on every edge cell.
  g.set(x, 3, z, COPING);
}

// The street door: lower and upper halves in the south middle pier.
const [dx, dz] = DOOR;
g.set(dx, 1, dz, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 2, dz, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// Warm lights: a standing lantern inside some ground-storey windows, a hanging lantern in some
// upper-storey air pockets (glowstone and shroomlight read as orange cubes from the street, so none).
const wins = cells.map(([x, z]) => [x, z]).filter(([x, z]) => {
  const n = wallNormal(x, z); return n && isWindow(x, z, n) && !isDoorSurround(x, z);
});
wins.forEach(([x, z], k) => {
  const f = exposed(x, z), n = wallNormal(x, z);
  const [ix, iz] = f.n ? [x, z + 1] : f.s ? [x, z - 1] : f.w ? [x + 1, z] : [x - 1, z];
  if (!has(ix, iz) || faceCount(ix, iz) !== 0) return;
  if (k % 3 === 0) g.set(ix, 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  else if (k % 3 === 1 && upperAir.has(key(ix, iz))) g.set(ix, 2, iz, "lantern", { hanging: "true", waterlogged: "false" });
});

const { blocks, palette } = g.save(`${DIR}/DC81123.nbt`);
console.log("wrote DC81123.nbt", { blocks, palette, cells: cells.length, upperAir: upperAir.size, windows: wins.length });
