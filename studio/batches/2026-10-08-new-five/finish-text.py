from pathlib import Path
B=Path(__file__).parent
for p in (B/'en').glob('*.md'):
    parts=p.read_text().split('## ')
    for i in [1,2]:
        import re
        parts[i]=re.sub(r'(?<!«)ākāśa(?!»)', '«Ākāśa»', parts[i])
        parts[i]=re.sub(r'(?<!«)Akṣara(?!»)', '«Akṣara»', parts[i])
    p.write_text('## '.join(parts))
p=B/'source-notes/ribhu-nidagha.md'
p.write_text(p.read_text().replace('modern stand-alone retellings often omit the food visit or shorten the interval. ',''))
