// The Colonial Building: a 1970s concrete-and-glass office on a sandstone plinth. The lidar reads an eight-storey podium
// (roof 35) with a slim 19-storey tower along a diagonal ridge to the north-west (roof 79), setbacks at 47 and 63, and
// two-to-six-storey wings to the south-west. Each cell is a column solid from the foundation up to its tier's top;
// storeys are 4 blocks on a 3 + 4n grid, with concrete bands and white piers framing 2-high glass. Interiors are air.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861436.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([42, 93, 34]);

// Storey lines sit at y = 3 + 4n; a tier's top is one of them (exclusive): the lidar roof snapped to a storey line.
const LINE = (y) => 3 + 4 * Math.ceil((y - 3) / 4);
const tierTop = (r) => {
  if (r >= 68) return 79;                          // tower, 19 storeys
  if (r >= 56) return 63;                          // setback ring
  if (r >= 44) return 47;                          // second setback
  if (r >= 28) return 35;                          // eight-storey podium
  return Math.min(27, Math.max(19, LINE(r)));      // wings, 4 to 6 storeys
};
const k = (x, z) => `${x},${z}`;
// lidar noise: each roof is the median of its footprint neighbourhood (3 x 3), so one-cell spikes fall back to the tier
const roofAt = new Map(cells.map(([x, z, , r]) => [k(x, z), r]));
const median = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (roofAt.has(k(x + dx, z + dz))) v.push(roofAt.get(k(x + dx, z + dz)));
  v.sort((a, b) => a - b); return v[Math.floor(v.length / 2)];
};
const list = cells.map(([x, z, gd, r]) => ({ x, z, gd, top: tierTop(median(x, z)) }));
const byKey = new Map(list.map((c) => [k(c.x, c.z), c]));
const topOf = (x, z) => byKey.get(k(x, z))?.top ?? 0;   // 0 = off the footprint
const DIRS = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
// the sides of a cell at height y that face open air or a lower tier, so they are walls at that height
const exposed = (x, z, y) => Object.keys(DIRS).filter((d) => topOf(x + DIRS[d][0], z + DIRS[d][1]) <= y);

// Entrance: the middle of the podium's south-facing ground edge, three cells wide, a door in the middle.
const ents = list.filter((c) => c.top === 35 && exposed(c.x, c.z, 4).includes("S")).sort((a, b) => a.x - b.x || a.z - b.z);
const mid = ents[Math.floor(ents.length / 2)];
const entrance = new Set(mid ? ents.filter((c) => c.z === mid.z && Math.abs(c.x - mid.x) <= 1).map((c) => k(c.x, c.z)) : []);

const glassFor = (x, z, top) => (top === 79 ? "cyan_stained_glass" : (x + z) % 4 === 0 ? "gray_stained_glass" : "light_blue_stained_glass");
const warm = (x, z, base) => (x * 5 + z * 3 + base) % 17 === 0;   // sparse lit windows

for (const { x, z, gd, top } of list) {
  // foundation: solid from y 0 up to the cell's ground, and a sandstone plinth course (cap at y 2) under every cell
  for (let y = 0; y < Math.max(3, gd); y++) {
    const face = exposed(x, z, 0).length > 0;
    g.set(x, y, z, y === 2 && face ? "polished_andesite" : face ? "smooth_sandstone" : "stone");
  }

  for (let base = 3; base < top; base += 4) {
    const ground = base === 3, last = base + 3 === top - 1;
    const ex = exposed(x, z, base + 1), edge = ex.length > 0;
    const corner = (ex.includes("N") || ex.includes("S")) && (ex.includes("E") || ex.includes("W"));
    const pier = corner
      || ex.some((d) => (d === "N" || d === "S") && x % 3 === 0)
      || ex.some((d) => (d === "E" || d === "W") && z % 3 === 0);

    // floor slab per storey (the floor band on the face); interiors are air between slabs
    g.set(x, base, z, edge ? (ground ? "polished_andesite" : "light_gray_concrete") : "smooth_stone");

    if (edge) {
      if (last) g.set(x, base + 3, z, "polished_andesite");           // parapet
      else g.set(x, base + 3, z, ground ? "smooth_sandstone" : "light_gray_concrete");   // head band
    } else if (last) g.set(x, base + 3, z, "gray_concrete");          // roof membrane

    if (!edge) continue;
    const inEntrance = ground && entrance.has(k(x, z));
    for (const y of [base + 1, base + 2]) {
      if (inEntrance && y === base + 1 && x === mid.x && z === mid.z) {        // door, lower then upper half
        g.set(x, y, z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (inEntrance && y === base + 2 && x === mid.x && z === mid.z) {
        g.set(x, y, z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (inEntrance) {
        g.set(x, y, z, "glass");
      } else if (pier) {
        g.set(x, y, z, ground ? "stone_bricks" : "white_concrete");
      } else if (warm(x, z, base)) {
        g.set(x, y, z, "glowstone");
      } else {
        g.set(x, y, z, glassFor(x, z, top));
      }
    }
    if (inEntrance) g.set(x, base + 3, z, "polished_andesite");           // lintel over the entrance
  }

  // roof plant on the podium: a stone box with a lantern on it, on the roof membrane
  if (top === 35 && !exposed(x, z, 34).length && x % 9 === 4 && z % 7 === 3) {
    g.set(x, 35, z, "stone_bricks");
    g.set(x, 36, z, "lantern", { hanging: "false" });
  }
}

// The tower's crown: a mast of iron bars and a lightning rod above its roof
const crown = list.find((c) => c.x === 14 && c.z === 3 && c.top === 79);
if (crown) {
  for (let y = 79; y <= 82; y++) g.set(crown.x, y, crown.z, "iron_bars");
  g.set(crown.x, 83, crown.z, "lightning_rod");
}

const stats = g.save(`${DIR}/way_292861436.nbt`);
console.log(`way_292861436: ${stats.blocks} blocks, ${stats.palette} palette entries, ${list.length} cells`);
