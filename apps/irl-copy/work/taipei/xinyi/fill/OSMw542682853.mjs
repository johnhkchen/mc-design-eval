import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682853";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 14, H = 23, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
let B = Infinity;
for (const [x, z, gy] of cells) {
  ground.set(`${x},${z}`, gy);
  if (gy < B) B = gy;
}
const has = (x, z) => ground.has(`${x},${z}`);

// Roof surface (parapet top) about 11 blocks above lowest ground
const TOP = B + 11;

// Glass pane connection states (so panes join into walls)
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Storey layout relative to B:
// r0 plinth, r1-4 ground-floor storey (shopfront), r5 floor band,
// r6-9 upper storey (sill r6, glass r7-9), r10 cornice, r11 parapet.

function outerSpec(x, z, r) {
  const front = z === 0 || z === D - 1;
  const endFace = x === 0 || x === W - 1;

  if (r === 0) return { id: "gray_concrete" };
  if (r === 5 || r === 10) return { id: "smooth_quartz" };
  if (r === 11) return { id: "white_concrete" };

  // Piers at x%3==0 and the far end column; windows elsewhere
  const winX = !(x % 3 === 0 || x === W - 1);

  if (front) {
    const paneProps = z === 0 || z === D - 1 ? PANE_EW : PANE_EW;
    if (r <= 4) {
      // Entrance door on the street face (z=0)
      if (z === 0 && x === 1 && (r === 1 || r === 2)) {
        return {
          id: "oak_door",
          props: {
            facing: "north",
            half: r === 1 ? "lower" : "upper",
            hinge: "left",
            open: "false",
            powered: "false",
          },
        };
      }
      if (!winX) return { id: "white_concrete" };
      if (r === 4) return { id: "smooth_quartz" };
      return { id: "glass_pane", props: paneProps };
    }
    // Upper storey r6-9
    if (!winX) return { id: "white_concrete" };
    if (r === 6) return { id: "smooth_quartz" };
    return { id: "glass_pane", props: paneProps };
  }

  if (endFace) {
    const centre = z === 2;
    if (centre && ((r >= 1 && r <= 3) || (r >= 7 && r <= 9))) {
      return { id: "glass_pane", props: PANE_NS };
    }
    return { id: "white_concrete" };
  }

  return { id: "white_concrete" };
}

// Rooftop equipment on interior roof cells
function roofEquipment(x, z) {
  if (z === 2 && x === 3) return { id: "iron_block" };
  if (z === 2 && x === 9) return { id: "iron_block" };
  if (z === 2 && x === 7) return { id: "lightning_rod" };
  return null;
}

for (const [x, z, gy] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;

  // Foundation from y=0 up to this cell's ground
  for (let y = 0; y < gy && y < H; y++) {
    g.set(x, y, z, "stone_bricks");
  }

  if (gy >= TOP) continue;

  const outer = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !has(x + dx, z + dz));

  for (let y = gy; y <= TOP && y < H; y++) {
    const r = y - B;

    if (outer) {
      const spec = outerSpec(x, z, r);
      if (spec) {
        if (spec.props) g.set(x, y, z, spec.id, spec.props);
        else g.set(x, y, z, spec.id);
      }
    } else {
      // Interior: floors, roof slab, and air gaps (no interiors)
      if (y === gy || r === 5) {
        g.set(x, y, z, "smooth_stone");
      } else if (r === 10) {
        g.set(x, y, z, "gray_concrete");
      } else if (r === 11) {
        const eq = roofEquipment(x, z);
        if (eq) g.set(x, y, z, eq.id);
      }
      // all other interior cells remain air
    }
  }
}

// Warm lights glowing behind glass (interior cells, just inside the windows)
const lights = [
  [4, 1, 2],   // behind ground-floor shopfront glass
  [10, 1, 2],  // behind ground-floor shopfront glass
  [8, 1, 8],   // behind upper-storey glass
];
for (const [x, z, r] of lights) {
  if (has(x, z)) {
    const y = B + r;
    if (y < H) g.set(x, y, z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
