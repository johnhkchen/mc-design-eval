import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682865";
const W = 15, D = 18, H = 23;

// Record: no building data. Read as a two-storey mid-century concrete commercial block
// (white-tiled concrete frame, brown terracotta bands, red canopy over a shopfront,
// flat roof with parapet and a small rooftop water tank). Storeys are 5 blocks each.

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(x + "," + z, gr);
const inF = (x, z) => G.has(x + "," + z);
const gnd = (x, z) => G.get(x + "," + z);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// outward normals and the facing name used for doors
const NB = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];
const exposed = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz));

// Pass 1: foundations, floor slabs, roof slabs, perimeter walls
for (const [x, z, fy] of cells) {
  for (let y = 0; y < fy; y++) put(x, y, z, "stone_bricks");

  const faces = exposed(x, z);
  const perim = faces.length > 0;

  // ground floor slab / plinth, first-floor slab, roof slab
  put(x, fy, z, "light_gray_concrete");
  put(x, fy + 5, z, "smooth_stone");
  put(x, fy + 10, z, "smooth_stone");

  if (!perim) continue;

  const corner = faces.length > 1;
  const [dx, dz, facing] = faces[0];
  // position along the face (used for the bay rhythm)
  const i = dx === 0 ? x : z;
  const pillar = corner || i % 3 === 0;

  // ground storey: pillars or shopfront glazing, red canopy band at top
  for (let y = fy + 1; y <= fy + 3; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
  put(x, fy + 4, z, "red_terracotta");

  // floor line band
  put(x, fy + 5, z, "brown_terracotta");

  // upper storey: solid pillars, glazed bays, lintel
  for (let y = fy + 6; y <= fy + 8; y++) {
    if (pillar) put(x, y, z, "white_concrete");
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
  put(x, fy + 9, z, "white_concrete");

  // parapet / cornice cap
  put(x, fy + 10, z, "smooth_stone");
}

// Pass 2: entrance door, warm lights behind some upper windows
for (const [x, z, fy] of cells) {
  const faces = exposed(x, z);
  if (faces.length === 0) continue;

  // front entrance on the north (z = 0) face, central bay
  const front = faces.find(([, dz]) => dz === -1);
  if (front && x === Math.floor(W / 2) && z === 0) {
    put(x, fy + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, fy + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // glowstone behind selected upper windows (air gap, interior cell)
  if (faces.length === 1) {
    const [dx, dz] = faces[0];
    const i = dx === 0 ? x : z;
    if (i % 6 === 2) {
      const ix = x - dx, iz = z - dz;
      if (inF(ix, iz) && exposed(ix, iz).length === 0) {
        put(ix, fy + 7, iz, "glowstone");
      }
    }
  }
}

// Pass 3: rooftop water tank, a 3x3 block of interior roof cells nearest the centroid
const interior = cells.filter(([x, z]) => {
  for (let ax = -1; ax <= 1; ax++)
    for (let az = -1; az <= 1; az++)
      if (!inF(x + ax, z + az) || exposed(x + ax, z + az).length > 0) return false;
  return true;
});
if (interior.length) {
  const mx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
  const mz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
  interior.sort((a, b) => Math.hypot(a[0] - mx, a[1] - mz) - Math.hypot(b[0] - mx, b[1] - mz));
  const [cx, cz] = interior[0];
  for (let ax = -1; ax <= 1; ax++) {
    for (let az = -1; az <= 1; az++) {
      const x = cx + ax, z = cz + az;
      const fy = gnd(x, z);
      put(x, fy + 11, z, "light_gray_concrete");
      put(x, fy + 12, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
