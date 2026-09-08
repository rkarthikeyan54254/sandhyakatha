export type Tradition = 'sanskrit'|'tamil-shaiva'|'tamil-vaishnava'|'north-bhakti'|'jain'|'buddhist'|'folk';
export type Stability = 'stable'|'variant'|'regional'|'folk';
export type Block = { t:'p'|'slow'; text:string } | { t:'beat' };

export interface Card {
  id:string; title:string; tease:string; version:number;
  corpus:string; tradition:Tradition; work:string; locus:string; stability:Stability;
  minAge:number; sensitivity:string[]; gated:boolean; careNote:string|null;
  values:string[]; calendar:{festivals?:string[];months?:string[];tithi?:string[];seasons?:string[];weight?:number};
  characters:string[]; minutes:Record<string,number>; linked:{next:string;reason:string}|null;
}
export interface Story extends Omit<Card,'characters'|'minutes'> {
  source:{corpus:string;tradition:Tradition;work:string;locus:string;stability:Stability;traditionNote?:string};
  audience:{minAge:number;sensitivity?:string[];gated?:boolean;careNote?:string};
  lengths:Record<string,{minutes:number;words?:number;blocks:Block[]}>;
  close:{question:string;seed:string;ifTheyAsk?:{q:string;a:string}[]};
  characters:{ref:string;role:string}[];
}
export interface LexEntry { id:string; native:{deva?:string;taml?:string}; say:string; ipa?:string; kind:string; gloss:string; aliases?:string[] }
export type Lexicon = Record<string, LexEntry>;
