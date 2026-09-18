# Locale-aware Tonight

Sandhya Katha has one story identity and multiple reviewed language editions.

The root app exposes English, हिन्दी and தமிழ். `?lang=hi` / `?lang=ta`
take precedence over the saved device preference.

Hindi and Tamil Tonight draw only from editions that are public, approved,
exact-source-byte pinned, human reviewed and current in the locale lock.
There is no runtime translation.

The same canonical age/calendar picker is used for every language. Small
reviewed locale shelves use a repeat fallback only after the normal recency
pass has no eligible story.

Locale runtime stories are build-time merges of canonical identity/provenance
with reviewed locale prose. Family history therefore stores the same canonical
story id regardless of language.

Only reviewed short locale editions are emitted. English Full / One more
controls are not fabricated for languages that do not yet have reviewed full
editions.

Generic acquisition:
- English: https://sandhyakatha.com/
- Hindi: https://sandhyakatha.com/hi/
- Tamil: https://sandhyakatha.com/ta/

The Hindi/Tamil shelves link prominently into locale-aware Tonight.


## Surface parity

Language changes the reviewed edition, not the product hierarchy.

English, Hindi and Tamil Tonight keep the same visual scaffold: language
control, four navigation positions, greeting, date/panchanga context, festival
context, Why-tonight band, source line, story title/tease, illustration,
metadata and read CTA.

Content capability can still differ honestly: Hindi/Tamil expose only reviewed
short editions until reviewed full editions exist.
