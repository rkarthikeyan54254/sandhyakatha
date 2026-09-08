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

export interface CanonRow {
  n:number; id:string; title:string; corpus:string; tradition:Tradition;
  work:string; locus:string; stability:Stability; minAge:number; sensitivity:string[];
  value:string; hook:string; status:string; wave:number; gated:boolean; careNote?:string;
}
export interface Relations { clusters:Record<string,string[]>; edges:[string,string,string][] }

export const CORPUS_LABEL: Record<string,string> = {
  ramayana:'Rāmāyaṇa', mahabharata:'Mahābhārata', bhagavata:'Bhāgavatam', purana:'Purāṇas',
  upanishad:'Upaniṣads', 'shiva-purana':'Śiva Purāṇa', 'vishnu-purana':'Viṣṇu Purāṇa',
  'other-purana':'Other Purāṇas', nayanmar:'Nāyaṉmārs', alvar:'Āḻvārs', sant:'Sants of the North',
  'other-ramayana':'The other Rāmāyaṇas', origin:'Where the stories come from', panchatantra:'Pañcatantra'
};
export const CORPUS_ORDER = ['ramayana','other-ramayana','mahabharata','bhagavata','vishnu-purana',
  'shiva-purana','purana','other-purana','upanishad','nayanmar','alvar','sant','panchatantra','origin'];
export const TRADITION_LABEL: Record<string,string> = {
  sanskrit:'Sanskrit','tamil-shaiva':'Tamil Śaiva','tamil-vaishnava':'Tamil Vaiṣṇava',
  'north-bhakti':'North bhakti', jain:'Jain', buddhist:'Buddhist', folk:'Folk / oral'
};
export const STABILITY_NOTE: Record<string,string> = {
  variant:'the recensions differ here',
  regional:'not in the Sanskrit — this one reaches us through a regional tradition',
  folk:'oral tradition; no text to check it against'
};
