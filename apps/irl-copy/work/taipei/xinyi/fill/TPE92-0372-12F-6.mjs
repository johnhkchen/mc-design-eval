import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0372-12F-6";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 7 x 7 footprint, 81 high (world max height 760 via datapack)
const W = 7, H = 81, D = 7;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);

const B0 = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

const STOREYS = 12, STOREY_H = 5, PARAPET = 60, TOP = B0 + 69;

function normal(x, z) {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  if (!has(x + 1, z)) return "east";
  return null;
}

function paneProps(nrm) {
  if (nrm === "north" || nrm === "south") {
    return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  }
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

function along(x, z, nrm) {
  return nrm === "north" || nrm === "south" ? x - minX : z - minZ;
}

function inward(nrm) {
  switch (nrm) {
    case "north": return [0, 1];
    case "south": return [0, -1];
    case "west": return [1, 0];
    case "east": return [-1, 0];
  }
  return [0, 0];
}

// Glass alternates tone by storey for rhythm; every fourth storey line is a
// light band, and the ground storey gets a deeper plinth and a full-width lobby.
function glassId(k) {
  return k % 2 === 0 ? "light_blue_stained_glass_pane" : "cyan_stained_glass_pane";
}

// 1. Foundation
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "gray_concrete");
}

// 2. Superstructure
for (const [x, z, gr] of cells) {
  const nrm = normal(x, z);
  const penthouseCell = x >= 2 && x <= 4 && z >= 2 && z <= 4;
  const ringCell = penthouseCell && (x === 2 || x === 4 || z === 2 || z === 4);
  const centreCell = penthouseCell && x === 3 && z === 3;

  for (let y = Math.max(gr, B0); y <= TOP; y++) {
    if (y >= H) break;
    const rel = y - B0;

    if (nrm) {
      if (rel < STOREYS * STOREY_H) {
        const k = Math.floor(rel / STOREY_H);
        const off = rel % STOREY_H;
        const t = along(x, z, nrm);

        if (off === 0 && k === 0) {
          put(x, y, z, "polished_granite"); // plinth course at street level
        } else if (t % 2 === 0) {
          // mullion; the ground storey gets a stone pier instead of white
          put(x, y, z, k === 0 ? "stone_bricks" : "white_concrete");
        } else if (off >= 1 && off <= 3) {
          if (nrm === "south" && t === 3 && k === 0 && (off === 1 || off === 2)) {
            put(x, y, z, "dark_oak_door", {
              facing: "south",
              half: off === 1 ? "lower" : "upper",
              hinge: "left",
              open: "false",
              powered: "false",
            });
          } else if (k === 0) {
            // ground storey: lobby glazing, transom at the door bay
            put(x, y, z, "light_blue_stained_glass_pane", paneProps(nrm));
          } else {
            put(x, y, z, glassId(k), paneProps(nrm));
          }
        } else {
          // spandrel: a light band every fourth storey, otherwise light gray
          const band = k % 4 === 3;
          put(x, y, z, band ? "white_concrete" : "light_gray_concrete");
        }
      } else if (rel === PARAPET || rel === PARAPET + 1) {
        put(x, y, z, "white_concrete");
      }
    } else {
      if (rel <= PARAPET && rel % STOREY_H === 0 && rel < STOREYS * STOREY_H) {
        put(x, y, z, "light_gray_concrete");
      } else if (rel === PARAPET) {
        put(x, y, z, "light_gray_concrete");
      }
    }

    if (!nrm && penthouseCell) {
      if (rel >= 61 && rel <= 66) {
        if (centreCell) {
          put(x, y, z, "light_gray_concrete");
        } else if (ringCell) {
          if (rel === 61 || rel === 65 || rel === 66) {
            put(x, y, z, "white_concrete");
          } else {
            put(x, y, z, "light_blue_stained_glass_pane", {
              north: "true", south: "true", east: "true", west: "true", waterlogged: "false",
            });
          }
        }
      } else if (rel === 67) {
        put(x, y, z, "smooth_stone");
      } else if (centreCell && (rel === 68 || rel === 69)) {
        put(x, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
      }
    }
  }
}

// 3. Warm lights behind some panes, on alternate storeys, in the interior air gap
for (const [x, z, gr] of cells) {
  const nrm = normal(x, z);
  if (!nrm) continue;
  const t = along(x, z, nrm);
  if (t % 2 !== 1) continue;
  for (let k = 1; k < STOREYS; k++) {
    if ((k + t) % 2 !== 0) continue;
    const [dx, dz] = inward(nrm);
    const ix = x + dx, iz = z + dz;
    if (!has(ix, iz) || normal(ix, iz)) continue;
    const y = B0 + k * STOREY_H + 2;
    if (y < groundOf(ix, iz) || y >= H) continue;
    put(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
