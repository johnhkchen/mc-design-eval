// Way 910658675: a three-storey Edwardian brick shop-top building (c. 1910), the Auckland main-street type of Karangahape
// Road and Queen Street. Brick walls, a painted-render (smooth quartz) string course at each floor line and a cornice,
// a timber-fascia shopfront with one door, sash windows on the upper floors, a flat roof with a parapet and an
// air-conditioning unit. Built on the footprint only; each cell stands on its ground, every floor slab and roof on the
// walls under it, and the interior is air behind the glass with a slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_910658675.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const plan = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { x, z, ground, roof }]));
const inside = (x, z) => plan.has(`${x},${z}`);
const OUT = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const outFaces = (x, z) => Object.keys(OUT).filter((f) => !inside(x + OUT[f][0], z + OUT[f][1]));
const DOOR = "3,0";                                  // the entrance: a non-corner ground cell on the north face

const H = 24;
const maxRoof = Math.max(...cells.map((c) => c[3]));
const g = new Voxels([6, Math.max(H, maxRoof + 2), 7]);

const BRICK = "bricks", BASE = "stone_bricks", QUARTZ = "smooth_quartz", FLOOR = "smooth_stone", ROOF = "light_gray_concrete";
const pane = (x, z, face) => {
  // a pane joins the neighbours along its wall (solid or glass), so a row of windows reads as one band
  const along = face === "north" || face === "south" ? ["west", "east"] : ["north", "south"];
  const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const side of along) { const [dx, dz] = OUT[side]; st[side] = inside(x + dx, z + dz) ? "true" : "false"; }
  return ["glass_pane", st];
};
const put = (x, y, z, [block, state]) => g.set(x, y, z, block, state);

// pass 1: foundations, floors, roof cover, walls, windows and the shopfront
for (const { x, z, ground, roof } of plan.values()) {
  const faces = outFaces(x, z), edge = faces.length > 0, corner = faces.length > 1;
  const face = faces[0];
  const win = edge && !corner && (x + z) % 2 === 0;           // bays alternate window and pier along each wall
  for (let y = 0; y <= ground; y++) put(x, y, z, [BASE]);     // foundation: solid from y 0 up to this cell's ground
  put(x, 4, z, [FLOOR]); put(x, 8, z, [FLOOR]);               // a floor slab per storey, on the walls and the interior
  put(x, roof, z, [ROOF]);                                    // flat roof cover
  if (!edge) continue;
  for (let y = ground + 1; y < roof; y++) {
    if (y === 4 || y === 8) put(x, y, z, [QUARTZ]);           // string courses at the floor lines
    else if (y <= 3) {                                        // ground storey: shopfront or entrance
      if (`${x},${z}` === DOOR && y === 1) put(x, y, z, ["oak_door", { facing: face, half: "lower", hinge: "left", open: "false", powered: "false" }]);
      else if (`${x},${z}` === DOOR && y === 2) put(x, y, z, ["oak_door", { facing: face, half: "upper", hinge: "left", open: "false", powered: "false" }]);
      else if (corner) put(x, y, z, [BASE]);
      else if (y === 1) put(x, y, z, [BASE]);                 // base course above the street
      else if (y === 2) put(x, y, z, pane(x, z, face));       // shop glass
      else put(x, y, z, ["dark_oak_planks"]);                 // timber fascia over the shopfront
    }
    else if (y === 5 || y === 6 || y === 9 || y === 10) put(x, y, z, win ? pane(x, z, face) : [BRICK]);
    else if (y === 7) put(x, y, z, win ? [ "white_terracotta" ] : [BRICK]);   // painted sash lintel
  }
  put(x, roof, z, [QUARTZ]);                                  // cornice
  put(x, roof + 1, z, ["smooth_quartz_slab", { type: "bottom", waterlogged: "false" }]);   // parapet cap
}

// pass 2: warm light behind some upper windows, lanterns in the interior, a unit on the roof
const interior = [...plan.values()].filter((c) => !outFaces(c.x, c.z).length);
for (const { x, z, roof } of plan.values()) {
  const faces = outFaces(x, z);
  if (!faces.length || faces.length > 1 || (x + z) % 2 !== 0) continue;
  if ((x * 3 + z) % 4 !== 0) continue;
  const [dx, dz] = OUT[faces[0]];
  const ix = x - dx, iz = z - dz;                               // the cell inside, behind the glass
  if (inside(ix, iz) && outFaces(ix, iz).length === 0) g.set(ix, 5, iz, "glowstone");   // sits on the floor slab at y 4
}
for (const { x, z, roof } of interior) {
  g.set(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });        // under the ground-storey ceiling (y 4)
  if (roof - 1 > 9) g.set(x, 10, z, "lantern", { hanging: "true", waterlogged: "false" });  // under the roof (y 11)
}
for (const { x, z, roof } of interior.slice(0, 2)) g.set(x, roof + 1, z, "iron_block");     // air-conditioning unit

// check: every block stands on a block (or hangs from one, for lanterns)
let loose = 0;
g.forEachCell((i) => {
  const X = g.size[0], Y = g.size[1], x = i % X, y = Math.floor(i / X) % Y, z = Math.floor(i / (X * Y));
  if (y === 0) return;
  const hangs = g.get(x, y, z).block.endsWith("lantern") && g.get(x, y + 1, z);   // a hanging lantern holds up from above
  // a floor slab over an interior room spans between the walls, so a neighbour in the same course holds it up too
  const spans = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => g.get(x + dx, y, z + dz));
  if (!g.get(x, y - 1, z) && !hangs && !spans) loose++;
});
if (loose) console.warn(`${loose} cells with nothing under them`);
console.log(g.save(`${DIR}/way_910658675.nbt`));
