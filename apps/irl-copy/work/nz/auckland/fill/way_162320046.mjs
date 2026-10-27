// City Lodge, Auckland (way 162320046): a 1960s reinforced-concrete hotel and apartment block, nine storeys on a
// stepped massing. Footprint and heights come from the lidar record: most cells rise to the 38-block roof, a 32-block
// NW wing, a 28-block west wing and an 8-block annex. Concrete frame with bands and spandrels, glazed bays between
// piers, a glass shopfront and a recessed door on the ground storey, lit windows, a roof plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320046.cells.json", "utf8"));
const g = new Voxels([24, 51, 18]);

// lidar roof heights snapped to flat tiers (noise at the edges of the 38 mass is pulled into it)
const top = new Map();
for (const [x, z, ground, roof] of cells) top.set(`${x},${z}`, { g: ground, H: roof >= 33 ? 38 : roof >= 30 ? 32 : roof >= 25 ? 28 : 8 });
const at = (x, z) => top.get(`${x},${z}`);

// a wall voxel: a neighbouring column is outside the footprint, or stands lower than this height
const exposed = (x, z, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => {
  const n = at(x + dx, z + dz); return !n || n.H <= y;
});

// the ground storey (0..3) is a base, shopfront and transom; upper storeys run 4-block floors: band, two glass rows, spandrel
const rowKind = (y, gr) => {
  if (y === gr) return "base";
  if (y < 3) return "shop";
  if (y % 4 === 0 || y % 4 === 3) return "span";
  return "win";
};

const CONCRETE = "white_concrete", FRAME = "light_gray_concrete", BASE = "polished_andesite", FOUND = "stone_bricks";
const GLASS = "light_blue_stained_glass_pane", SHOP = "glass_pane";
const put = new Map();              // "x,y,z" -> [block, state]
const set = (x, y, z, block, state) => put.set(`${x},${y},${z}`, [block, state]);

for (const [x, z, gr] of cells) {
  const { H } = at(x, z);
  for (let y = 0; y < H; y++) {
    if (y < gr) { set(x, y, z, FOUND); continue; }
    const ex = exposed(x, z, y);
    if (y === H - 1) { set(x, y, z, ex ? FRAME : "smooth_stone"); continue; }     // parapet or roof surface
    if (y === H - 2 && ex) { set(x, y, z, FRAME); continue; }                    // cornice
    if (ex) {
      const k = rowKind(y, gr);
      if (k === "base") set(x, y, z, BASE);
      else if (k === "span") set(x, y, z, FRAME);
      else if ((x + z) % 3 === 0) set(x, y, z, FRAME);                          // pier between bays
      else set(x, y, z, k === "shop" ? SHOP : GLASS, null);
      continue;
    }
    // interior: a floor slab per storey, columns on a 4-block grid carrying the floors and the roof
    if (y > 0 && y % 4 === 0) set(x, y, z, "smooth_stone");
    else if (x % 4 === 2 && z % 4 === 2 && y <= H - 2) set(x, y, z, FRAME);
  }
}

// glass panes join the panes beside them in the same row
for (const [key, [block]] of [...put]) {
  if (block !== GLASS && block !== SHOP) continue;
  const [x, y, z] = key.split(",").map(Number);
  const same = (dx, dz) => { const p = put.get(`${x + dx},${y},${z + dz}`); return !!p && p[0] === block; };
  put.set(key, [block, { north: String(same(0, -1)), south: String(same(0, 1)), east: String(same(1, 0)), west: String(same(-1, 0)), waterlogged: "false" }]);
}

// warm light behind a few windows (about one bay in twelve, a sparse lit floor rather than freckles): the interior cell beside it
for (const [key, [block]] of [...put]) {
  if (block !== GLASS && block !== SHOP) continue;
  const [x, y, z] = key.split(",").map(Number);
  if ((x * 31 + y * 17 + z * 13) % 12 !== 0) continue;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = at(x + dx, z + dz); if (!n || y < n.g || y > n.H - 2) continue;
    const k = `${x + dx},${y},${z + dz}`; if (put.has(k)) continue;
    set(x + dx, y, z + dz, "glowstone");
    break;
  }
}

// the entrance: a recessed door on the south face of the lobby, a lantern under the lintel
set(16, 0, 17, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
set(16, 1, 17, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
set(16, 2, 17, "lantern", { hanging: "true", waterlogged: "false" });

// roof plant room on the core, solid concrete with louvred faces
for (let x = 10; x <= 13; x++) for (let z = 9; z <= 11; z++) for (let y = 38; y <= 40; y++) {
  const edge = x === 10 || x === 13 || z === 9 || z === 11;
  if (!edge) { set(x, y, z, FRAME); continue; }
  if (y === 39 && (x + z) % 2 === 1) set(x, y, z, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  else set(x, y, z, FRAME);
}
for (let x = 10; x <= 13; x++) for (let z = 9; z <= 11; z++) set(x, 41, z, "smooth_stone");

for (const [key, [block, state]] of put) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_162320046.nbt");
console.log(`way_162320046: ${blocks} blocks, ${palette} palette entries`);
