/**
 * Zamienia:
 *   _; EN;ES ;  PL
 *   "_; EN;ES ;  PL"
 *   '_; Foo ; Bar;Baz'
 *   `_; A;  B ; C`
 * na:
 *   i18n(["EN", "ES", "PL"])  // znormalizowane odstępy: "; "
 *
 * Dwie fazy:
 *  1) quoted: podmienia CAŁE literały stringów (", ', `)
 *  2) unquoted: podmienia goły tekst (np. w markupie)
 */

export  function i18nPreprocess({ dryRun = false } = {}) {
  const lit = (s) => JSON.stringify(s);
  const toArrayExpr = (list) =>
  `[${list
    .split(/\s*;\s*/g)        // zachowuje puste między ';;'
    .map((s) => s.trim())     // przytnij brzegi
    .map(lit)                 // JSON.stringify
    .join(', ')}]`;

  // 1) W <script> zamieniamy CAŁE literały "_; ...; ..." -> i18n([ ... ])
  //    Uwaga: dla prostoty nie dopuszczamy cudzysłowów/backticków wewnątrz placeholderów
  const QUOTED_IN_SCRIPT =
    /(['"`])\s*_;\s*((?:[^'"`;\r\n]*)(?:\s*;\s*[^'"`;\r\n]*)*)\s*\1/g;


  // 2) W markup – TYLKO surowy tekst między tagami (nie dotykamy atrybutów)
  const UNQUOTED_TEXT_IN_MARKUP =
    /(^|>)(\s*)_;\s*((?:[^;<>]*)(?:\s*;\s*[^;<>]*)*)/g;

  // ATRYBUTY: name="_; A; ; C"  ->  name={i18n(["A", "", "C"])}
  const ATTR_QUOTED =
    /(\s[0-9A-Za-z_:@#.-]+)\s*=\s*(["'])\s*_;\s*((?:[^"'<>]*)(?:\s*;\s*[^"'<>]*)*)\s*\2/g;

  // Wytnij i przywróć bloki, żeby w fazie markup nie ruszać <script>/<style>
  const extractBlocks = (content, tag) => {
    const re = new RegExp(`<${tag}\\b[\\s\\S]*?>[\\s\\S]*?<\\/${tag}>`, 'gi');
    const blocks = [];
    const placeholders = [];
    let i = 0;
    content = content.replace(re, (m) => {
      const key = `<<<${tag.toUpperCase()}_BLOCK_${i++}>>>`;
      blocks.push(m);
      placeholders.push(key);
      return key;
    });
    return { content, blocks, placeholders };
  };

  // UWAGA: używamy funkcji jako replacera, by nie zepsuć `$$props` -> `$props`
  const restoreBlocks = (content, placeholders, blocks) => {
    placeholders.forEach((key, idx) => {
      content = content.replace(key, () => blocks[idx]);
    });
    return content;
  };

  return {
    name: 'i18n-preprocess',

    markup({ content, filename }) {
      const s = extractBlocks(content, 'script');
      const ss = extractBlocks(s.content, 'style');

      let body = ss.content;
      let count = 0;

      body = body.replace(UNQUOTED_TEXT_IN_MARKUP, (m, before, pre, list) => {
        count++;
        return `${before}${pre}{i18n(${toArrayExpr(list)})}`;
      });

     if (count) console.log(`[i18n-preprocess][markup] ${filename} -> ${count} replace(s)`);

      body = restoreBlocks(body, ss.placeholders, ss.blocks);
      body = restoreBlocks(body, s.placeholders, s.blocks);

      if (dryRun) return { code: content };
      return { code: body };
    },

    script({ content, attributes, filename }) {
      let count = 0;
      const code = content.replace(QUOTED_IN_SCRIPT, (_m, _q, list) => {
        count++;
        return `i18n(${toArrayExpr(list)})`;
      });
    //  if (count) console.log(`[i18n-preprocess][script] ${filename} -> ${count} replace(s)`);
      if (dryRun) return { code: content, attributes };
      return { code, attributes };
    },

    style({ content, attributes }) {
      return { code: content, attributes };
    }
  };
}