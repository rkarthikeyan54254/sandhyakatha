import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export function approvedHeroUrl({ root, story, media, warn = () => {} }) {
  const m = media[story.id];
  if (!m || m.image?.status !== 'approved') return null;

  if (m.storyVersion !== story.version) {
    warn(`${story.id} hero approved for v${m.storyVersion ?? 'none'}, story is v${story.version}; omitting image`);
    return null;
  }

  const file = m.image.file;
  if (typeof file !== 'string' || !file.startsWith('/media/stories/')) {
    warn(`${story.id} has an invalid hero path; omitting image`);
    return null;
  }

  const disk = join(root, 'public', file.replace(/^\/+/, ''));
  if (!existsSync(disk)) {
    warn(`${story.id} approved hero file is missing; omitting image`);
    return null;
  }

  const digest = createHash('sha256')
    .update(readFileSync(disk))
    .digest('hex')
    .slice(0, 12);

  return `${file}?v=${digest}`;
}
