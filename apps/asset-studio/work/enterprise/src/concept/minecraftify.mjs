// Minecraftify: a second pass over concept art. Each concept image goes in as the reference, and comes back redrawn
// as a build a player could make in vanilla Minecraft: the same design (silhouette, materials, colour, mood), but on
// the block grid, out of real blocks, at the asset's true size. The concept pass is free to paint; this pass is held to
// the game. The prompt is data, versioned (PROMPTS), so it can be tuned and versions compared on the same inputs;
// each output lands under its version and keeps its prompt beside it.
//   node src/concept/minecraftify.mjs <style ...> [--v v1] [--only id,id] [--redo id --note "..."]
import { codexImage } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/codex-image.mjs";
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";

// the block-grid rules every version shares
const GRID = [
  "Everything sits on a visible cubic grid: every block a 1-metre cube aligned to the same grid, edges straight, no smooth curves, no organic sculpting, no non-cube shapes.",
  "Only shapes that exist as vanilla blocks: full blocks, stairs, slabs, walls, fences, fence gates, trapdoors, panes, iron bars, chains, lanterns, campfires, banners, carpets, doors, buttons, end rods, leaves, logs on their axis.",
  "A curve (a tusk, a dome, an arch, a round hut) becomes a stepped curve of blocks, stairs and slabs, the way builders do it, readable at a glance as the same shape.",
  "Textures are Minecraft's own vanilla textures (stone bricks, terracotta, logs, wool, deepslate, copper...), seen as distinct block faces with the grid visible, not painted surfaces.",
  "No details smaller than half a block; ornaments become blocks (a skull is a skull or bone block, a horn is a column of bone blocks and walls, a rune is a chiselled block).",
];

export const PROMPTS = {
  v1: {
    intent: "Redraw the attached concept art as a real Minecraft build, the way a skilled builder would make it in vanilla Minecraft 1.21: the same building, the same design, silhouette, materials, colours and mood, but every part of it now made of actual Minecraft blocks on the block grid.",
    grid: GRID,
    scale: "Keep it at its true game size: SIZE. A door is 2 blocks tall and 1 wide; a storey is about 5 blocks. Draw the plot's outline as a ring of path or grass blocks so the footprint reads. Do not enlarge it to fit more detail: simplify instead.",
    view: "Same view as the reference: the one building alone on its plot, three-quarter view from the front-left about 30 degrees above, soft plain sky, clean even daylight, a screenshot-like render (a path-traced Minecraft screenshot), not a painting.",
    keep: "Keep what makes the design: its silhouette, its colour blocking, its signature features (they become block versions), its front door or open front.",
  },
  // v2 (after v1 on 8 tests): v1 gridded well but obeyed the reference over the game: a 3 x 3 stall stayed a small
  // building, an 8-long wall stretch stayed a closed fort, a background landscape crept in. v2 puts the footprint
  // first (the reference gives the style, not the size or form), adds per-kind shape rules, and pins the background.
  v2: {
    intent: "Redraw the attached concept art as a real Minecraft build made in vanilla Minecraft 1.21. The reference gives the STYLE (materials, colours, ornament, mood); the game fixes the SIZE and the KIND of thing. Where the reference is larger or a different kind of object than this asset, follow the asset and carry the style over.",
    grid: GRID,
    scale: "Its size is fixed by the game: SIZE. Build exactly that footprint, outlined on the ground by a ring of path blocks, and nothing beyond it. A door is 2 blocks tall and 1 wide; a storey is about 5 blocks. Count it: a 3 x 3 asset is three blocks a side, about the width of a doorway and its frame. Simplify to fit; never enlarge.",
    view: "The one asset alone on a flat square of grass or its biome's ground, three-quarter view from the front-left about 30 degrees above, against a plain pale sky with no landscape, mountains or other buildings, clean even daylight, a path-traced Minecraft screenshot, not a painting.",
    keep: "Keep what makes the design: its colour blocking and its signature features, in block form, at this asset's size.",
  },
  // v3 (after v2): v2 fixed size and kind (stalls, scale) but simplified away signature ornament (orc wall's tusks and
  // skulls, dwarf tower's battered base), set orc assets on green grass, and the orc wall still closed its ends. v3
  // keeps v2's footprint-first rule, protects the signature features, takes the ground from the style, and makes a
  // repeating piece's cut ends unmistakable.
  v3: {
    intent: "Redraw the attached concept art as a real Minecraft build made in vanilla Minecraft 1.21. The reference gives the STYLE (materials, colours, ornament, mood); the game fixes the SIZE and the KIND of thing. Where the reference is larger or a different kind of object than this asset, follow the asset and carry the style over.",
    grid: GRID,
    scale: "Its size is fixed by the game: SIZE. Build exactly that footprint, outlined on the ground by a ring of path blocks, and nothing beyond it. A door is 2 blocks tall and 1 wide; a storey is about 5 blocks. Simplify the BODY to fit (fewer windows, plainer wall runs); never enlarge.",
    view: "The one asset alone on a flat square of GROUND, three-quarter view from the front-left about 30 degrees above, against a plain pale sky with no landscape, mountains or other buildings, clean even daylight, a path-traced Minecraft screenshot, not a painting.",
    keep: "Keep EVERY signature feature of the reference, in block form, even if smaller: if it has tusks, horns, skulls, spikes, banners, runes, gold trim, a battered or sloped base, a forge glow, keep each of them, at roughly the same count and place. The ornament is what makes the style; cut plain wall, not ornament.",
  },
  // v4 (after v3): v3 won back ground and ornament, but "keep every feature" pulled the dwarf stall back into a small
  // building, and no version would draw a wall piece cut off flat. v4 puts the kind FIRST (ornament only where it fits
  // the kind) and shows repeating pieces as one piece in a run of three identical pieces.
  v4: {
    intent: "Redraw the attached concept art as a real Minecraft build made in vanilla Minecraft 1.21. Three things, in this order of priority: (1) WHAT IT IS: the kind of object, below, decides its form; (2) its SIZE, fixed by the game; (3) the STYLE from the reference: materials, colours, ornament, mood. Where the reference shows a different kind or size of object, follow (1) and (2) and carry only the style over.",
    grid: GRID,
    scale: "Its size is fixed by the game: SIZE. Build exactly that footprint, outlined on the ground by a ring of path blocks. A door is 2 blocks tall and 1 wide; a storey is about 5 blocks. Simplify the body to fit; never enlarge.",
    view: "Alone on a flat square of GROUND, three-quarter view from the front-left about 30 degrees above, against a plain pale sky with no landscape, mountains or other buildings, clean even daylight, a path-traced Minecraft screenshot, not a painting.",
    keep: "Keep the reference's signature ornament (tusks, horns, skulls, spikes, banners, runes, gold trim, glow) at roughly the same count, in block form, BUT only placed on the parts this kind of object has: never add walls, rooms, roofs or chimneys the kind doesn't have to make room for ornament.",
  },
};
// v4: repeating pieces are drawn in a run of three, the middle one the asset
export const RUN = {
  wall_curtain: "Draw THREE identical copies of this 8-block wall piece joined end to end in one straight line (24 blocks of wall, seamless, the same pattern repeating three times), the run cropped by the frame at both ends so the wall clearly continues beyond. No towers, corners or end walls anywhere in the run.",
};
// per-kind shape rules: what this kind of asset is, whatever the reference drew
export const KIND = {
  stall: "A market stall, not a building: a 3 x 3 timber floor, a counter across the front with goods on it, four corner posts, and a small roof or awning on top. Open on the customer's side and on both sides, no walls, no back room, no door, no chimney: you can see through it. Its ornament goes on the four posts and the awning.",
  wall_curtain: "A straight piece of town wall built to repeat end to end: a solid wall 8 blocks long and 3 thick with a walkway along its top behind a parapet. Both ends are CUT OFF flat like a slice through the wall, the cross-section of stone and walkway visible at each end, as if the wall continues out of frame on both sides. No towers, bastions, corners, end posts or end walls. No interior.",
  wall_gatehouse: "A gate through the town wall: the wall's thickness, a gate passage 3 wide and 4 high through its middle, the wall's ends cut off flat to join the curtain on both sides.",
  cottage_7x7: "A small one-storey cottage, 7 x 7 blocks: about as big as a room, roof ridge about 8 blocks up.",
  house_10x7: "A two-storey house, 10 x 7 blocks, clearly taller and longer than a 7 x 7 cottage.",
};

export function mcPrompt(v, asset, ground = "grass") {
  const P = PROMPTS[v], [W, D] = asset.footprint;
  const size = asset.tiles ? `${W} blocks wide by ${D} blocks deep (${asset.tiles[0]} x ${asset.tiles[1]} building tiles of 4 x 4 blocks), ${asset.storeys} storey${asset.storeys > 1 ? "s" : ""}, its outer 1-block ring left as ground` : asset.storeys ? `${W} blocks wide by ${D} blocks deep, ${asset.storeys} storey${asset.storeys > 1 ? "s" : ""}` : `${W} blocks wide by ${D} blocks long`;
  const form = asset.form || KIND[asset.id], kind = v !== "v1" && form ? ["", `WHAT IT IS: ${form}`] : [];
  if (v === "v4" && RUN[asset.id]) kind.push(`HOW TO SHOW IT: ${RUN[asset.id]}`);
  return [P.intent, "", "RULES:", ...P.grid.map((r) => `- ${r}`), "", `SCALE: ${P.scale.replace("SIZE", size)}`, ...kind, "", `VIEW: ${P.view.replace("GROUND", ground)}`, "", `KEEP: ${P.keep}`, "", `THIS ASSET: ${asset.what}.`].join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const ROOT = `${new URL(".", import.meta.url).pathname}../..`;
  const argv = process.argv.slice(2), opt = (k) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : null);
  const ids = argv.filter((a, i) => !a.startsWith("--") && !["--v", "--only", "--redo", "--note"].includes(argv[i - 1]));
  const v = opt("--v") || "v1", only = opt("--only")?.split(","), redo = opt("--redo"), note = opt("--note");
  const catalog = JSON.parse(readFileSync(`${ROOT}/styles/assets.json`, "utf8")).assets;
  const jobs = [];
  for (const id of ids) for (const a of catalog) {
    const src = `${ROOT}/out/concept/styles/${id}/assets/${a.id}.png`;
    if (!existsSync(src) || (only && !only.includes(a.id)) || (redo && redo !== a.id)) continue;
    jobs.push([id, a, src]);
  }
  let i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (i < jobs.length) {
      const [id, a0, src] = jobs[i++], a = { ...a0, ...(JSON.parse(readFileSync(`${ROOT}/styles/${id}.json`, "utf8")).assets?.[a0.id] || {}) }, OUT = `${ROOT}/out/concept/styles/${id}/mc/${v}`; mkdirSync(OUT, { recursive: true });
      const out = `${OUT}/${a.id}.png`;
      if (existsSync(out)) { if (redo !== a.id) continue; renameSync(out, `${OUT}/${a.id}.${Date.now()}.png`); }
      const style = JSON.parse(readFileSync(`${ROOT}/styles/${id}.json`, "utf8")), ground = style.concept.ground || style.concept.greenery.split(",")[0];
      const p = mcPrompt(v, a, ground) + (note && redo === a.id ? `\n\nREVISION NOTE: ${note}` : "");
      writeFileSync(`${OUT}/${a.id}.prompt.txt`, p + "\n");
      const size = a.footprint[1] > a.footprint[0] * 1.6 ? "1024x1536" : "1536x1024";
      try { const r = await codexImage({ prompt: p, images: [{ base64: readFileSync(src).toString("base64"), mediaType: "image/png" }], size });
        writeFileSync(out, Buffer.from(r.base64, "base64")); console.log(`done ${id} ${a.id}`); }
      catch (e) { console.log(`failed ${id} ${a.id}: ${e.message.slice(0, 160)}`); }
    }
  }));
  console.log("all done");
}
