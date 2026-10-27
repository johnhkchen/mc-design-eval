// Way 948317633: a 1930s interwar commercial block, three storeys on a two-storey podium. Cream plastered
// walls, stone string courses, a dark timber shopfront and fascia, and a flat roof with a penthouse. The
// lidar roof heights (7 to 13) are smoothed into two tiers: the podium parapet at y 8, the tower parapet at y 13.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_948317633.cells.json`, "utf8"));   // [x, z, ground, roof]

const foot = new Set(cells.map(([x, z]) => `${x},${z}`));
const inF = (x, z) => foot.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, name: "north" }, { dx: 0, dz: 1, name: "south" },
  { dx: -1, dz: 0, name: "west" }, { dx: 1, dz: 0, name: "east" },
];
// the tower: a 7 x 9 core on the 11 x 13 footprint; everything else is the two-storey podium
const tower = (x, z) => x >= 2 && x <= 8 && z >= 2 && z <= 10;
const perim = (x, z) => DIRS.some((d) => !inF(x + d.dx, z + d.dz) || (tower(x, z) && !tower(x + d.dx, z + d.dz)));
// the last solid row of each column: podium 7 (deck) / 8 (parapet), tower 12 (deck) / 13 (parapet)
const H = (x, z) => (tower(x, z) ? (perim(x, z) ? 13 : 12) : (perim(x, z) ? 8 : 7));
// a face is open at row r when the cell beside it is outside the footprint or lower than r
const exposed = (x, z, d, r) => r <= H(x, z) && (!inF(x + d.dx, z + d.dz) || r > H(x + d.dx, z + d.dz));
const exposures = (x, z, r) => DIRS.filter((d) => exposed(x, z, d, r));

// row bands: plinth 0, ground fascia 3, string courses 4, 8 (tower) and 11, cornices 7 and 12, parapet 13
const BAND = { 0: "stone_bricks", 3: "dark_oak_planks", 4: "stone_bricks", 7: "chiseled_stone_bricks", 11: "stone_bricks", 12: "chiseled_stone_bricks", 13: "smooth_stone" };
const WINDOW = { 1: "ground", 2: "ground", 5: "upper", 6: "upper", 9: "upper", 10: "upper" };
const DOOR = { x: 0, z: 5 };   // the street entrance on the west face

const bandAt = (x, z, r) => (r === 8 ? (tower(x, z) ? "stone_bricks" : "smooth_stone") : BAND[r] ?? null);
const isDoor = (x, z, r) => x === DOOR.x && z === DOOR.z && (r === 1 || r === 2);
const paneState = (x, z, d, r) => Object.fromEntries(DIRS.map((c) => {
  const along = d.dx ? c.dz !== 0 : c.dx !== 0;   // north/south on the west and east faces, east/west on north and south
  const nx = x + c.dx, nz = z + c.dz;
  return [c.name, along && inF(nx, nz) && r <= H(nx, nz) ? "true" : "false"];
}));

// the block for one exposed cell at row r: a band, a corner pier, a pier, a door or a pane
function facade(x, z, r, ex) {
  const band = bandAt(x, z, r);
  const ground = WINDOW[r] === "ground" || r === 0 || r === 3;
  if (ex.length >= 2) return band ? { block: band } : ground ? { block: "polished_andesite" } : { block: "quartz_pillar", state: { axis: "y" } };
  if (band) return { block: band };
  if (!WINDOW[r]) return { block: "quartz_block" };
  const d = ex[0], k = d.dx ? z : x;
  if (k % 3 === 0) return { block: ground ? "polished_andesite" : "quartz_block" };   // a pier every third cell
  if (isDoor(x, z, r) && d.name === "west") {
    return { block: "dark_oak_door", state: { facing: "west", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" } };
  }
  return { block: "glass_pane", state: paneState(x, z, d, r) };
}

const g = new Voxels([11, 26, 13]);
const openings = [];   // the glazed cells, for the air gap and the lamp behind each pane
const cols = cells.map(([x, z]) => [x, z]);

// pass 1: solid from the ground up to each column's roof, with its facade on the open faces
for (const [x, z] of cols) {
  const h = H(x, z);
  for (let r = 0; r <= h; r++) {
    const ex = exposures(x, z, r);
    if (ex.length === 0) { g.set(x, r, z, r === h ? "smooth_stone" : "stone"); continue; }
    const f = facade(x, z, r, ex);
    g.set(x, r, z, f.block, f.state);
    if (ex.length === 1 && (f.block === "glass_pane" || f.block === "dark_oak_door")) openings.push({ x, z, r, d: ex[0], k: ex[0].dx ? z : x });
  }
}

// pass 2: the air gap behind each pane, with a warm lamp in about one window in three; the vestibule behind the door
for (const { x, z, r, d, k } of openings) {
  const cx = x - d.dx, cz = z - d.dz;
  if (!inF(cx, cz) || exposures(cx, cz, r).length) continue;
  if (isDoor(x, z, r)) { g.set(cx, r, cz, "air"); continue; }
  // lit per window, not per row, so a lit pocket's lower row is never air under it
  const band = r <= 2 ? 0 : r <= 6 ? 1 : 2;
  const tierLit = (k + band + (tower(x, z) ? 3 : 0)) % 3 === 0;
  if (tierLit) g.set(cx, r, cz, WINDOW[r] === "ground" ? "shroomlight" : "glowstone");
  else g.set(cx, r, cz, "air");
}

// the penthouse stair and lift core on the tower roof
for (let x = 4; x <= 6; x++) for (let z = 5; z <= 7; z++) {
  if (!inF(x, z)) continue;
  g.set(x, 13, z, "quartz_block");
  g.set(x, 14, z, "smooth_stone");
}

// every block should stand on a block: report any that do not
const hanging = [];
for (let y = 1; y < 26; y++) for (const [x, z] of cols) if (g.get(x, y, z) && !g.get(x, y - 1, z)) hanging.push([x, y, z]);
const pockets = openings.length;
const st = g.save(`${DIR}/way_948317633.nbt`);
console.log(`cells ${cols.length}, openings ${pockets}, blocks ${st.blocks}, palette ${st.palette}, hanging ${hanging.length}`);
if (hanging.length) console.log("hanging at (x,y,z):", JSON.stringify(hanging.slice(0, 40)));
