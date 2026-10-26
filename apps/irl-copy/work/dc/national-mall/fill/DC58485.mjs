// DC58485: a three-storey Beaux-Arts office block (cream limestone, stone cornice, a raised central pavilion with a
// parapet, a service nub on the south edge, and a pedimented entrance bay on the north). Hollow: a 1-block shell,
// air behind the glass, a floor or ceiling slab per storey, a roof deck over everything.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58485.cells.json", "utf8"));
const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => fp.has(`${x},${z}`);

// lidar: body roof 7 (smoothed from the 6-8 noise), the central pavilion 8, the south service nub 6
const isPav = (x, z) => x >= 3 && x <= 7 && z >= 3 && z <= 5 && has(x, z);
const isNub = (x, z) => x === 3 && z === 8;
const isEntry = (x, z) => x === 5 && z === 0;
const top = (x, z) => (isPav(x, z) ? 8 : isNub(x, z) ? 6 : 7);
// outward exposure: which sides face off the footprint
const outs = (x, z) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => !has(x + dx, z + dz));
const exposed = (x, z) => outs(x, z).length > 0;
// the pavilion's ring at its top storey: a pavilion cell with a neighbour outside the pavilion
const pavRing = (x, z) => isPav(x, z) && [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => !isPav(x + dx, z + dz));

const g = new Voxels([11, 8, 9]);

const W = "calcite", BASE = "polished_andesite", BELT = "smooth_quartz", CORNICE = "stone_bricks", FLOOR = "smooth_stone";
const glass = (dx, dz) => (dz !== 0 ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });

// a window on a flat face of the GF or F2 storey: the bays alternate pane and mullion (odd coordinate = pane)
const isWindow = (x, z, outsList) => {
  if (outsList.length !== 1 || isNub(x, z) || isEntry(x, z)) return false;
  const [dx, dz] = outsList[0];
  return dz !== 0 ? x % 2 === 1 : z % 2 === 1;
};

// interior glow: a warm light just inside one ground-floor window in four, a hanging lantern behind some upper panes
const lightBehind = (x, z, y, outsList) => {
  const [dx, dz] = outsList[0];
  const ix = x - dx, iz = z - dz;
  if (!has(ix, iz) || exposed(ix, iz)) return null;
  return [ix, y, iz];
};

for (const [x, z] of cells) {
  const T = top(x, z), out = outs(x, z), ext = out.length > 0;
  for (let y = 0; y < T; y++) {
    if (!ext) {
      // interior: floor slabs at 0 and 3, a ceiling at 5, the roof deck at 6; air between
      if (y === 0 || y === 3 || y === 5 || y === 6) g.set(x, y, z, FLOOR);
      else if (y === 7 && pavRing(x, z)) g.set(x, y, z, CORNICE);
      continue;
    }
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (isEntry(x, z) && (y === 1 || y === 2)) { g.set(x, y, z, "iron_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isNub(x, z) && (y === 1 || y === 2)) { g.set(x, y, z, "spruce_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
    if (isEntry(x, z) && y === 3) { g.set(x, y, z, "smooth_quartz_stairs", { facing: "north", half: "top", shape: "straight", waterlogged: "false" }); continue; }
    if (y === T - 1) { g.set(x, y, z, CORNICE); continue; }
    if (y === 3 || y === 5) { g.set(x, y, z, BELT); continue; }
    if ((y === 1 || y === 2 || y === 4) && isWindow(x, z, out)) {
      g.set(x, y, z, "glass_pane", glass(out[0][0], out[0][1]));
      continue;
    }
    g.set(x, y, z, W);
  }
}

// the warm lights, set once the shell is in
for (const [x, z] of cells) {
  const out = outs(x, z);
  if (out.length !== 1 || isNub(x, z) || isEntry(x, z)) continue;
  if (x % 4 === 1 || z % 4 === 1) {
    const L = lightBehind(x, z, 1, out);
    if (L && isWindow(x, z, out)) g.set(...L, "glowstone");
  }
  const H = lightBehind(x, z, 4, out);
  if (H && isWindow(x, z, out) && (x + z) % 3 === 0) g.set(H[0], 4, H[2], "lantern", { hanging: "true", waterlogged: "false" });
}

// roof equipment: standing lanterns on the pavilion's inner roof
g.set(4, 7, 4, "lantern", { hanging: "false", waterlogged: "false" });
g.set(5, 7, 4, "lantern", { hanging: "false", waterlogged: "false" });

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC58485.nbt");
console.log(JSON.stringify(r));
