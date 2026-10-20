import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540883608";
const W = 10, H = 23, L = 15;

// Era read: a 1970s–80s Taipei low-rise commercial block. Two storeys over a
// shopfront ground floor, white tiled walls, quartz piers, aluminium-look
// window bands in light-blue glass, a dark sign band, a stone cornice and a
// low parapet with a small rooftop plant box.
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, L]);

const ground = new Map();
let minG = Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity;
for (const [x, z, gr] of cells) {
  ground.set(`${x},${z}`, gr);
  minG = Math.min(minG, gr);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z);
}

const D = minG;                       // ground-floor datum on the lowest ground
const has = (x, z) => ground.has(`${x},${z}`);
const base = (x, z) => Math.max(ground.get(`${x},${z}`), D);

// faces that are exposed (no footprint neighbour on that side)
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const isRing = (x, z) => faces(x, z).length > 0;

// only write above the local foundation top and inside the volume
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (y < base(x, z)) return;
  g.set(x, y, z, id, p);
};

// glass pane connections follow the wall they sit in
const paneProps = (f) =>
  (f === "N" || f === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// along-face index: pier every third bay, measured from the footprint edge
const bayIndex = (f, x, z) => (f === "N" || f === "S") ? x - minX : z - minZ;

// inward neighbour for a face
const inward = (f, x, z) => {
  if (f === "N") return [x, z + 1];
  if (f === "S") return [x, z - 1];
  if (f === "W") return [x + 1, z];
  return [x - 1, z];
};

// entrance: north (street-facing) ring cell nearest the middle, not a pier bay
const mid = (minX + maxX) / 2;
let doorX = null;
for (const [x, z] of cells) {
  if (z !== minZ) continue;
  const f = faces(x, z);
  if (f.length !== 1 || f[0] !== "N") continue;
  if ((x - minX) % 3 === 0) continue;
  if (doorX === null || Math.abs(x - mid) < Math.abs(doorX - mid)) doorX = x;
}

// 1. foundation: solid from y 0 up to each cell's ground (and plinth to the datum)
for (const [x, z] of cells) {
  const b = base(x, z);
  for (let y = 0; y < b && y < H; y++) g.set(x, y, z, "stone_bricks");
}

// 2. storeys, roof and parapet
for (const [x, z] of cells) {
  const f = faces(x, z);
  const ring = f.length > 0;
  const corner = f.length > 1;
  const idx = ring ? bayIndex(f[0], x, z) : -1;
  const pier = corner || (ring && idx % 3 === 0);
  const door = ring && !pier && f[0] === "N" && z === minZ && x === doorX;

  // ground floor: base course at the datum, shopfront glass, sign band, lintel
  put(x, D, z, ring ? "stone_bricks" : "smooth_stone");
  if (ring) {
    for (const y of [D + 1, D + 2]) {
      if (pier) put(x, y, z, "quartz_block");
      else if (door) {
        const half = y === D + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "north", half, hinge: "left", open: "false", powered: "false",
        });
      } else put(x, y, z, "light_blue_stained_glass_pane", paneProps(f[0]));
    }
    put(x, D + 3, z, pier ? "quartz_block" : "gray_concrete");
    put(x, D + 4, z, pier ? "quartz_block" : "white_concrete");
  }

  // upper storey floor slab and window band
  const y0 = D + 5;
  put(x, y0, z, "smooth_stone");
  if (ring) {
    put(x, y0 + 1, z, pier ? "quartz_block" : "white_concrete");
    put(x, y0 + 4, z, pier ? "quartz_block" : "white_concrete");
    for (const y of [y0 + 2, y0 + 3]) {
      put(x, y, z, pier ? "quartz_block" : "light_blue_stained_glass_pane", pier ? undefined : paneProps(f[0]));
    }
  }

  // roof deck, stone cornice and parapet
  put(x, D + 10, z, "smooth_stone");
  if (ring) put(x, D + 11, z, "white_concrete");
}

// 3. warm lights behind some windows (interior air side)
for (const [x, z] of cells) {
  const f = faces(x, z);
  if (f.length !== 1) continue;
  const idx = bayIndex(f[0], x, z);
  if (idx % 3 === 0 || (f[0] === "N" && x === doorX && z === minZ)) continue;
  const [ix, iz] = inward(f[0], x, z);
  if (!has(ix, iz) || isRing(ix, iz)) continue;
  if (idx % 4 === 1) put(ix, D + 2, iz, "glowstone");          // ground shopfront
  if (idx % 4 === 2) put(ix, D + 7, iz, "glowstone");          // upper storey
}

// 4. rooftop plant box, set back from the parapet
for (const [x, z] of cells) {
  if (isRing(x, z)) continue;
  if (x >= 3 && x <= 6 && z >= 5 && z <= 8) put(x, D + 11, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
