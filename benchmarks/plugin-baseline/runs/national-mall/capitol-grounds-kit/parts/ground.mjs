// Ground and pool (plan.md part 1): groundColumn from the height map, pool basin, coping ring, plaza paving, lawns.
import { readFileSync } from "node:fs";
import { groundColumn, poolBasin, copingRing, plazaPaving, POOL, COPING_RING, PLAZA } from "../vocab.mjs";

const ROWS = readFileSync(new URL("./heights.txt", import.meta.url), "utf8").trim().split("\n");
export const heightAt = (x, z) => parseInt(ROWS[z][x], 36);

export function build(g) {
  for (let x = 0; x <= 184; x++) for (let z = 0; z <= 124; z++) {
    let H = heightAt(x, z), surface = "grass_block";
    const inPool = x >= POOL.x0 && x <= POOL.x1 && z >= POOL.z0 && z <= POOL.z1;
    const inRing = x >= COPING_RING.x0 && x <= COPING_RING.x1 && z >= COPING_RING.z0 && z <= COPING_RING.z1;
    const inPlaza = x >= PLAZA.x0 && x <= PLAZA.x1 && z >= PLAZA.z0 && z <= PLAZA.z1;
    if (inPool) { H = 1; surface = "smooth_stone"; }
    else if (inRing) { H = 2; surface = "stone"; }
    else if (inPlaza) { H = 3; surface = "smooth_stone"; }
    groundColumn(g, x, z, H, surface);
  }
  copingRing(g, COPING_RING.x0, COPING_RING.z0, COPING_RING.x1, COPING_RING.z1, { over: true });
  poolBasin(g, POOL.x0, POOL.z0, POOL.x1, POOL.z1);
  plazaPaving(g, PLAZA.x0, PLAZA.z0, PLAZA.x1, PLAZA.z1, 3);
}
