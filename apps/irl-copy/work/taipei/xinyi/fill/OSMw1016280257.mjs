import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280257";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 8, H = 33, D = 21;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const base = Math.max(...cells.map((c) => c[2])); // ground floor sits on the highest ground
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

// Bounds-guarded setter
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Which outward face a cell presents (null = interior)
function faceOf(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

// Along-facade index and facade length
function alongOf(face, x, z) {
  if (face === "north" || face === "south") return { a: x - minX, L: maxX - minX + 1 };
  return { a: z - minZ, L: maxZ - minZ + 1 };
}

const isPier = (a, L) => a === 0 || a === L - 1 || a % 4 === 0;

// Cell directly inside the building from a facade cell
function inwardOf(face, x, z) {
  if (face === "north") return [x, z + 1];
  if (face === "south") return [x, z - 1];
  if (face === "west") return [x + 1, z];
  return [x - 1, z];
}

const paneProps = (face) =>
  face === "north" || face === "south"
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorProps = (half) => ({
  facing: "north",
  half,
  hinge: "left",
  open: "false",
  powered: "false",
});

// ---- Foundation, floors, roof deck ----
for (const [x, z] of cells) {
  const face = faceOf(x, z);
  for (let y = 0; y < base; y++) put(x, y, z, "stone_bricks");

  // Floor slabs: base course at ground, interior floors each storey, roof deck on top
  for (let k = 0; k <= 4; k++) {
    const f = base + 5 * k;
    if (k === 0) put(x, f, z, face ? "stone_bricks" : "smooth_stone");
    else if (k === 4) put(x, f, z, "light_gray_concrete");
    else if (face) {
      const { a, L } = alongOf(face, x, z);
      put(x, f, z, isPier(a, L) ? "white_concrete" : "light_gray_concrete");
    } else put(x, f, z, "smooth_stone");
  }

  if (!face) continue;

  // ---- Facade articulation ----
  const { a, L } = alongOf(face, x, z);
  const pier = isPier(a, L);

  for (let k = 0; k <= 3; k++) {
    const f = base + 5 * k;

    if (k === 0) {
      // Shopfront: glass with white piers, entrance door on the street face
      for (let dy = 1; dy <= 3; dy++) {
        if (pier) put(x, f + dy, z, "white_concrete");
        else put(x, f + dy, z, "glass");
      }
      if (face === "north" && a === 3 && !pier) {
        put(x, f + 1, z, "dark_oak_door", doorProps("lower"));
        put(x, f + 2, z, "dark_oak_door", doorProps("upper"));
        put(x, f + 3, z, "glass");
      }
      // Fascia band over the shopfront
      put(x, f + 4, z, pier ? "white_concrete" : "dark_oak_slab", pier ? undefined : { type: "top", waterlogged: "false" });
    } else {
      // Upper storeys: framed pane windows between white piers
      for (let dy = 1; dy <= 3; dy++) {
        if (pier) put(x, f + dy, z, "white_concrete");
        else put(x, f + dy, z, "glass_pane", paneProps(face));
      }
      // Spandrel band at the storey line
      put(x, f + 4, z, "light_gray_concrete");
    }

    // Warm light behind selected windows
    if (!pier && k >= 1) {
      const [ix, iz] = inwardOf(face, x, z);
      if (has(ix, iz)) {
        if (k % 2 === 1 && a === 2) put(ix, f + 2, iz, "glowstone");
        if (k === 2 && a === 5) put(ix, f + 2, iz, "shroomlight");
      }
    }
  }

  // Parapet and cornice cap
  put(x, base + 21, z, "white_concrete");
  put(x, base + 22, z, "white_concrete");
  put(x, base + 23, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}

// ---- Roof-top water tank on the deck (interior cells only) ----
for (const [x, z] of cells) {
  if (faceOf(x, z)) continue;
  if (x >= minX + 2 && x <= minX + 3 && z >= minZ + 3 && z <= minZ + 4) {
    put(x, base + 21, z, "iron_block");
    put(x, base + 22, z, "iron_block");
    put(x, base + 23, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
