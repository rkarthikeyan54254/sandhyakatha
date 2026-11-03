import type { AppLocale } from './app-locale';
export interface DirectRoute { id: string; locale: AppLocale }
export interface DirectEdition { title: string; tease: string; minAge: number; careNote: string; hero?: string; href: string; runtimePath: string }
export interface DirectCatalog { schemaVersion: '1.0'; stories: Record<string, Record<string, DirectEdition>> }
export function directStoryRoute(pathname: string): DirectRoute | null {
  const match = /^\/read\/([a-z0-9]+(?:-[a-z0-9]+)*)(?:\/(hi|ta))?\/?$/.exec(pathname);
  return match ? { id: match[1], locale: match[2] === 'hi' ? 'hi-IN' : match[2] === 'ta' ? 'ta-IN' : 'en' } : null;
}
export function directLanguage(locale: AppLocale): string { return locale === 'en' ? 'en' : locale.split('-')[0]; }
