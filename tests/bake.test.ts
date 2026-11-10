import { expect, test } from 'vitest';
import { bakeAll } from '../src/content/bake';
import baked from '../src/content/baked.json';

test('baked hitboxes match the current animation data (run npm run bake)', () => {
  expect(bakeAll()).toEqual(baked);
});
