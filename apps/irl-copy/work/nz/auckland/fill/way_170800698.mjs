// South British Insurance Company Building, Queen Street, Auckland: an interwar (c.1925-30) stripped-classical office
// block. Reinforced-concrete frame clad in cream plaster (smooth quartz), a dark andesite plinth, chiseled string courses
// at every storey line, paired-window bays between quartz piers, a shopfront band on the ground floor, a plain cornice
// and parapet, and a flat roof with plant. Massing from the lidar roof heights, quantised to four flat tiers.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_170800698.cells.json`, "utf8"));

const FOUNDATION = "stone_bricks", PLINTH = "polished_andesite", WALL = "smooth_quartz", PIER = "quartz_pillar";
const COURSE = "chiseled_quartz_block", GLASS = "light_blue_stained_glass", FASCIA = "dark_oak_planks";
const ROOF = "gray_concrete", FLOOR = "smooth_stone", CAP = "smooth_quartz_slab", PLANT = "light_gray_concrete";

// lidar roof height -> one of four flat tiers (lower wing, body, setback, tower fin)
const tier = (R) => (R < 44 ? 42 : R < 48 ? 46 : R < 53 ? 50 : 57);

const fp = new Map();
for (const [x, z, gr, R] of cells) fp.set(`${x},${z}`, { x, z, g: gr, R, T: tier(R) });
const inside = (x, z) => fp.has(`${x},${z}`);

// the sides of a footprint cell that face outside the footprint: N (-z), S (+z), W (-x), E (+x)
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const exposed = (x, z) => DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
const isEdge = (x, z) => exposed(x, z).length > 0;

const b = new Voxels([35, 70, 31]);

// a bay of window or pier along a street face: piers every third cell, glazed pairs between
const windowBay = (c, [dx]) => (dx !== 0 ? c.z : c.x) % 3 !== 0;

// the entrance: north face, centre of the three-cell frontage on the lower tier
const DOOR = { x: 7, z: 0 };

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  const ex = exposed(x, z);
  const edge = ex.length > 0;
  const corner = ex.length > 1;
  const inward = edge && !corner ? [-ex[0][0], -ex[0][1]] : null;

  for (let y = 0; y < T; y++) {
    if (y < g) { b.set(x, y, z, FOUNDATION); continue; }

    if (!edge) {
      // interior: a floor slab per storey, the roof membrane on top, air between (no interiors)
      if (y === g || (y % 4 === 0 && y > 0) ) b.set(x, y, z, FLOOR);
      if (y === T - 1) b.set(x, y, z, ROOF);
      continue;
    }

    // facade cells, from the plinth up to the cap
    if (y === g) { b.set(x, y, z, PLINTH); continue; }
    if (y === T - 1) { b.set(x, y, z, WALL); continue; }
    if (y === T - 2 && y > 3) { b.set(x, y, z, COURSE); continue; }

    if (y === 3) { b.set(x, y, z, FASCIA); continue; }
    if (y % 4 === 0 && y > 0) { b.set(x, y, z, COURSE); continue; }

    const band = y < 4 ? (y - g) : y % 4;      // ground storey counts from its own floor, upper storeys from the line
    if (y < 4) {
      // shopfront: glazed bays between plinth-faced piers
      b.set(x, y, z, !corner && windowBay(c, ex[0]) ? GLASS : PLINTH);
    } else if (band === 3) {
      b.set(x, y, z, WALL);                     // spandrel under the window band
    } else if (corner || !windowBay(c, ex[0])) {
      b.set(x, y, z, PIER);
    } else {
      b.set(x, y, z, GLASS);
    }
  }

  // the cap: a quartz parapet course one block above the body on the street faces
  if (edge) b.set(x, T, z, CAP, { type: "bottom", waterlogged: "false" });

  // warm light behind a few panes: glowstone up the storeys, lanterns on the shopfront floor (air gap stays)
  if (inward) {
    const [ix, iz] = [x + inward[0], z + inward[1]];
    const back = fp.get(`${ix},${iz}`);
    if (back && !isEdge(ix, iz)) {
      for (let y = g; y < back.T - 1; y++) {
        const on = !corner && windowBay(c, ex[0]) && y > 0 && y % 4 === 1 && (x * 7 + z * 3 + y) % 9 === 0;
        const shop = !corner && windowBay(c, ex[0]) && y === g + 1 && y < 4 && (x * 5 + z) % 4 === 0;
        if (on) b.set(ix, y, iz, "glowstone");
        else if (shop) b.set(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }
}

// the entrance door, two blocks, facing out to the street
const dc = fp.get(`${DOOR.x},${DOOR.z}`);
for (let y = dc.g; y <= dc.g + 1; y++) {
  b.set(DOOR.x, y, DOOR.z, "dark_oak_door", { facing: "north", half: y === dc.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
}
// a lintel bar over the door, and the entrance pair of pilasters either side
b.set(DOOR.x, dc.g + 2, DOOR.z, COURSE);
for (const dx of [-1, 1]) b.set(DOOR.x + dx, dc.g + 2, DOOR.z, PIER);

// roof plant: a few boxes on the tier-46 roof, and a small plant room on the lower wing
let plant = 0;
for (const c of fp.values()) {
  if (plant >= 5 || isEdge(c.x, c.z)) continue;
  if (c.T === 46 && c.x >= 12 && c.x <= 18 && c.z >= 9 && c.z <= 15 && (c.x + 2 * c.z) % 7 === 0) {
    b.set(c.x, 46, c.z, PLANT); b.set(c.x, 47, c.z, PLANT); plant++;
  }
}
for (const c of fp.values()) {
  if (c.T === 42 && !isEdge(c.x, c.z) && c.x >= 19 && c.x <= 23 && c.z >= 17 && c.z <= 21 && (c.x + c.z) % 4 === 0) {
    b.set(c.x, 42, c.z, PLANT); b.set(c.x, 43, c.z, PLANT);
  }
}

const info = b.save(`${DIR}/way_170800698.nbt`);
console.log(JSON.stringify(info));
