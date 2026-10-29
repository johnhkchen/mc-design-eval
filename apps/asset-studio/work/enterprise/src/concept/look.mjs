// The shared art direction for every style's concept sheet: tuned here once, never per style. A style supplies only
// words about its place (styles/<id>.json `concept`); this supplies how the picture should look.
export const LOOK = {
  medium: "Concept art of a Minecraft build in the unmistakable art direction of World of Warcraft",
  form: "hand-painted stylised forms, chunky exaggerated proportions: massive bases, thick walls, oversized roofs and beams, everything slightly bulging and heroic; bold readable silhouettes; nothing thin, flat or plain",
  blocks: "Everything is built of Minecraft blocks at true block scale (1 block = 1 metre), the blocks' texture readable up close, but with the shapes, colour and drama of Warcraft concept paintings",
  light: "warm painterly light with strong rim light, saturated colour, game concept art",
  rules: "No people, creatures or text. No logos.",
};
export const VIEWS = {
  aerial: { size: "1536x1024", text: (c) => `A whole town from the air at about 40 degrees, filling the frame: ${c.setting}. Its streets wind and branch with the land, not a grid. Buildings: ${c.buildings}. The landmark dominates the skyline: ${c.landmark}. The streets are full of life: ${c.street_life}. Greenery: ${c.greenery}.` },
  street: { size: "1536x1024", text: (c) => `At eye level down the town's main street: ${c.setting}. Buildings: ${c.buildings}. The street is full of life: ${c.street_life}. Greenery: ${c.greenery}. At the street's end the landmark rises over the roofs: ${c.landmark}.` },
  landmark: { size: "1024x1536", text: (c) => `The town's landmark seen from below in its square, towering over everything: ${c.landmark}. Around its base: ${c.street_life}. The town's buildings frame the view: ${c.buildings}.` },
  sheet: { size: "1536x1024", text: (c) => `A clean design sheet on a plain parchment background, the kind a game art team hands to builders: three front elevations side by side, all in the same style and at the same block scale: a two-storey house, a craftsman's workshop with an open front, and a stretch of town wall with a gate. Under them a row of material swatches (${c.materials}) and a palette strip (${(c.colours || []).join(", ")}). Buildings: ${c.buildings}. No text labels.` },
};
export function prompt(style, view) {
  const c = style.concept, v = VIEWS[view];
  const avoid = c.avoid?.length ? ` Avoid: ${c.avoid.join("; ")}.` : "";
  return `${LOOK.medium}: ${LOOK.form}. ${LOOK.blocks}. Materials: ${c.materials}. ${LOOK.light}. ${LOOK.rules}${avoid}\n\nVIEW: ${v.text(c)}`;
}
