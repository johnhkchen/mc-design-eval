// Exterior dressing: pectinate ribs on the auricles, cut-end collars on the vessels, lightning rods, banners at the door.
import { R, NU, NY, NZ, idx } from "./anat.mjs";
import { noise, rnd, pick } from "./mats.mjs";
import { ridge } from "./surface.mjs";
import { B } from "../../../../../../minecraft-design/tools/src/build.mjs";
import { wf } from "./kit.mjs";

// before emission: relief that lives in the field
export function exteriorShape(F) {
  const RAA = [[[7.2, 23.8], [7.6, 21.8]], [[9.0, 24.4], [9.2, 21.8]], [[10.8, 24], [10.8, 22]]];
  const LAA = [[[21.2, 23.8], [21.4, 21.8]], [[22.8, 24.2], [22.8, 21.8]]];
  for (const r of [...RAA, ...LAA]) ridge(F, r, R.RIB);
}

// after emission
export function exterior(K, F) {
  // collars: the top ring of each cut vessel in oxidized copper, so the cut reads as a flue / a socket
  const ring = (cu, cz, y, r0, r1) => {
    for (let u = Math.floor(cu - r1 - 1); u <= Math.ceil(cu + r1 + 1); u++) for (let z = Math.floor(cz - r1 - 1); z <= Math.ceil(cz + r1 + 1); z++) {
      const d = Math.hypot(u + 0.5 - cu, z + 0.5 - z * 0 - cz);
      if (d >= r0 && d <= r1 && K.solid(u, y, z) && K.at(u, y, z)) K.put(u, y, z, "waxed_oxidized_cut_copper");
    }
  };
  ring(6, 12, 34, 1.6, 3.0);                     // vena cava
  ring(15.4, 14.5, 34, 1.0, 2.0); ring(19, 15.7, 34, 0.9, 1.8); ring(22.3, 17.5, 34, 0.9, 1.8);   // arch branches
  // a lightning rod rising from each branch: a copper coil in the lumen below, the rod above
  for (const [u, z] of [[15, 14], [19, 15], [22, 17]]) {
    let top = 34;
    while (top > 20 && !K.at(u, top, z) && !K.solid(u, top, z)) top--;           // highest block in the column
    if (K.room(u, top, z) && K.free(u, top, z)) {                                // an open lumen: fill it with a coil
      let y = top;
      for (; y > 20 && K.free(u, y, z); y--) K.put(u, y, z, (top - y) % 2 === 1 ? "copper_bulb" : "waxed_copper_block", (top - y) % 2 === 1 ? { lit: "true", powered: "false" } : undefined);
    }
    for (let y = top + 1; y <= 35; y++) K.put(u, y, z, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
  // banners at the door: a red field with a black diamond, a white disc and a border, one either side of the signs
  for (const u of [3, 6]) K.put(u, 5, 7, ...B.banner("red", [["rhombus", "black"], ["circle", "white"], ["border", "black"]], { wall: true, facing: wf("n") }));
}

// copper flanges round the venae cavae, and the courtyard the heart stands on
export function bands(K, F) {
  for (const y of [8, 26, 31]) for (let u = 0; u < NU; u++) for (let z = 0; z < NZ; z++) {
    if (F.a[idx(u, y, z)] !== R.VENA || F.room[idx(u, y, z)]) continue;
    const out = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !F.a[idx(u + a, y, z + b)] && !F.room[idx(u + a, y, z + b)]);
    if (out && K.at(u, y, z)) K.put(u, y, z, "waxed_oxidized_cut_copper");
  }
}

export function courtyard(K, F) {
  const ground = [["stone_bricks", 42], ["cobblestone", 24], ["mossy_cobblestone", 14], ["cracked_stone_bricks", 12], ["gravel", 8]];
  for (let u = 0; u < NU; u++) for (let z = 0; z < NZ; z++) {
    if (K.at(u, 0, z) || F.a[idx(u, 0, z)] || F.room[idx(u, 0, z)]) continue;
    const t = 0.7 * noise(u, 0, z, 3, 55) + 0.3 * rnd(u, 0, z, 9);
    K.put(u, 0, z, pick(ground, Math.min(0.999, t)));
  }
}
