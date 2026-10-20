import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833598";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Two-storey, mid-century Taipei shophouse-style block: stone base, white
// painted walls, quartz storey lines and cornice, red awning over a glazed
// shopfront, light-blue windows with light-grey mullions, a rooftop plant box.
const W = 12, H = 23, D = 18;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const perim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const ROOF_CAP = 11;   // parapet / cornice top block
const SLAB_1 = 5;      // storey line / floor 2 base
const SLAB_2 = 10;     // roof slab, under white cornice band

// Determine which face a perimeter cell sits on, and its along-face index.
function faceOf(x, z) {
  if (z === 0) return { face: "front", t: x };
  if (z === D - 1) return { face: "back", t: x };
  return { face: "side", t: z };
}

function wallBlock(x, y, z, gr) {
  const { face, t } = faceOf(x, z);
  const last = face === "side" ? D - 1 : W - 1;
  const post = t % 3 === 0 || t === last;

  if (y === gr) return { id: "smooth_stone" };                 // base course
  if (y === ROOF_CAP) return { id: "smooth_quartz" };          // cap
  if (y === SLAB_2) return { id: "white_concrete" };           // roof band
  if (y === SLAB_1) return { id: "smooth_quartz" };            // storey line

  if (y < SLAB_1) {
    // Ground floor (commercial)
    if (face === "front") {
      if (y === 4) return { id: "red_concrete" };              // awning band
      if (post) return { id: "light_gray_concrete" };
      return { id: "glass_pane" };                             // clear shopfront glass
    }
    if (y === 4) return { id: "white_concrete" };
    if (y === 1) return { id: "light_gray_concrete" };         // sill
    if (y === 2 || y === 3) {
      return post ? { id: "light_gray_concrete" } : { id: "light_blue_stained_glass_pane" };
    }
    return { id: "white_concrete" };
  }

  // Upper floor
  if (y === 6) return { id: "light_gray_concrete" };           // sill
  if (y === 9) return { id: "white_concrete" };                // lintel
  if (y === 7 || y === 8) {
    return post ? { id: "light_gray_concrete" } : { id: "light_blue_stained_glass_pane" };
  }
  return { id: "white_concrete" };
}

// Pass 1: foundation, base, walls, interior floors and slabs.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (perim(x, z)) {
    for (let y = gr; y <= ROOF_CAP; y++) {
      const b = wallBlock(x, y, z, gr);
      g.set(x, y, z, b.id);
    }
    // Front entrance: door centred on the street face, lantern above it.
    if (z === 0 && x === 5) {
      const lo = gr + 1, hi = gr + 2;
      if (hi <= 3) {
        g.set(x, lo, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
        g.set(x, hi, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
        g.set(x, gr + 3, z, "lantern", { hanging: "true" });
      }
    }
  } else {
    // Interior: air, with floor slabs at ground level and at storey lines.
    g.set(x, gr, z, "light_gray_concrete");
    if (SLAB_1 > gr) g.set(x, SLAB_1, z, "light_gray_concrete");
    if (SLAB_2 > gr) g.set(x, SLAB_2, z, "light_gray_concrete");
  }
}

// Pass 2: warm light behind some windows (glowstone just inside the glass).
for (const [x, z, gr] of cells) {
  if (!perim(x, z)) continue;
  const { face } = faceOf(x, z);
  for (let y = gr + 1; y <= 9; y++) {
    if (y === SLAB_1 || y === 6 || y === 9 || y === 4 || y === 1) continue;
    const wallNow = wallBlock(x, y, z, gr);
    if (wallNow.id !== "light_blue_stained_glass_pane" && wallNow.id !== "glass_pane") continue;
    if ((x * 7 + z * 13 + y * 5) % 6 !== 0) continue;
    let ix = x, iz = z;
    if (face === "front") iz = z + 1;
    else if (face === "back") iz = z - 1;
    else if (x === 0) ix = x + 1;
    else ix = x - 1;
    if (!has(ix, iz) || perim(ix, iz)) continue;
    if (y <= gr) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Rooftop plant box and a small lantern-topped vent.
for (let x = 3; x <= 6; x++) {
  for (let z = 6; z <= 10; z++) {
    if (!has(x, z) || perim(x, z)) continue;
    g.set(x, ROOF_CAP, z, "light_gray_concrete");
    g.set(x, ROOF_CAP + 1, z, "light_gray_concrete");
  }
}
if (has(4, 7) && !perim(4, 7)) {
  g.set(4, ROOF_CAP + 2, 7, "lantern", { hanging: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
