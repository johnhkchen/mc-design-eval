import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw764466768";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 12 x 22; roof about 26 blocks above lowest ground.
// Read as a five-storey, 1990s-2000s Taipei mid-rise office/retail block:
// white tiled-concrete frame, blue-tinted curtain glazing in bays,
// a stone plinth, a light-grey roof deck and a rooftop plant box.
const W = 12, D = 22, H = 38;
const ROOF = 25;   // roof deck (interior) and cornice course (perimeter)
const PARAPET = 26;
const FLOOR = 5;   // storey height in blocks

const g = new Voxels([W, H, D]);

const groundMap = new Map();
for (const [x, z, gr] of cells) groundMap.set(`${x},${z}`, gr);

const put = (x, y, z, block, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = x === 0 || x === W - 1 || z === 0 || z === D - 1;

  for (let y = gr; y <= PARAPET; y++) {
    if (y === PARAPET) {
      if (edge) put(x, y, z, "white_concrete");
      continue;
    }
    if (y === ROOF) {
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }

    const k = Math.floor(y / FLOOR);
    const b = k * FLOOR;
    const r = y - b;

    if (!edge) {
      // Interior: just a floor slab per storey, air elsewhere (no interiors).
      if (r === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Facade
    const onXFace = x === 0 || x === W - 1;
    const idx = onXFace ? z : x;
    const len = onXFace ? D : W;
    const pier = idx % 3 === 0 || idx === len - 1;
    const bay = idx % 3;

    if (r === 0) {
      // Storey line / belt course (plinth at ground floor)
      put(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");
      continue;
    }
    if (r === 4) {
      put(x, y, z, "light_gray_concrete"); // spandrel
      continue;
    }

    // Ground floor: single entrance on the z=0 face.
    if (k === 0 && z === 0 && idx === 5) {
      if (r === 1) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 2) {
        put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (r === 3) {
        put(x, y, z, "white_concrete"); // lintel over door
        continue;
      }
    }

    if (pier) {
      put(x, y, z, "white_concrete");
      continue;
    }

    // Window bay: glass pane, with a warm light behind some panes.
    put(x, y, z, "cyan_stained_glass_pane");
    if (r === 2 && bay === 1 && (idx + k) % 4 === 0) {
      let xi = x, zi = z;
      if (x === 0) xi = 2;
      else if (x === W - 1) xi = W - 3;
      else if (z === 0) zi = 2;
      else if (z === D - 1) zi = D - 3;
      put(xi, y, zi, "glowstone");
    }
  }
}

// Rooftop plant box on the roof deck (sits on y=25 deck).
for (let x = 3; x <= 8; x++) {
  for (let z = 7; z <= 14; z++) {
    if (!groundMap.has(`${x},${z}`)) continue;
    put(x, 26, z, "light_gray_concrete");
    put(x, 27, z, "light_gray_concrete");
  }
}
// Roof vent caps and a lightning rod on the plant.
for (let x = 4; x <= 7; x += 3) {
  for (let z = 8; z <= 13; z += 5) {
    put(x, 28, z, "iron_block");
  }
}
put(5, 28, 10, "lightning_rod", { facing: "up", powered: "false" });

g.save(`${DIR}/${ID}.nbt`);
