// FR245184821: Tribunal de commerce de Paris (2003), a cream-stone civic block with shopfronts at street level, built on the
// lidar footprint. The lidar gives one flat roof (58-60 blocks, read as 60), so the massing is a single tower of 12 five-block
// storeys on a stone plinth, not tiers. Every storey line (y = 5, 10 ... 55) is a quartz string course and an interior floor
// slab, so nothing hangs. Facade: calcite piers every third block, three glass rows, a quartz lintel; the ground floor is
// shopfront glass with a portal (dark oak door, hanging lantern) on the north face. Glowstone sits behind some panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR245184821.cells.json`, "utf8"));

const W = 22, H = 76, D = 22;
const TOP = 60;                                     // roof surface above y 0 (lidar); the roof deck is the top block row, y = 59
const g = new Voxels([W, H, D]);

const fp = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => fp.has(`${x},${z}`);
const NEI = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];
const exposed = (x, z) => NEI.filter(([, dx, dz]) => !inFp(x + dx, z + dz)).map(([n]) => n);
const put = (x, y, z, block, state) => { if (inFp(x, z)) g.set(x, y, z, block, state); };

const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };   // pane on a north/south face
const PANE_Z = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };  // pane on an east/west face
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// The main entrance: the middle of the north row (the lidar's row z = 0 runs x 9..13).
const DOOR = [11, 0];
const isDoor = (x, z) => x === DOOR[0] && z === DOOR[1];

for (const [x, z] of cells) {
  const ex = exposed(x, z);
  const wall = ex.length > 0;
  const face = ex[0];
  const along = face === "north" || face === "south" ? x : z;   // position along the face, for the pier rhythm

  // Base course and foundation: y 0 under every cell (the lowest ground is y 0; ground-1 cells get the same plinth).
  g.set(x, 0, z, "stone_bricks");

  for (let y = 1; y < TOP; y++) {
    const roofDeck = y === TOP - 1;
    const r = y % 5;                                 // 0 string course, 1-3 glass band, 4 lintel
    if (roofDeck) {
      g.set(x, y, z, wall ? "quartz_block" : "smooth_stone");   // cornice at the edge, roof deck inside
      continue;
    }
    if (!wall) {
      if (r === 0) g.set(x, y, z, "smooth_stone");              // interior floor slab per storey; air between
      continue;
    }
    if (r === 0 || r === 4) { g.set(x, y, z, "quartz_block"); continue; }

    // Glass band (rows 1-3): corners and piers in calcite, panes between; the ground floor is all shopfront glass.
    const ground = y < 5;
    if (isDoor(x, z)) {
      if (y === 1) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else if (y === 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      else if (y === 3) g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    const portalJamb = ground && z === DOOR[1] && Math.abs(x - DOOR[0]) === 1;
    if (ex.length > 1 || (!ground && along % 3 === 0) || portalJamb) {
      g.set(x, y, z, "calcite");                      // corners and piers; the portal's jambs
    } else {
      const alongX = face === "north" || face === "south";
      g.set(x, y, z, "glass_pane", alongX ? PANE_X : PANE_Z);
      // a warm light behind some panes: the interior cell just inside the glass stays air otherwise
      if (r === 2 && (x * 13 + z * 7 + y * 3) % 11 === 0) {
        const [dx, dz] = INWARD[face];
        const ix = x + dx, iz = z + dz;
        if (inFp(ix, iz) && exposed(ix, iz).length === 0) g.set(ix, y, iz, "glowstone");
      }
    }
  }
}

// The portal: a smooth-stone sill and a quartz lintel over the door (lintel row 4 is already quartz; add the threshold).
g.set(DOOR[0], 0, DOOR[1], "smooth_stone");

// Roof: a glazed-top lantern over the centre with a glowstone heart, and two plant boxes with grilles.
const LANTERN = { x0: 9, x1: 12, z0: 9, z1: 12 };
for (let x = LANTERN.x0; x <= LANTERN.x1; x++) for (let z = LANTERN.z0; z <= LANTERN.z1; z++) {
  const edge = x === LANTERN.x0 || x === LANTERN.x1 || z === LANTERN.z0 || z === LANTERN.z1;
  for (let y = TOP; y <= TOP + 2; y++) if (edge) put(x, y, z, "calcite");
  put(x, TOP + 3, z, "quartz_block");               // the cap
}
for (let x = LANTERN.x0 + 1; x < LANTERN.x1; x++) for (let z = LANTERN.z0 + 1; z < LANTERN.z1; z++) {
  put(x, TOP + 1, z, "glowstone");
  put(x, TOP, z, "smooth_stone");
}
for (let x = 3; x <= 6; x++) for (let z = 15; z <= 17; z++) {
  put(x, TOP, z, "smooth_stone");
  put(x, TOP + 1, z, "iron_bars");
}

const summary = g.save(`${DIR}/FR245184821.nbt`);
console.log(`FR245184821.nbt: ${summary.blocks} blocks, ${summary.palette} palette entries`);
