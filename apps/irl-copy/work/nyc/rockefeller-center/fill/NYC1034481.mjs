// 23 West 47th Street, 1931 commercial and office building: a narrow midblock office block, 9 x 28 blocks, with its
// 9-block side on the 47th Street frontage (low z = north). Lidar gives a flat lot and three roof tiers: a 2-storey
// front wing (roof 7, medians 7) on the street, then the main block stepping down from 26 (west, x 0-4, z 4-19) to
// 24 (east, x 5-8) to 23 (the rear, z 20-27). Each tier is one flat roof; no lidar noise is followed cell by cell.
// Walls are buff limestone: polished granite base course, cut-sandstone piers every third bay, smooth-sandstone
// spandrels under two rows of glass in each 3-block storey, and a chiseled cornice course under a tar roof. The
// shopfront at ground level has a black-stone lintel over an iron entrance door. Glass sits one block out from a
// solid core, with an air gap behind it and a floor slab in each storey (no interiors). A few panes have glowstone
// behind them. Roof equipment is a small sandstone penthouse on the 26 tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034481.cells.json`, "utf8"));
const X = 9, Z = 28, Y = 38;

// Footprint: every cell of the 9 x 28 rectangle (the cells file covers all of them).
const onFoot = (x, z) => x >= 0 && x < X && z >= 0 && z < Z;

// Roof height in blocks (layers 0..H-1), from the lidar tiers above.
const H = (x, z) => {
  if (z <= 3) return 7;                          // 2-storey front wing on 47th Street
  if (x <= 4 && z <= 19) return 26;              // west tower tier
  if (z <= 19) return 24;                        // east mid tier
  return 23;                                     // rear tier
};
const cornice = (top) => (top >= 20 ? 2 : 1);    // tall tiers carry a two-course cornice, the front wing one course

// A layer is closed where a cell is built. depth(x, y, z): 1 = touches open air sideways (the skin), 2 = one in,
// 3+ = core. Computed per layer by a breadth-first walk in from the outside.
const closed = (x, y, z) => onFoot(x, z) && y < H(x, z);
const depthAt = (y) => {
  const d = Array.from({ length: X }, () => Array(Z).fill(Infinity));
  const q = [];
  for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
    if (!closed(x, y, z)) continue;
    const exposed = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !closed(x + dx, y, z + dz));
    if (exposed) { d[x][z] = 1; q.push([x, z]); }
  }
  for (let i = 0; i < q.length; i++) {
    const [x, z] = q[i];
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz;
      if (closed(nx, y, nz) && d[nx][nz] > d[x][z] + 1) { d[nx][nz] = d[x][z] + 1; q.push([nx, nz]); }
    }
  }
  return d;
};
const depth = Array.from({ length: Y }, (_, y) => (y < 27 ? depthAt(y) : null));

// Which way a skin cell faces: N = low z (47th Street), S, W, E. Corners take the first open neighbour in that order.
const faceOf = (x, y, z) => {
  if (!closed(x, y, z - 1)) return "N";
  if (!closed(x, y, z + 1)) return "S";
  if (!closed(x - 1, y, z)) return "W";
  if (!closed(x + 1, y, z)) return "E";
  return null;
};
// The bay index along the face: x on the N and S faces, z on the W and E faces. Piers at every third bay and at both
// ends of each face.
const uOf = (x, z, face) => (face === "N" || face === "S" ? x : z);
const isPier = (x, z, face) => {
  const u = uOf(x, z, face);
  return u % 3 === 0 || (face === "N" || face === "S" ? u === 8 : false);
};
const lit = (u, y, k) => (u * 5 + y * 7 + k * 3) % 11 === 0;   // sparse, deterministic warm windows

// Entrance: door in the shopfront at x 4 on 47th Street, black-stone lintel over it.
const DOOR = { x: 4, z: 0 };
const isDoor = (x, y, z) => x === DOOR.x && z === DOOR.z && y <= 1;
const isLintel = (x, y, z) => z === 0 && (x === 4 || x === 5) && y === 2;

const glassState = (face) => (face === "N" || face === "S"
  ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }   // pane along x
  : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" }); // pane along z

// Skin role at a cell and height: "pier", "spandrel", "glass" or "base" (ground course) or "door".
const skinKind = (x, y, z, face) => {
  if (y === 0) return "base";
  if (isPier(x, z, face)) return "pier";
  if (y % 3 === 0) return "spandrel";
  return "glass";
};
// The skin cell a pocket cell sits behind, if it is a glass cell.
const glassBehind = (x, y, z) => {
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!onFoot(nx, nz) || depth[y][nx][nz] !== 1) continue;
    const f = faceOf(nx, y, nz);
    if (!f) continue;
    if (skinKind(nx, y, nz, f) === "glass" || isDoor(nx, y, nz)) return { x: nx, y, z: nz, face: f };
  }
  return null;
};

const g = new Voxels([X, Y, Z]);

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const top = H(x, z), cor = cornice(top);
  for (let y = 0; y < top; y++) {
    const dep = depth[y][x][z];
    // Roof: the top layer is the cornice cap on the skin, tar roof inside; the second cornice course sits under it.
    if (y === top - 1) { g.set(x, y, z, dep === 1 ? "chiseled_sandstone" : "gray_concrete"); continue; }
    if (dep === 1 && cor === 2 && y === top - 2) { g.set(x, y, z, "cut_sandstone"); continue; }
    if (dep === 1) {
      const face = faceOf(x, y, z);
      if (isDoor(x, y, z)) { g.set(x, y, z, "iron_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isLintel(x, y, z)) { g.set(x, y, z, "polished_blackstone"); continue; }
      const kind = skinKind(x, y, z, face);
      if (kind === "base") g.set(x, y, z, "polished_granite");
      else if (kind === "pier") g.set(x, y, z, "cut_sandstone");
      else if (kind === "spandrel") g.set(x, y, z, "smooth_sandstone");
      else g.set(x, y, z, "light_blue_stained_glass_pane", glassState(face));
      continue;
    }
    if (dep === 2) {
      // Behind a glass cell in a storey (rows 1 and 2 of the 3-block storey) is air, or glowstone in a lit window;
      // everywhere else, including the floor slab rows, it is solid.
      const b = glassBehind(x, y, z);
      if (b && y % 3 !== 0 && y > 0) {
        const u = uOf(b.x, b.z, b.face);
        const k = b.face === "N" ? 0 : b.face === "S" ? 1 : b.face === "W" ? 2 : 3;
        if (lit(u, y, k)) g.set(x, y, z, "glowstone");
        continue;
      }
      g.set(x, y, z, "stone");
      continue;
    }
    g.set(x, y, z, "stone");
  }
}

// Roof equipment: a sandstone penthouse on the 26 tier, two blocks high, with a chiseled cap, set on the tar roof.
for (let x = 1; x <= 3; x++) for (let z = 8; z <= 11; z++) {
  g.set(x, 26, z, "smooth_sandstone");
  g.set(x, 27, z, "chiseled_sandstone");
}

const out = `${DIR}/NYC1034481.nbt`;
const r = g.save(out);
console.log("saved", out, r);
