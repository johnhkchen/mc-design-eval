// Part 1, ground and knoll: every column from the height map (outer rings exact; the map is used as is).
import { groundColumn } from "../vocab/h1.mjs";
import { heightAt, SIZE } from "../vocab/base.mjs";

export function build(g) {
  for (let x = 0; x < SIZE[0]; x++)
    for (let z = 0; z < SIZE[2]; z++) groundColumn(g, x, z, heightAt(x, z));
}
