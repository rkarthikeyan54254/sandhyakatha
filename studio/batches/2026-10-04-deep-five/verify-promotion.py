#!/usr/bin/env python3
"""Compare approved review text/assets to structured publication files."""
from pathlib import Path
import hashlib, json, re, subprocess

B = Path(__file__).resolve().parent
R = B.parents[2]
IDS = ('nrga-well', 'indra-virocana', 'dharma-vyadha', 'mainaka-welcome', 'devi-messenger')
lexicon = json.loads((R / 'content/lexicon.json').read_text())


def sections(text):
    bits = re.split(r'^##\s+([^\n]+)\n', text, flags=re.M)
    return {bits[i]: bits[i + 1] for i in range(1, len(bits), 2)}


def normalized(text):
    text = text.replace('**', '').replace('_', '').replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', text).strip()


failures = []
checks = []
review = json.loads((B / 'review-data.json').read_text())
approval = json.loads((B / 'approval.json').read_text())
checks.append(('review HTML hash', approval['reviewHtmlSha256'] == hashlib.sha256((B / 'review.html').read_bytes()).hexdigest()))
records = {x['id']: x for x in review['stories']}
for story_id in IDS:
    record = records[story_id]
    story = json.loads((R / 'content/stories' / f'{story_id}.json').read_text())
    hero = R / 'public/media/stories' / story_id / 'hero.webp'
    checks.append((f'{story_id} hero approved hash', hashlib.sha256(hero.read_bytes()).hexdigest() == record['art']['sha256']))
    og = R / 'public/og' / f'{story_id}.jpg'
    size = subprocess.check_output(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(og)], text=True)
    checks.append((f'{story_id} production OG dimensions', 'pixelWidth: 1200' in size and 'pixelHeight: 630' in size))
    for lang in ('en', 'hi', 'ta'):
        draft = B / ('en' if lang == 'en' else f'locales/{lang}') / f'{story_id}.md'
        doc = story if lang == 'en' else json.loads((R / 'content/locales' / lang / f'{story_id}.json').read_text())
        names = doc.get('displayNames', {})
        parts = sections(draft.read_text())
        title = draft.read_text().splitlines()[0][2:].split(' — ')[0]
        checks.append((f'{story_id}/{lang} reviewed title', title == doc['title'] if lang != 'en' else True))
        for length in ('short', 'full'):
            original = next(value for heading, value in parts.items() if heading.startswith(length.capitalize()))
            if lang == 'hi':
                original = original.split('**पूछें:**')[0]
            expected = normalized(original).replace('«', '').replace('»', '')
            rendered = ' '.join(block['text'] for block in doc['lengths'][length]['blocks'] if block['t'] != 'beat')
            rendered = re.sub(r'«([^»]+)»', lambda m: names.get(m.group(1), lexicon.get(m.group(1), {}).get('display', m.group(1))), rendered)
            checks.append((f'{story_id}/{lang}/{length} exact narrated text', expected == normalized(rendered)))
            if lang != 'en':
                scene_map = doc['sourceMap']['scenes']
                used = {block['scene'] for block in doc['lengths'][length]['blocks']}
                checks.append((f'{story_id}/{lang}/{length} source scene coverage', used <= set(scene_map)))
for name, ok in checks:
    if not ok:
        failures.append(name)
report = {'scope': 'approved review to production publication parity', 'checks': len(checks), 'failures': failures, 'pass': not failures}
(B / 'promotion-verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(f"promotion parity: {len(checks)} checks, {len(failures)} failures")
for failure in failures:
    print('FAIL', failure)
raise SystemExit(bool(failures))
