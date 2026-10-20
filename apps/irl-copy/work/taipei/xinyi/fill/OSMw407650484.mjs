import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw407650484";
const W = 29, H = 100, D = 27;
const TOP = 88;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Late-20th-century office slab: a 10-storey shaft, two setbacks, a crown and a plant penthouse.
// Storey bands sit on a 5-block grid anchored at y=10 (rel 0 and 4 are spandrels, 1..3 glass).
const TIERS = [
  { from: 0,  to: 60, inset: 0 },
  { from: 60, to: 80, inset: 4 },
  { from: 80, to: 85, inset: 7 },
  { from: 85, to: 88, inset: 10 },
];

const inside = (x, z, i) => x >= i && x <= W - 1 - i && z >= i && z <= D - 1 - i;
const perim = (x, z, i) => inside(x, z, i) && (x === i || x === W - 1 - i || z === i || z === D - 1 - i);
const tierAt = (y) => TIERS.find((t) => y >= t.from && y < t.to);

// Piers on the facade every third bay; corners are always piers.
function isPier(x, z, i) {
  const onZFace = z === i || z === D - 1 - i;
  const onXFace = x === i || x === W - 1 - i;
  if (onXFace && onZFace) return true;
  if (onZFace) return (x - i) % 3 === 0;
  return (z - i) % 3 === 0;
}

const isCell = new Set(cells.map(([x, z]) => `${x},${z}`));
const onFootprint = (x, z) => isCell.has(`${x},${z}`);

for (const [x, z, ground] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  for (let y = ground; y <= TOP; y++) {
    // Parapet ring on each tier's top edge, where the next tier does not cover it.
    let parapet = false;
    for (const t of TIERS) {
      if (y === t.to && perim(x, z, t.inset)) {
        const nt = TIERS.find((u) => u.from === t.to);
        if (!nt || !inside(x, z, nt.inset)) {
          g.set(x, y, z, "light_gray_concrete");
          parapet = true;
          break;
        }
      }
    }
    if (parapet) continue;

    const t = tierAt(y);
    if (!t || !inside(x, z, t.inset)) continue;

    // Roof slab closing each tier.
    if (y === t.to - 1) {
      g.set(x, y, z, "white_concrete");
      continue;
    }

    const rel = ((y - 10) % 5 + 5) % 5;

    // Interior: only floor slabs, the rest is air behind the glass.
    if (!perim(x, z, t.inset)) {
      if (rel === 0 || y === ground) g.set(x, y, z, "smooth_stone");
      continue;
    }

    // Facade.
    if (y === ground && y < 10) {
      g.set(x, y, z, "polished_granite"); // base course
      continue;
    }

    // Entrance on the street face: door set between granite pillars under a granite lintel.
    if (z === 0 && t.inset === 0 && x >= 13 && x <= 15) {
      if (x === 14) {
        if (y === ground + 1) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === ground + 2) {
          g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
          continue;
        }
        if (y === ground + 3) {
          g.set(x, y, z, "polished_granite"); // lintel over the entrance
          continue;
        }
      } else if (y === ground + 1 || y === ground + 2 || y === ground + 3) {
        g.set(x, y, z, "polished_granite"); // door pillars and lintel run
        continue;
      }
    }

    const pier = isPier(x, z, t.inset);
    if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (rel === 0 || rel === 4) {
      g.set(x, y, z, "light_gray_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
      // Warm lights behind some window bands, sparse and irregular.
      if (rel === 1 && (x * 31 + z * 17 + y * 7) % 11 === 0) {
        let dx = x === t.inset ? 1 : x === W - 1 - t.inset ? -1 : 0;
        let dz = z === t.inset ? 1 : z === D - 1 - t.inset ? -1 : 0;
        if (dx !== 0) dz = 0;
        if (dx !== 0 || dz !== 0) {
          const ix = x + dx, iz = z + dz;
          if (inside(ix, iz, t.inset + 1)) g.set(ix, y, iz, "glowstone");
        }
      }
    }
  }
}

// Crown: warm lanterns on the penthouse parapet corners, so the top reads at dusk.
for (const [x, z] of [[10, 10], [18, 10], [10, 16], [18, 16]]) {
  if (onFootprint(x, z) && inside(x, z, 10)) {
    g.set(x, TOP + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Antenna on the penthouse roof, clear of the corner lanterns.
g.set(14, TOP, 13, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
