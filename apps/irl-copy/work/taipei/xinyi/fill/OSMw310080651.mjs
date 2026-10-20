import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// United Hotel, Xinyi. Read as a 1970s-80s Taipei mid-rise hotel: about 15 storeys
// of 5 blocks, buff-white stone and quartz spandrels with tinted glazing, a
// stone base course, a quartz coping, and a plant penthouse on the roof.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw310080651";
const W = 38, D = 34, H = 90;
const STOREY = 5;
const ROOF_Y = 75;   // roof slab, top of storey 14
const TOP = 77;      // parapet top, about 78 blocks above lowest ground

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gc] of cells) ground.set(`${x},${z}`, gc);
const has = (x, z) => ground.has(`${x},${z}`);
const gr = (x, z) => ground.get(`${x},${z}`);

// Outward faces: a neighbour outside the footprint means this cell is on the facade.
const FACES = [
  { name: "north", dx: 0, dz: -1, facing: "north" },
  { name: "south", dx: 0, dz: 1, facing: "south" },
  { name: "west", dx: -1, dz: 0, facing: "west" },
  { name: "east", dx: 1, dz: 0, facing: "east" },
];
const outwardFaces = (x, z) => FACES.filter((f) => !has(x + f.dx, z + f.dz));
const isEdge = (x, z) => outwardFaces(x, z).length > 0;

const g = new Voxels([W, H, D]);

const STONE = "stone_bricks";
const BAND = "smooth_quartz";
const PILLAR = "white_concrete";
const CORNER = "quartz_pillar";
const GLASS = "light_blue_stained_glass_pane";
const FLOOR = "light_gray_concrete";

function edgeOr(x, z, a, b) {
  return isEdge(x, z) ? a : b;
}

// Pass 1: foundation, base, floor slabs, facade and interior shell
for (const [x, z, gc] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gc; y++) g.set(x, y, z, STONE);

  // Ground-level slab
  g.set(x, gc, z, STONE);

  // Interior floor slab at every storey line above ground, and the roof slab
  for (let y = Math.ceil(gc / STOREY) * STOREY; y <= ROOF_Y; y += STOREY) {
    if (y >= gc) g.set(x, y, z, FLOOR);
  }
  g.set(x, ROOF_Y, z, edgeOr(x, z, BAND, FLOOR));

  if (!isEdge(x, z)) continue;

  const firstLine = Math.ceil(gc / STOREY) * STOREY;
  const faces = outwardFaces(x, z);
  const isCorner = faces.length >= 2;
  const alongNS = faces.some((f) => f.dz !== 0);
  const p = alongNS ? x : z;

  for (let y = gc; y <= TOP; y++) {
    if (y >= ROOF_Y) { g.set(x, y, z, BAND); continue; }   // roof line and parapet
    if (y < firstLine) { g.set(x, y, z, STONE); continue; } // base course
    const r = y % STOREY;
    if (r === 0 || r === 4) { g.set(x, y, z, BAND); continue; } // spandrels
    // Window zone r in 1..3
    if (isCorner) g.set(x, y, z, CORNER);
    else if (p % 4 === 0) g.set(x, y, z, PILLAR);
    else g.set(x, y, z, GLASS);
  }
}

// Pass 2: shopfront on the ground storey along the street (north) side
// and a clear entrance: quartz surround, doors, and a lit lintel.
{
  const northEdge = cells
    .filter(([x, z]) => !has(x, z - 1))
    .sort((a, b) => Math.abs(a[0] - W / 2) - Math.abs(b[0] - W / 2));
  if (northEdge.length) {
    const [ex, ez, egc] = northEdge[0];
    const base = egc;
    const doorStates = (half) => ({
      facing: "north", half, hinge: "left", open: "false", powered: "false",
    });
    // Recess the threshold: clear the entrance cells in the window zone
    for (const dx of [-1, 0, 1]) {
      const cx = ex + dx;
      if (!has(cx, ez)) continue;
      const cgc = gr(cx, ez);
      // Lintel and jambs in quartz
      g.set(cx, base + 3, ez, BAND);
      if (dx !== 0) {
        g.set(cx, base + 1, ez, BAND);
        g.set(cx, base + 2, ez, BAND);
      }
    }
    g.set(ex, base, ez, "oak_door", doorStates("lower"));
    g.set(ex, base + 1, ez, "oak_door", doorStates("upper"));
    g.set(ex, base + 2, ez, "glowstone");
  }
}

// Pass 3: warm lights set back behind some windows (glowstone in the room)
for (const [x, z] of cells) {
  if (!isEdge(x, z)) continue;
  const f = outwardFaces(x, z)[0];
  const ix = x - f.dx, iz = z - f.dz;
  if (!has(ix, iz) || isEdge(ix, iz)) continue;
  const igc = gr(ix, iz);
  for (let k = 1; k <= 13; k++) {
    const y = k * STOREY + 2;
    if (y <= igc) continue;
    if (((x * 7 + z * 13 + k * 5) % 5) !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 4: rooftop plant penthouse with a stepped top
for (let x = 14; x <= 23; x++) {
  for (let z = 12; z <= 21; z++) {
    if (!has(x, z) || isEdge(x, z)) continue;
    g.set(x, 76, z, "light_gray_concrete");
    if (x > 15 && x < 22 && z > 13 && z < 20) g.set(x, 77, z, "gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
