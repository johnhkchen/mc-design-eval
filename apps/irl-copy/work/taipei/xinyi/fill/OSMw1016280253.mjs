import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280253.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280253.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 7, H = 33, D = 21;
const TOP = 21;          // roof deck level (about 21 blocks above lowest ground)
const STOREY = 5;        // 4 storeys of 5 blocks

// footprint: cell key -> ground level (clamped below the roof)
const G = new Map();
for (const [x, z, gr] of cells) {
  G.set(`${x},${z}`, Math.max(0, Math.min(TOP - 1, Math.round(gr ?? 0))));
}
const has = (x, z) => G.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// exposed faces of a perimeter cell; long (west/east) faces take priority
function face(x, z) {
  const ex = [];
  if (!has(x - 1, z)) ex.push("west");
  if (!has(x + 1, z)) ex.push("east");
  if (!has(x, z - 1)) ex.push("north");
  if (!has(x, z + 1)) ex.push("south");
  if (ex.length === 0) return null;
  const dir = ex.find(d => d === "west" || d === "east") ?? ex[0];
  return { dir, corner: ex.length > 1 };
}

const paneProps = dir => (dir === "west" || dir === "east")
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const inward = (dir, x, z) => {
  switch (dir) {
    case "west": return [x + 1, z];
    case "east": return [x - 1, z];
    case "north": return [x, z + 1];
    case "south": return [x, z - 1];
  }
};

const lights = [];

for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const f = face(x, z);

  // foundation under the cell, up to its ground
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");

  // ground-level course
  put(x, gr, z, "stone_bricks");

  for (let y = gr + 1; y < TOP; y++) {
    const r = y % STOREY;
    if (!f) {
      // interior: floor slab per storey, air elsewhere
      if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    const { dir, corner } = f;
    const idx = (dir === "west" || dir === "east") ? z : x;
    const pillar = corner || idx % 3 === 0;
    const groundFloor = gr < 5 && y < 5;

    if (groundFloor) {
      // shopfront with entrance on the west face at the middle of the long side
      const isEntrance = dir === "west" && x === 0 && z === 10 && gr <= 2 && y <= gr + 2;
      if (isEntrance) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", {
          facing: "west", half, hinge: "left", open: "false", powered: "false"
        });
      } else if (y === 4 || pillar) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "tinted_glass");
      }
      continue;
    }

    if (r === 0) {
      put(x, y, z, "white_concrete");                     // spandrel
    } else if (r === 4) {
      put(x, y, z, "light_gray_concrete");                // sill / ceiling band
    } else if (pillar) {
      put(x, y, z, "light_gray_concrete");                // frame
    } else {
      put(x, y, z, "glass_pane", paneProps(dir));         // window
      if (r === 2 && (x + y + z) % 3 === 0) {
        const [ix, iz] = inward(dir, x, z);
        if (has(ix, iz) && !face(ix, iz)) lights.push([ix, y, iz]);
      }
    }
  }

  // roof deck and parapet
  if (f) {
    put(x, TOP, z, "white_concrete");
    put(x, TOP + 1, z, "white_concrete");
  } else {
    put(x, TOP, z, "light_gray_concrete");
  }
}

// warm lights behind selected windows
for (const [x, y, z] of lights) put(x, y, z, "glowstone");

// roof plant room and antenna
for (let x = 2; x <= 4; x++) {
  for (let z = 7; z <= 13; z++) {
    if (!has(x, z)) continue;
    put(x, TOP + 1, z, "light_gray_concrete");
    put(x, TOP + 2, z, "light_gray_concrete");
    if (x === 3 || z === 7 || z === 13) put(x, TOP + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}
if (has(3, 10)) {
  for (let y = TOP + 3; y <= TOP + 5; y++) {
    put(3, y, 10, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
