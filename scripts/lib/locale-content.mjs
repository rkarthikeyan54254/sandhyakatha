import { createHash } from 'node:crypto';

export function gitBlobSha1(text) {
  const bytes = Buffer.from(text, 'utf8');
  return createHash('sha1')
    .update(`blob ${bytes.length}\0`)
    .update(bytes)
    .digest('hex');
}

export function localeContentHash(doc) {
  const payload = {
    storyId: doc.storyId,
    sourceVersion: doc.sourceVersion,
    sourceBlobSha1: doc.sourceBlobSha1,
    locale: doc.locale,
    language: doc.language,
    register: doc.register,
    title: doc.title,
    tease: doc.tease,
    displayNames: doc.displayNames,
    sourceMap: doc.sourceMap,
    lengths: doc.lengths,
    parentNote: doc.parentNote,
    traditionNote: doc.traditionNote,
    close: doc.close
  };
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
}
