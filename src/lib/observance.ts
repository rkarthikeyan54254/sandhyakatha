export type ObservanceRelevance = 'direct' | 'strong-related' | 'related';

export interface RuntimeObservanceStory {
  storyId: string;
  relevance: ObservanceRelevance;
  reason: string;
}

export interface RuntimeObservanceSource {
  authority: string;
  url: string;
  citation: string;
}

export interface RuntimeObservance {
  id: string;
  names: { en: string; hi?: string; ta?: string; sa?: string };
  kind: string;
  scope: {
    breadth: 'pan-india' | 'broad' | 'regional' | 'sampradaya' | 'temple-specific';
    traditions: string[];
    regions: string[];
  };
  importance: { tier: string; score: number };
  source: RuntimeObservanceSource;
  stories: RuntimeObservanceStory[];
}

export interface RuntimeObservanceCatalog {
  schemaVersion: '1.0';
  meta: {
    generated: string;
    sourceObservances: number;
    agreedDateInstances: number;
    excludedDateDisagreements: number;
    runtimeStoryMappings: number;
  };
  dates: Record<string, RuntimeObservance[]>;
}

export function observancesForDate(
  catalog: RuntimeObservanceCatalog | null | undefined,
  date: string
): RuntimeObservance[] {
  return catalog?.dates?.[date] ?? [];
}

export function observanceLabel(o: RuntimeObservance, locale: 'en' | 'hi-IN' | 'ta-IN'): string | null {
  if (locale === 'en') return o.names.en;
  if (locale === 'hi-IN') return o.names.hi ?? null;
  return o.names.ta ?? null;
}
