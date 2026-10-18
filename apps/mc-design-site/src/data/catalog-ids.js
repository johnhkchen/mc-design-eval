// Catalog numbering: the plot number from the id ("sears-04-cornell" -> 04), a colour variant lettered ("04b").
export const catalogNo = (e) => e.id.split("-")[1] + (e.variantOf ? "b" : "");
