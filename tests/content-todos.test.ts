import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Every `// TODO Leonie: <hint>` in content/*.ts must appear in the checklist in
 * content/README.md (as "`content/<file>` — <hint>"), and vice versa,
 * so the checklist never goes stale.
 */
const CONTENT_DIR = fileURLToPath(new URL('../content', import.meta.url));
const TODO_RE = /\/\/\s*TODO Leonie:\s*(.+?)\s*$/;

function todosInContent(): string[] {
  const found: string[] = [];
  for (const file of readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.ts')).sort()) {
    for (const line of readFileSync(join(CONTENT_DIR, file), 'utf8').split('\n')) {
      const m = TODO_RE.exec(line);
      if (m?.[1]) found.push(`\`content/${file}\` — ${m[1]}`);
    }
  }
  return found;
}

function checklistItems(): string[] {
  const readme = readFileSync(join(CONTENT_DIR, 'README.md'), 'utf8');
  const block = /<!-- TODO-CHECKLIST:START -->([\s\S]*?)<!-- TODO-CHECKLIST:END -->/.exec(readme);
  expect(block, 'content/README.md needs the TODO-CHECKLIST markers').toBeTruthy();
  return (block?.[1] ?? '')
    .split('\n')
    .map((l) => /^- \[[ x]\] (.+?)\s*$/.exec(l)?.[1])
    .filter((x): x is string => Boolean(x));
}

describe('TODO-Leonie checklist', () => {
  it('lists every TODO Leonie found in content/', () => {
    const listed = new Set(checklistItems());
    const missing = todosInContent().filter((t) => !listed.has(t));
    expect(missing, 'add these lines to the checklist in content/README.md').toEqual([]);
  });

  it('has no stale entries for TODOs that were already resolved', () => {
    const present = new Set(todosInContent());
    const stale = checklistItems().filter((t) => !present.has(t));
    expect(stale, 'remove these finished items from content/README.md').toEqual([]);
  });
});
