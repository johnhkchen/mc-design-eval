// P8 lantern: the lantern temple on the dome's crown (plan rule 27, elements 38, 39, 41): the smooth_quartz platform
// at y 101, eight quartz_pillar posts with gold capitals, the glass ring, the entablature and gold band, the gilded
// cupola and the finial with its four lightning rods, and a hanging lantern under the y 109 ceiling.
import { lanternTemple } from "../vocab.mjs";

// The dome's axis is at 31.5, 31.5 (plan: dome centre); the platform sits on the dome's crown at y 101.
export function build(g) {
  lanternTemple(g, 31.5, 31.5, 101);
}
