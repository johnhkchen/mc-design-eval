import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3339166";
const W = 10, H = 17, D = 4;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1967 elevator apartment block on Henry Street: brick-faced, two storeys
// on a stone base, stone cornice, full glazed bays with concrete mullions,
// a central street entrance and warm lights in some bays.
const g = new Voxels([W, H, D]);

const info = new Map();
for (const c of cells) {
  const [x, z, ground, roof] = c;
  info.set(`${x},${z}`, {
    ground: Math.max(0, Math.min(H - 1, Math.round(ground))),
    roof: Math.round(roof),
  });
}
const has = (x, z) => info.has(`${x},${z}`);

function exposed(x, z) {
  return {
    xm: !has(x - 1, z),
    xp: !has(x + 1, z),
    zm: !has(x, z - 1),
    zp: !has(x, z + 1),
  };
}
const isPerimeter = (x, z) => {
  const e = exposed(x, z);
  return e.xm || e.xp || e.zm || e.zp;
};

// street entrance: the exposed min-z face, middle cell
let minZ = Infinity;
for (const k of info.keys()) {
  const z = Number(k.split(",")[1]);
  if (z < minZ) minZ = z;
}
const frontX = [];
for (const k of info.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (z === minZ && !has(x, z - 1)) frontX.push(x);
}
frontX.sort((a, b) => a - b);
const entranceX = frontX.length ? frontX[Math.floor(frontX.length / 2)] : -1;
const entranceZ = minZ;

// position along a perimeter face
function faceInfo(x, z) {
  const e = exposed(x, z);
  const alongX = e.zm || e.zp;
  const alongZ = e.xm || e.xp;
  const corner = alongX && alongZ;
  let idx = 0, len = 1;
  if (alongX) {
    let lo = x, hi = x;
    while (has(lo - 1, z)) lo--;
    while (has(hi + 1, z)) hi++;
    len = hi - lo + 1;
    idx = x - lo;
  } else if (alongZ) {
    let lo = z, hi = z;
    while (has(x, lo - 1)) lo--;
    while (has(x, hi + 1)) hi++;
    len = hi - lo + 1;
    idx = z - lo;
  }
  return { corner, idx, len, e };
}

for (const [k, { ground, roof }] of info) {
  const [x, z] = k.split(",").map(Number);
  const per = isPerimeter(x, z);

  // foundation: solid from y 0 up to the cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone");

  let top = Math.min(H - 1, roof - 1);
  if (top < ground) top = ground;

  for (let y = ground; y <= top; y++) {
    const rel = y - ground;

    // roof cap / cornice
    if (y === top) {
      g.set(x, y, z, per ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (!per) {
      // interior: floor slab per storey, air between (no interiors)
      if (rel % 2 === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const fi = faceInfo(x, z);

    // corner piers
    if (fi.corner) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // stone base course on the ground storey
    if (rel === 0) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // entrance door and lintel
    const isEntranceCell = (x === entranceX && z === entranceZ);
    if (isEntranceCell && rel === 1) {
      g.set(x, y, z, "iron_door", {
        facing: "north", half: "lower", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isEntranceCell && rel === 2) {
      g.set(x, y, z, "iron_door", {
        facing: "north", half: "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (isEntranceCell && rel === 3) {
      g.set(x, y, z, "stone_bricks");
      continue;
    }

    // brick spandrels on even rows
    if (rel % 2 === 0) {
      g.set(x, y, z, "bricks");
      continue;
    }

    // full glazed bays on odd rows, concrete mullions, brick at the ends
    const interior = fi.idx > 0 && fi.idx < fi.len - 1;
    if (interior) {
      const mullion = fi.idx % 3 === 0;
      g.set(x, y, z, mullion ? "light_gray_concrete" : "light_blue_stained_glass");
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// warm lights just inside some glazed bays
for (const [k, { ground, roof }] of info) {
  const [x, z] = k.split(",").map(Number);
  if (!isPerimeter(x, z)) continue;
  const fi = faceInfo(x, z);
  if (fi.corner || !(fi.idx > 0 && fi.idx < fi.len - 1) || fi.idx % 3 === 0) continue;

  const e = fi.e;
  let ix = x, iz = z;
  if (e.zm) iz = z + 1;
  else if (e.zp) iz = z - 1;
  else if (e.xm) ix = x + 1;
  else if (e.xp) ix = x - 1;
  if (!has(ix, iz) || isPerimeter(ix, iz)) continue;

  let top = Math.min(H - 1, roof - 1);
  if (top < ground) top = ground;
  for (let y = ground + 1; y < top; y += 2) {
    if (((x * 5 + z * 3 + y) % 4) === 0) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
