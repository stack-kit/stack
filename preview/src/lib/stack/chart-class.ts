// The split of the class of a chart part: HeatMap, PatternChart and TimeChart. In v1.0.0 the class of
// a chart set the size of the chart container, which needs a fixed height, such as "h-56 w-full". A
// page of v1.0.0 keeps that meaning: a height class, with or without a variant such as "md:", sets the
// height of the chart container, and every other class places the root of the part. The package
// exports no path to this file.
const SIZE = /^(?:[^:\s]+:)*!?(?:(?:min-|max-)?h|size)-/;

/** The height classes of a class: they size the chart container. */
export const sizeOf = (c?: string) => (c ?? '').split(/\s+/).filter((t) => SIZE.test(t)).join(' ');

/** The other classes of a class: they place the root of the part. */
export const placeOf = (c?: string) => (c ?? '').split(/\s+/).filter((t) => t && !SIZE.test(t)).join(' ');
