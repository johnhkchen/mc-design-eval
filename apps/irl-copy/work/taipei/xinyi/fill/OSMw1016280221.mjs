import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1016280221";
const W = 23, H = 33, D = 21;
const TOP = 21;          // parapet starts here; roof deck at y=20
const ROOF_DECK = 20;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, Math.max(0, Math.min(19, Math.round(gr))));

const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isPerim = (x, z) =>
  has(x, z) && (!has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z));

const g = new Voxels([W, H, D]);

// Pane orientation helpers
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  const gl = G(x, z);
  const n = !has(x, z - 1), s = !has(x, z + 1), w = !has(x - 1, z), e = !has(x + 1, z);
  const perim = n || s || w || e;
  const corner = (n || s) && (w || e);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gl; y++) g.set(x, y, z, "stone_bricks");

  // Body from ground up to the parapet
  for (let y = gl; y < ROOF_DECK; y++) {
    if (y % 5 === 0) {
      // Storey floor slabs (interior air sits between them)
      g.set(x, y, z, perim ? "smooth_quartz" : "light_gray_concrete");
      continue;
    }
    if (!perim) continue; // interior air

    const t = y % 5;             // 1 sill, 2-3 glass, 4 spandrel
    const st = Math.floor(y / 5); // storey index 0..3
    const idx = (n || s) ? x : z;
    const pier = corner || idx % 3 === 0;

    if (pier) {
      g.set(x, y, z, "smooth_quartz");
    } else if (t === 1) {
      g.set(x, y, z, st === 0 ? "polished_andesite" : "white_concrete");
    } else if (t === 4) {
      g.set(x, y, z, "white_concrete");
    } else {
      // Glass panes with frames
      const horizontal = n || s;
      g.set(x, y, z, "light_blue_stained_glass_pane", horizontal ? { ...PANE_EW } : { ...PANE_NS });

      // Warm light behind some windows, in the air gap inside
      if (t === 2 && (idx + st) % 5 === 2) {
        let ix = x, iz = z;
        if (n) iz = z + 1; else if (s) iz = z - 1; else if (w) ix = x + 1; else ix = x - 1;
        if (has(ix, iz) && !isPerim(ix, iz) && y >= G(ix, iz)) {
          g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }

  // Roof deck: cornice on the edge, roof surface inside
  if (ROOF_DECK >= gl) {
    g.set(x, ROOF_DECK, z, perim ? "smooth_stone" : "light_gray_concrete");
  }

  // Parapet with coping
  if (perim) {
    g.set(x, TOP, z, "smooth_quartz");
    g.set(x, TOP + 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Main entrance on the north face, at x = 11
{
  let zmin = Infinity;
  for (const [x, z] of cells) if (x === 11 && z < zmin) zmin = z;
  if (Number.isFinite(zmin) && has(11, zmin)) {
    const y0 = G(11, zmin) + 0; // door sits on the local ground
    const yb = Math.max(1, y0 + 1);
    for (let y = yb - 1; y <= yb; y++) {
      // clear the wall block for the opening
      if (y < ROOF_DECK) g.set(11, y, zmin, "air");
    }
    g.set(11, yb, zmin, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(11, yb + 1, zmin, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    // Lintel over the door
    g.set(11, yb + 2, zmin, "smooth_quartz");
  }
}

// Roof plant room, centred, if the footprint allows it
{
  const x0 = 8, x1 = 14, z0 = 7, z1 = 13;
  let ok = true;
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (!has(x, z)) ok = false;
  if (ok) {
    for (let y = ROOF_DECK + 1; y <= ROOF_DECK + 3; y++) {
      for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
        const edge = x === x0 || x === x1 || z === z0 || z === z1;
        if (edge) g.set(x, y, z, "light_gray_concrete");
      }
    }
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
      g.set(x, ROOF_DECK + 4, z, "smooth_stone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
