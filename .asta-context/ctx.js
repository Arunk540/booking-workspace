#!/usr/bin/env node
'use strict';
/**
 * ctx — find code in the booking workspace from the code itself.
 *
 *   node .asta-context/ctx.js find "<task words>"   ranked repo/path:line hits + docs
 *   node .asta-context/ctx.js entry <svc>           Kafka / REST / Temporal entry points
 *   node .asta-context/ctx.js verify [--run]        context files vs code; --run executes `verify` commands
 *   node .asta-context/ctx.js drift                 docs whose verified commit is behind develop
 *   node .asta-context/ctx.js index [--force]       rebuild the code index (automatic when stale)
 *
 * The index is built from each repo's origin/develop tree (git objects, not the
 * checkout), so whatever branch a checkout is on, hits are develop's. It is
 * rebuilt whenever a repo's develop sha moves. Zero deps, node >= 16.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync, spawnSync } = require('child_process');

const CTX = __dirname;
const ROOT = path.dirname(CTX);
const SERVICES = JSON.parse(fs.readFileSync(path.join(CTX, 'services.json'), 'utf8'));
const INDEX = process.env.CTX_INDEX || path.join(CTX, process.env.CTX_BEFORE ? `_code_index.before-${process.env.CTX_BEFORE.replace(/[^\w-]/g, '')}.json` : '_code_index.json');
const ALIASES = path.join(CTX, 'aliases.json');
const FIND_LOG = path.join(CTX, '.find-log.jsonl');
const GEN = path.join(ROOT, 'docs', 'generated');
const VERSION = 6;
// Ranking knobs. Defaults are the eval's best (eval.js); CTX_W='{"len":0}' overrides for ablations.
const W = Object.assign({ type: 2, entryArg: 3, method: 3, field: 0.8, avro: 1.5, key: 0.6, path: 1, phrase: 0.2, entry: 1, len: 0, co: 0.5, alias: 0.5, mlen: 0 },
  process.env.CTX_W ? JSON.parse(process.env.CTX_W) : {});

// Budgets for always-loaded text (chars). A lesson has to displace a line, not pile on.
const BUDGET = { root: 2600, rules: 1800, service: 3200 };

const STOP = new Set(('a an the of to in on for and or with from into is are be by at as it this that ' +
  'add adding added new field fields change changes changed update updates updated make fix fixes ' +
  'when where should must not do does use using via so we our its also then than only one any all ' +
  'impl java class get set value values true false null list map ' +
  'feat fix chore refactor feature bepteliko beptelikos improve support handling issue').split(' '));

// ── helpers ─────────────────────────────────────────────────────────────────
const git = (repo, args, opts = {}) =>
  execFileSync('git', ['-C', path.join(ROOT, repo), ...args], { maxBuffer: 1 << 30, ...opts });
function refOf(repo) {
  // CTX_BEFORE=<date>: develop as it was then (rehearsals replay a past task without seeing its fix).
  if (process.env.CTX_BEFORE) {
    try {
      const sha = git(repo, ['rev-list', '-1', `--before=${process.env.CTX_BEFORE}`, 'origin/develop'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      if (sha) return { ref: sha, sha: sha.slice(0, 9) };
    } catch (_) { /* fall through */ }
  }
  for (const ref of ['origin/develop', 'develop', 'HEAD']) {
    try { return { ref, sha: git(repo, ['rev-parse', '--short', ref], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim() }; } catch (_) { /* next */ }
  }
  return null;
}
function words(text) {
  return String(text)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2').replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1 && !STOP.has(w)).map(stem);
}
function stem(w) {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}
const svcOfRepo = (repo) => Object.keys(SERVICES).find((k) => SERVICES[k] === repo) || repo;
const repoOfSvc = (s) => SERVICES[s] || (Object.values(SERVICES).includes(s) ? s : null);

// ── index ───────────────────────────────────────────────────────────────────
const WANT = /(\/src\/main\/java\/.*\.java|\/src\/main\/(avro|resources\/avro)\/.*\.avsc|\/src\/main\/resources\/application[^/]*\.ya?ml)$/;
const TESTFILE = /\/src\/test\/java\/.*Test\.java$/;

function readBlobs(repo, ref, paths) {
  // One `git cat-file --batch` for the whole tree: thousands of files in ~1s.
  const out = git(repo, ['cat-file', '--batch'], { input: paths.map((p) => `${ref}:${p}`).join('\n') + '\n' });
  const files = {}; let off = 0; let i = 0;
  while (off < out.length && i < paths.length) {
    const nl = out.indexOf(10, off);
    const head = out.slice(off, nl).toString();
    const size = parseInt(head.split(' ')[2], 10);
    if (Number.isNaN(size)) { off = nl + 1; i++; continue; } // "missing"
    files[paths[i]] = out.slice(nl + 1, nl + 1 + size).toString('utf8');
    off = nl + 1 + size + 1; i++;
  }
  return files;
}

function parseJava(src) {
  const lines = src.split('\n');
  const types = []; const methods = []; const entries = []; const fields = [];
  let pendingAnn = [];
  const classLevelAnn = [];
  for (let n = 0; n < lines.length; n++) {
    const l = lines[n].trim();
    if (!l || l.startsWith('//') || l.startsWith('*') || l.startsWith('/*') || l.startsWith('import ') || l.startsWith('package ')) continue;
    if (l.startsWith('@')) {
      let ann = l;
      // join multi-line annotation arguments
      let k = n;
      while ((ann.match(/\(/g) || []).length > (ann.match(/\)/g) || []).length && k + 1 < lines.length && k - n < 8) { k++; ann += ' ' + lines[k].trim(); }
      pendingAnn.push({ text: ann, line: n + 1 });
      if (!/\b(class|interface|enum|record)\b/.test(ann)) { n = k; continue; }   // argument lines belong to it
    }
    const t = l.match(/\b(class|interface|enum|record)\s+([A-Z][A-Za-z0-9_]*)/);
    if (t && !/^\s*(return|new)\b/.test(l)) {
      types.push({ name: t[2], kind: t[1], line: n + 1 });
      for (const a of pendingAnn) classLevelAnn.push(a);
      pendingAnn = []; continue;
    }
    const m = l.match(/^(?:(?:public|protected|private|static|final|default|abstract|synchronized)\s+)*(?:<[^>]+>\s+)?[\w<>\[\],.? ]+\s+([a-z][A-Za-z0-9_]*)\s*\(/);
    if (m && !/^(return|new|if|for|while|switch|catch|throw|else)\b/.test(l) && !l.includes('=')) {
      methods.push({ name: m[1], line: n + 1 });
      for (const a of pendingAnn) entryOf(a, entries, m[1]);
      pendingAnn = []; continue;
    }
    const f = l.match(/^(?:(?:private|protected|public|static|final|transient|volatile)\s+)+[\w<>\[\],.? ]+\s+([A-Za-z_][A-Za-z0-9_]*)\s*(=|;)/);
    if (f) fields.push({ name: f[1], line: n + 1 });
    else if (types.length && types[types.length - 1].kind === 'enum') {
      const ev = l.match(/^([A-Z][A-Z0-9_]+)\s*(\(|,|;|$)/);
      if (ev) fields.push({ name: ev[1], line: n + 1 });
    }
    pendingAnn = [];
  }
  for (const a of classLevelAnn) entryOf(a, entries, null);
  // Kafka consumers here are reactor-kafka (KafkaReceiver / ReceiverOptions) or Spring listener
  // containers, not @KafkaListener: mark the class, with topic property names from @Value.
  const head = types[0];
  if (head && !entries.some((e) => e.kind === 'kafka') && /\bKafkaReceiver<|\bReceiverOptions<|KafkaListenerContainerFactory|MessageListener<|\.receive\(\)/.test(src)
      && /(Consumer|Listener|Receiver|Kafka\w*Config|ConsumerConfig)/.test(head.name)) {
    const topics = Array.from(src.matchAll(/@Value\(\s*"\$\{([^}:]*topic[^}:]*)/gi)).map((m) => m[1]);
    entries.push({ kind: 'kafka', ann: /KafkaListenerContainerFactory|MessageListener</.test(src) ? 'spring-kafka' : 'reactor-kafka', method: null, line: head.line, args: Array.from(new Set(topics)).join(' ') });
  }
  return { types, methods, entries, fields };
}
function entryOf(a, entries, method) {
  const s = a.text;
  const arg = (s.match(/\(([\s\S]*)\)/) || [])[1] || '';
  const strs = (arg.match(/"[^"]*"/g) || []).map((x) => x.slice(1, -1));
  let kind = null;
  if (/^@KafkaListener\b/.test(s)) kind = 'kafka';
  else if (/^@(Get|Post|Put|Patch|Delete|Request)Mapping\b/.test(s)) kind = 'rest';
  else if (/^@(RestController|Controller)\b/.test(s)) kind = 'rest';
  else if (/^@WorkflowInterface\b/.test(s)) kind = 'workflow';
  else if (/^@ActivityInterface\b/.test(s)) kind = 'activity';
  else if (/^@(WorkflowMethod|SignalMethod|QueryMethod|UpdateMethod)\b/.test(s)) kind = 'workflow';
  else if (/^@Scheduled\b/.test(s)) kind = 'scheduled';
  if (!kind) return;
  const topicExpr = (arg.match(/topics?\s*=\s*([^,)]*(?:\{[^}]*\})?)/) || [])[1] || '';
  entries.push({ kind, ann: s.split('(')[0], method, line: a.line, args: strs.join(' ') || topicExpr.replace(/[{}"\s]/g, '') });
}
function parseAvsc(src) {
  try {
    const out = []; const seen = new Set();
    const walk = (node) => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (node && typeof node === 'object') {
        if (node.name && !seen.has(node.name)) { seen.add(node.name); out.push(node.name); }
        Object.values(node).forEach(walk);
      }
    };
    walk(JSON.parse(src));
    return out;
  } catch (_) { return []; }
}
function parseYamlKeys(src) {
  // Key NAMES only. Values are never read into the index.
  const keys = []; const stack = [];
  src.split('\n').forEach((raw, n) => {
    const m = raw.match(/^(\s*)([A-Za-z0-9_.-]+):(\s|$)/);
    if (!m || raw.trim().startsWith('#')) return;
    const ind = m[1].length;
    while (stack.length && stack[stack.length - 1].ind >= ind) stack.pop();
    stack.push({ ind, key: m[2] });
    keys.push({ key: stack.map((s) => s.key).join('.'), line: n + 1 });
  });
  return keys;
}

function buildIndex(force) {
  const old = fs.existsSync(INDEX) ? JSON.parse(fs.readFileSync(INDEX, 'utf8')) : null;
  const shas = {};
  for (const repo of Object.values(SERVICES)) {
    if (!fs.existsSync(path.join(ROOT, repo, '.git'))) continue;
    shas[repo] = refOf(repo);
  }
  const fresh = old && old.version === VERSION && JSON.stringify(old.shas) === JSON.stringify(shas) && (old.coUntil || '') === (process.env.CTX_CO_UNTIL || '');
  if (fresh && !force) return old;
  const idx = { version: VERSION, built: new Date().toISOString(), shas, coUntil: process.env.CTX_CO_UNTIL || '', files: [], tests: {} };
  for (const [repo, r] of Object.entries(shas)) {
    if (!r) continue;
    const all = git(repo, ['ls-tree', '-r', '--name-only', r.ref]).toString().split('\n').filter(Boolean);
    const want = all.filter((p) => WANT.test('/' + p) && !p.includes('/target/') && !p.startsWith('componenttest/') && !p.startsWith('perftest/'));
    for (const p of all) if (TESTFILE.test('/' + p) && !p.startsWith('componenttest/')) {
      idx.tests[repo + '/' + path.basename(p, '.java').replace(/Test$/, '')] = (idx.tests[repo + '/' + path.basename(p, '.java').replace(/Test$/, '')] || []).concat(p);
    }
    const blobs = readBlobs(repo, r.ref, want);
    const imp = new Set();
    for (const p of want) if (p.endsWith('.java') && blobs[p]) for (const m of blobs[p].matchAll(/^import\s+(?:static\s+)?[\w.]*\.([A-Z]\w*)(?:\.\w+)?;/gm)) imp.add(m[1]);
    (idx.imports = idx.imports || {})[repo] = Array.from(imp);
    for (const p of want) {
      const src = blobs[p]; if (src == null) continue;
      const rec = { repo, path: p };
      if (p.endsWith('.java')) Object.assign(rec, parseJava(src));
      else if (p.endsWith('.avsc')) rec.avro = parseAvsc(src);
      else rec.keys = parseYamlKeys(src).map((k) => k.key);
      idx.files.push(rec);
    }
  }
  idx.co = coChange(shas);
  fs.writeFileSync(INDEX, JSON.stringify(idx));
  writeGenerated(idx);
  return idx;
}

function coChange(shas) {
  // Files that change together in develop's history (temporal coupling). A hit's
  // partners are what a change to it usually also touches: constants, enum pairs, mappers.
  const co = {};
  for (const [repo, r] of Object.entries(shas)) {
    if (!r) continue;
    const log = git(repo, ['log', r.ref, '--no-merges', '--since=18 months ago', ...(process.env.CTX_CO_UNTIL ? ['--until=' + process.env.CTX_CO_UNTIL] : []), '--name-only', '--format=format:@@']).toString();
    const count = {}; const pair = {};
    for (const c of log.split('@@')) {
      const fsx = Array.from(new Set(c.split('\n').filter((p) => WANT.test('/' + p) && (p.endsWith('.java') || p.endsWith('.avsc')))));
      if (fsx.length < 2 || fsx.length > 12) continue;
      for (const a of fsx) { count[a] = (count[a] || 0) + 1; for (const b of fsx) if (a !== b) { const k = a + '\t' + b; pair[k] = (pair[k] || 0) + 1; } }
    }
    for (const [k, n] of Object.entries(pair)) {
      const [a, b] = k.split('\t');
      if (n < 3 || n / count[a] < 0.25) continue;
      (co[repo + '/' + a] = co[repo + '/' + a] || []).push([b, n, +(n / count[a]).toFixed(2)]);
    }
    for (const k of Object.keys(co)) if (k.startsWith(repo + '/')) co[k] = co[k].sort((x, y) => y[2] - x[2]).slice(0, 4);
  }
  return co;
}

function writeGenerated(idx) {
  for (const [svc, repo] of Object.entries(SERVICES)) {
    const ents = [];
    for (const f of idx.files) if (f.repo === repo) for (const e of f.entries || []) ents.push({ f, e });
    if (!ents.length) continue;
    const order = ['kafka', 'rest', 'workflow', 'activity', 'scheduled'];
    const out = [`# ${svc} entry points`, '', `GENERATED by ctx from ${repo}@${idx.shas[repo].sha} (${idx.shas[repo].ref}). Do not edit; run \`node .asta-context/ctx.js index\`.`, ''];
    for (const k of order) {
      const rows = ents.filter((x) => x.e.kind === k);
      if (!rows.length) continue;
      out.push(`## ${k} (${rows.length})`, '');
      for (const { f, e } of rows) {
        const cls = (f.types[0] || {}).name || path.basename(f.path, '.java');
        out.push(`- \`${cls}${e.method ? '.' + e.method : ''}\` ${e.ann}${e.args ? ' `' + e.args.slice(0, 80) + '`' : ''} — ${f.path}:${e.line}`);
      }
      out.push('');
    }
    fs.mkdirSync(path.join(GEN, svc), { recursive: true });
    fs.writeFileSync(path.join(GEN, svc, 'entry-points.md'), out.join('\n'));
  }
}

// ── find ────────────────────────────────────────────────────────────────────
function loadAliases() {
  try { return JSON.parse(fs.readFileSync(ALIASES, 'utf8')).aliases || {}; } catch (_) { return {}; }
}
function docFiles() {
  const out = [];
  const walk = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else if (e.name.endsWith('.md') && e.name !== 'lessons.md') out.push(p);
    }
  };
  walk(path.join(CTX, 'repos')); walk(path.join(ROOT, 'docs', 'architecture'));
  return out;
}

function fileTerms(f) {
  // term -> weight. Type names and entry-point args weigh most; methods/fields a little.
  const t = new Map();
  const put = (ws, w) => { for (const x of ws) t.set(x, Math.max(t.get(x) || 0, w)); };
  put(words(f.path.replace(/^.*\/src\/main\/(java|avro|resources)\//, '').replace(/^(net|com)\/[a-z]+\/[a-z]+\//, '')), W.path);
  for (const ty of f.types || []) put(words(ty.name), W.type);
  for (const e of f.entries || []) { put(words(e.args), W.entryArg); put([e.kind], 2); }
  const ml = 1 + W.mlen * Math.log2(1 + ((f.methods || []).length) / 25); // a 300-method util matches every verb
  for (const m of f.methods || []) put(words(m.name), W.method / ml);
  for (const x of f.fields || []) put(words(x.name), W.field);
  for (const a of f.avro || []) put(words(a), W.avro);
  if (f.avro) put(['avro', 'event', 'schema'], 2);
  for (const k of f.keys || []) put(words(k), W.key);
  return t;
}

const memo = {};
function prepared() {
  // Built once per process: the eval and resolve-task call find() many times.
  if (memo.idx) return memo;
  memo.idx = buildIndex(false);
  memo.termsOf = memo.idx.files.map(fileTerms);
  memo.df = new Map();
  for (const t of memo.termsOf) for (const k of t.keys()) memo.df.set(k, (memo.df.get(k) || 0) + 1);
  memo.docs = docFiles().map((p) => ({ p, rel: path.relative(ROOT, p), head: fs.readFileSync(p, 'utf8').split('\n').filter((l) => /^#{1,3} /.test(l)).join(' ') }));
  memo.byKey = new Map(memo.idx.files.map((f) => [f.repo + '/' + f.path, f]));
  return memo;
}

function find(task, opts = {}) {
  const { idx, termsOf, df, docs: docList, byKey } = prepared();
  const aliases = memo.aliases || (memo.aliases = loadAliases());
  const q = Array.from(new Set(words(task)));
  const weights = new Map(q.map((w) => [w, 1]));
  for (const w of q) for (const a of aliases[w] || []) for (const x of words(a)) if (!weights.has(x)) weights.set(x, W.alias);
  const N = idx.files.length;
  const scored = [];
  idx.files.forEach((f, i) => {
    const t = termsOf[i]; let s = 0; const hit = [];
    for (const [w, qw] of weights) {
      const fw = t.get(w); if (!fw) continue;
      s += qw * fw * Math.log(1 + N / (df.get(w) || 1)); hit.push(w);
    }
    if (!hit.length) return;
    const typeName = ((f.types || [])[0] || {}).name || '';
    const tw = new Set(words(typeName));
    const both = q.filter((w) => tw.has(w)).length;
    if (both >= 2) s *= 1 + W.phrase * both;               // the class name itself says it
    if ((f.entries || []).length) s *= W.entry;           // entry points are where flows start
    s *= Math.min(1, 0.55 + 0.15 * hit.length);        // one lucky word is not a match
    s /= 1 + W.len * Math.log2(1 + ((f.methods || []).length + (f.fields || []).length) / 25); // big utils match everything
    scored.push({ f, s, hit });
  });
  scored.sort((a, b) => b.s - a.s);
  // Co-change: a strong hit lends score to the files that usually change with it.
  if (W.co > 0 && idx.co) {
    const cur = new Map(scored.map((x) => [x.f.repo + '/' + x.f.path, x]));
    for (const x of scored.slice(0, 8)) {
      for (const [p, , ratio] of idx.co[x.f.repo + '/' + x.f.path] || []) {
        const k = x.f.repo + '/' + p; const f = byKey.get(k); if (!f) continue;
        const add = x.s * W.co * ratio;
        const e = cur.get(k);
        if (e) e.s += add * 0.5; else { const n = { f, s: add, hit: ['co:' + ((x.f.types || [])[0] || {}).name] }; cur.set(k, n); scored.push(n); }
      }
    }
    scored.sort((a, b) => b.s - a.s);
  }
  const top = scored.slice(0, opts.limit || 10);
  const best = top.length ? top[0].s : 0;
  const hits = top.filter((x) => x.s >= best * 0.25).map(({ f, s, hit }) => {
    const ty = f.types && f.types[0];
    const line = ty ? ty.line : 1;
    const base = ty ? ty.name : path.basename(f.path);
    const test = ty && (idx.tests[f.repo + '/' + ty.name.replace(/Impl$/, '')] || idx.tests[f.repo + '/' + ty.name] || [])[0];
    const ent = (f.entries || []).slice(0, 2).map((e) => `${e.kind}${e.args ? ':' + e.args.slice(0, 50) : ''}`).join(', ');
    const co = ((idx.co || {})[f.repo + '/' + f.path] || []).slice(0, 3).map(([p]) => path.basename(p).replace(/\.java$/, ''));
    return { svc: svcOfRepo(f.repo), repo: f.repo, file: `${f.path}:${line}`, name: base, score: +s.toFixed(1), terms: hit, entry: ent || undefined, test, co: co.length ? co : undefined };
  });
  // Docs: the same words against doc names and headings, only for the repos the code hits name.
  const repos = Array.from(new Set(hits.map((h) => h.repo)));
  const docs = docList.map(({ p, rel, head }) => {
    const dt = new Set(words(path.basename(p, '.md') + ' ' + head));
    const n = q.filter((w) => dt.has(w)).length;
    const repoBonus = repos.some((r) => rel.includes(r)) ? 0.5 : 0;
    return { rel, n: n + (n ? repoBonus : 0) };
  }).filter((d) => d.n >= 1.5).sort((a, b) => b.n - a.n).slice(0, 3).map((d) => d.rel);
  const res = { query_terms: q, repos, hits, docs, index: Object.fromEntries(Object.entries(idx.shas).map(([r, v]) => [svcOfRepo(r), v && `${v.ref}@${v.sha}`])) };
  try { fs.appendFileSync(FIND_LOG, JSON.stringify({ at: new Date().toISOString(), q: task.slice(0, 300), top: hits.slice(0, 5).map((h) => h.repo + '/' + h.file) }) + '\n'); } catch (_) { /* best effort */ }
  return res;
}

// Where printed paths point. A leg in a task checkout gets paths INSIDE it (ASTA_CHECKOUT, set by
// Asta), never the workspace's own clones: those are Arun's working copies, on whatever branch he has.
function where(repo) {
  const co = process.env.ASTA_CHECKOUT;
  if (co && fs.existsSync(path.join(co, repo))) return path.join(co, repo);
  return repo;
}

function printFind(res) {
  if (!res.hits.length) { console.log('no code hits — try the class/topic words, or `ctx entry <svc>`'); return; }
  console.log(`index: ${Object.entries(res.index).map(([k, v]) => k + ' ' + v).join(' · ')}`);
  for (const h of res.hits) {
    console.log(`${h.svc.padEnd(5)} ${where(h.repo)}/${h.file}  ${h.name}${h.entry ? '  [' + h.entry + ']' : ''}${h.test ? '  test: ' + path.basename(h.test) : ''}`);
  }
  // What a change to the top hits usually also touches (develop history): the hub files a task never names.
  const co = Array.from(new Set(res.hits.slice(0, 3).flatMap((h) => h.co || []))).filter((n) => !res.hits.some((h) => h.name === n));
  if (co.length) console.log('usually changes with the top hits: ' + co.slice(0, 6).join(', '));
  if (res.docs.length) console.log('docs: ' + res.docs.join('  '));
}

// ── entry ───────────────────────────────────────────────────────────────────
function entry(svc) {
  const repo = repoOfSvc(svc);
  if (!repo) { console.error(`unknown service "${svc}" — one of: ${Object.keys(SERVICES).join(', ')}`); process.exit(2); }
  buildIndex(false);
  const p = path.join(GEN, svcOfRepo(repo), 'entry-points.md');
  const text = fs.readFileSync(p, 'utf8').split('\n');
  const kind = process.argv[4];
  const base = where(repo) === repo ? '' : where(repo) + '/';
  const fix = (l) => (base ? l.replace(/ — ([^\s]+:\d+)$/, (m0, p) => ' — ' + base + p) : l);
  if (!kind) { console.log(text.filter((l) => !l.startsWith('- ')).join('\n').replace(/\n{3,}/g, '\n\n') + `\nfull list: ${path.relative(process.cwd(), p)}  (ctx entry ${svc} <kafka|rest|workflow|activity>)`); return; }
  let on = false;
  for (const l of text) { if (l.startsWith('## ')) on = l.startsWith('## ' + kind); else if (on && l) console.log(fix(l)); }
}

// ── verify ──────────────────────────────────────────────────────────────────
function contextFiles() {
  const out = [{ p: path.join(ROOT, 'CLAUDE.md'), budget: BUDGET.root, repo: null }];
  const rules = path.join(ROOT, '.claude', 'rules');
  if (fs.existsSync(rules)) for (const f of fs.readdirSync(rules)) if (f.endsWith('.md')) out.push({ p: path.join(rules, f), budget: null, rule: true, repo: null });
  for (const [svc, repo] of Object.entries(SERVICES)) out.push({ p: path.join(ROOT, 'services', svc, 'CLAUDE.md'), budget: BUDGET.service, repo, svc });
  return out;
}
function verify(run) {
  const idx = buildIndex(false);
  const fail = []; const ok = [];
  const symbols = new Map();
  for (const f of idx.files) for (const t of f.types || []) symbols.set(f.repo + '/' + t.name, f.path);
  for (const f of idx.files) for (const a of f.avro || []) if (/^[A-Z]/.test(a)) symbols.set(f.repo + '/' + a, f.path); // generated Avro classes
  for (const [repo, names] of Object.entries(idx.imports || {})) for (const n of names) if (!symbols.has(repo + '/' + n)) symbols.set(repo + '/' + n, '(library)');
  const anySym = new Set(Array.from(symbols.keys()).map((k) => k.split('/').pop()));
  let rulesTotal = 0;
  for (const cf of contextFiles()) {
    const rel = path.relative(ROOT, cf.p);
    if (!fs.existsSync(cf.p)) { fail.push(`${rel}: missing — create it (see docs/README.md)`); continue; }
    const text = fs.readFileSync(cf.p, 'utf8');
    if (cf.rule) rulesTotal += text.length;
    if (cf.budget && text.length > cf.budget) fail.push(`${rel}: ${text.length} chars > budget ${cf.budget} — move detail to docs/ and leave a pointer`);
    const repoDir = cf.repo ? path.join(ROOT, cf.repo) : ROOT;
    const ref = cf.repo && idx.shas[cf.repo] ? idx.shas[cf.repo].ref : null;
    const tree = ref ? new Set(git(cf.repo, ['ls-tree', '-r', '--name-only', ref]).toString().split('\n')) : null;
    const dirs = new Set(); if (tree) for (const p of tree) { const parts = p.split('/'); for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/')); }
    const existsInRepo = (p) => (tree ? tree.has(p) || dirs.has(p.replace(/\/$/, '')) : fs.existsSync(path.join(repoDir, p)));
    // 1) backticked paths must exist (repo-relative in service files, workspace-relative at the root)
    for (const m of text.matchAll(/`([^`\s]+)`/g)) {
      const tok = m[1].replace(/[:#].*$/, '');
      if (!/^[\w.-]+(\/[\w.*-]+)+\/?$/.test(tok) || tok.includes('*') || tok.startsWith('~') || /^(feature|release|hotfix)\//.test(tok)) continue;
      const wsPath = fs.existsSync(path.join(ROOT, tok));
      if (!(cf.repo ? existsInRepo(tok) || wsPath : wsPath || Object.values(SERVICES).some((r) => fs.existsSync(path.join(ROOT, r, tok))))) {
        fail.push(`${rel}: path \`${tok}\` not in ${cf.repo ? cf.repo + '@' + idx.shas[cf.repo].sha : 'workspace'} — fix or mark [gap]`);
      }
    }
    // 2) backticked ClassNames must exist in the index
    for (const m of text.matchAll(/`([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*)+)(?:\.[a-z]\w*)?(?:\(\))?`/g)) {
      const name = m[1];
      const found = cf.repo ? symbols.has(cf.repo + '/' + name) : anySym.has(name);
      if (!found && !/^(JAVA|JDK|Lombok|MapStruct|WebFlux|SendGrid|LaunchDarkly|GitHub|ApiKey)/.test(name)) fail.push(`${rel}: class \`${name}\` not found in code — renamed or removed?`);
    }
    // 3) build commands: -f <pom> and -pl <module> must exist (the `-pl service` class of error)
    for (const block of text.matchAll(/```(?:bash|sh)([^\n]*)\n([\s\S]*?)```/g)) {
      for (const line of block[2].split('\n').filter((l) => /^\s*mvn\b/.test(l))) {
        const f = (line.match(/-f\s+(\S+)/) || [])[1];
        const pl = (line.match(/-pl\s+(\S+)/) || [])[1];
        if (cf.repo && f && !existsInRepo(f)) fail.push(`${rel}: \`-f ${f}\` does not exist in ${cf.repo}`);
        if (cf.repo && pl) for (const mod of pl.split(',')) if (!existsInRepo(mod.replace(/^:/, '') + '/pom.xml')) fail.push(`${rel}: module \`${mod}\` has no pom.xml in ${cf.repo}`);
        if (cf.repo && !f && !pl && !existsInRepo('pom.xml')) fail.push(`${rel}: \`${line.trim()}\` needs -f — ${cf.repo} has no root pom.xml`);
      }
      if (run && cf.repo && /\bverify\b/.test(block[1])) {
        const r = runVerify(cf.repo, idx.shas[cf.repo].ref, block[2]);
        (r.ok ? ok : fail).push(`${rel}: verify block ${r.ok ? 'passed' : 'FAILED'} on ${cf.repo}@${idx.shas[cf.repo].sha} in ${r.secs}s${r.ok ? '' : ' — ' + r.tail}`);
      }
    }
  }
  if (rulesTotal > BUDGET.rules) fail.push(`.claude/rules: ${rulesTotal} chars > budget ${BUDGET.rules}`);
  // 4) docs that name a class the code no longer has (prose drift a sha check can't see)
  for (const d of docFiles()) {
    const text = fs.readFileSync(d, 'utf8');
    const repo = Object.values(SERVICES).find((r) => d.includes('/' + r + '/'));
    if (!repo) continue;
    const gone = new Set(); const named = new Set();
    for (const m of text.matchAll(/`([A-Z][a-z0-9]+(?:[A-Z][a-z0-9]*){2,})`/g)) { named.add(m[1]); if (!symbols.has(repo + '/' + m[1]) && !anySym.has(m[1])) gone.add(m[1]); }
    // Library classes (StatusRuntimeException…) aren't ours, so a few misses are noise; a third gone is drift.
    // Build commands in docs drift too (the `mvn test -pl service` that had no root pom).
    const ref = idx.shas[repo] && idx.shas[repo].ref;
    if (ref) {
      const tree = memoTree(repo, ref);
      for (const m of text.matchAll(/`(mvn [^`]+)`/g)) {
        const line = m[1]; const f = (line.match(/-f\s+(\S+)/) || [])[1]; const pl = (line.match(/-pl\s+(\S+)/) || [])[1];
        const cd = (text.slice(Math.max(0, m.index - 40), m.index).match(/cd ([\w-]+) &&\s*$/) || [])[1];
        if (f && !tree.has(f)) fail.push(`${path.relative(ROOT, d)}: \`${line}\` — ${f} does not exist`);
        else if (pl && (!tree.has('pom.xml') || !pl.split(',').every((x) => tree.has(x.replace(/^:/, '') + '/pom.xml')))) fail.push(`${path.relative(ROOT, d)}: \`${line}\` — module ${pl} has no pom.xml (or no root reactor)`);
        else if (!f && !cd && !tree.has('pom.xml')) fail.push(`${path.relative(ROOT, d)}: \`${line}\` — no root pom.xml; needs -f <module>/pom.xml`);
      }
    }
    if (gone.size >= 3 && gone.size / named.size >= 0.34) fail.push(`${path.relative(ROOT, d)}: ${gone.size} classes not in code (${Array.from(gone).slice(0, 3).join(', ')}…) — refresh this doc`);
  }
  for (const o of ok) console.log('ok   ' + o);
  for (const f of fail) console.log('FAIL ' + f);
  console.log(fail.length ? `${fail.length} problem(s)` : 'context ok');
  return fail.length ? 1 : 0;
}
const trees = {};
function memoTree(repo, ref) {
  if (!trees[repo]) trees[repo] = new Set(git(repo, ['ls-tree', '-r', '--name-only', ref]).toString().split('\n'));
  return trees[repo];
}
function runVerify(repo, ref, script) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctx-verify-'));
  const wt = path.join(dir, repo);
  const t0 = Date.now();
  try {
    git(repo, ['worktree', 'add', '--detach', wt, ref], { stdio: 'ignore' });
    const log = path.join(dir, 'build.log');
    const r = spawnSync('sh', ['-c', `( ${script.replace(/\n+/g, ' && ').replace(/&&\s*$/, '')} ) > "${log}" 2>&1`], { cwd: wt, timeout: 20 * 60 * 1000 });
    const out = fs.existsSync(log) ? fs.readFileSync(log, 'utf8') : '';
    const runs = Array.from(out.matchAll(/Tests run: (\d+)/g)).map((m) => +m[1]);
    const zero = runs.length && runs.every((n) => n === 0);
    const tail = out.split('\n').filter((l) => /ERROR|FAIL|Tests run/.test(l)).slice(-3).join(' | ').slice(0, 300);
    return { ok: r.status === 0 && !zero && runs.length > 0, secs: Math.round((Date.now() - t0) / 1000), tail: zero ? 'Tests run: 0' : tail || `exit ${r.status}` };
  } finally {
    try { git(repo, ['worktree', 'remove', '--force', wt], { stdio: 'ignore' }); } catch (_) { /* ignore */ }
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── drift ───────────────────────────────────────────────────────────────────
function drift() {
  const r = spawnSync('node', [path.join(CTX, 'check-drift.js'), ROOT], { encoding: 'utf8' });
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '');
  return r.status || 0;
}

// ── main ────────────────────────────────────────────────────────────────────
function main() {
const [cmd, ...rest] = process.argv.slice(2);
const json = rest.includes('--json');
const args = rest.filter((a) => !a.startsWith('--'));
switch (cmd) {
  case 'find': {
    if (!args.length) { console.error('usage: ctx find "<task words>"'); process.exit(2); }
    const res = find(args.join(' '));
    if (json) console.log(JSON.stringify(res)); else printFind(res);
    process.exit(res.hits.length ? 0 : 3);
  }
  // eslint-disable-next-line no-fallthrough
  case 'entry': entry(args[0] || ''); break;
  case 'verify': process.exit(verify(rest.includes('--run')));
  // eslint-disable-next-line no-fallthrough
  case 'drift': process.exit(drift());
  // eslint-disable-next-line no-fallthrough
  case 'index': { const i = buildIndex(rest.includes('--force')); console.log(`indexed ${i.files.length} files: ${Object.entries(i.shas).map(([r, v]) => svcOfRepo(r) + ' ' + (v && v.ref + '@' + v.sha)).join(' · ')}`); break; }
  default:
    console.log('usage: ctx <find "<task>"|entry <svc> [kind]|verify [--run]|drift|index [--force]>');
    process.exit(cmd ? 2 : 0);
}
}
if (require.main === module) main();
function reset() { for (const k of Object.keys(memo)) delete memo[k]; }
module.exports = { find, buildIndex, words, reset };
