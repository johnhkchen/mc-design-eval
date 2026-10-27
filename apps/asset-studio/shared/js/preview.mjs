#!/usr/bin/env node
// Preview a structure: the mod's decorative twins (enterprise:decor_<id>) are drawn as the vanilla block they copy
// (a dyed decor_cauldron as a full water cauldron), then the toolkit's renderer makes a contact sheet. Picture only:
// the delivered file keeps its twins.
//   node tools/preview.mjs <file.nbt> <out.png|out.jpg> [--closeups] [--width 1400]
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { Grid, splitState, joinState } from "../work/enterprise/src/grid.mjs";

const MCD = process.env.MCD || new URL("../../../../minecraft-design/tools/bin/mcd.mjs", import.meta.url).pathname;
const argv = process.argv.slice(2), [inp, out] = argv.filter((a, i) => !a.startsWith("--") && argv[i - 1] !== "--width");
if (!inp || !out) { console.error("preview.mjs <file.nbt> <out.png|.jpg> [--closeups] [--width n]"); process.exit(1); }

const vanilla = (s) => {
  const st = splitState(s);
  if (!st.name.startsWith("enterprise:decor_")) return s;
  const id = st.name.slice("enterprise:decor_".length);
  if (id === "cauldron") return st.props.contents && st.props.contents !== "empty" ? "minecraft:water_cauldron[level=3]" : "minecraft:cauldron";
  return joinState({ name: `minecraft:${id}`, props: st.props });
};
const g = Grid.load(inp), v = new Grid(g.size);
for (const [x, y, z, s] of g.each()) v.set(x, y, z, vanilla(s));
const tmp = mkdtempSync(join(tmpdir(), "preview-")), f = join(tmp, "p.nbt");
v.save(f);
const png = out.endsWith(".jpg") ? join(tmp, "p.png") : out;
execFileSync("node", [MCD, "render", f, "--out", png, "--front", "s", "--version", "1.21.1", ...(argv.includes("--closeups") ? ["--closeups"] : [])], { stdio: "ignore" });
if (out.endsWith(".jpg")) execFileSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", argv.includes("--width") ? argv[argv.indexOf("--width") + 1] : "1400", png, "--out", out], { stdio: "ignore" });
rmSync(tmp, { recursive: true, force: true });
console.log(out);
