import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE92-0236-18F-2";
const W = 22, H = 100, D = 19;
const ROOF = 88;            // roof deck top, about 88 blocks above lowest ground
const PARAPET = 86;         // cornice and parapet band start here

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const ground = new Map();
const cellList = [];
for (const [x, z, gr] of cells) {
  const gg = Math.max(0, Math.min(ROOF - 1, Math.round(gr)));
  ground.set(key(x, z), gg);
  cellList.push([x, z]);
}
const inFP = (x, z) => ground.has(key(x, z));
const outs = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => !inFP(x + dx, z + dz));

let minX = Infinity, maxX = -Infinity;
for (const [x] of cellList) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); }
const midX = (minX + maxX) / 2;

// ---- helpers ----------------------------------------------------------------
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};
const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS = "cyan_stained_glass_pane";

// ---- main pass: each footprint cell from its own ground up ------------------
for (const [x, z] of cellList) {
  const G = ground.get(key(x, z));
  const os = outs(x, z);
  const ring = os.length > 0;
  const corner = os.length >= 2;
  const [nx, nz] = os[0] ?? [0, 0];
  const along = nz !== 0 ? x : z;                // coordinate running along the facade
  const onEntrFace = ring && os.some(([dx, dz]) => dz === 1 && dx === 0);
  const isEntr = onEntrFace && Math.abs(x - midX) <= 1;
  const isEntrPillar = onEntrFace && Math.abs(Math.abs(x - midX) - 2) < 0.5;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < G; y++) put(x, y, z, "stone_bricks");

  for (let y = G; y < ROOF - 1; y++) {
    const h = y - G;

    // cornice and parapet band
    if (y >= PARAPET) {
      if (ring) {
        if (y === PARAPET) put(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
        else put(x, y, z, "smooth_quartz");
      }
      continue;
    }

    // base course
    if (h === 0) {
      put(x, y, z, ring ? "polished_granite" : "smooth_stone");
      continue;
    }

    // podium shopfront, h 1..4
    if (h <= 4) {
      if (!ring) continue;
      if (isEntr) {
        if (h <= 3) put(x, y, z, "glass");
        else put(x, y, z, "smooth_quartz");           // lintel
        if (h === 2 && Math.abs(x - midX) < 0.5) {
          // warm lantern just inside the doorway
          const ix = x - nx, iz = z - nz;
          if (inFP(ix, iz) && outs(ix, iz).length === 0) {
            put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
          }
        }
      } else if (corner || isEntrPillar) {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      } else if (along % 3 === 0) {
        put(x, y, z, "quartz_pillar", { axis: "y" });
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }

    // podium ceiling / cornice line, h 5
    if (h === 5) {
      put(x, y, z, ring ? "smooth_quartz_slab" : "smooth_quartz",
        ring ? { type: "top", waterlogged: "false" } : undefined);
      continue;
    }

    // residential modules of 5: m0 floor slab, m1..3 glazing, m4 shadow ledge
    const m = (h - 6) % 5;
    const k = Math.floor((h - 6) / 5);

    if (m === 0) {
      put(x, y, z, "light_gray_concrete");   // floor slab across footprint
      continue;
    }
    if (m === 4) {
      if (ring) put(x, y, z, "smooth_quartz_slab", { type: "top", waterlogged: "false" });
      continue;
    }

    // m = 1..3 windows
    if (!ring) continue;
    if (corner) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else if (along % 3 === 0) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
    } else {
      put(x, y, z, GLASS, nz !== 0 ? PANE_NS : PANE_EW);
    }

    // warm light behind some glazing, at mid-height of the module
    if (m === 2 && (along + k) % 4 === 0) {
      const ix = x - nx, iz = z - nz;
      if (inFP(ix, iz) && outs(ix, iz).length === 0) {
        put(ix, y, iz, "shroomlight");
      }
    }
  }
}

// ---- roof deck at ROOF --------------------------------------------------------
for (const [x, z] of cellList) {
  const ring = outs(x, z).length > 0;
  if (ring) put(x, ROOF, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  else put(x, ROOF, z, "gray_concrete");
}

// ---- mechanical penthouse on the roof deck ------------------------------------
for (let x = 6; x <= 14; x++) {
  for (let z = 5; z <= 12; z++) {
    if (!inFP(x, z)) continue;
    const edge = x === 6 || x === 14 || z === 5 || z === 12;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (!edge) continue;
      if (y === ROOF + 2 && (x === 6 || x === 14)) {
        // louvred band on the long faces
        put(x, y, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
      } else {
        put(x, y, z, "light_gray_concrete");
      }
    }
    put(x, ROOF + 4, z, "light_gray_concrete");   // penthouse roof
  }
}

// ---- antenna --------------------------------------------------------------------
for (let y = ROOF + 5; y <= ROOF + 7; y++) {
  put(10, y, 8, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
