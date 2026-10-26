import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86663.cells.json`, "utf8"));

// Commercial-Office-Large, 1126 16th St NW: 1960s-70s speculative office block.
// Stone base and cornice, white concrete piers, blue-tinted glass bays set in
// darker grey spandrels, 3-block storeys, plant-room penthouse on the roof.
const W = 11, H = 25, D = 5;
const g = new Voxels([W, H, D]);

const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  cellMap.set(`${x},${z}`, { gr, rf });
}

function put(x, y, z, id, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

const roofOf = new Map();

for (const c of cells) {
  const [x, z] = [c[0], c[1]];
  const gr = Math.max(0, Math.round(c[2]));
  const rf = Math.round(c[3]);

  // storeys are 3 blocks tall; roof slab sits at gr + 3*nst
  let nst = Math.max(2, Math.floor((rf - gr) / 3));
  nst = Math.min(nst, Math.floor((H - 8 - gr) / 3));
  const R = gr + 3 * nst;
  roofOf.set(`${x},${z}`, R);

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const perim = x === 0 || x === W - 1 || z === 0 || z === D - 1;
  const corner = (x === 0 || x === W - 1) && (z === 0 || z === D - 1);
  const front = z === 0 || z === D - 1;

  for (let y = gr; y <= R; y++) {
    const rel = y - gr;

    // floor lines, base course and roof slab
    if (rel % 3 === 0) {
      if (perim) {
        const id = rel === 0 ? "stone_bricks" : rel === R ? "stone_bricks" : "smooth_stone";
        put(x, y, z, id);
      } else {
        put(x, y, z, "smooth_stone");
      }
      continue;
    }

    if (!perim) continue; // interior stays air

    if (corner) {
      put(x, y, z, "white_concrete");
      continue;
    }

    const u = front ? x : z;
    const isMullion = u % 2 === 0;
    const groundFloor = rel < 3;

    // main entrance, centred on the street face (z = 0)
    if (front && z === 0 && x === 5 && (rel === 1 || rel === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // ground-floor storefront transom
    if (groundFloor && rel === 2) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    if (isMullion) {
      put(x, y, z, "white_concrete");
    } else if (rel % 3 === 1) {
      // window glass, with a warm light behind some panes
      put(x, y, z, "light_blue_stained_glass_pane");
      const k = Math.floor((rel - 1) / 3);
      if ((u + k) % 3 === 1) {
        if (front && x >= 1 && x <= W - 2) put(x, y, 1, "glowstone");
        if (!front && z >= 1 && z <= D - 2) put(1, y, z, "glowstone");
      }
    } else {
      // spandrel panel between window head and floor line
      put(x, y, z, "gray_concrete");
    }
  }
}

// plant-room penthouse, set back on the roof where the footprint allows
for (let x = 3; x <= 7; x++) {
  for (let z = 1; z <= 3; z++) {
    const R = roofOf.get(`${x},${z}`);
    if (R === undefined) continue;
    const ring = x === 3 || x === 7 || z === 1 || z === 3;
    if (ring) {
      put(x, R + 1, z, "light_gray_concrete");
      put(x, R + 2, z, "light_gray_concrete");
      put(x, R + 3, z, "stone_bricks"); // parapet cap on the plant room
    } else {
      put(x, R + 3, z, "stone_bricks"); // roof slab over the plant room
      put(x, R + 1, z, "air");
      put(x, R + 2, z, "air");
    }
  }
}

// lobby lantern just inside the entrance
const lobby = cellMap.get("5,0");
if (lobby) {
  const gr = Math.max(0, Math.round(lobby.gr));
  put(5, gr + 1, 1, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/DC86663.nbt`);
