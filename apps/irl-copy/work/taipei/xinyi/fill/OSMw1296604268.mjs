import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise 2-storey Xinyi-style retail/office block (c. 1980s-90s):
// smooth quartz cladding, light-gray frames, ground-floor shopfront on the
// north (street) face, centred entrance, ribbon-style bay windows above,
// stone plinth, quartz cornice and parapet, roof plant on the deck.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1296604268";
const W = 25, H = 23, D = 9;
const DOOR_X = 12;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Ground relative to the lowest ground under the footprint.
const B = Math.min(...cells.map((c) => c[2]));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr - B);

const has = (x, z) => ground.has(`${x},${z}`);
const shell = (x, z) => !has(x + 1, z) || !has(x - 1, z) || !has(x, z + 1) || !has(x, z - 1);
const faces = (x, z) => ({
  N: !has(x, z - 1), // street face (outward -z)
  S: !has(x, z + 1),
  W: !has(x - 1, z),
  E: !has(x + 1, z),
});

const RANK = { wall: 1, frame: 2, glass: 3, shop: 3, door: 4 };

// Decide what a shell cell's wall row becomes on one exposed face.
// r = row offset above the cell's ground (1..4 ground storey, 6..9 upper storey).
function kindFor(face, idx, r) {
  const len = face === "N" || face === "S" ? W : D;
  if (idx === 0 || idx === len - 1) return "wall"; // corner piers
  if (r <= 4) {
    if (face === "N") {
      if (idx === DOOR_X) return r <= 2 ? "door" : r === 3 ? "glass" : "frame";
      if (r <= 3) return "shop";
      return "frame";
    }
    if (idx % 3 !== 1) return "wall";
    return r === 1 || r === 4 ? "frame" : "glass";
  }
  const q = r - 5; // upper storey, 1..4
  if (idx % 3 !== 1) return "wall";
  return q === 1 || q === 4 ? "frame" : "glass";
}

function paneProps(face) {
  const alongX = face === "N" || face === "S";
  return {
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    waterlogged: "false",
  };
}

// ---- Foundations, plinth, floor bands, roof, parapet ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const gr = ground.get(`${x},${z}`);
  const sh = shell(x, z);
  const top = gr + 11;
  if (top >= H) throw new Error(`cell ${x},${z} roof ${top} exceeds world height ${H}`);

  for (let y = 0; y <= gr; y++) g.set(x, y, z, "stone_bricks"); // foundation + base course
  g.set(x, gr + 5, z, "smooth_quartz");                          // storey line
  g.set(x, gr + 10, z, sh ? "smooth_quartz" : "light_gray_concrete"); // roof deck / cornice
  if (sh) g.set(x, gr + 11, z, "smooth_quartz");                  // parapet
}

// ---- Shell walls with glazing; interior cells stay air (no interiors) ----
const rowsRel = [1, 2, 3, 4, 6, 7, 8, 9];
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!shell(x, z)) continue;
  const gr = ground.get(`${x},${z}`);
  const f = faces(x, z);
  const exposed = Object.keys(f).filter((k) => f[k]);

  for (const r of rowsRel) {
    let best = { kind: "wall", face: exposed[0], rank: 1 };
    for (const face of exposed) {
      const idx = face === "N" || face === "S" ? x : z;
      const kind = kindFor(face, idx, r);
      if (RANK[kind] > best.rank) best = { kind, face, rank: RANK[kind] };
    }
    const y = gr + r;
    switch (best.kind) {
      case "door":
        g.set(x, y, z, "dark_oak_door", {
          facing: "north",
          half: r === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        break;
      case "glass":
        g.set(x, y, z, "glass_pane", paneProps(best.face));
        break;
      case "shop":
        g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(best.face));
        break;
      case "frame":
        g.set(x, y, z, "light_gray_concrete");
        break;
      default:
        g.set(x, y, z, "smooth_quartz");
    }
  }
}

// ---- Warm light behind some glazing (interior cell, standing on the floor) ----
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (!shell(x, z)) continue;
  if (!faces(x, z).N) continue;
  const iz = z + 1;
  if (!has(x, iz) || shell(x, iz)) continue;
  const gr = ground.get(`${x},${z}`);
  if (x % 3 !== 1) continue;
  if (x % 6 === 4) {
    g.set(x, gr + 1, iz, "glowstone");   // ground-floor shopfront glow
    g.set(x, gr + 6, iz, "glowstone");   // upper storey glow
  } else if (x % 6 === 1 && x !== DOOR_X) {
    g.set(x, gr + 6, iz, "shroomlight");
  }
}

// ---- Roof plant: small AC/plant boxes on the deck, interior cells only ----
function plant(x0, z0, w, d, h) {
  const list = [];
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++) {
      if (!has(x, z) || shell(x, z)) return;
      list.push([x, z]);
    }
  for (const [x, z] of list) {
    const gr = ground.get(`${x},${z}`);
    for (let k = 0; k < h; k++) {
      g.set(x, gr + 11 + k, z, k === h - 1 ? "white_concrete" : "light_gray_concrete");
    }
  }
}
plant(3, 2, 2, 2, 2);
plant(19, 5, 2, 2, 1);

g.save(`${DIR}/${ID}.nbt`);
