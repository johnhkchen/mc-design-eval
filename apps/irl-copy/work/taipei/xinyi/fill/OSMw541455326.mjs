import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise two-storey Taipei shophouse-style block: stone base, white concrete
// frame with glazed bays, red fascia over a shopfront ground storey, plain
// parapet cornice with rooftop AC units. Walls are one cell thick, interiors
// are air behind the glass, with a floor slab per storey.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541455326";
const cells = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const T = 10;                       // top course (cornice / roof deck); roof surface at y 11
const NB = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const facesOf = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));
const isEdge = (x, z) => has(x, z) && facesOf(x, z).length > 0;

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Choose the entrance: the single-face wall cells on the side with the most
// exposed cells, taking the middle of that run.
const singles = [];
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const f = facesOf(x, z);
  if (f.length === 1) singles.push({ x, z, face: f[0] });
}
const dirCount = {};
for (const s of singles) dirCount[s.face[2]] = (dirCount[s.face[2]] || 0) + 1;
const topDir = Object.keys(dirCount).sort((a, b) => dirCount[b] - dirCount[a])[0];
const alongOf = (s) => (s.face[0] !== 0 ? s.z : s.x);
const doorCands = singles.filter((s) => s.face[2] === topDir).sort((a, b) => alongOf(a) - alongOf(b));
const door = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;
const doorKey = door ? `${door.x},${door.z}` : null;

for (const [x, z, gy] of cells) {
  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const faces = facesOf(x, z);
  const edge = faces.length > 0;
  const corner = faces.length > 1;

  // Storey lines: ground floor at gy, string course (slab) at f2
  const f2 = Math.max(gy + 2, Math.min(gy + 5, 6));

  // Floor slab at ground level and at the upper storey line (all cells)
  put(x, gy, z, edge ? "stone_bricks" : "smooth_stone");
  put(x, f2, z, "smooth_stone");

  // Top course: cornice on the edge, roof deck inside
  put(x, T, z, edge ? "light_gray_concrete" : "smooth_stone");

  // Rooftop AC units on some roof-deck cells
  if (!edge && (x * 3 + z) % 7 === 0) put(x, T + 1, z, "iron_block");

  if (!edge) continue;

  // Exterior walls, both storeys
  for (let y = gy + 1; y < T; y++) put(x, y, z, "white_concrete");

  // Red fascia over the shopfront, a sign band
  put(x, f2 - 1, z, "red_concrete");

  if (corner) continue;

  const [dx, dz, dir] = faces[0];
  const along = dx !== 0 ? z : x;
  const ix = x - dx, iz = z - dz;            // interior neighbour
  const interiorOpen = has(ix, iz) && !isEdge(ix, iz);
  const isWindow = along % 3 !== 0;
  const isDoor = doorKey === `${x},${z}`;

  if (isDoor) {
    put(x, gy + 1, z, "oak_door", { facing: dir, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gy + 2, z, "oak_door", { facing: dir, half: "upper", hinge: "left", open: "false", powered: "false" });
    if (gy + 3 <= f2 - 2) put(x, gy + 3, z, "glass");
    continue;
  }

  if (isWindow) {
    // Shopfront glazing on the ground storey
    for (let y = gy + 1; y <= f2 - 2; y++) put(x, y, z, "glass");
    // Upper-storey glazed bay with a lintel course left above
    for (let y = f2 + 1; y <= T - 2; y++) put(x, y, z, "glass");
    // Warm light behind some glass
    if (interiorOpen) {
      if ((x + z) % 4 === 1 && gy + 2 <= f2 - 2) put(ix, gy + 2, iz, "glowstone");
      if ((x + z) % 2 === 0) put(ix, f2 + 2, iz, "glowstone");
    }
  } else {
    // Pier: solid pillar on the shopfront, plain concrete above
    for (let y = gy + 1; y <= f2 - 2; y++) put(x, y, z, "smooth_stone");
  }
}

g.save(`${SRC}/${ID}.nbt`);
