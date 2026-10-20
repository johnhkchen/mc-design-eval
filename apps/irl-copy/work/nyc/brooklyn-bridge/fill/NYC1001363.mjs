import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001363.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC1001363.nbt";

const W = 23, H = 30, D = 48;
const cells = JSON.parse(readFileSync(SRC, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const has = (x, z) => info.has(key(x, z));

// ---- read the footprint ----
const info = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 10, Math.round(gr)));
  info.set(key(x, z), { x, z, ground, rawRoof: Math.round(rf) });
}

// ---- roof tiers: one main roof from the median lidar height, plus a lower wing ----
const evenRound = (v) => 2 * Math.round(v / 2);
const sortedRoofs = [...info.values()].map((c) => c.rawRoof).sort((a, b) => a - b);
const mainRoof = evenRound(sortedRoofs[Math.floor(sortedRoofs.length / 2)]);
for (const c of info.values()) {
  let roof = mainRoof;
  if (c.rawRoof < mainRoof - 3) roof = evenRound(c.rawRoof); // low wing
  roof = Math.max(c.ground + 4, Math.min(H - 6, roof));
  c.roof = roof;
}

// ---- faces: outward side of each edge cell ----
const faceOf = (x, z) => {
  if (!has(x - 1, z)) return "W";
  if (!has(x + 1, z)) return "E";
  if (!has(x, z - 1)) return "N";
  if (!has(x, z + 1)) return "S";
  return null;
};

// entrance: centre of the north (low-z) street facade
const nXs = [];
for (const c of info.values()) if (faceOf(c.x, c.z) === "N") nXs.push(c.x);
nXs.sort((a, b) => a - b);
const entranceX = nXs.length ? nXs[Math.floor(nXs.length / 2)] : Math.floor(W / 2);

const paneProps = (face) =>
  (face === "W" || face === "E")
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const inward = (x, z, face) => {
  if (face === "W") return [x + 1, z];
  if (face === "E") return [x - 1, z];
  if (face === "N") return [x, z + 1];
  return [x, z - 1];
};

// ---- pass 1: foundation, floors, facade, roof ----
for (const c of info.values()) {
  const { x, z, ground, roof } = c;
  const face = faceOf(x, z);
  const idx = (face === "W" || face === "E") ? z : x;

  // foundation down to y 0
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // ground deck; street walls get a stone base course
  g.set(x, ground, z, face ? "stone_bricks" : "smooth_stone");

  for (let y = ground + 1; y < roof - 1; y++) {
    const rel = y - ground;

    if (!face) {
      // interior: air with a slab at every storey line
      if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    if (rel % 2 === 0) {
      // spandrel band between storeys
      g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    // window row
    const onEntrance = face === "N" && idx === entranceX;
    if (onEntrance && rel <= 2) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: rel === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (onEntrance && rel === 3) {
      // lintel over the door, stone surround
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (face === "N" && (idx === entranceX - 1 || idx === entranceX + 1) && rel <= 3) {
      // door surround: stone jambs beside the entrance
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (idx % 3 === 0) {
      g.set(x, y, z, "bricks"); // brick piers
    } else {
      g.set(x, y, z, "glass_pane", paneProps(face));
    }
  }

  // roof deck and cornice course
  if (face) {
    g.set(x, roof - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    // solid stone parapet on the street walls
    g.set(x, roof, z, "stone_bricks");
  } else {
    g.set(x, roof - 1, z, "smooth_stone");
  }
}

// ---- pass 2: a few lit offices behind glass (dusk read) ----
for (const c of info.values()) {
  const { x, z, ground, roof } = c;
  const face = faceOf(x, z);
  if (!face) continue;
  const idx = (face === "W" || face === "E") ? z : x;
  if (idx % 3 === 0) continue;
  for (let rel = 3; rel < roof - ground - 1; rel += 2) {
    const storey = (rel - 1) / 2;
    if (idx % 9 !== 2 || storey % 2 !== 1) continue;
    const [ix, iz] = inward(x, z, face);
    if (has(ix, iz)) g.set(ix, ground + rel, iz, "glowstone");
  }
}

// ---- pass 3: low rooftop plant, one block tall, set back from the edges ----
for (const c of info.values()) {
  const { x, z, roof } = c;
  if (x < 6 || x > 16 || z < 14 || z > 33) continue;
  if (!(has(x - 2, z) && has(x + 2, z) && has(x, z - 2) && has(x, z + 2))) continue;
  g.set(x, roof, z, "light_gray_concrete");
}

g.save(OUT);
