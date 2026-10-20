import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542612472";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 23, D = 22;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${Math.round(x)},${Math.round(z)}`, Math.round(gr));
const has = (x, z) => cellMap.has(`${x},${z}`);

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const LANTERN = { hanging: "false", waterlogged: "false" };

// Pass 1: structure per footprint cell
for (const [rx, rz] of cells.map(([x, z]) => [Math.round(x), Math.round(z)])) {
  const x = rx, z = rz;
  const gg = cellMap.get(`${x},${z}`);
  if (gg === undefined) continue;

  const mN = !has(x, z - 1), mS = !has(x, z + 1);
  const mW = !has(x - 1, z), mE = !has(x + 1, z);
  const edge = mN || mS || mW || mE;
  const alongX = mN || mS;               // lies on a north/south face
  const corner = (mN || mS) && (mW || mE);
  const idx = alongX ? x : z;

  // Foundation below the cell's ground
  for (let y = 0; y < gg; y++) put(x, y, z, "stone_bricks");

  // Ground-level base course / floor slab
  put(x, gg, z, edge ? "polished_andesite" : "smooth_stone");

  if (!edge) {
    // Interior: floor slabs and roof deck only (air between)
    put(x, gg + 5, z, "smooth_stone");
    put(x, gg + 10, z, "gray_concrete");

    // Roof plant: AC/plant boxes on the roof deck
    const plantX = (x >= 5 && x <= 7) || (x >= 16 && x <= 18);
    const plantZ = (z >= 6 && z <= 8) || (z >= 12 && z <= 14);
    if (plantX && plantZ) {
      put(x, gg + 11, z, "light_gray_concrete");
      put(x, gg + 12, z, "smooth_stone_slab", SLAB_BOTTOM);
    }
    continue;
  }

  // ---- Edge cells: facade ----
  const pillar = corner || idx % 3 === 0;
  const face = alongX ? (mN ? "north" : "south") : (mW ? "west" : "east");
  const isFront = alongX && mS;
  const isEntrance = isFront && x === 13;

  // Cornice / storey line / parapet
  put(x, gg + 5, z, "light_gray_concrete");        // storey line
  put(x, gg + 10, z, "smooth_stone");              // cornice course
  put(x, gg + 11, z, "white_concrete");            // parapet
  if (corner) put(x, gg + 12, z, "lantern", LANTERN); // warm corner lights

  if (pillar) {
    // Structural pillars run the full height of the facade
    for (let y = gg + 1; y <= gg + 4; y++) put(x, y, z, "gray_concrete");
    for (let y = gg + 6; y <= gg + 9; y++) put(x, y, z, "gray_concrete");
    return_skip: ;
    continue;
  }

  // Ground floor: shopfront glass with awning
  for (let y = gg + 1; y <= gg + 3; y++) put(x, y, z, "cyan_stained_glass");
  put(x, gg + 4, z, "dark_oak_slab", SLAB_BOTTOM);

  if (isEntrance) {
    put(x, gg + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gg + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  }

  // Upper storey: wall with framed glass window band
  put(x, gg + 6, z, "white_concrete");
  put(x, gg + 9, z, "white_concrete");
  put(x, gg + 7, z, "light_blue_stained_glass");
  put(x, gg + 8, z, "light_blue_stained_glass");

  // Warm light behind some upper windows (glowstone one cell inside)
  if (idx % 6 === 1) {
    let dx = 0, dz = 0;
    if (face === "north") dz = 1;
    else if (face === "south") dz = -1;
    else if (face === "west") dx = 1;
    else dx = -1;
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz)) put(ix, gg + 7, iz, "glowstone");
  }
}

// Pass 2: roof deck and parapet need to cover cells whose top is inside; handled above.
g.save(`${DIR}/${ID}.nbt`);
