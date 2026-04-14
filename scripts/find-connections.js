#!/usr/bin/env node
/**
 * find-connections.js — Encuentra conexiones semánticas entre notas usando TF-IDF
 *
 * Uso: node scripts/find-connections.js <note-path> [--top=N] [--min-score=0.05]
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, resolve, basename, extname } from 'path';
import { homedir } from 'os';
import { parseFrontmatter, extractTitle, extractSnippet, extractTags } from './lib/note-parser.js';
import { findSimilar } from './lib/tfidf.js';

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const notePath = args.find(a => !a.startsWith('--'));
const topArg = args.find(a => a.startsWith('--top='));
const minArg = args.find(a => a.startsWith('--min-score='));
const TOP_N = topArg ? parseInt(topArg.split('=')[1]) : 5;
const MIN_SCORE = minArg ? parseFloat(minArg.split('=')[1]) : 0.05;

if (!notePath) {
  console.error('Uso: node scripts/find-connections.js <note-path> [--top=5] [--min-score=0.05]');
  process.exit(1);
}

// ─── Vault detection ──────────────────────────────────────────────────────────

function findVaultConfig() {
  const registryPath = join(homedir(), '.pkm-vaults.json');
  if (!existsSync(registryPath)) return null;

  try {
    const registry = JSON.parse(readFileSync(registryPath, 'utf8'));
    for (const vault of registry.vaults) {
      const configPath = join(vault.path, 'vault.config.json');
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf8'));
      }
    }
  } catch {}
  return null;
}

// ─── Note scanner ─────────────────────────────────────────────────────────────

function walkNotes(rootDir, excludeDirs = ['_sistema', '.git', '.obsidian']) {
  const results = [];

  function walk(dir) {
    if (!existsSync(dir)) return;
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && !excludeDirs.includes(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
        results.push(fullPath);
      }
    }
  }

  walk(rootDir);
  return results;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const resolvedNotePath = resolve(notePath);

  if (!existsSync(resolvedNotePath)) {
    console.error(JSON.stringify({ error: `Nota no encontrada: ${resolvedNotePath}` }));
    process.exit(1);
  }

  const config = findVaultConfig();
  if (!config) {
    console.error(JSON.stringify({ error: 'Vault no configurado. Usá /setup.' }));
    process.exit(1);
  }

  const vaultPath = config.vault_path;

  // Leer la nota query
  const queryContent = readFileSync(resolvedNotePath, 'utf8');
  const { frontmatter: queryFm, body: queryBody } = parseFrontmatter(queryContent);
  const queryTitle = extractTitle(queryFm, queryBody, basename(resolvedNotePath, '.md'));
  const queryTags = extractTags(queryBody, queryFm);

  // Escanear todas las notas del vault
  const allPaths = walkNotes(vaultPath);
  const lowNoteCount = allPaths.length < 5;

  if (allPaths.length === 0) {
    console.log(JSON.stringify({
      query: { path: resolvedNotePath, title: queryTitle, tags: queryTags },
      connections: [],
      tag_connections: [],
      low_note_count: true,
      message: 'No hay notas en el vault todavía.',
    }));
    return;
  }

  // Construir corpus
  const docs = new Map();
  const meta = new Map();

  for (const p of allPaths) {
    try {
      const content = readFileSync(p, 'utf8');
      const { frontmatter: fm, body } = parseFrontmatter(content);
      const title = extractTitle(fm, body, basename(p, '.md'));
      const tags = extractTags(body, fm);

      // El texto para TF-IDF incluye título, tags y body
      const text = [
        title,
        ...tags,
        body.replace(/^---[\s\S]*?---/, ''),
      ].join(' ');

      docs.set(p, text);
      meta.set(p, {
        title,
        tags,
        type: fm.tipo || fm.type || 'unknown',
        projects: fm.proyectos || fm.projects || [],
      });
    } catch {
      // Ignorar archivos no legibles
    }
  }

  // Asegurar que la nota query está en el corpus
  if (!docs.has(resolvedNotePath)) {
    const text = [queryTitle, ...queryTags, queryBody].join(' ');
    docs.set(resolvedNotePath, text);
    meta.set(resolvedNotePath, {
      title: queryTitle,
      tags: queryTags,
      type: queryFm.tipo || queryFm.type || 'unknown',
    });
  }

  // TF-IDF connections
  const connections = lowNoteCount
    ? []
    : findSimilar(resolvedNotePath, docs, meta, TOP_N, MIN_SCORE);

  // Tag-based connections (siempre disponibles)
  const tagConnections = [];
  if (queryTags.length > 0) {
    for (const [p, m] of meta) {
      if (p === resolvedNotePath) continue;
      const sharedTags = queryTags.filter(t => m.tags.includes(t));
      if (sharedTags.length > 0) {
        tagConnections.push({
          path: p,
          title: m.title,
          shared_tags: sharedTags,
          snippet: extractSnippet(docs.get(p) || '', 100),
        });
      }
    }
    tagConnections.sort((a, b) => b.shared_tags.length - a.shared_tags.length);
  }

  // Formatear paths relativos al vault
  const relativize = (p) => p.startsWith(vaultPath) ? p.slice(vaultPath.length + 1) : p;

  const result = {
    query: {
      path: relativize(resolvedNotePath),
      title: queryTitle,
      tags: queryTags,
      type: queryFm.tipo || queryFm.type || 'unknown',
    },
    connections: connections.map(c => ({ ...c, path: relativize(c.path) })),
    tag_connections: tagConnections.slice(0, 5).map(c => ({ ...c, path: relativize(c.path) })),
    low_note_count: lowNoteCount,
    total_notes_scanned: allPaths.length,
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch(e => {
  console.error(JSON.stringify({ error: e.message }));
  process.exit(1);
});
