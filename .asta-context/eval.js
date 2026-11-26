#!/usr/bin/env node
'use strict';
/**
 * eval — how well `ctx find` lands on the files a real change touched.
 *
 *   node .asta-context/eval.js build <gold.jsonl> [--since 2026-03-01]
 *   node .asta-context/eval.js run   <gold.jsonl> [--k 5] [--misses]
 *   node .asta-context/eval.js learn <gold.jsonl> [--write]   aliases that lift hit@5 on both halves
 *   node .asta-context/eval.js xrun  <xgold.jsonl>           cross-repo: does find land BOTH sides?
 *
 * The gold set comes from merged PRs: the PR title is the query, the src/main files
 * it MODIFIED (not added: a new file can't be found before it exists) are the answer.
 * PR titles are work data: keep gold.jsonl OUTSIDE this repo.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
// No leak: co-change history for scoring stops before the gold window starts.
process.env.CTX_CO_UNTIL = process.env.CTX_CO_UNTIL || '2026-02-01';
process.env.CTX_INDEX = process.env.CTX_INDEX || require('path').join(require('os').tmpdir(), 'ctx-eval-index.json');
const ctx = require('./ctx.js');

const ROOT = path.dirname(__dirname);
const SERVICES = JSON.parse(fs.readFileSync(path.join(__dirname, 'services.json'), 'utf8'));
const SRC = /\/src\/main\/(java\/.*\.java|(avro|resources\/avro)\/.*\.avsc)$/;
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };

function build(out) {
  const since = arg('--since', '2026-03-01');
  const rows = [];
  for (const repo of Object.values(SERVICES)) {
    const g = (...a) => execFileSync('git', ['-C', path.join(ROOT, repo), ...a], { maxBuffer: 1 << 28 }).toString();
    const log = g('log', 'origin/develop', '--first-parent', `--since=${since}`, '--format=%H%x1f%P%x1f%s%x1f%b%x1e');
    for (const rec of log.split('\x1e')) {
      const [sha, parents, subject, body] = rec.trim().split('\x1f');
      if (!sha) continue;
      const pr = (subject.match(/#(\d+)/) || [])[1];
      if (!pr) continue;
      const title = (parents.includes(' ') ? (body || '').split('\n')[0] : subject.replace(/\s*\(#\d+\)\s*$/, '')).trim();
      if (!title || title.length < 12 || /^(update|bump|merge|release|revert)\b|down-?merge|prod issues|^ct test|^feature\/|^hotfix\//i.test(title) || /values\.ya?ml|dependabot|version/i.test(title)) continue;
      const base = parents.split(' ')[0];
      const diff = g('diff', '--name-status', '-M', base, sha).split('\n').filter(Boolean);
      const modified = diff.filter((l) => /^M\t/.test(l)).map((l) => l.split('\t')[1]).filter((p) => SRC.test('/' + p) && !p.startsWith('componenttest/'));
      const added = diff.filter((l) => /^A\t/.test(l) && SRC.test('/' + l.split('\t')[1])).length;
      if (!modified.length || modified.length > 15) continue;
      rows.push({ repo, pr: +pr, title, gold: modified, added });
    }
  }
  fs.writeFileSync(out, rows.map((r) => JSON.stringify(r)).join('\n') + '\n');
  console.log(`${rows.length} cases → ${out}`);
}

function load(file) { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); }

function run(file, quiet) {
  const k = +arg('--k', 5);
  const rows = Array.isArray(file) ? file : load(file);
  const idx = ctx.buildIndex(false);
  const known = new Set(idx.files.map((f) => f.repo + '/' + f.path));
  let hit = 0; let rec = 0; let n = 0; let rr = 0; const misses = []; const per = {};
  for (const r of rows) {
    const gold = r.gold.map((p) => r.repo + '/' + p).filter((p) => known.has(p));
    if (!gold.length) continue;
    n++;
    const res = ctx.find(r.title, { limit: 10 });
    const got = res.hits.map((h) => h.repo + '/' + h.file.replace(/:\d+$/, ''));
    const topk = got.slice(0, k);
    const found = gold.filter((g) => topk.includes(g)).length;
    const first = got.findIndex((g) => gold.includes(g));
    if (found) hit++;
    rec += found / gold.length;
    rr += first >= 0 ? 1 / (first + 1) : 0;
    const s = (per[r.repo] = per[r.repo] || { n: 0, hit: 0 }); s.n++; if (found) s.hit++;
    if (!found) misses.push({ pr: `${r.repo.replace('telikos-', '').replace('-service', '')} PR ${r.pr}`, title: r.title.slice(0, 90), want: gold.map((g) => path.basename(g)).slice(0, 3), got: got.slice(0, 3).map((g) => path.basename(g)) });
  }
  const pct = (x) => (100 * x / (n || 1)).toFixed(0) + '%';
  if (quiet) return { n, hit: hit / (n || 1), recall: rec / (n || 1), mrr: rr / (n || 1), misses };
  console.log(`cases ${n} · hit@${k} ${pct(hit)} · recall@${k} ${pct(rec)} · MRR@10 ${(rr / (n || 1)).toFixed(2)}`);
  for (const [repo, s] of Object.entries(per)) console.log(`  ${repo}: hit@${k} ${s.hit}/${s.n}`);
  if (process.argv.includes('--misses')) for (const m of misses) console.log(`  miss ${m.pr}: ${m.title}\n       want ${m.want.join(', ')}\n       got  ${m.got.join(', ')}`);
  return { n, hit: hit / (n || 1), recall: rec / (n || 1), mrr: rr / (n || 1) };
}

// Learn aliases from misses: a task word the code never uses → a word in the class that changed.
// Kept only if hit@5 rises on the tune half AND does not fall on the held-out half (no overfit).
function learn(file) {
  const rows = load(file);
  const tune = rows.filter((_, i) => i % 2 === 0); const hold = rows.filter((_, i) => i % 2 === 1);
  const idx = ctx.buildIndex(false);
  const aliasPath = path.join(__dirname, 'aliases.json');
  const doc = JSON.parse(fs.readFileSync(aliasPath, 'utf8'));
  const vocab = new Set();
  for (const f of idx.files) for (const t of f.types || []) for (const w of ctx.words(t.name)) vocab.add(w);
  const base = { tune: run(tune, true), hold: run(hold, true) };
  const cands = new Map();
  for (const m of base.tune.misses) {
    const r = tune.find((x) => x.title.startsWith(m.title.slice(0, 60)));
    if (!r) continue;
    const q = ctx.words(r.title).filter((w) => !vocab.has(w) && w.length > 2);
    const target = new Set(r.gold.flatMap((g) => ctx.words(path.basename(g, '.java'))));
    for (const a of q) for (const b of target) if (b.length > 2) cands.set(a + '→' + b, [a, b]);
  }
  const kept = [];
  let cur = base;
  for (const [key, [a, b]] of cands) {
    const al = doc.aliases[a] || [];
    if (al.includes(b)) continue;
    doc.aliases[a] = al.concat(b); fs.writeFileSync(aliasPath, JSON.stringify(doc, null, 2) + '\n'); ctx.reset();
    const t = run(tune, true); const h = run(hold, true);
    // at least two more tuning cases found, and the held-out half no worse
    if ((t.hit - cur.tune.hit) * t.n >= 1.5 && h.hit >= cur.hold.hit) { kept.push(key); cur = { tune: t, hold: h }; }
    else { doc.aliases[a] = al; if (!al.length) delete doc.aliases[a]; }
  }
  if (!process.argv.includes('--write')) { const orig = JSON.parse(JSON.stringify(doc)); for (const k of kept) { const [a, b] = k.split('→'); orig.aliases[a] = (orig.aliases[a] || []).filter((x) => x !== b); if (!orig.aliases[a].length) delete orig.aliases[a]; } fs.writeFileSync(aliasPath, JSON.stringify(orig, null, 2) + '\n'); }
  else fs.writeFileSync(aliasPath, JSON.stringify(doc, null, 2) + '\n');
  const p = (x) => (100 * x).toFixed(0) + '%';
  console.log(`learn: ${cands.size} candidates, kept ${kept.length}: ${kept.join(', ') || '-'}`);
  console.log(`tune hit@5 ${p(base.tune.hit)} → ${p(cur.tune.hit)} · hold ${p(base.hold.hit)} → ${p(cur.hold.hit)}${process.argv.includes('--write') ? ' (written)' : ' (dry run)'}`);
}

// Cross-repo cases: {title, before, gold: {repo: [files]}}. A case lands when the top 10 holds at
// least one changed file in EVERY repo the change touched. Each case is scored against develop as it
// was before the change (CTX_BEFORE), so the fix itself is not in the index.
function xrun(file) {
  const rows = load(file);
  const { spawnSync } = require('child_process');
  let both = 0; let sides = 0; let sideHits = 0; let rec = 0; let n = 0;
  let lboth = 0; let lsideHits = 0; let lrec = 0; let lsize = 0;
  for (const r of rows) {
    const out = spawnSync(process.execPath, [path.join(__dirname, 'ctx.js'), 'find', r.title, '--json'],
      { env: Object.assign({}, process.env, { CTX_BEFORE: r.before, CTX_INDEX: '' }), encoding: 'utf8', maxBuffer: 1 << 26 });
    let res = { hits: [], cross: [] };
    try { res = JSON.parse(out.stdout); } catch (_) { /* no hits */ }
    const got = res.hits.concat(res.cross || []).map((h) => h.repo + '/' + h.file.replace(/:\d+$/, ''));
    let all = true; const per = [];
    for (const [repo, files] of Object.entries(r.gold)) {
      if (!files.length) continue;
      sides++;
      const f = files.filter((x) => got.includes(repo + '/' + x)).length;
      if (f) sideHits++; else all = false;
      rec += f / files.length; n++;
      per.push(`${repo.replace('telikos-', '').replace('-service', '')} ${f}/${files.length}`);
    }
    if (all) both++;
    // find + flow (what a leg sees after one find and a flow on its cross-repo families)
    const lf = spawnSync(process.execPath, ['-e', `const c=require(${JSON.stringify(path.join(__dirname, 'ctx.js'))});const r=c.landing(${JSON.stringify(r.title)});console.log(JSON.stringify({files:[...r.files.keys()],stems:r.stems}))`],
      { env: Object.assign({}, process.env, { CTX_BEFORE: r.before, CTX_INDEX: '' }), encoding: 'utf8', maxBuffer: 1 << 26 });
    let L = { files: [], stems: [] }; try { L = JSON.parse(lf.stdout); } catch (_) { /* none */ }
    let lall = true; const lper = [];
    for (const [repo, files] of Object.entries(r.gold)) {
      if (!files.length) continue;
      const f = files.filter((x) => L.files.includes(repo + '/' + x)).length;
      lsideHits += f ? 1 : 0; lrec += f / files.length; if (!f) lall = false;
      lper.push(`${repo.replace('telikos-', '').replace('-service', '')} ${f}/${files.length}`);
    }
    if (lall) lboth++;
    lsize += L.files.length;
    if (process.argv.includes('--misses')) console.log(`       find+flow ${lper.join(' · ')}  (${L.files.length} files; ${L.stems.join(', ') || 'no family'})`);
    if (process.argv.includes('--misses') || !all) console.log(`  ${all ? 'ok  ' : 'miss'} ${per.join(' · ')}  ${r.title.slice(0, 70)}`);
  }
  console.log(`cross cases ${rows.length} · both sides landed ${both}/${rows.length} · sides ${sideHits}/${sides} · recall per side ${(100 * rec / (n || 1)).toFixed(0)}%`);
  console.log(`find+flow       · both sides landed ${lboth}/${rows.length} · sides ${lsideHits}/${sides} · recall per side ${(100 * lrec / (n || 1)).toFixed(0)}% · ${(lsize / rows.length).toFixed(0)} files listed per case`);
}

const [cmd, file] = process.argv.slice(2);
if (cmd === 'build' && file) build(file);
else if (cmd === 'run' && file) run(file);
else if (cmd === 'learn' && file) learn(file);
else if (cmd === 'xrun' && file) xrun(file);
else { console.log('usage: eval.js build|run <gold.jsonl>'); process.exit(2); }
