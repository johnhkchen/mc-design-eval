import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370537817";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 24, H = 47, D = 58;
const ROOF = 34;          // top parapet block index; roof surface at y=35
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, gr] of cells) {
  fp.set(key(x, z), Math.max(0, Math.min(ROOF - 6, Math.round(gr))));
}
const has = (x, z) => fp.has(key(x, z));

const FACE = {
  N: { dx: 0, dz: -1, name: "north" },
  S: { dx: 0, dz: 1, name: "south" },
  W: { dx: -1, dz: 0, name: "west" },
  E: { dx: 1, dz: 0, name: "east" },
};

function S(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Facade block for an exposed ring cell at absolute height y
function facade(x, z, y, gg, ex) {
  const xFace = ex.includes("E") || ex.includes("W");
  const pk = xFace ? (ex.includes("E") ? "E" : "W") : (ex.includes("S") ? "S" : "N");
  const u = xFace ? z : x;

  // Corner quoins: a stacked, alternating column at every corner of the ring
  const cornerX = ex.includes("E") || ex.includes("W");
  const cornerZ = ex.includes("N") || ex.includes("S");
  const corner = cornerX && cornerZ;

  if (y === ROOF) return S(x, y, z, "smooth_quartz");
  if (y === ROOF - 1) return S(x, y, z, "light_gray_concrete");
  if (y === gg) return S(x, y, z, "polished_granite");

  if (corner) {
    // quoins alternate block-by-block so the corners read as stone piers
    const q = (y + x + z) % 2 === 0 ? "white_concrete" : "light_gray_concrete";
    return S(x, y, z, q);
  }

  if (y < 5) {
    // Ground-floor base and shopfront band
    if (y === 4) return S(x, y, z, "light_gray_concrete");
    if (y === gg + 1 && gg + 1 <= 1) return S(x, y, z, "polished_granite");

    // Recessed double entrance on the south frontage (two-leaf door, x = 11..12)
    if (z === D - 1 && (x === 11 || x === 12) && (y === gg + 1 || y === gg + 2) && gg + 2 <= 3) {
      const half = y === gg + 1 ? "lower" : "upper";
      const hinge = x === 11 ? "left" : "right";
      return S(x, y, z, "dark_oak_door", {
        facing: FACE.S.name, half, hinge, open: "false", powered: "false",
      });
    }
    if (u % 4 === 0) return S(x, y, z, "white_concrete");
    return S(x, y, z, "glass_pane");
  }

  // Upper storeys: floor lines and spandrels in concrete, window rows in tinted glass
  const r = y % 5;
  if (r === 0 || r === 4) return S(x, y, z, "light_gray_concrete");
  if (u % 4 === 0) return S(x, y, z, "white_concrete");
  return S(x, y, z, "cyan_stained_glass_pane");
}

// Pass 1: foundation, interior floors and air, facade
for (const [x, z] of cells) {
  const gg = fp.get(key(x, z));
  const ex = Object.keys(FACE).filter((k) => !has(x + FACE[k].dx, z + FACE[k].dz));
  const ring = ex.length > 0;

  for (let y = 0; y <= ROOF; y++) {
    if (y < gg) { S(x, y, z, "stone"); continue; }
    if (!ring) {
      if (y === ROOF) S(x, y, z, "gray_concrete");
      else if (y === gg || y % 5 === 0) S(x, y, z, "light_gray_concrete");
      continue;
    }
    facade(x, z, y, gg, ex);
  }
}

// Pass 2: warm lights behind some windows (interior cell behind the glass)
for (const [x, z] of cells) {
  const gg = fp.get(key(x, z));
  const ex = Object.keys(FACE).filter((k) => !has(x + FACE[k].dx, z + FACE[k].dz));
  if (ex.length === 0) continue;
  const xFace = ex.includes("E") || ex.includes("W");
  const pk = xFace ? (ex.includes("E") ? "E" : "W") : (ex.includes("S") ? "S" : "N");
  const u = xFace ? z : x;
  const ix = x - FACE[pk].dx;
  const iz = z - FACE[pk].dz;
  if (!has(ix, iz)) continue;

  for (let k = 1; k <= 6; k++) {
    const y = 5 * k + 2;
    if (y > ROOF - 2) break;
    if ((u + k * 3) % 6 === 0) S(ix, y, iz, "shroomlight");
  }
  // one warm lamp in the shopfront behind the glass
  if (gg + 2 <= 3 && u % 8 === 5) S(ix, gg + 2, iz, "glowstone");
}

// Rooftop plant enclosure (inset from the edges, sits on the roof slab)
for (let x = 4; x <= 19; x++) {
  for (let z = 8; z <= 49; z++) {
    if (!has(x, z)) continue;
    const edge = x === 4 || x === 19 || z === 8 || z === 49;
    for (let y = 35; y <= 37; y++) {
      if (edge) S(x, y, z, "light_gray_concrete");
    }
    S(x, 38, z, "stone_bricks");
  }
}

// Aviation mast and red beacon on the plant enclosure
const mx = 11, mz = 28;
if (has(mx, mz)) {
  for (let y = 39; y <= 43; y++) S(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  S(mx, 44, mz, "redstone_lamp", { lit: "true" });
}

g.save(`${DIR}/${ID}.nbt`);
