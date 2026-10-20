import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1241583929";
const W = 18, H = 23, D = 16;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and datums
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const xz = cells.map(([x, z]) => [x, z]);
const L = Math.min(...cells.map(c => c[2]));
const B = Math.max(...cells.map(c => c[2]));   // common floor datum on the uphill side
const ROOF_TARGET = L + 11;                     // roof about 11 blocks above lowest ground

// Two storeys of 4-5 blocks each, roof deck on top of the second
const h = Math.max(4, Math.min(5, Math.floor((ROOF_TARGET - 1 - B) / 2)));
const roofY = B + 2 * h;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) {
    throw new Error(`out of bounds ${x},${y},${z}`);
  }
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward faces a footprint cell exposes
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push("N");
  if (!has(x, z + 1)) f.push("S");
  if (!has(x - 1, z)) f.push("W");
  if (!has(x + 1, z)) f.push("E");
  return f;
};
const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };

// Main entrance: centre of the south-only wall cells
const southOnly = xz
  .filter(([x, z]) => { const f = faces(x, z); return f.length === 1 && f[0] === "S"; })
  .sort((a, b) => a[0] - b[0]);
const door = southOnly.length ? southOnly[Math.floor(southOnly.length / 2)] : null;
const isDoor = (x, z) => door !== null && door[0] === x && door[1] === z;

const paneProps = (face) =>
  (face === "N" || face === "S")
    ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundation and plinth: solid from y 0 up to the common datum
for (const [x, z] of xz) {
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");
}

// 2. Storeys: floor slab row at each base, walls above, glazing and warm light
for (const [x, z] of xz) {
  const f = faces(x, z);
  const perim = f.length > 0;
  const corner = f.length >= 2;
  const face = f.length === 1 ? f[0] : null;
  const idx = (face === "N" || face === "S") ? x : z;

  for (let s = 0; s < 2; s++) {
    const base = B + s * h;
    for (let y = base; y < base + h; y++) {
      // floor / string course row
      if (y === base) {
        if (perim) put(x, y, z, s === 0 ? "stone_bricks" : "smooth_quartz");
        else put(x, y, z, "smooth_stone");
        continue;
      }
      if (!perim) continue; // interior air
      if (corner) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; }

      const top = y === base + h - 1;

      if (s === 0) {
        if (isDoor(x, z) && (y === base + 1 || y === base + 2)) {
          const props = { facing: "south", hinge: "left", open: "false", powered: "false" };
          put(x, y, z, "dark_oak_door", { ...props, half: y === base + 1 ? "lower" : "upper" });
        } else if (top) {
          put(x, y, z, "red_concrete"); // red fascia over the shopfront
        } else {
          put(x, y, z, "glass"); // shopfront glazing
        }
      } else {
        if (top) {
          put(x, y, z, "smooth_quartz");
        } else if (idx % 2 === 1) {
          put(x, y, z, "glass_pane", paneProps(face));
        } else {
          put(x, y, z, "quartz_block");
        }
      }

      // warm light one cell behind some glazing
      const lit = s === 0 ? (idx % 3 === 2) : (idx % 4 === 1);
      const glazed = (s === 0 ? !top && !isDoor(x, z) : (!top && idx % 2 === 1));
      if (face && lit && glazed && y === base + 2) {
        const ix = x + IN[face][0], iz = z + IN[face][1];
        if (has(ix, iz) && faces(ix, iz).length === 0) {
          put(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// 3. Roof deck, parapet and coping
for (const [x, z] of xz) {
  const perim = faces(x, z).length > 0;
  put(x, roofY, z, perim ? "smooth_quartz" : "stone_bricks");
  if (perim) {
    put(x, roofY + 1, z, "quartz_block");
    put(x, roofY + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 4. Small mechanical penthouse near the middle of the roof
const cx = Math.round(xz.reduce((a, c) => a + c[0], 0) / xz.length);
const cz = Math.round(xz.reduce((a, c) => a + c[1], 0) / xz.length);
for (const [x, z] of xz) {
  const perim = faces(x, z).length > 0;
  if (perim || Math.abs(x - cx) > 2 || Math.abs(z - cz) > 2) continue;
  put(x, roofY + 1, z, "light_gray_concrete");
  put(x, roofY + 2, z, "light_gray_concrete");
  put(x, roofY + 3, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
