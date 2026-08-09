import { readdirSync } from 'fs';
import { join } from 'path';
import { TABS } from '../../components/TabBar';

const APP_DIR = join(__dirname, '..', '..', 'app');
const TABS_DIR = join(APP_DIR, '(tabs)');

function filesUnder(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
}

describe('app directory', () => {
  it('contains no test files', () => {
    // Expo Router treats every file under `app/` as a route, and its context filter
    // only excludes `+api`, `+html`, `+middleware` and `+native-intent`. A colocated
    // test file therefore ends up in the app bundle, which red-screens the app on
    // launch when the test library reaches for Node's `console`. Tests for routes
    // belong in `__tests__/app/` instead.
    const offenders = filesUnder(APP_DIR)
      .filter((path) => /\.(test|spec)\.[jt]sx?$/.test(path))
      .map((path) => path.slice(APP_DIR.length + 1));

    expect(offenders).toEqual([]);
  });

  it('has a tab manifest entry for every tab route, and no more', () => {
    // `app/(tabs)/_layout.tsx` registers its screens from the manifest, so a route file
    // the manifest does not name is unreachable and a manifest entry with no file
    // crashes the navigator. Neither fails a type check.
    const routes = readdirSync(TABS_DIR)
      .filter((file) => !file.startsWith('_'))
      .map((file) => file.replace(/\.tsx?$/, ''));

    expect(routes.sort()).toEqual(TABS.map((tab) => tab.name).sort());
  });

  it('keeps helper modules out of the app directory', () => {
    // Expo Router bundles every file under `app/` as a route, so a colocated helper
    // becomes a navigable screen that renders nothing. Helpers live in `components/`,
    // `hooks/` or `store/`.
    const nonRoutes = filesUnder(APP_DIR).filter((path) => !/\.tsx$/.test(path));
    expect(nonRoutes).toEqual([]);
  });
});
