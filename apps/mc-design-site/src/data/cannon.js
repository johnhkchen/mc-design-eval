// Schematicannon pace used for every time estimate on the site (the board lets the builder change its own copy).
export const SEC_PER_BLOCK = 1.5;
export const cannonMinutes = (blocks) => Math.round((blocks * SEC_PER_BLOCK) / 60);
