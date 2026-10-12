/**
 * F-001 / F-010: the alcove itself - floor, back wall and the two optional side
 * walls. Every box comes from `utils/layout.ts`, so the walls the user sees are
 * literally the walls the collision test uses.
 *
 * TWO THINGS THIS FILE IS CAREFUL ABOUT
 *
 * 1. NO COPLANAR FACES AT THE FLOOR JUNCTION. The floor used to be a plane at
 *    y = 0 while every wall box had its bottom face at exactly y = 0 - two
 *    faces on one plane, overlapping, which shimmered along the whole join.
 *    The floor is now a slab whose top face is y = 0 and the walls run down
 *    into it (`WALL_FLOOR_OVERLAP_MM`), so the buried face is never drawn.
 *    Nothing here nudges a position by an epsilon to hide it.
 *
 * 2. THE SCENE DRAWS WHAT THE PANEL SHOWS. Both read `space`, so the control
 *    and the room can never disagree - see `utils/initialState.ts`. Whether the
 *    shopper has CONFIRMED a wall is a separate question, and it decides what
 *    may be claimed in the result, never what is drawn here.
 *
 *    Until v1.1 this gated the walls on `environmentAnswers` while the panel
 *    read `space`, so on first render [있어요] was selected and the room had no
 *    wall, and re-clicking the already-selected button was what made them
 *    agree.
 */
import type { SpaceLayout } from '../types/geometry';

import { MmBox, MmBoxOutline } from './MmBox';

/**
 * The room's own surfaces, in the interface's colour family.
 *
 * These were `#cfd3d8` and `#9fb0c0` - grey and grey-blue, from before the
 * palette had a hue of its own, then `#ced3e2` and `#9dabc8` when the room was
 * rotated onto the periwinkle-blue the panels are built from. Once the ground
 * behind them went near-neutral, that rotation left the room as the loudest
 * colour on screen, so both are stepped back toward neutral here.
 *
 * Every version has held the same LIGHTNESS, and these do too - within about
 * one unit of luma. That is the point: the silhouette of a white appliance
 * against this room is a VALUE difference, so chroma can be tuned freely
 * without touching what reads. The appliance stays the only warm-neutral
 * object in the scene.
 */
const FLOOR_COLOR = '#d2d4dd';
const WALL_COLOR = '#a4acbe';
const WALL_OPACITY = 0.45;
const DEBUG_WALL_COLOR = '#2b6cb0';

interface InstallationSpace3DProps {
  layout: SpaceLayout;
  showDebugGeometry: boolean;
}

export function InstallationSpace3D({ layout, showDebugGeometry }: InstallationSpace3DProps) {
  // `buildSpaceLayout` already omits a wall the space says is absent, so this
  // is the panel's own answer arriving through the layout.
  const { floor, backWall, sideWalls: visibleWalls } = layout;

  return (
    <group>
      {/* An opaque, single-sided slab. The camera never goes below it. */}
      <MmBox box={floor} color={FLOOR_COLOR} />

      <MmBox box={backWall} color={WALL_COLOR} opacity={WALL_OPACITY} depthWrite={false} faces="double" />

      {visibleWalls.map((wall) => (
        <MmBox
          key={wall.id}
          box={wall.box}
          color={WALL_COLOR}
          opacity={WALL_OPACITY}
          depthWrite={false}
          faces="double"
        />
      ))}

      {showDebugGeometry && (
        <group>
          <MmBoxOutline box={backWall} color={DEBUG_WALL_COLOR} />
          {visibleWalls.map((wall) => (
            <MmBoxOutline key={`debug-${wall.id}`} box={wall.box} color={DEBUG_WALL_COLOR} />
          ))}
        </group>
      )}
    </group>
  );
}
