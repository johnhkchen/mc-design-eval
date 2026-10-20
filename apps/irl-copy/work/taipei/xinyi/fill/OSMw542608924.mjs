import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542608924";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 20 x 23 x 20 volume: roof about 11 blocks above the lowest ground.
const W = 20, H = 23, D = 20;
const g = new Voxels([W, H, D]);

// Footprint lookup
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));

// Two storeys of 5 blocks, flat roof at R, parapet at R+1 (~11 above lowest ground).
const L0 = Math.min(minG, 10);   // lowest ground (clamped so the parapet fits the 23-high volume)
const MID = L0 + 5;              // second-floor belt course / slab
const R = L0 + 10;               // roof slab / cornice
const TOP = R + 1;               // parapet

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Which face of an edge cell is exposed, and the inward offset.
function faceOf(x, z) {
  if (!has(x - 1, z)) return { axis: "x", out: "west", dx: 1, dz: 0, u: z };
  if (!has(x + 1, z)) return { axis: "x", out: "east", dx: -1, dz: 0, u: z };
  if (!has(x, z - 1)) return { axis: "z", out: "north", dx: 0, dz: 1, u: x };
  return { axis: "z", out: "south", dx: 0, dz: -1, u: x };
}

const paneProps = (axis) =>
  axis === "x"
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const edge = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

  // Floor slabs run across the whole footprint (no empty course under a tier).
  for (const yy of [MID, R]) {
    if (yy >= gr) put(x, yy, z, edge ? "smooth_quartz" : "light_gray_concrete");
  }

  // Roof equipment on the flat roof (interior cells only).
  if (!edge && R >= gr) {
    if (x % 6 === 3 && z % 6 === 3) put(x, TOP, z, "iron_block");
    else if (x % 6 === 3 && z % 6 === 4) put(x, TOP, z, "chain");
  }

  if (!edge) continue;

  const f = faceOf(x, z);
  const { u } = f;
  const isEntrance = f.out === "south" && x === 10;

  // Facade and cornice band
  for (let y = gr; y <= TOP; y++) {
    if (y === TOP) {                       // parapet
      put(x, y, z, "white_concrete");
      continue;
    }
    if (y === R) {                         // cornice
      put(x, y, z, "smooth_quartz");
      continue;
    }
    if (y === MID) {                       // belt course
      put(x, y, z, "smooth_quartz");
      continue;
    }

    if (y < MID) {
      // Ground storey: plinth, then shopfront or entrance
      if (y === gr) {
        put(x, y, z, "polished_granite");
        continue;
      }
      if (isEntrance && x === 10) {
        if (y === gr) { put(x, y, z, "dark_oak_door", { facing: f.out, half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 1) { put(x, y, z, "dark_oak_door", { facing: f.out, half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
        if (y === gr + 2) { put(x, y, z, "smooth_quartz"); continue; }
      }
      if (isEntrance && (x === 9 || x === 11) && y === gr + 2) {
        put(x, y, z, "smooth_quartz");
        continue;
      }
      if (u % 4 === 0) {
        put(x, y, z, "quartz_pillar");
      } else {
        put(x, y, z, "glass_pane", paneProps(f.axis));
        // warm light behind some shopfront glass
        if ((u + x + z + y) % 5 === 0) {
          const ix = x + f.dx, iz = z + f.dz;
          if (has(ix, iz) && !(!has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1)) && y >= gAt(ix, iz)) {
            put(ix, y, iz, "glowstone");
          }
        }
      }
    } else {
      // Upper storey: sill and lintel bands, tinted glazing in mullioned bays
      if (y === MID + 1 || y === R - 1) {
        put(x, y, z, "smooth_quartz");
        continue;
      }
      if (u % 4 === 1 || u % 4 === 2) {
        put(x, y, z, "light_blue_stained_glass_pane", paneProps(f.axis));
        if ((u * 3 + y) % 7 === 0) {
          const ix = x + f.dx, iz = z + f.dz;
          if (has(ix, iz) && y >= gAt(ix, iz)) {
            const interiorEdge = !has(ix - 1, iz) || !has(ix + 1, iz) || !has(ix, iz - 1) || !has(ix, iz + 1);
            if (!interiorEdge) put(ix, y, iz, "glowstone");
          }
        }
      } else {
        put(x, y, z, "white_concrete");
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
