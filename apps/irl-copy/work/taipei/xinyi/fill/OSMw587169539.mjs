import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587169539";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 33, D = 15;
const g = new Voxels([W, H, D]);

// Record: 4 storeys of 5 blocks, roof at y 20, parapet to 21, 1990s-2000s
// office block: light grey concrete frame, bronze-blue glass, lit offices.
const ROOF_Y = 20;
const TOP_Y = 21;

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.round(gr));
const inside = (x, z) => ground.has(`${x},${z}`);
const out = (x, z, dx, dz) => !inside(x + dx, z + dz);
const isPerim = (x, z) =>
  inside(x, z) && (out(x, z, 1, 0) || out(x, z, -1, 0) || out(x, z, 0, 1) || out(x, z, 0, -1));
const exteriorCount = (x, z) =>
  [out(x, z, 1, 0), out(x, z, -1, 0), out(x, z, 0, 1), out(x, z, 0, -1)].filter(Boolean).length;

// Which facade a perimeter cell belongs to: N/S walls run along x, W/E along z.
function faceOf(x, z) {
  if (out(x, z, 0, -1)) return "N";
  if (out(x, z, 0, 1)) return "S";
  if (out(x, z, -1, 0)) return "W";
  return "E";
}

function paneProps(face) {
  if (face === "N" || face === "S")
    return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

const inwardOf = {
  N: [0, 1],
  S: [0, -1],
  W: [1, 0],
  E: [-1, 0],
};

// 1. Foundations, floors, facade, roof
for (const [x, z, gr] of cells) {
  const G = ground.get(`${x},${z}`);
  for (let y = 0; y < G; y++) g.set(x, y, z, "stone_bricks");

  const perim = isPerim(x, z);
  const cornerCount = exteriorCount(x, z);
  const face = perim ? faceOf(x, z) : null;
  const idx = face === "N" || face === "S" ? x : z;

  for (let y = G; y <= TOP_Y; y++) {
    if (y === TOP_Y) {
      if (perim) g.set(x, y, z, "light_gray_concrete"); // parapet
      continue;
    }
    if (y === ROOF_Y) {
      g.set(x, y, z, "smooth_stone"); // roof slab / cornice course
      continue;
    }
    if (y % 5 === 0) {
      // storey slab line
      g.set(x, y, z, perim ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!perim) continue; // interior air gap

    if (y % 5 === 4) {
      // spandrel panel under each window band
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // window band y%5 in {1,2,3}
    const ground_floor = y < 5;
    if (cornerCount >= 2 || idx % 3 === 0) {
      g.set(x, y, z, ground_floor ? "polished_andesite" : "light_gray_concrete");
    } else {
      const glassBlock = ground_floor ? "light_blue_stained_glass_pane" : "gray_stained_glass_pane";
      g.set(x, y, z, glassBlock, paneProps(face));
    }
  }
}

// 2. Penthouse / roof plant on interior cells
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (x >= 6 && x <= 10 && z >= 4 && z <= 10 && inside(x, z) && !isPerim(x, z)) {
    g.set(x, TOP_Y, z, "light_gray_concrete");
    g.set(x, TOP_Y + 1, z, "light_gray_concrete");
    g.set(x, TOP_Y + 2, z, "smooth_stone");
  }
}

// 3. Warm lights behind some windows
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const [ix, iz] = [x + inwardOf[face][0], z + inwardOf[face][1]];
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  const idx = face === "N" || face === "S" ? x : z;
  if (exteriorCount(x, z) >= 2 || idx % 3 === 0) continue;
  for (let y = 1; y <= 3; y++) {
    if (y >= 5) continue;
    if ((x * 7 + y * 3 + z * 5) % 9 === 0) {
      g.set(ix, y + 5 * Math.floor(y / 5), iz, "glowstone");
    }
  }
}

// Also lit offices on upper storeys
for (const [x, z] of cells.map(([a, b]) => [a, b])) {
  if (!isPerim(x, z)) continue;
  const face = faceOf(x, z);
  const [ix, iz] = [x + inwardOf[face][0], z + inwardOf[face][1]];
  if (!inside(ix, iz) || isPerim(ix, iz)) continue;
  const idx = face === "N" || face === "S" ? x : z;
  if (exteriorCount(x, z) >= 2 || idx % 3 === 0) continue;
  for (const base of [5, 10, 15]) {
    const y = base + 2;
    if ((x * 5 + base + z * 3) % 7 === 0) g.set(ix, y, iz, "shroomlight");
  }
}

// 4. Entrance on the south (front) facade, with lantern inside
const southCells = cells
  .filter(([x, z]) => isPerim(x, z) && out(x, z, 0, 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
if (southCells.length) {
  const doorX = southCells[Math.floor(southCells.length / 2)];
  const doorZ = Math.max(...cells.filter(([x]) => x === doorX).map(([, z]) => z));
  const G = ground.get(`${doorX},${doorZ}`);
  if (G + 1 <= 4) {
    g.set(doorX, G, doorZ, "dark_oak_door", {
      facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
    });
    g.set(doorX, G + 1, doorZ, "dark_oak_door", {
      facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
    });
    // Lintel and lantern in the lobby behind the door
    g.set(doorX, G + 2, doorZ, "light_gray_concrete");
    const lz = doorZ - 1;
    if (inside(doorX, lz) && !isPerim(doorX, lz)) {
      g.set(doorX, G + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
