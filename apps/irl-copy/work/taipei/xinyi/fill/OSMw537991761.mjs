import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw537991761";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 17 x 23 x 16: two-storey Xinyi low-rise, roof about 11 blocks above lowest ground.
const W = 17, H = 23, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (!has(x, z)) return; // build only on footprint cells
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward faces: neighbour missing from footprint.
const DIRS = [
  { n: "north", dx: 0, dz: -1, along: "x" },
  { n: "south", dx: 0, dz: 1, along: "x" },
  { n: "west", dx: -1, dz: 0, along: "z" },
  { n: "east", dx: 1, dz: 0, along: "z" },
];
const facesOf = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

// Footprint bounds for centring rooftop plant.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of ground.keys().map((k) => k.split(",").map(Number))) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Pick the entrance: the face with most exposed cells, middle non-corner cell.
const faceCount = Object.fromEntries(DIRS.map((d) => [d.n, 0]));
const pairs = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  for (const f of fs) { faceCount[f.n]++; pairs.push({ x, z, f, corner: fs.length >= 2 }); }
}
const frontName = Object.entries(faceCount).sort((a, b) => b[1] - a[1])[0][0];
const front = DIRS.find((d) => d.n === frontName);
let frontPairs = pairs.filter((p) => p.f.n === frontName);
const nonCorner = frontPairs.filter((p) => !p.corner);
const doorPool = (nonCorner.length ? nonCorner : frontPairs)
  .sort((a, b) => (front.along === "x" ? a.x - b.x : a.z - b.z));
const doorPair = doorPool[Math.floor(doorPool.length / 2)];
const doorKey = doorPair ? key(doorPair.x, doorPair.z) : null;

const paneProps = (along) =>
  along === "x"
    ? { east: "true", west: "true", north: "false", south: "false" }
    : { north: "true", south: "true", east: "false", west: "false" };

for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const B = gr;
  const faces = facesOf(x, z);
  const perimeter = faces.length > 0;
  const corner = faces.length >= 2;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: ground, first-floor, roof.
  put(x, B, z, "smooth_stone");
  put(x, B + 5, z, "light_gray_concrete");
  put(x, B + 10, z, "light_gray_concrete");

  if (perimeter) {
    // Walls for both storeys.
    for (const y of [B + 2, B + 3, B + 4, B + 6, B + 7, B + 8, B + 9]) {
      put(x, y, z, "white_concrete");
    }
    // Base course and cornice.
    put(x, B + 1, z, "stone_bricks");
    put(x, B + 10, z, "smooth_stone");
    // Parapet.
    put(x, B + 11, z, "white_concrete");
    // Shopfront lintel band (red signage).
    put(x, B + 4, z, "red_concrete");
    // Sill band between storeys.
    put(x, B + 6, z, "white_concrete");
  }

  // Windows and shopfronts on each exposed, non-corner face.
  for (const f of faces) {
    if (corner) continue;
    const i = f.along === "x" ? x : z;
    const isDoor = doorKey === k && f.n === frontName;
    const props = paneProps(f.along);

    // Ground storey: wide shopfront glass except piers.
    if (i % 3 !== 0 && !isDoor) {
      put(x, B + 2, z, "glass_pane", props);
      put(x, B + 3, z, "glass_pane", props);
    }
    // Upper storey: a clean window grid.
    if (i % 3 === 1) {
      put(x, B + 7, z, "glass_pane", props);
      put(x, B + 8, z, "glass_pane", props);
      // Warm light behind the glass on alternate windows.
      if (i % 6 === 1) {
        const ix = x - f.dx, iz = z - f.dz;
        if (has(ix, iz)) put(ix, B + 7, iz, "glowstone");
      }
    }
    // Ground-floor warm light behind some shopfront glass.
    if (i % 6 === 2 && !isDoor) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz)) put(ix, B + 2, iz, "shroomlight");
    }
  }

  // Entrance door with its own lintel above.
  if (k === doorKey) {
    put(x, B + 1, z, "oak_door", {
      facing: frontName, half: "lower", hinge: "left", open: "false", powered: "false",
    });
    put(x, B + 2, z, "oak_door", {
      facing: frontName, half: "upper", hinge: "left", open: "false", powered: "false",
    });
    put(x, B + 3, z, "white_concrete");
  }

  // Rooftop plant: a stone-brick water-tank housing near the centre, lantern on top.
  const inner = !perimeter;
  if (inner && Math.abs(x - cx) <= 1.5 && Math.abs(z - cz) <= 1.5) {
    put(x, B + 11, z, "stone_bricks");
    put(x, B + 12, z, "stone_bricks");
    if (Math.abs(x - cx) < 0.5 && Math.abs(z - cz) < 0.5) {
      put(x, B + 13, z, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
