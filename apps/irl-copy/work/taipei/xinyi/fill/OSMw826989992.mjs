import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989992";
const W = 24, H = 38, D = 17;
const ROOF = 26;      // roof level above lowest ground (lidar)
const STOREY = 5;     // blocks per storey
const PARAPET_TOP = ROOF;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;
const shift = Math.min(...list.map((c) => c[2]));

// footprint: "x,z" -> ground (relative to lowest ground, y0 = 0)
const G = new Map();
for (const [x, z, gr] of list) G.set(`${x},${z}`, gr - shift);

const inside = (x, z) => G.has(`${x},${z}`);
const exposed = (x, z) => ({
  n: !inside(x, z - 1),
  s: !inside(x, z + 1),
  w: !inside(x - 1, z),
  e: !inside(x + 1, z),
});
const isExt = (x, z) => {
  const f = exposed(x, z);
  return f.n || f.s || f.w || f.e;
};
const faceOf = (x, z) => {
  const f = exposed(x, z);
  if (f.n) return "n";
  if (f.s) return "s";
  if (f.w) return "w";
  if (f.e) return "e";
  return null;
};
// direction from the outer skin into the building
const INWARD = { n: [0, 1], s: [0, -1], w: [1, 0], e: [-1, 0] };

// entrance: middle of the south (street) face, else north
const southCells = list
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faceOf(x, z) === "s")
  .sort((a, b) => a[0] - b[0]);
const northCells = list
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => faceOf(x, z) === "n")
  .sort((a, b) => a[0] - b[0]);
const doorCands = southCells.length ? southCells : northCells;
const door = doorCands.length ? doorCands[Math.floor(doorCands.length / 2)] : null;

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// ---- shell, storeys, roof ----
for (const [k, gr] of G) {
  const [x, z] = k.split(",").map(Number);
  const gy = gr;
  const f = faceOf(x, z);
  const ext = f !== null;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const isDoor = door && door[0] === x && door[1] === z;
  const t = f === "n" || f === "s" ? x : z;
  const inward = f ? INWARD[f] : null;
  const alongEW = f === "n" || f === "s";

  for (let y = gy; y <= 25; y++) {
    if (!ext) {
      // interior: floor slab at each storey line and the roof deck
      if (y === gy || y % STOREY === 0) {
        put(x, y, z, y === 25 ? "smooth_quartz" : "white_concrete");
      }
      continue;
    }

    if (isDoor && (y === gy || y === gy + 1) && gy <= 3) {
      const half = y === gy ? "lower" : "upper";
      put(x, y, z, "oak_door", {
        facing: "south",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (y === 25) {
      put(x, y, z, "white_concrete"); // cornice
      continue;
    }
    if (y % STOREY === 0) {
      put(x, y, z, y === 0 ? "polished_granite" : "white_concrete"); // storey line
      continue;
    }
    if (y % STOREY === 4) {
      put(x, y, z, "smooth_quartz"); // spandrel / lintel
      continue;
    }

    // window or shopfront band (y % 5 in 1..3)
    const ground = y < STOREY;
    const pier = t % 3 === 0;
    if (pier) {
      put(x, y, z, ground ? "polished_granite" : "smooth_quartz");
    } else {
      const conn = alongEW
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
      put(x, y, z, "light_blue_stained_glass_pane", conn);

      // warm light behind some windows
      if (y % STOREY === 2 && ((t + Math.floor(y / STOREY)) % 4 === 1)) {
        const ix = x + inward[0], iz = z + inward[1];
        const gi = G.get(`${ix},${iz}`);
        if (gi !== undefined && !isExt(ix, iz) && gi < y) {
          put(ix, y, iz, (t + y) % 2 ? "glowstone" : "shroomlight");
        }
      }
    }
  }

  // parapet on the perimeter
  if (ext) put(x, PARAPET_TOP, z, "white_concrete");
}

// ---- rooftop mechanical penthouse and mast ----
const PH = { x0: 5, x1: 12, z0: 4, z1: 10 };
for (let x = PH.x0; x <= PH.x1; x++) {
  for (let z = PH.z0; z <= PH.z1; z++) {
    if (!inside(x, z) || isExt(x, z)) continue;
    const border = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (border) {
      for (let y = ROOF; y <= 28; y++) put(x, y, z, "gray_concrete");
    }
    put(x, 29, z, "smooth_quartz");
  }
}
for (let y = 30; y <= 33; y++) {
  put(8, y, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
