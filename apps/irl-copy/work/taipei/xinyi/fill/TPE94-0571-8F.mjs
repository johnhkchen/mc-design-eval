import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE94-0571-8F";
const W = 19, H = 52, D = 27;
const STOREY = 5;
const STOREYS = 8;
const SETBACK_FROM = 6; // storeys 6 and 7 are stepped in by 2 blocks

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const gAt = (x, z) => ground.get(`${x},${z}`);
const fp = (x, z) => ground.has(`${x},${z}`);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Body of storey i: full footprint below the setback, inset by 2 blocks above it.
const body = (x, z, i) =>
  fp(x, z) && (i < SETBACK_FROM || (x >= 2 && x <= W - 3 && z >= 2 && z <= D - 3));
const perim = (x, z, i) =>
  body(x, z, i) && DIRS.some(([dx, dz]) => !body(x + dx, z + dz, i));
const missingX = (x, z, i) => !body(x - 1, z, i) || !body(x + 1, z, i);
const missingZ = (x, z, i) => !body(x, z - 1, i) || !body(x, z + 1, i);
const cornerCell = (x, z, i) => missingX(x, z, i) && missingZ(x, z, i);
const along = (x, z, i) => (missingX(x, z, i) ? z : x); // position along the face
const isPier = (x, z, i) =>
  perim(x, z, i) && (cornerCell(x, z, i) || along(x, z, i) % 3 === 0);

// Safe setter: ignores anything outside the volume.
const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// 1. Foundation: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");
}

// 2. Storeys: slab, three glass rows, spandrel band; piers every 3 blocks.
for (let i = 0; i < STOREYS; i++) {
  for (const [x, z, gr] of cells) {
    const s = gr + STOREY * i;

    // Terrace deck under the setback, over the whole footprint.
    if (i === SETBACK_FROM) put(x, s, z, "light_gray_concrete");

    if (!body(x, z, i)) continue;
    const per = perim(x, z, i);

    if (i !== SETBACK_FROM) {
      const slab = i === 0 && per ? "polished_granite" : "light_gray_concrete";
      put(x, s, z, slab);
    }

    if (!per) continue;

    const pier = isPier(x, z, i);
    const entrance = i === 0 && z === 0 && x === 9;

    if (entrance) {
      // Door occupies y s+1..s+2 (placed below); portal lintel is granite.
      put(x, s + 3, z, "polished_granite");
      put(x, s + 4, z, "white_concrete");
    } else if (i === 0 && z === 0 && x >= 7 && x <= 11) {
      // Lobby: glass flanked by the portal lintel at the top.
      for (let k = 1; k <= 2; k++) put(x, s + k, z, "light_blue_stained_glass");
      put(x, s + 3, z, "polished_granite");
      put(x, s + 4, z, "white_concrete");
    } else {
      for (let k = 1; k <= 3; k++) {
        put(x, s + k, z, pier ? "quartz_block" : "light_blue_stained_glass");
      }
      put(x, s + 4, z, pier ? "quartz_block" : "light_gray_concrete");
    }

    // Warm light just inside selected front-face windows.
    if (z === 0 && i < SETBACK_FROM && i % 2 === 0 && x % 6 === 2 && x > 0 && x < W - 1 &&
        !pier && fp(x, 1) && body(x, 1, i)) {
      put(x, s + 2, 1, "glowstone");
    }
  }
}

// 3. Entrance door on the front (z = 0) face, centred at x = 9.
if (fp(9, 0)) {
  const gr = gAt(9, 0);
  put(9, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(9, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lanterns inside either side of the door, so the entrance reads at dusk.
  for (const lx of [8, 10]) {
    if (fp(lx, 1)) put(lx, gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 4. Terrace railings on the outer edge of the setback terrace.
for (const [x, z, gr] of cells) {
  if (body(x, z, SETBACK_FROM)) continue;
  const edge = DIRS.some(([dx, dz]) => !fp(x + dx, z + dz));
  if (edge) put(x, gr + SETBACK_FROM * STOREY + 1, z, "iron_bars");
}

// 5. Roof: deck, parapet with coping, machinery box, corner crowns.
for (const [x, z, gr] of cells) {
  if (!body(x, z, STOREYS - 1)) continue;
  const r = gr + STOREY * STOREYS; // roof deck level
  if (perim(x, z, STOREYS - 1)) {
    put(x, r, z, "white_concrete");
    put(x, r + 1, z, "white_concrete");
    put(x, r + 2, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, r, z, "light_gray_concrete");
  }
}

// Rooftop plant box, set in the middle of the roof.
for (let x = 7; x <= 11; x++) {
  for (let z = 10; z <= 16; z++) {
    if (!fp(x, z)) continue;
    const r = gAt(x, z) + STOREY * STOREYS;
    put(x, r + 1, z, "light_gray_concrete");
    put(x, r + 2, z, "light_gray_concrete");
    put(x, r + 3, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Corner crowns: quartz pillars with a glowstone cap.
for (const [cx, cz] of [[2, 2], [W - 3, 2], [2, D - 3], [W - 3, D - 3]]) {
  if (!fp(cx, cz)) continue;
  const r = gAt(cx, cz) + STOREY * STOREYS;
  put(cx, r + 3, cz, "quartz_pillar", { axis: "y" });
  put(cx, r + 4, cz, "quartz_pillar", { axis: "y" });
  put(cx, r + 5, cz, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
