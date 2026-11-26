"""Normalize web wordbooks using the local english-vocabulary JSONL files."""
import argparse
import json
import re
from collections import defaultdict
from pathlib import Path

aliases = {'a': 'adj', 'ad': 'adv', 'noun': 'n', '名词': 'n', 'verb': 'v',
           'vb': 'v', 'adverb': 'adv', 'pronoun': 'pron', 'determiner': 'det',
           'conjunction': 'conj', 'interjection': 'interj', 'int': 'interj',
           'numeral': 'num', 'aux v': 'aux', 'modal verb': 'modal'}
tags = set('n v vi vt adj adv prep conj pron abbr art num aux interj det modal neg'.split())


def label(raw):
    if raw == 'noun, uncountable':
        return 'n. [不可数]'
    if raw == 'prep., symbol':
        return 'prep./符号'
    result = []
    for part in re.split(r'[&/,]', raw):
        part = part.strip(' .')
        part = aliases.get(part, part)
        if part in tags:
            part += '.'
        elif part not in ('plural noun', 'comparative adj', 'superlative adj'):
            return ''
        else:
            part = {'plural noun': 'n. pl.', 'comparative adj': 'adj. 比较级',
                    'superlative adj': 'adj. 最高级'}[part]
        if part not in result:
            result.append(part)
    return '/'.join(result)


def key(s):
    return re.sub(r'[\s，,、；;。]', '', s)


def reference(directory):
    index = defaultdict(list)
    for path in sorted(directory.glob('*.jsonl')):
        for line in path.read_text().splitlines():
            row = json.loads(line)
            senses = [(key(t['translation']), label(t.get('type', '')))
                      for t in row['translations']]
            index[row['word'].strip().lower()].append(senses)
    if not index:
        raise ValueError('Missing reference JSONL files')
    return index


phrase = re.compile(r"(?<![a-zA-Z])([A-Za-z][\w'-]*(?: [A-Za-z][\w'-]*)*[!?]?)\s*:+\s*", re.ASCII)
suffix = re.compile(r'\(([^()]+)\)')
prefix = re.compile(r'^(adj|adv|n|vt|vi|v|prep|conj|int|pron|num|aux|abbr)\.(?!/)\s*')


def split_text(text, book):
    if book == 'XDF_CET6_Luan':
        head = re.match(r"^([A-Za-z][\x20-\x39\x3b-\x7e]*?)\s*:+\s*", text)
        if head:
            text = head[1].strip() + '：' + phrase.sub(r'\n\1：', text[head.end():])
        else:
            text = phrase.sub(r'\n\1：', text)
    text = re.sub(r'[;；]\s*(?=(?:adj|adv|n|vt|vi|v)\.)', '\n', text)
    for row in text.splitlines():
        row = row.strip()
        if not row:
            continue
        if book in ('HongBao_2026', 'CET6_T'):
            start = 0
            for mark in suffix.finditer(row):
                pos = label(mark[1])
                if pos:
                    meaning = row[start:mark.start()].strip(' ,，;；')
                    end = mark.end()
                    # A note after the final label belongs to that same sense.
                    if not any(label(m[1]) for m in suffix.finditer(row, end)):
                        meaning += row[end:]
                        end = len(row)
                    yield pos + ' ' + meaning
                    start = end
            row = row[start:].strip()
        if row:
            yield prefix.sub(lambda m: label(m[1]) + ' ', row)


# Reviewed senses for which the reference editions disagree or omit a type.
reviewed = {}
for pos, lemmas in {
    'n.': 'gratitude suicide kiosk frontbench treeline dread curse fore glimpse',
    'adj.': 'radical advisable planetary adventurist',
    'v.': 'exaggerate mourn cease',
    'conj.': 'whilst',
    'adv.': 'nonetheless',
    'n./v.': ('weld chase mention blend shrug disgust command exchange release debate '
              'frown display gaze tow roast boycott twinkle glide revolt slap arrest exile '
              'hug envy blush retail collapse assault')
}.items():
    reviewed.update(dict.fromkeys(lemmas.split(), pos))


def normalize(word, index, book):
    original = word['trans']
    refs = index.get(word['name'].strip().lower(), [])
    keys = [key(t) for t in original]
    aligned = [r for r in refs if [k for k, _ in r] == keys]
    rows = []
    for i, text in enumerate(original):
        possible = ({r[i][1] for r in aligned} if aligned else
                    {pos for r in refs for k, pos in r if k == keys[i]})
        possible.discard('')
        if len(possible) > 1 and possible <= {'v.', 'vt.', 'vi.'}:
            possible = {'v.'}
        if len(possible) == 1:
            text = possible.pop() + ' ' + text
        elif not prefix.match(text) and (not suffix.search(text) or word['name'] == 'kiosk') and not re.search(r'[:：]', text):
            lemma = word['name'].lower()
            pos = reviewed.get(lemma, '')
            if lemma in ('murder', 'input') and keys == [keys[i], keys[i]]:
                pos = ('v.', 'n.')[i]
            if book == 'XDF_CET6_Luan' and ' ' in lemma and not re.search('[a-zA-Z]', text):
                pos = '短语'
            if pos:
                text = pos + ' ' + text
        rows.extend(split_text(text, book))
    word['trans'] = rows


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('reference_dir', type=Path)
    index = reference(parser.parse_args().reference_dir)
    for path in sorted((Path(__file__).resolve().parents[1] / 'web').glob('*.json')):
        words = json.loads(path.read_text())
        for word in words:
            normalize(word, index, path.stem)
        path.write_text(json.dumps(words, ensure_ascii=False, separators=(',', ':')))
