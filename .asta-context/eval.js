#!/usr/bin/env node
'use strict';
/**
 * eval — how well `ctx find` lands on the files a real change touched.
 *
 *   node .asta-context/eval.js build <gold.jsonl> [--since 2026-03-01]
 *   node .asta-context/eval.js run   <gold.jsonl> [--k 5] [--misses]
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

function run(file) {
  const k = +arg('--k', 5);
  const rows = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
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
  console.log(`cases ${n} · hit@${k} ${pct(hit)} · recall@${k} ${pct(rec)} · MRR@10 ${(rr / (n || 1)).toFixed(2)}`);
  for (const [repo, s] of Object.entries(per)) console.log(`  ${repo}: hit@${k} ${s.hit}/${s.n}`);
  if (process.argv.includes('--misses')) for (const m of misses) console.log(`  miss ${m.pr}: ${m.title}\n       want ${m.want.join(', ')}\n       got  ${m.got.join(', ')}`);
  return { n, hit: hit / (n || 1), recall: rec / (n || 1), mrr: rr / (n || 1) };
}

const [cmd, file] = process.argv.slice(2);
if (cmd === 'build' && file) build(file);
else if (cmd === 'run' && file) run(file);
else { console.log('usage: eval.js build|run <gold.jsonl>'); process.exit(2); }
