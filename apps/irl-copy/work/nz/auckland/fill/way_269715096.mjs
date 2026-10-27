// Auckland, way 269715096: a one-storey brick commercial block (c. 1920s) on a sloping site.
// Lidar says one flat roof 5 blocks above y 0 across the footprint, so it is a single storey with a
// plastered parapet, not a tower. Lowest ground is on the south-west (street) side; the block steps into the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269715096.nbt";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269715096.cells.json", "utf8"));

// Lidar roof: one flat tier. The few cells at 4 are noise next to a 5 parapet, so the massing is smoothed to the mode.
const modeRoof = (() => { const n = {}; for (const c of cells) n[c[3]] = (n[c[3]] || 0) + 1; return +Object.entries(n).sort((a, b) => b[1] - a[1])[0][0]; })();
const ROOF = modeRoof;                                   // = 5: the top of layer 4 is the roof surface
const F = new Map();                                     // "x,z" -> ground
for (const [x, z, g] of cells) F.set(`${x},${z}`, g);
const inside = (x, z) => F.has(`${x},${z}`);
const DIRS = { N: [0, -1, "north"], S: [0, 1, "south"], E: [1, 0, "east"], W: [-1, 0, "west"] };
const exposed = (x, z) => Object.keys(DIRS).filter((d) => !inside(x + DIRS[d][0], z + DIRS[d][1]));
// a window in a wall cell is only glass if the cell inside it is air at that height (an air gap behind the pane)
const airInside = (x, z, y, d) => {
  const [dx, dz] = DIRS[d]; const ix = x - dx, iz = z - dz;
  if (!inside(ix, iz) || exposed(ix, iz).length) return false;     // interior cells only
  const gi = F.get(`${ix},${iz}`); return y > gi && y <= 2;        // above that cell's floor, below its ceiling slab
};

const g = new Voxels([31, 17, 17]);
const placed = new Map();                                // "x,y,z" -> block, for pane connections and lamp placement
const put = (x, y, z, block, state) => { g.set(x, y, z, block, state); placed.set(`${x},${y},${z}`, { block, state }); };
const at = (x, y, z) => placed.get(`${x},${y},${z}`);

// the street is the low south-west face: exposed on S or W with ground at most 1; its door is the middle ground-1 cell
const street = (x, z) => F.get(`${x},${z}`) <= 1 && exposed(x, z).some((d) => d === "S" || d === "W");
const streetCells = cells.map(([x, z, gr]) => [x, z, gr]).filter(([x, z]) => street(x, z) && exposed(x, z).length > 0 && (exposed(x, z).includes("S") || exposed(x, z).includes("W")));
streetCells.sort((a, b) => a[0] + a[1] - (b[0] + b[1]));
// the door needs two cells of wall above its grade (layers 2 and 3), so it sits on a ground-1 street cell
const doorCands = streetCells.filter(([, , gr]) => gr === 1);
const door = doorCands[Math.floor(doorCands.length / 2)];
const doorKey = door ? `${door[0]},${door[1]}` : null;
const doorFacing = door ? DIRS[exposed(door[0], door[1]).find((d) => d === "S" || d === "W")][2] : null;

// ---- pass 1: the solid shell, footings, floors, ceilings and the roof deck, cell by cell ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = F.get(`${x},${z}`);
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");          // foundation: nothing floats on the slope
  const ex = exposed(x, z);
  if (!ex.length) {                                                  // interior: a floor slab, air, then a ceiling slab
    if (G <= 3) put(x, G, z, "oak_planks");
    if (G <= 2) put(x, 3, z, "smooth_stone");
  }
}

// ---- pass 2: the walls of the ring cells ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = F.get(`${x},${z}`);
  const ex = exposed(x, z);
  if (!ex.length) continue;
  const isDoor = `${x},${z}` === doorKey;
  const isStreet = street(x, z);
  // base course: a stone band at the grade line (sill of the windows); where the slope buries the wall it is brick
  if (G <= 3) put(x, G, z, G <= 2 ? "stone_bricks" : "bricks");
  // storey: glass in frames where there is air behind, brick piers and spandrels between
  for (let y = G + 1; y <= 2; y++) {
    if (isDoor && y <= 3 && y >= G + 1) {
      put(x, y, z, "dark_oak_door", { facing: doorFacing, half: y === G + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = (x + z) % 3 === 0;
    const dirOk = ex.find((d) => airInside(x, z, y, d));
    if (isStreet && !pier && dirOk) put(x, y, z, "glass_pane", {});
    else if (isStreet && pier) put(x, y, z, "dark_oak_planks");
    else if (!pier && dirOk) put(x, y, z, "glass_pane", {});
    else put(x, y, z, "bricks");
  }
  // storey line / shopfront fascia on the top of the storey, then the parapet cap
  if (G <= 2 && !isDoor) put(x, 3, z, isStreet ? "dark_oak_planks" : "bricks");
  if (G <= 2 && isDoor) put(x, 3, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(x, 4, z, "smooth_stone");                                    // parapet cornice
}

// ---- pass 3: the roof deck over every interior and remaining cell at the roof level ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!placed.has(`${x},4,${z}`)) put(x, 4, z, "gray_concrete");
}

// ---- pass 4: warm light: hanging lanterns in the low interior, glowstone behind some glass ----
let glow = 0;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const G = F.get(`${x},${z}`), ex = exposed(x, z);
  if (!ex.length && G <= 1 && (x * 2 + z * 3) % 7 === 0 && !placed.has(`${x},2,${z}`))
    put(x, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  if (ex.length && placed.get(`${x},${G + 1},${z}`)?.block === "glass_pane" && G + 1 <= 2) {
    const d = ex.find((dd) => airInside(x, z, G + 1, dd));
    if (d && glow++ % 4 === 0) {
      const [dx, dz] = DIRS[d]; const ix = x - dx, iz = z - dz;
      if (!placed.has(`${ix},${G + 1},${iz}`)) put(ix, G + 1, iz, "glowstone");
    }
  }
}

// ---- pass 5: roof plant: two small boxes on the flat roof, each standing on the deck ----
const plant = [];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (plant.length >= 2) break;
  const sq = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (sq.every(([a, b]) => inside(a, b) && exposed(a, b).length === 0 && F.get(`${a},${b}`) <= 2) && x > 6 && z > 3 && z < 13 && (plant.length === 0 || x > plant[0][0] + 4 || x < plant[0][0] - 4)) {
    plant.push([x, z]);
    for (const [a, b] of sq) put(a, ROOF, b, "stone_bricks");
  }
}

// connect panes to the solid blocks beside them (no pane post standing alone in a run of wall)
for (const [k, v] of placed) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const st = {};
  for (const [name, [dx, dz]] of [["north", [0, -1]], ["south", [0, 1]], ["east", [1, 0]], ["west", [-1, 0]]]) {
    const n = at(x + dx, y, z + dz);
    st[name] = n ? "true" : "false";
  }
  placed.set(k, { block: "glass_pane", state: { ...st, waterlogged: "false" } });
  g.set(x, y, z, "glass_pane", { ...st, waterlogged: "false" });
}

const info = g.save(OUT);
console.log(`saved ${OUT}: ${info.blocks} blocks, ${info.palette} palette entries; street door at ${door ? `${door[0]},${door[1]}` : "none"}; roof ${ROOF}; lanterns ${[...placed.values()].filter((v) => v.block === "lantern").length}; glowstone ${[...placed.values()].filter((v) => v.block === "glowstone").length}`);
