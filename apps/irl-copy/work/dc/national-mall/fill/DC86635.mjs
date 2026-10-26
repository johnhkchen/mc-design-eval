import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86635";
const W = 18, H = 32, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Index footprint cells.
const cm = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 8, Math.round(gr)));
  cm.set(`${x},${z}`, { x, z, ground, rf: Number(rf) });
}
const has = (x, z) => cm.has(`${x},${z}`);
const isEdge = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const nearEdge = (x, z) => isEdge(x + 1, z) || isEdge(x - 1, z) || isEdge(x, z + 1) || isEdge(x, z - 1);

// Smooth the lidar roof: average over the 3x3 footprint neighbourhood, then snap to whole storeys.
const smoothTop = new Map();
for (const c of cm.values()) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = cm.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.rf; n++; }
  }
  const avgRoof = sum / n;
  let span = Math.round((avgRoof - c.ground) / 3) * 3;
  span = Math.max(6, Math.min(H - 6 - c.ground, span));
  smoothTop.set(`${c.x},${c.z}`, c.ground + span);
}

const GLASS = "light_blue_stained_glass_pane";
const FRAME = "white_concrete";
const WALL = "light_gray_concrete";
const STONE = "stone_bricks";
const FLOOR = "smooth_stone";
const ROOF = "stone";
const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const c of cm.values()) {
  const { x, z, ground } = c;
  const top = smoothTop.get(`${x},${z}`);
  const edge = isEdge(x, z);
  const corner = (x === 0 || x === 17) && (z === 0 || z === 17);
  const pier = corner || (x % 3 === 0 && (z === 0 || z === 17)) || (z % 3 === 0 && (x === 0 || x === 17));

  // Foundation up to grade.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  for (let y = ground; y < top; y++) {
    const rel = (y - ground) % 3;

    // Cornice / roof deck.
    if (y === top - 1) {
      g.set(x, y, z, edge ? STONE : ROOF);
      continue;
    }

    // Storey line: floor slab, base course at grade.
    if (rel === 0) {
      if (y === ground && edge) g.set(x, y, z, STONE);
      else g.set(x, y, z, edge ? WALL : FLOOR);
      continue;
    }

    if (edge) {
      if (pier) g.set(x, y, z, FRAME);
      else g.set(x, y, z, GLASS, paneProps);
      continue;
    }

    // Sparse warm lights in the air gap behind the glass.
    if (nearEdge(x, z) && rel === 1 && (x * 7 + z * 3 + y) % 13 === 0) {
      g.set(x, y, z, "glowstone");
    }
  }

  // Mechanical penthouse on the central roof.
  if (!edge && x >= 6 && x <= 11 && z >= 6 && z <= 11) {
    for (let y = top; y < top + 2 && y < H - 1; y++) {
      const ring = x === 6 || x === 11 || z === 6 || z === 11;
      if (ring) g.set(x, y, z, WALL);
    }
    if (top + 2 < H) g.set(x, top + 2, z, FLOOR);
  }
}

// Ground-floor entrance on the z=0 face: glazed vestibule, lintel, door.
const entry = cm.get("8,0");
if (entry) {
  const y0 = entry.ground;
  for (const x of [6, 10]) g.set(x, y0, 0, STONE);
  for (const x of [7, 9]) g.set(x, y0 + 1, 0, GLASS, paneProps);
  for (let x = 6; x <= 10; x++) g.set(x, y0 + 2, 0, STONE);
  g.set(8, y0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(8, y0 + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
