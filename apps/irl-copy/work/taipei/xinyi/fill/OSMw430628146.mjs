import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 光復市場 (Guangfu Market), Xinyi, Taipei.
// Read from the lidar record: roof about 11 blocks above the lowest ground.
// Era: 1960s-70s reinforced-concrete market hall, two storeys, pale tiled
// render, red trim, shopfronts on the street, open flat roof with plant boxes.
const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw430628146";
const cells = JSON.parse(readFileSync(`${SRC}.cells.json`, "utf8"));

const W = 33, H = 23, D = 39;
const g = new Voxels([W, H, D]);

const ROOF_Y = 10;      // roof slab; top surface at 11 blocks = lidar roof height
const FIRST_FLOOR_TOP = 4;
const SECOND_FLOOR = 5; // floor slab between storeys

const BASE = "stone_bricks";
const FLOOR = "light_gray_concrete";
const ROOF = "light_gray_concrete";
const ROOF_EDGE = "smooth_stone";
const WALL = "smooth_quartz";
const PIER = "white_concrete";
const TRIM = "red_terracotta";
const PARAPET = "smooth_quartz";
const GLASS = "glass_pane";
const EQUIP = "light_gray_concrete";
const EQUIP_TOP = "gray_concrete";

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const inF = (x, z) => ground.has(key(x, z));
const gnd = (x, z) => ground.get(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const DIRS = {
  north: [0, -1],
  south: [0, 1],
  west: [-1, 0],
  east: [1, 0],
};

function exposedFaces(x, z) {
  return Object.keys(DIRS).filter(f => {
    const [dx, dz] = DIRS[f];
    return !inF(x + dx, z + dz);
  });
}

// Entrance portal: a centred door with red pilasters either side and a
// red lintel across the top of the shopfront band.
function facade(x, z, face, y, G) {
  const single = G >= 4;
  const along = (face === "north" || face === "south") ? x : z;
  const pier = along % 3 === 0;
  const gTop = single ? 9 : FIRST_FLOOR_TOP;
  const portalCol = along % 9;            // 3 | 4 | 5 form the portal
  const inPortal = G <= 2 && portalCol >= 3 && portalCol <= 5;
  const doorCol = portalCol === 4;

  if (y === 9) return { b: TRIM };
  if (!single) {
    if (y === 5) return { b: TRIM };
    if (y >= 6) {
      if (y === 6) return { b: WALL };
      return { b: pier ? PIER : GLASS };
    }
  }
  // Ground storey (or the only storey)
  if (inPortal) {
    if (y === G + 1 || y === G + 2) {
      if (doorCol) {
        return {
          b: "oak_door",
          p: {
            facing: face,
            half: y === G + 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          },
        };
      }
      return { b: TRIM };                 // pilasters flanking the door
    }
    if (y === G + 3 && G + 3 <= gTop) return { b: TRIM }; // portal lintel
  }
  if (y === G + 1) return { b: BASE };
  if (y === gTop) return { b: TRIM };
  if (pier) return { b: PIER };
  return { b: GLASS };
}

// Pass 1: foundation, floor slabs and roof for every footprint cell.
for (const [x, z, gr] of cells) {
  const G = gr;
  for (let y = 0; y < G; y++) put(x, y, z, BASE);
  put(x, G, z, FLOOR);
  if (G < 4) put(x, SECOND_FLOOR, z, FLOOR);
  const roofY = Math.max(ROOF_Y, G + 1);
  put(x, roofY, z, ROOF);
}

// Pass 2: perimeter envelope (the wall column is the perimeter cell itself).
const perimeter = new Map();
for (const [x, z, gr] of cells) {
  const faces = exposedFaces(x, z);
  if (faces.length === 0) continue;
  const face = faces[0];
  perimeter.set(key(x, z), face);
  const G = gr;
  const roofY = Math.max(ROOF_Y, G + 1);
  for (let y = G + 1; y <= 9 && y < roofY; y++) {
    const f = facade(x, z, face, y, G);
    put(x, y, z, f.b, f.p);
  }
  // Parapet: red caps alternate with pale coping, lighter than before.
  const along = (face === "north" || face === "south") ? x : z;
  put(x, roofY + 1, z, along % 2 === 0 ? TRIM : PARAPET);
}

// Pass 3: warm lights set just inside the glass (interior cells only).
for (const [x, z, gr] of cells) {
  const face = perimeter.get(key(x, z));
  if (!face) continue;
  const [dx, dz] = DIRS[face];
  const ix = x - dx, iz = z - dz;
  if (!inF(ix, iz) || perimeter.has(key(ix, iz))) continue;
  const along = (face === "north" || face === "south") ? x : z;
  const G = gr;
  const single = G >= 4;
  if (along % 6 === 1) {
    if (single || G + 2 <= 3) {
      put(ix, G + 2, iz, "glowstone");
    }
  }
  if (!single && along % 6 === 4) {
    put(ix, 7, iz, "shroomlight");
  }
}

// Pass 4: roof plant and stair-core boxes, with a lantern on top of each.
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z] of cells) {
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const boxes = [
  { x0: minX + 3, x1: minX + 7, z0: minZ + 5, z1: minZ + 9, top: 14 },
  { x0: maxX - 9, x1: maxX - 5, z0: maxZ - 13, z1: maxZ - 9, top: 13 },
];
for (const bx of boxes) {
  for (let x = bx.x0; x <= bx.x1; x++) {
    for (let z = bx.z0; z <= bx.z1; z++) {
      if (!inF(x, z)) continue;
      const roofY = Math.max(ROOF_Y, gnd(x, z) + 1);
      for (let y = roofY + 1; y <= bx.top - 1; y++) put(x, y, z, EQUIP);
      put(x, bx.top, z, EQUIP_TOP);
    }
  }
  const cx = Math.round((bx.x0 + bx.x1) / 2);
  const cz = Math.round((bx.z0 + bx.z1) / 2);
  if (inF(cx, cz)) put(cx, bx.top + 1, cz, "lantern");
}

g.save(`${SRC}.nbt`);
