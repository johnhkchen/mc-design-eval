import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86659.cells.json`, "utf8"));

const W = 14, H = 31, D = 7;
const g = new Voxels([W, H, D]);

// Footprint lookup
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { gr, roof });
const has = (x, z) => map.has(`${x},${z}`);

// Exterior faces and window logic
const faces = (x, z) => ({
  N: !has(x, z - 1),
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});
const isExt = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };
const isCorner = (x, z) => { const f = faces(x, z); return (f.N || f.S) && (f.W || f.E); };

// Building base line: lowest ground under footprint; storeys are 4 blocks
const B = Math.min(...cells.map(c => c[2]));
const STOREY = 4;

// Street face is z = 0; entrance bay on x = 6 with lanterns at x = 5 and 7
const DOOR_X = 6, DOOR_Z = 0;
const isEntryBay = (x, z) => z === DOOR_Z && (x === 5 || x === 6 || x === 7);

// A window sits on a non-corner exterior cell at an odd index along its wall
const isWin = (x, z) => {
  if (!isExt(x, z) || isCorner(x, z)) return false;
  const f = faces(x, z);
  const idx = (f.N || f.S) ? x : z;
  return idx % 2 === 1;
};

for (const [x, z, gr, roofRaw] of cells) {
  const top = Math.max(gr + 1, Math.min(roofRaw, H - 1));
  const ext = isExt(x, z);
  const corner = isCorner(x, z);
  const win = isWin(x, z);
  const doorCell = ext && x === DOOR_X && z === DOOR_Z;
  const entry = ext && isEntryBay(x, z);

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y <= top - 1; y++) {
    const rel = y - B;
    const k = Math.floor(rel / STOREY);
    const r = rel % STOREY;

    if (ext) {
      // Entrance door, two blocks tall, centred on the street face
      if (doorCell && (y === gr || y === gr + 1)) {
        g.set(x, y, z, "oak_door", {
          facing: "north",
          half: y === gr ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }

      // Hanging lanterns in the entrance bays, under the stone lintel
      if (entry && !doorCell && y === gr + 2 && k === 0) {
        g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
        continue;
      }

      // Parapet cap
      if (y === top - 1) {
        g.set(x, y, z, "stone_brick_wall");
        continue;
      }

      // Cornice band just under the parapet
      if (y === top - 2 && top - 2 > gr) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }

      let blk;
      if (k === 0) {
        // Shopfront: granite base, glazed bays, stone lintel
        if (r === 0) blk = "polished_granite";
        else if (r === 3) blk = entry ? "stone_bricks" : "smooth_stone";
        else blk = win ? "glass_pane" : "polished_granite";
      } else {
        // Upper storeys: floor line, glazed bays with stone piers, spandrel band
        if (r === 0) blk = "smooth_stone";
        else if (r === 3) blk = "light_gray_concrete";
        else blk = win ? "glass_pane" : "smooth_quartz";
      }
      g.set(x, y, z, blk);
    } else {
      // Interior: only floor slabs and the roof deck; air elsewhere (no interiors)
      if (y === top - 1) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }
      if (r === 0 || y === gr) {
        g.set(x, y, z, "smooth_stone");
        continue;
      }
      // Warm lights just behind glazed bays
      const nb = [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
      const nearWin = nb.some(([nx, nz]) => isWin(nx, nz));
      if (nearWin && (r === 1 || r === 2) && (x + z + k) % 3 === 0) {
        g.set(x, y, z, "glowstone");
      }
    }
  }

  // Roof deck where the cell is interior and its column had no room for the loop
  if (!ext && top - 1 < gr) g.set(x, top - 1, z, "smooth_stone");
}

g.save(`${DIR}/DC86659.nbt`);
