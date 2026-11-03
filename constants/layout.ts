/**
 * Layout constants shared between the navigator and the screens.
 *
 * `TAB_BAR_HEIGHT` lives here rather than in `TabNavigator` because
 * `ScreenTemplate` needs it: importing it from the navigator makes a cycle
 * (navigator → screens → ScreenTemplate → navigator), which Metro resolves to
 * `undefined` at runtime.
 */

/**
 * The floating tab bar's height above the safe area: 8 top padding + 60 bar
 * + 12 bottom padding. The bar is absolutely positioned, so scrollable
 * content has to end above it or its last row can't be reached.
 */
export const TAB_BAR_HEIGHT = 80;
