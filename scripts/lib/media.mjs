import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// A file can exist with a .webp name and still be truncated. Check the RIFF
// envelope and every chunk before a published hero is accepted or rendered.
export function webpIntegrityProblem(bytes) {
  if (bytes.length < 20 || bytes.toString('ascii', 0, 4) !== 'RIFF' ||
      bytes.toString('ascii', 8, 12) !== 'WEBP') return 'invalid WebP header';

  const declaredSize = bytes.readUInt32LE(4) + 8;
  if (declaredSize !== bytes.length)
    return `truncated or oversized WebP: RIFF declares ${declaredSize} bytes, file has ${bytes.length}`;

  let offset = 12;
  let hasImage = false;
  while (offset < bytes.length) {
    if (offset + 8 > bytes.length) return 'incomplete WebP chunk header';
    const kind = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4);
    offset += 8 + size + (size % 2);
    if (offset > bytes.length) return `incomplete WebP ${kind} chunk`;
    if (kind === 'VP8 ' || kind === 'VP8L' || kind === 'ANMF') hasImage = true;
  }
  return hasImage ? null : 'WebP contains no image chunk';
}

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

  const bytes = readFileSync(disk);
  const problem = webpIntegrityProblem(bytes);
  if (problem) {
    warn(`${story.id} approved hero is invalid: ${problem}; omitting image`);
    return null;
  }

  const digest = createHash('sha256')
    .update(bytes)
    .digest('hex')
    .slice(0, 12);

  return `${file}?v=${digest}`;
}
