/**
 * A launch check for the navigation dependencies.
 *
 * `components/TabBar.tsx` imports its props type from `@react-navigation/bottom-tabs`, but
 * the navigator the app actually renders comes from `expo-router`, which resolves its own
 * copy of `@react-navigation/native`. A bottom-tabs newer than that copy reaches for
 * exports it does not have — `createScreenFactory` among them — and the app red-screens on
 * launch with "runtime not ready".
 *
 * Neither a type check nor a bundle catches this: the module resolves and compiles, and
 * only fails when it is evaluated. So it is evaluated here.
 */

/* eslint-disable @typescript-eslint/no-require-imports -- these are deliberately runtime requires: the point is to evaluate the modules the way the app does */
describe('navigation dependencies', () => {
  it('evaluates the tab navigator without reaching for a missing export', () => {
    const { createBottomTabNavigator } = require('@react-navigation/bottom-tabs');
    expect(createBottomTabNavigator()).toBeTruthy();
  });

  it('evaluates the stack navigator too', () => {
    const { createNativeStackNavigator } = require('@react-navigation/native-stack');
    expect(createNativeStackNavigator()).toBeTruthy();
  });

  it('pins bottom-tabs exactly rather than tracking the newest 7.x', () => {
    // A caret range is what broke it: `^7.15.5` resolved to 7.18.16, which needs a
    // navigation core newer than the one expo-router ships. The version has to move only
    // when expo-router's does.
    const declared = require('../package.json').dependencies['@react-navigation/bottom-tabs'];
    expect(declared).not.toMatch(/^[\^~]/);
  });
});
/* eslint-enable @typescript-eslint/no-require-imports */
