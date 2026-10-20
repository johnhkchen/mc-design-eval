import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755110";
const W = 26, H = 23, D = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint and per-cell ground (third number, rounded to whole blocks).
const ground = new Map();
const key = (x, z) => `${x},${z}`;
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), Math.round(gr));
}
const has = (x, z) => ground.has(key(x, z));
const L = Math.min(...ground.values()); // lowest ground, normally 0

// Safe setter: ignores anything outside the volume.
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Perimeter: a footprint cell with any side open to air or outside the grid.
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const side = (x, z) => {
  if (z === D - 1) return "front";
  if (z === 0) return "back";
  if (x === 0) return "left";
  if (x === W - 1) return "right";
  return "inner";
};

// Pane connection states so panes join along the wall they sit in.
const paneAlongX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneAlongZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Facade logic. Era: late-1990s Xinyi office/commercial block.
// Pale quartz-tile piers, white spandrels, cyan tinted glass above a clear shopfront,
// dark-oak canopy over the entrance, a single parapet cornice on top.
function facadeBlock(x, y, z, gr, sd, u) {
  const yr = y - L;

  // Base course at street level.
  if (yr === 0) return { id: "stone_bricks" };

  // Entrance door on the front face (centre bay).
  if (sd === "front" && x === 12 && (y - gr === 0 || y - gr === 1)) {
    return {
      id: "dark_oak_door",
      props: {
        facing: "south",
        half: y - gr === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      },
    };
  }

  // Ground-floor canopy band (front, over the entrance).
  if (sd === "front" && yr === 4 && x >= 9 && x <= 16) {
    return { id: "dark_oak_slab", props: { type: "bottom", waterlogged: "false" } };
  }

  // Spandrels at storey lines and the top cornice.
  if (yr === 4 || yr === 5) return { id: "white_concrete" };
  if (yr === 9) return { id: "smooth_quartz" };

  const ground1 = yr >= 1 && yr <= 3;   // shopfront band
  const upper = yr >= 6 && yr <= 8;     // second-storey band

  if (ground1 || upper) {
    const pier = sd === "front" || sd === "back"
      ? (ground1 && sd === "front" ? u % 6 === 0 : u % 3 === 0)
      : u % 3 === 0;
    if (pier) return { id: "smooth_quartz" };
    const alongX = sd === "front" || sd === "back" || sd === "inner";
    const clear = ground1; // shopfront glass is clear, office glass is tinted
    return {
      id: clear ? "glass_pane" : "cyan_stained_glass_pane",
      props: alongX ? paneAlongX : paneAlongZ,
    };
  }

  return { id: "white_concrete" };
}

// Build each footprint cell.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const deckY = Math.max(L + 10, gr);       // roof deck: 10 above lowest ground
  const perim = isPerim(x, z);
  const sd = side(x, z);
  const u = sd === "front" || sd === "back" ? x : sd === "left" || sd === "right" ? z : x + z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Walls on the perimeter only; interior stays air behind the glass.
  if (perim) {
    for (let y = gr; y < deckY; y++) {
      const b = facadeBlock(x, y, z, gr, sd, u);
      put(x, y, z, b.id, b.props);
    }
  }

  // Floor slab for the second storey across the interior.
  if (!perim && L + 5 >= gr && L + 5 < deckY) {
    put(x, L + 5, z, "smooth_stone");
  }

  // Roof deck at the top of the storeys.
  put(x, deckY, z, "smooth_stone");

  // Parapet with cornice cap on the perimeter.
  if (perim) {
    put(x, deckY + 1, z, "smooth_quartz");
  }
}

// Warm lights behind the glass on the front (street) face.
for (let u = 0; u < W; u++) {
  const x = u;
  const z = D - 2;
  if (!has(x, z) || isPerim(x, z)) continue;
  const gr = ground.get(key(x, z));
  // Shopfront light: a lantern standing on the floor behind the clear glass.
  if (u % 6 === 4 && gr <= L + 3) {
    put(x, gr, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
  // Upper-storey glowstone behind tinted glass, on the storey slab.
  if (u % 6 === 2 && L + 5 >= gr) {
    put(x, L + 6, z, "glowstone");
  }
}

// Rooftop air-conditioning plant, set back from the parapet.
for (let x = 4; x <= 6; x++) {
  for (let z = 3; z <= 4; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const gr = ground.get(key(x, z));
    const deckY = Math.max(L + 10, gr);
    put(x, deckY + 1, z, "light_gray_concrete");
    put(x, deckY + 2, z, "light_gray_concrete");
  }
}
for (let x = 18; x <= 20; x++) {
  for (let z = 6; z <= 7; z++) {
    if (!has(x, z) || isPerim(x, z)) continue;
    const gr = ground.get(key(x, z));
    const deckY = Math.max(L + 10, gr);
    put(x, deckY + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
