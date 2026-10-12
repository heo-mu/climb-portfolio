/**
 * Which axis of the installation space each measurement is of.
 *
 * The three measurement rows share ONE isometric drawing and differ only in the
 * edge that carries the span, so this map is the actual semantics and the glyph
 * is derived from it. A new measurement adds a line here, not a new picture.
 *
 * It lives apart from the component so `npm run verify` can assert the axis
 * semantics without a JSX build - and so nothing renders to check them.
 */

/** The three axes of an installation space. */
export type MeasurementAxis = 'width' | 'height' | 'depth';

export const MEASUREMENT_AXIS: Record<string, MeasurementAxis> = {
  SPACE_WIDTH: 'width',
  SPACE_HEIGHT: 'height',
  SPACE_DEPTH: 'depth',
};
