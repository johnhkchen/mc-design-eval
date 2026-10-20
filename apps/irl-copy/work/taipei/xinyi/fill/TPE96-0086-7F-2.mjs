import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE96-0086-7F-2: 2007 Xinyi commercial office, 7 storeys x 5 blocks (roof slab y=35),
// pale-grey concrete frame with blue-tinted curtain wall, spandrel bands, stepped parapet,
// rooftop plant house and a short mast. Entrances on both long faces (z=0 and z=6).

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE96-0086-7F-2";
const W = 42, H = 47, D = 7;
const STOREY = 5;
const STOREYS = 7;
const ROOF_Y = STOREY * STOREYS; // 35

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const foot = new Map();
for (const [x, z, gr] of cells) {
  foot.set(`${x},${z}`, Math.max(0, Math.min(20, Math.round(gr))));
}
const has = (x, z) => foot.has(`${x},${z}`);
const groundAt = (x, z) => foot.get(`${x},${z}`);

const g = new Voxels([W, H, D]);

// Place a block only inside the box and on footprint cells.
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter cell: any side neighbour missing from the footprint.
const edge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Mullion positions: every 3rd column on the long faces (z=0, z=6),
// centre and corners on the short faces (x=0, x=41).
const mullion = (x, z) => {
  if (x === 0 || x === 41) return z === 0 || z === 3 || z === 6;
  return x % 3 === 0 && (z === 0 || z === 6);
};

const GLASS = "light_blue_stained_glass";
const FRAME = "polished_andesite";
const SLAB = "light_gray_concrete";
const SPANDREL = "white_concrete";
const BASE = "polished_granite";

// 1. Foundations, floor slabs, facade bands and glazing per cell.
for (const [x, z, gr] of cells.map(([cx, cz]) => [cx, cz, groundAt(cx, cz)])) {
  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr && y < H; y++) put(x, y, z, "minecraft:stone");

  // Floor slabs at each storey line (sit on the foundation where ground is higher).
  for (let k = 0; k < STOREYS; k++) {
    const base = k * STOREY;
    if (base >= gr) put(x, base, z, `minecraft:${SLAB}`);
  }
  // Roof slab.
  if (ROOF_Y >= gr) put(x, ROOF_Y, z, `minecraft:${SLAB}`);

  // Facade on perimeter cells only.
  if (edge(x, z)) {
    for (let k = 0; k < STOREYS; k++) {
      const base = k * STOREY;
      for (let y = base + 1; y <= base + 4; y++) {
        if (y < gr) continue;
        if (k === 0 && y === 1) {
          put(x, y, z, `minecraft:${BASE}`); // ground-floor plinth
        } else if (y === base + 4) {
          put(x, y, z, `minecraft:${SPANDREL}`); // spandrel band at storey line
        } else if (mullion(x, z)) {
          put(x, y, z, `minecraft:${FRAME}`);
        } else {
          put(x, y, z, `minecraft:${GLASS}`);
        }
      }
    }
    // Stepped parapet: cornice then parapet cap.
    put(x, ROOF_Y + 1, z, `minecraft:${SLAB}`);
    put(x, ROOF_Y + 2, z, `minecraft:${SPANDREL}`);
  }
}

// 2. Interior warm lights behind the street-side glass, standing on the floor slab.
for (const k of [1, 3, 5]) {
  const base = k * STOREY;
  for (let x = 3; x < W - 1; x += 6) {
    if (has(x, 1) && base + 1 >= groundAt(x, 1)) {
      put(x, base + 1, 1, "minecraft:shroomlight");
    }
  }
}
// Ground-floor lantern glow behind the shopfront, on both long faces.
for (let x = 3; x < W - 1; x += 6) {
  if (has(x, 1) && 1 >= groundAt(x, 1) && x !== 21) {
    put(x, 1, 1, "minecraft:glowstone");
  }
}
if (has(21, 1) && 1 >= groundAt(21, 1)) {
  put(21, 1, 1, "minecraft:glowstone");
}
if (has(21, 5) && 1 >= groundAt(21, 5)) {
  put(21, 1, 5, "minecraft:glowstone");
}

// 3. Entrances on both long faces: glass, double iron doors, quartz columns, granite canopy.
// face z=0 faces north, face z=6 faces south; `out` is the outward z, `in` the depth direction.
const entrance = (zFace, dir, facing) => {
  const step = zFace === 0 ? 1 : -1; // direction from the face into the building
  const zs = [0, 1, 2].map((d) => zFace + d * step);

  // Glass across the opening.
  for (let x = 19; x <= 22; x++) {
    for (let y = 1; y <= 3; y++) put(x, y, zFace, "minecraft:" + GLASS);
  }
  // Quartz columns flanking the opening.
  for (const x of [18, 23]) {
    for (let y = 1; y <= 3; y++) put(x, y, zFace, "minecraft:quartz_pillar");
  }
  // Granite canopy, cantilevered from the face over the entrance.
  for (let x = 18; x <= 23; x++) {
    for (const z of zs) put(x, 4, z, `minecraft:${BASE}`);
  }
  // Double iron doors.
  const doorProps = (hinge, half) => ({
    facing,
    half,
    hinge,
    open: "false",
    powered: "false",
  });
  put(20, 1, zFace, "minecraft:iron_door", doorProps("left", "lower"));
  put(20, 2, zFace, "minecraft:iron_door", doorProps("left", "upper"));
  put(21, 1, zFace, "minecraft:iron_door", doorProps("right", "lower"));
  put(21, 2, zFace, "minecraft:iron_door", doorProps("right", "upper"));
};
entrance(0, 1, "north");
entrance(6, -1, "south");

// 4. Rooftop plant house: x 13..28, z 2..4, floor at y36, ring walls y37-38, ceiling y39, roof y40.
const PX0 = 13, PX1 = 28, PZ0 = 2, PZ1 = 4;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    put(x, ROOF_Y + 1, z, `minecraft:${SLAB}`);
    put(x, ROOF_Y + 4, z, `minecraft:${SLAB}`);
    put(x, ROOF_Y + 5, z, `minecraft:${SLAB}`);
  }
}
for (let x = PX0; x <= PX1; x++) {
  for (const z of [PZ0, PZ1]) {
    for (const y of [ROOF_Y + 2, ROOF_Y + 3]) {
      if ((x - PX0) % 2 === 1) put(x, y, z, "minecraft:iron_bars");
      else put(x, y, z, `minecraft:${SPANDREL}`);
    }
  }
}
for (let z = PZ0; z <= PZ1; z++) {
  for (const x of [PX0, PX1]) {
    for (const y of [ROOF_Y + 2, ROOF_Y + 3]) {
      put(x, y, z, `minecraft:${SPANDREL}`);
    }
  }
}

// 5. Mast on the plant-house roof (y40), warm beacon at the top (below 47).
const MX = 20, MZ = 3;
for (let y = ROOF_Y + 6; y <= ROOF_Y + 10; y++) {
  put(MX, y, MZ, "minecraft:lightning_rod");
}
put(MX, ROOF_Y + 11, MZ, "minecraft:sea_lantern");

g.save(`${DIR}/${ID}.nbt`);
