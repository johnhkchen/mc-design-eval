import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456557665";
const W = 22, H = 33, D = 18;
const ROOF = 21;            // parapet top, relative to lowest ground (lidar record)
const STOREYS = 4;          // ~5 blocks per storey, 1990s mid-rise office/commercial

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.cells;
const ground = new Map();
for (const [x, z, gy] of rows) ground.set(`${x},${z}`, gy);

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outward = (x, z) => Object.keys(DIRS).filter(n => !has(x + DIRS[n][0], z + DIRS[n][1]));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

// glass pane connected along the facade axis only
const paneProps = (alongX) => alongX
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundation, floor slabs, roof membrane
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
  for (const L of [0, 5, 10, 15]) put(x, gr + L, z, "smooth_stone");
  put(x, gr + 20, z, "gray_concrete");
}

// Entrance: centre of the north-facing facade (lowest z)
const northCells = [...ground.keys()].map(k => k.split(",").map(Number))
  .filter(([x, z]) => outward(x, z).includes("north"));
const doorT = northCells.length
  ? northCells.map(([x]) => x).sort((a, b) => a - b)[Math.floor(northCells.length / 2)]
  : -1;

// Pass 2: facade walls, bands, mullions, windows, entrance, interior lights
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (out.length === 0) continue;

  const corner = out.length >= 2;
  const alongX = out.includes("north") || out.includes("south");
  const t = alongX ? x : z;
  const single = out.length === 1 ? out[0] : null;
  const [dx, dz] = single ? DIRS[single] : [0, 0];

  for (let rel = 0; rel <= ROOF - 1; rel++) {
    const y = gr + rel;
    const band = rel % 5;

    if (rel === 0) { put(x, y, z, "polished_granite"); continue; }
    if (rel === 20) { put(x, y, z, "smooth_quartz"); continue; }
    if (band === 0) { put(x, y, z, "smooth_quartz"); continue; }   // storey lines
    if (band === 4) { put(x, y, z, "light_gray_concrete"); continue; } // spandrels

    // band 1..3: window zone
    if (corner) { put(x, y, z, "smooth_quartz"); continue; }

    // Entrance on the north facade, ground floor
    if (rel <= 4 && single === "north" && t === doorT) {
      if (rel === 1 || rel === 2) {
        put(x, y, z, "dark_oak_door", {
          facing: "north", half: rel === 1 ? "lower" : "upper",
          hinge: "left", open: "false", powered: "false"
        });
      } else if (rel === 3) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(true));
      }
      continue;
    }
    if (rel === 4 && single === "north" && Math.abs(t - doorT) <= 1) {
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); // canopy
      continue;
    }

    if (t % 3 === 0) { put(x, y, z, "smooth_quartz"); continue; } // mullions

    put(x, y, z, "light_blue_stained_glass_pane", paneProps(alongX));

    // warm light just inside some windows
    if (single && rel === 2) {
      const ix = x - dx, iz = z - dz;
      const storey = Math.floor(rel / 5);
      if (has(ix, iz) && outward(ix, iz).length === 0 && (t + storey) % 4 === 1) {
        put(ix, y, iz, "glowstone");
      }
    }
  }

  // Lantern just inside the entrance
  if (single === "north" && t === doorT) {
    const ix = x, iz = z + 1;
    if (has(ix, iz) && outward(ix, iz).length === 0) put(ix, gr + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: parapet on the perimeter
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z).length > 0) put(x, gr + ROOF, z, "white_concrete");
}

// Pass 4: roof plant and a central penthouse
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const inRect = x >= 7 && x <= 14 && z >= 6 && z <= 11;
  if (!inRect) continue;
  const edgeX = x === 7 || x === 14, edgeZ = z === 6 || z === 11;
  for (let rel = 0; rel <= 3; rel++) {
    const y = gr + ROOF + rel;
    if (rel === 0 || rel === 3) { put(x, y, z, "white_concrete"); continue; }
    if (edgeX || edgeZ) {
      if (edgeX && edgeZ) put(x, y, z, "smooth_quartz");
      else if ((x + z) % 2 === 0) put(x, y, z, "light_blue_stained_glass_pane", paneProps(edgeZ));
      else put(x, y, z, "white_concrete");
    }
  }
  put(x, gr + ROOF + 4, z, "gray_concrete");
}

// Mechanical units on the roof
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [17, 13], [18, 13], [17, 14]]) {
  if (!has(x, z)) continue;
  put(x, gr0(x, z) + ROOF, z, "light_gray_concrete");
  put(x, gr0(x, z) + ROOF + 1, z, "light_gray_concrete");
}
function gr0(x, z) { return gAt(x, z); }

// Antenna on the penthouse
const cx = 10, cz = 8;
if (has(cx, cz)) {
  const base = gAt(cx, cz) + ROOF + 5;
  for (let i = 0; i < 4; i++) put(cx, base + i, cz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
