import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 1970s-80s concrete shophouse-office: two storeys over a ground-floor shopfront,
// white tiled concrete frame with a light-grey cornice, glass bays, red sign band on the street front,
// flat roof with a parapet and a small rooftop plant box.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617858";
const W = 9, H = 23, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

const key = (x, z) => `${x},${z}`;
const footprint = new Map();
for (const [x, z, gr] of cells) footprint.set(key(x, z), Math.max(0, Math.round(gr)));
const has = (x, z) => footprint.has(key(x, z));
const outs = (x, z) => ({ w: !has(x - 1, z), e: !has(x + 1, z), n: !has(x, z - 1), s: !has(x, z + 1) });
const isPerim = (o) => o.w || o.e || o.n || o.s;

// Front = south-facing edge (highest z). Door sits on the front cell nearest the middle.
const frontCells = [...footprint.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => outs(x, z).s);
let door = null;
if (frontCells.length) {
  frontCells.sort((a, b) => Math.abs(a[0] - 4) - Math.abs(b[0] - 4));
  door = { x: frontCells[0][0], z: frontCells[0][1] };
}

const glassPane = (xFace) =>
  xFace
    ? { b: "glass_pane", p: { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" } }
    : { b: "glass_pane", p: { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" } };

// Returns list of {b, p} for a perimeter cell at height y (gr = local ground level, 0..3).
function wallSpec(x, z, y, gr, o) {
  const xFace = o.w || o.e;
  const zFace = o.n || o.s;
  const corner = xFace && zFace;
  const isDoor = door && door.x === x && door.z === z && o.s;
  const LG = { b: "light_gray_concrete" };
  const WC = { b: "white_concrete" };

  if (y === 10) return [LG];                       // cornice course
  if (y === 11) return [WC];                       // parapet
  if (y === 5) return [{ b: "smooth_stone" }];     // storey line
  if (y === gr + 1 && y < 5) {                     // plinth, or door bottom
    if (isDoor)
      return [{ b: "dark_oak_door", p: { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" } }];
    return [{ b: "polished_andesite" }];
  }
  if (isDoor && y === gr + 2 && y < 5)
    return [{ b: "dark_oak_door", p: { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" } }];

  if (y >= 6) {                                    // upper storey
    if (y === 6 || y === 9 || corner) return [WC];
    const s = xFace ? z : x;
    if (s % 2 === 0) return [LG];                  // mullion pier
    if (y === 7 || y === 8) return [glassPane(xFace)];
    return [WC];
  }

  // ground storey, remaining rows
  if (y === 4) return [o.s && !corner ? { b: "red_concrete" } : WC]; // sign band / spandrel
  if (corner) return [WC];
  if (o.s) return [glassPane(false)];            // shopfront glazing on street front
  const s = xFace ? z : x;
  if (s % 2 === 0) return [LG];
  return [glassPane(xFace)];
}

for (const [k, rawGround] of footprint) {
  const [x, z] = k.split(",").map(Number);
  const top = rawGround;                              // foundation top (solid fill below)
  const gr = Math.min(3, rawGround);                  // body layout base
  const o = outs(x, z);
  const perim = isPerim(o);

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < top; y++) put(x, y, z, "stone_bricks");

  // floor slabs and roof deck
  put(x, gr, z, "smooth_stone");
  put(x, 5, z, "smooth_stone");
  put(x, 10, z, "light_gray_concrete");

  if (perim) {
    for (let y = gr + 1; y <= 11; y++) {
      if (y === 5 && !perim) continue;
      const specs = wallSpec(x, z, y, gr, o);
      for (const s of specs) put(x, y, z, s.b, s.p);
    }
  }
}

// Warm lights behind some glass (inside the air gap, one cell in from the wall).
for (const [k] of footprint) {
  const [x, z] = k.split(",").map(Number);
  const o = outs(x, z);
  if (!isPerim(o) || (o.w || o.e) && (o.n || o.s)) continue;
  let dx = 0, dz = 0;
  if (o.w) dx = 1; else if (o.e) dx = -1; else if (o.n) dz = 1; else if (o.s) dz = -1;
  const ix = x + dx, iz = z + dz;
  if (!has(ix, iz) || isPerim(outs(ix, iz))) continue;
  const along = (o.w || o.e) ? z : x;
  if (o.s && door && x === door.x) continue;
  if (along % 6 === 1) put(ix, 7, iz, "glowstone");          // upper storey
  if (o.s && x % 3 === 2) put(ix, 2, iz, "glowstone");       // shopfront
}

// Rooftop plant: a small grey box with an iron cap on the interior roof.
for (let x = 2; x <= 3; x++) {
  for (let z = 5; z <= 7; z++) {
    if (!has(x, z) || isPerim(outs(x, z))) continue;
    put(x, 11, z, "gray_concrete");
    put(x, 12, z, "gray_concrete");
    put(x, 13, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
