import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey commercial block, c. 1970s-80s Taipei: tiled and concrete
// facade, pilasters on a 3-bay rhythm, a shopfront-glazed ground storey, a
// parapet roof with plant boxes. Total height 11 blocks above the floor line.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw965224969";
const W = 22, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const footprint = new Set(cells.map(([x, z]) => key(x, z)));
const inFp = (x, z) => footprint.has(key(x, z));

// Floor line of the building: the highest ground under the footprint, so every
// storey sits on one plane and nothing floats on the slope.
const F = Math.max(...cells.map((c) => c[2]));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: normal, facing name, and the axis the face runs along.
const DIRS = [
  { n: "north", dx: 0, dz: -1, along: "x" },
  { n: "south", dx: 0, dz: 1, along: "x" },
  { n: "west", dx: -1, dz: 0, along: "z" },
  { n: "east", dx: 1, dz: 0, along: "z" },
];
const exteriorFaces = (x, z) => DIRS.filter((d) => !inFp(x + d.dx, z + d.dz));
const along = (d, x, z) => (d.along === "x" ? x : z);

const paneProps = (d) =>
  d.along === "x"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation, ground slab, level-2 slab, roof deck.
for (const [x, z] of cells) {
  for (let y = 0; y < F; y++) put(x, y, z, "stone_bricks");   // foundation to floor line
  put(x, F, z, "smooth_stone");                               // ground-floor slab
  put(x, F + 5, z, "smooth_stone");                           // level-2 slab
  put(x, F + 10, z, "light_gray_concrete");                   // roof deck
}

// 2. Perimeter walls, pilasters and window grids.
const faceCount = {};
for (const [x, z] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length === 0) continue;
  for (const d of faces) faceCount[d.n] = (faceCount[d.n] || 0) + 1;

  const isCorner = faces.length >= 2;
  for (let y = F + 1; y <= F + 9; y++) {
    if (y === F + 1) { put(x, y, z, "polished_andesite"); continue; }       // base course
    if (y === F + 5 || y === F + 9) { put(x, y, z, "smooth_stone"); continue; } // storey lines
    if (isCorner) { put(x, y, z, "white_concrete"); continue; }
    // Single-face cell: 3-bay rhythm, pilaster on bay 0, glazed bays 1 and 2.
    const d = faces[0];
    const bay = along(d, x, z) % 3;
    if (bay === 0) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", paneProps(d));
  }
  // Parapet cap on the perimeter.
  put(x, F + 10, z, "white_concrete");
}

// 3. Entrance on the dominant street-facing side, with door and lintel.
let dom = DIRS[0];
for (const d of DIRS) if ((faceCount[d.n] || 0) > (faceCount[dom.n] || 0)) dom = d;

const faceCells = cells
  .filter(([x, z]) => exteriorFaces(x, z).some((f) => f.n === dom.n))
  .map(([x, z]) => ({ x, z }))
  .sort((a, b) => along(dom, a.x, a.z) - along(dom, b.x, b.z));

if (faceCells.length > 0) {
  const mid = Math.floor(faceCells.length / 2);
  const e = faceCells[mid];
  const doorBase = { facing: dom.n, hinge: "left", open: "false", powered: "false" };
  put(e.x, F + 1, e.z, "dark_oak_door", { ...doorBase, half: "lower" });
  put(e.x, F + 2, e.z, "dark_oak_door", { ...doorBase, half: "upper" });

  // Canopy/lintel across the entrance bay, three cells wide where the face allows.
  faceCells.forEach((c, i) => {
    if (Math.abs(i - mid) <= 1) put(c.x, F + 3, c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  });
}

// 4. Warm lights behind some glazed bays (interior cell behind the pane).
for (const [x, z] of cells) {
  const faces = exteriorFaces(x, z);
  if (faces.length !== 1) continue;
  const d = faces[0];
  const bay = along(d, x, z) % 3;
  if (bay === 0) continue;
  if (along(d, x, z) % 6 !== 1) continue;
  const ix = x - d.dx, iz = z - d.dz;
  if (!inFp(ix, iz) || exteriorFaces(ix, iz).length > 0) continue;
  const block = (x + z) % 2 === 0 ? "glowstone" : "shroomlight";
  put(ix, F + 3, iz, block);
  put(ix, F + 7, iz, block);
}

// 5. Roof plant boxes on interior cells, sparse.
for (const [x, z] of cells) {
  if (exteriorFaces(x, z).length > 0) continue;
  if ((x * 7 + z * 3) % 11 === 0) {
    put(x, F + 11, z, "light_gray_concrete");
    put(x, F + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
