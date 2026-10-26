// 900 19th St NW: a 1920s-era stripped-classical commercial block, stone-faced, 8 storeys under a flat roof with a
// stepped massing (lidar tiers 17 / 14 / 11 / 10) and a penthouse. Solid massing; glass sits in 1-block window
// pockets with an air gap behind it, a floor band per storey, and some pockets lit. Front = the z=0 face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${HERE}/DC54659.cells.json`, "utf8"));

// Lidar roof -> flat tiers. Values under 9 are no-roof noise (zeros, a stray 7) and read as the lowest tier.
const tierOf = (r) => (r >= 16 ? 17 : r >= 12.5 ? 14 : r >= 10.5 ? 11 : 10);
// then a 3x3 majority over the footprint, so one-cell notches (lidar noise at the edges) don't stand as teeth
const raw = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, tierOf(r)]));
const foot = new Map();
for (const [x, z] of cells) {
  const votes = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const t = raw.get(`${x + dx},${z + dz}`); if (t !== undefined) votes.set(t, (votes.get(t) ?? 0) + (dx || dz ? 1 : 2));
  }
  const H = [...votes].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0][0];
  foot.set(`${x},${z}`, { H });
}
const inF = (x, z) => foot.has(`${x},${z}`);
const Hof = (x, z) => foot.get(`${x},${z}`)?.H ?? 0;

const SX = 17, SY = 29, SZ = 18;
const g = new Voxels([SX, SY, SZ]);

// outward normals; index 0 is the z=0 front
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const DOOR_X = 12;

// one pass per cell: classify each column's block, then pockets are carved after so glass always has air behind it
const pockets = [];
for (const [key, { H }] of foot) {
  const [x, z] = key.split(",").map(Number);
  // the face a block exposes: outside the footprint first (the street), else a step above a lower neighbour's roof
  const faceAt = (y) => {
    for (const d of DIRS) if (!inF(x + d[0], z + d[1])) return d;
    for (const d of DIRS) if (Hof(x + d[0], z + d[1]) <= y) return d;
    return null;
  };
  for (let y = 0; y < H; y++) {
    const d = faceAt(y);
    if (!d) {
      g.set(x, y, z, y === H - 1 ? "smooth_stone" : "stone");
      continue;
    }
    const coord = d[0] !== 0 ? z : x;     // along the facade
    const onGround = y >= 1 && y <= 3;
    const windowRow = y >= 4 && y % 3 === 2;
    let block = "quartz_bricks", state = null, glass = false;
    if (y === 0) block = "stone_bricks";                                 // plinth
    else if (y === H - 1) block = "smooth_quartz";                       // parapet coping
    else if (y === H - 2 && H >= 11) block = "chiseled_quartz_block";    // cornice
    else if (onGround) {
      if (y === 1) block = "stone_bricks";                              // shopfront bulkhead
      else { block = coord % 3 === 0 ? "quartz_pillar" : "light_blue_stained_glass"; glass = block.includes("glass"); }
    } else if (y >= 4 && y % 3 === 1) block = "smooth_quartz";           // floor band
    else if (windowRow) { block = coord % 3 === 0 ? "quartz_pillar" : "light_blue_stained_glass"; glass = block.includes("glass"); }
    // spandrel rows keep quartz_bricks
    const front = z === 0 && d[1] === -1;                                   // the street face
    if (front && x === DOOR_X && (y === 1 || y === 2)) { block = "dark_oak_door"; state = { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }; }
    if (front && x === DOOR_X && y === 3) { block = "lantern"; state = { hanging: "true", waterlogged: "false" }; }
    g.set(x, y, z, block, state);
    if (glass) pockets.push({ x, y, z, d, coord });
  }
}

// air gap behind each glass pane (only where the cell behind is interior), some pockets lit
for (const p of pockets) {
  const ix = p.x - p.d[0], iz = p.z - p.d[1];
  if (!inF(ix, iz) || Hof(ix, iz) <= p.y) continue;
  g.set(ix, p.y, iz, "air");
  if ((p.coord + p.y) % 4 === 0) g.set(ix, p.y, iz, "glowstone");
}

// penthouse on the 14-tier roof (cells 6..8 x 6..8 all sit on the 14 tier): two stone courses under a copper cap
for (let x = 6; x <= 8; x++) for (let z = 6; z <= 8; z++) {
  for (let y = 14; y <= 15; y++) g.set(x, y, z, y === 15 ? "copper_block" : "stone_bricks");
}

g.save(`${HERE}/DC54659.nbt`);
console.log("DC54659.nbt written, cells", g.count(), "palette", g.palette.length);
