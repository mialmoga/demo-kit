#!/usr/bin/env node
// art_code.js · reformatea el JS de un HTML para que el código dibuje una cinta ondulante (como una forma de onda).
// Solo cambia espacios y saltos de línea: los tokens quedan idénticos y en el mismo orden (se verifica comparando los AST).
// Uso:  node art_code.js entrada.html salida.html [--min 38] [--max 92] [--p1 18] [--p2 150] [--preview prev.json]
// Requiere:  npm i acorn
const fs = require('fs'), acorn = require('acorn');
const A = process.argv.slice(2), opt = { min: 38, max: 92, p1: 18, p2: 150 }; let inF, outF, prevF;
for (let i = 0; i < A.length; i++) { if (A[i].startsWith('--')) { const k = A[i].slice(2), v = A[++i]; if (k === 'preview') prevF = v; else opt[k] = +v; } else if (!inF) inF = A[i]; else outF = A[i]; }
if (!inF || !outF) { console.error('uso: node art_code.js entrada.html salida.html [--min N --max N --p1 N --p2 N --preview f.json]'); process.exit(1); }

const NO_BREAK_AFTER = new Set(['return', 'throw', 'break', 'continue', 'yield', 'async']);   // aquí un salto de línea cambiaría el significado
function parse(src, module, extra) { return acorn.parse(src, Object.assign({ ecmaVersion: 'latest', sourceType: module ? 'module' : 'script', allowHashBang: true }, extra)); }
const strip = (n) => JSON.stringify(n, (k, v) => (k === 'start' || k === 'end' || k === 'loc' || k === 'range') ? undefined : v);

function tokenize(src, module) {
  const toks = [], asi = new Set(), tpl = [];
  const ast = parse(src, module, { onToken: t => toks.push(t), onInsertedSemicolon: p => asi.add(p) });
  (function walk(n) { if (!n || typeof n !== 'object') return; if (Array.isArray(n)) return n.forEach(walk); if (n.type === 'TemplateLiteral') { tpl.push([n.start, n.end]); return; } for (const k in n) if (k !== 'type') walk(n[k]); })(ast);
  tpl.sort((a, b) => a[0] - b[0]);
  const chunks = []; let ti = 0;
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]; let text, cls, end;
    if (ti < tpl.length && t.start === tpl[ti][0]) { end = tpl[ti][1]; text = src.slice(t.start, end); cls = 'str'; while (i + 1 < toks.length && toks[i + 1].start < end) i++; ti++; }
    else { end = t.end; text = src.slice(t.start, t.end); const l = t.type.label; cls = t.type.keyword ? 'kw' : l === 'name' ? 'id' : l === 'string' ? 'str' : l === 'num' ? 'num' : l === 'regexp' ? 're' : 'p'; }
    chunks.push({ text, cls, nbA: NO_BREAK_AFTER.has(text) && cls !== 'str', nbB: text === '=>' || ((text === '++' || text === '--') && cls === 'p') });
    if (asi.has(end)) chunks.push({ text: ';', cls: 'p', nbA: false, nbB: false, virt: true });          // el punto y coma que la ASI habría puesto
  }
  return { chunks, ast };
}
const env = i => { const a = .5 + .5 * Math.sin(2 * Math.PI * i / opt.p1), b = .55 + .45 * Math.sin(2 * Math.PI * i / opt.p2 + 1); return a * b; };
function layout(chunks) {
  const lines = []; let i = 0, ln = 0;
  while (i < chunks.length) {
    const target = Math.round(opt.min + (opt.max - opt.min) * env(ln)), row = [chunks[i++]]; let w = row[0].text.length;
    while (i < chunks.length) {
      const nx = chunks[i], prv = row[row.length - 1], must = prv.nbA || nx.nbB;
      if (w + 1 + nx.text.length > target && !must) break;
      if (w + 1 + nx.text.length > target + 40) break;
      row.push(nx); w += 1 + nx.text.length; i++;
    }
    lines.push({ row, w, target }); ln++;
  }
  return lines;
}
function render(lines, prev) {
  const out = [];
  lines.forEach((L, y) => {
    const n = L.row.length, gaps = n - 1; let pad = Math.max(0, Math.floor((opt.max - Math.max(L.w, L.target)) / 2)), extra = Math.max(0, L.target - L.w), gs = new Array(gaps).fill(1);
    if (gaps > 0 && extra > 0 && extra / gaps <= 4.5) { const base = Math.floor(extra / gaps), rem = extra % gaps; for (let g = 0; g < gaps; g++) gs[g] += base + ((g * 7 + y) % gaps < rem ? 1 : 0); }
    else pad += Math.floor(extra / 2);
    let s = ' '.repeat(pad), col = pad; const marks = [];
    L.row.forEach((c, k) => { marks.push([col, c.text.length, c.cls]); s += c.text; col += c.text.length; if (k < gaps) { s += ' '.repeat(gs[k]); col += gs[k]; } });
    out.push(s); if (prev) prev.push(marks);
  });
  return out.join('\n');
}
const html = fs.readFileSync(inF, 'utf8'); let nScripts = 0, tIn = 0, tOut = 0, verified = true; const previews = [];
const outHtml = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (m, attrs, body) => {
  if (/\bsrc\s*=/.test(attrs) || (/\btype\s*=/.test(attrs) && !/type\s*=\s*["']?(module|text\/javascript|application\/javascript)/i.test(attrs)) || !body.trim()) return m;
  const module = /type\s*=\s*["']?module/i.test(attrs); let T; try { T = tokenize(body, module); } catch (e) { try { T = tokenize(body, !module); } catch (e2) { console.error('script omitido (no se pudo leer):', e2.message); return m; } }
  const lines = layout(T.chunks), pv = [], _p = previews.push(pv), art = '\n/* Demo Kit · versión «arte»: mismo programa, otro peinado (solo cambian espacios y saltos de línea). */\n' + render(lines, pv) + '\n';
  // verificación: el AST del arte debe ser idéntico al original
  let ok = false; try { ok = strip(parse(art, module)) === strip(T.ast); } catch (e) { ok = false; }
  if (!ok) { verified = false; console.error('✗ el AST NO coincide en el script', nScripts + 1, '→ se deja sin tocar'); return m; }
  nScripts++; tIn += body.length; tOut += art.length; return '<script' + attrs + '>' + art + '</script>';
});
const preview = previews.reduce((a, b) => b.length > a.length ? b : a, []);
fs.writeFileSync(outF, outHtml); if (prevF) fs.writeFileSync(prevF, JSON.stringify(preview));
console.log(`scripts transformados: ${nScripts} | AST idéntico: ${verified ? 'sí' : 'NO'} | JS ${tIn} → ${tOut} bytes (+${((tOut / tIn - 1) * 100).toFixed(0)}%) | HTML ${html.length} → ${outHtml.length} | líneas de arte: ${preview.length}`);
