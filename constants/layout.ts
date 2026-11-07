/**
 * Layout constants shared between the navigator and the screens.
 *
 * `TAB_BAR_HEIGHT` lives here rather than in `TabNavigator` because
 * `ScreenTemplate` needs it: importing it from the navigator makes a cycle
 * (navigator → screens → ScreenTemplate → navigator), which Metro resolves to
 * `undefined` at runtime.
 */

/**
 * Room to leave above the safe area for the floating tab bar: 28 from the
 * bottom + a 55 bar (41 item + 7 padding each side) + breathing room, so the
 * last row clears it (the design's 130 bottom inset, less screens' own
 * padding). The bar is absolutely positioned, so scrollable content has to
 * end above it or its last row can't be reached.
 */
export const TAB_BAR_HEIGHT = 100;
