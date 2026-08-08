import { readdirSync } from 'fs';
import { join } from 'path';

const APP_DIR = join(__dirname, '..', '..', 'app');

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
});
