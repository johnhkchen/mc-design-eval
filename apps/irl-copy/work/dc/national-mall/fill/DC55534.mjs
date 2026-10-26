// DC55534: a three-tier Federal-style brick office block with calcite trim, on the Mall's north-east flank.
// Footprint 10 x 8. Lidar roof heights step 4 (wings) / 5 (flank) / 6 (core); each tier is solid brick with
// glazed bays on the perimeter, a 1-block air gap behind the glass (lit in some bays), and a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55534.cells.json`, "utf8"));
const X = 10, Z = 8, Y = 17;

const FOUND = "stone_bricks", WALL = "bricks", TRIM = "calcite", DECK = "smooth_stone", SLAB = "stone_bricks";
const GLASS = "glass_pane";

const byXZ = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const roofAt = (x, z) => byXZ.get(`${x},${z}`).roof;

// one storey line per tier: the string course of the 6-tier core, the cornice on every tier
const stringY = (r) => (r >= 6 ? 3 : null);
const cornice = (r) => r - 1;
// glazed rows: the two ground-storey rows, plus the upper storey where the tier has one
const winRows = (r) => [1, 2, r >= 6 ? 4 : r === 5 ? 3 : null].filter((v) => v !== null);

const g = new Voxels([X, Y, Z]);
const lit = (x, y, z) => (x + 2 * y + 3 * z) % 3 === 0;   // about a third of the glazed bays carry a warm light

// interior air gap behind each glazed bay; floor slabs and walls stay solid elsewhere
const backCell = (x, z, face) => {
  if (face === "N") return [x, 1];
  if (face === "S") return [x, Z - 2];
  if (face === "W") return [1, z];
  return [X - 2, z];
};
const gaps = [];

for (const [key, { roof: r }] of byXZ) {
  const [x, z] = key.split(",").map(Number);
  const onN = z === 0, onS = z === Z - 1, onW = x === 0, onE = x === X - 1;
  const perim = onN || onS || onW || onE;
  const corner = (onN || onS) && (onW || onE);
  const face = onN ? "N" : onS ? "S" : onW ? "W" : onE ? "E" : null;
  const bayAt = (y) => {
    if (!perim || corner) return null;
    if (face === "S" && x === 4 && (y === 1 || y === 2)) return "door";   // the entrance faces the street (south)
    const k = face === "N" || face === "S" ? x : z;
    return k % 2 === 1 ? "window" : "pier";
  };
  const glazed = winRows(r);

  g.set(x, 0, z, FOUND);                          // foundation / plinth on the lowest ground
  for (let y = 1; y < r; y++) {
    if (y === cornice(r)) { g.set(x, y, z, perim ? TRIM : DECK); continue; }
    if (y === stringY(r)) { g.set(x, y, z, perim ? TRIM : SLAB); continue; }
    if (!perim) { g.set(x, y, z, WALL); continue; }
    if (corner) { g.set(x, y, z, TRIM); continue; }
    if (glazed.includes(y)) {
      const b = bayAt(y);
      if (b === "door") {
        g.set(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (b === "window") {
        const pane = face === "N" || face === "S"
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        g.set(x, y, z, GLASS, pane);
        gaps.push({ x, y, z, face, lit: lit(x, y, z), ground: y <= 2 });
        continue;
      }
    }
    g.set(x, y, z, WALL);
  }
  // an entrance hood: the dark-oak canopy over the street door sits in the cornice row of the bay
  if (face === "S" && x >= 3 && x <= 5) g.set(x, cornice(r), z, "dark_oak_slab", { type: "top", waterlogged: "false" });
}

// the air gap behind each glazed bay (or a warm light in its place)
for (const w of gaps) {
  const [bx, bz] = backCell(w.x, w.z, w.face);
  if (w.lit) g.set(bx, w.y, bz, w.ground ? "glowstone" : "shroomlight");
  else g.set(bx, w.y, bz, "air");
}

// the core's roof plant: a 2 x 2 penthouse on the 6-tier, a skylight-less rooftop box
for (const [x, z] of [[3, 3], [4, 3], [3, 4], [4, 4]]) g.set(x, roofAt(x, z), z, "chiseled_stone_bricks");

const out = `${DIR}/DC55534.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ out, ...info }));
