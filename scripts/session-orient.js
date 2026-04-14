#!/usr/bin/env node
/**
 * session-orient.js — Inyecta contexto PKM al inicio de cada sesión de Claude Code
 *
 * Corre como hook SessionStart. Imprime un bloque de contexto a stdout
 * que Claude Code inyecta en la sesión.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.pkm-vaults.json');

function readRegistry() {
  if (!existsSync(REGISTRY_PATH)) return null;
  try { return JSON.parse(readFileSync(REGISTRY_PATH, 'utf8')); } catch { return null; }
}

function readConfig(vaultPath) {
  const p = join(vaultPath, 'vault.config.json');
  if (!existsSync(p)) return null;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return null; }
}

function countFiles(dir) {
  if (!existsSync(dir)) return 0;
  try {
    return readdirSync(dir)
      .filter(f => f.endsWith('.md') && f !== '.gitkeep').length;
  } catch { return 0; }
}

function lastModified(dir) {
  if (!existsSync(dir)) return null;
  try {
    const files = readdirSync(dir, { withFileTypes: true })
      .filter(e => e.isFile() && e.name.endsWith('.md') && e.name !== '.gitkeep')
      .map(e => {
        const p = join(dir, e.name);
        return { name: e.name, mtime: statSync(p).mtime };
      });
    if (files.length === 0) return null;
    files.sort((a, b) => b.mtime - a.mtime);
    const diff = Date.now() - files[0].mtime.getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'hace menos de 1 hora';
    if (hours < 24) return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days === 1) return 'ayer';
    return `hace ${days} días`;
  } catch { return null; }
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function daysSince(dateStr) {
  if (!dateStr) return null;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 86400000);
}

function countAllMd(vaultPath, excludeDirs = ['_sistema', '.git', '.obsidian']) {
  let count = 0;
  function walk(dir) {
    if (!existsSync(dir)) return;
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && !excludeDirs.includes(entry.name)) {
          walk(join(dir, entry.name));
        } else if (entry.name.endsWith('.md') && entry.name !== '.gitkeep') {
          count++;
        }
      }
    } catch {}
  }
  walk(vaultPath);
  return count;
}

async function main() {
  const registry = readRegistry();
  if (!registry || registry.vaults.length === 0) {
    // No hay vault configurado — mostrar hint discreto
    console.log('\n--- PKM ---\nNo hay vault configurado. Usá /setup para crear tu segundo cerebro.\n-----------\n');
    return;
  }

  // Usar el primer vault del registro (el más reciente)
  let config = null;
  for (const vault of registry.vaults) {
    config = readConfig(vault.path);
    if (config) break;
  }

  if (!config) {
    console.log('\n--- PKM ---\nVault registrado pero no encontrado. Verificá el path o usá /setup.\n-----------\n');
    return;
  }

  const v = config.vault_path;
  const f = config.folders;
  const lang = config.language || 'es';

  const todayStr = today();
  const dailyPath = join(v, f.daily, `${todayStr}.md`);
  const hasDailyNote = existsSync(dailyPath);
  const inboxCount = countFiles(join(v, f.captures)) + countFiles(join(v, f.inbox));
  const totalNotes = countAllMd(v);

  const lastReviewDays = daysSince(config.last_weekly_review);
  const reviewDue = lastReviewDays === null || lastReviewDays >= (config.review_cadence_days || 7);

  // Proyectos activos con última actividad
  const activeProjects = (config.active_projects || [])
    .filter(p => p.status === 'active')
    .map(p => {
      const projectDir = join(v, f.projects, p.slug);
      const lastMod = lastModified(projectDir);
      return { name: p.name, lastMod };
    });

  // ── Output ─────────────────────────────────────────────────────────────────
  const sep = '─'.repeat(45);

  if (lang === 'es') {
    console.log(`\n${sep}`);
    console.log(`📚 CONTEXTO PKM — ${todayStr}`);
    console.log(sep);

    if (hasDailyNote) {
      console.log(`📝 Nota diaria: ya existe (/daily para verla)`);
    } else {
      console.log(`📝 Nota diaria: pendiente → /daily`);
    }

    if (inboxCount > 0) {
      console.log(`📥 Inbox: ${inboxCount} captura${inboxCount > 1 ? 's' : ''} sin procesar → /inbox`);
    } else {
      console.log(`📥 Inbox: vacío ✓`);
    }

    if (activeProjects.length > 0) {
      console.log(`🎯 Proyectos activos:`);
      for (const p of activeProjects) {
        const lastStr = p.lastMod ? ` (${p.lastMod})` : '';
        console.log(`   • ${p.name}${lastStr}`);
      }
    }

    console.log(`🗃  Total notas: ${totalNotes}`);

    if (reviewDue) {
      const days = lastReviewDays === null ? '(nunca)' : `(hace ${lastReviewDays} días)`;
      console.log(`🔁 Revisión semanal pendiente ${days} → /review`);
    }

    console.log(sep);
    console.log('');
  } else {
    console.log(`\n${sep}`);
    console.log(`📚 PKM CONTEXT — ${todayStr}`);
    console.log(sep);

    if (hasDailyNote) {
      console.log(`📝 Daily note: exists (/daily to view)`);
    } else {
      console.log(`📝 Daily note: missing → /daily`);
    }

    if (inboxCount > 0) {
      console.log(`📥 Inbox: ${inboxCount} unprocessed capture${inboxCount > 1 ? 's' : ''} → /inbox`);
    } else {
      console.log(`📥 Inbox: empty ✓`);
    }

    if (activeProjects.length > 0) {
      console.log(`🎯 Active projects:`);
      for (const p of activeProjects) {
        const lastStr = p.lastMod ? ` (${p.lastMod})` : '';
        console.log(`   • ${p.name}${lastStr}`);
      }
    }

    console.log(`🗃  Total notes: ${totalNotes}`);

    if (reviewDue) {
      const days = lastReviewDays === null ? '(never)' : `(${lastReviewDays} days ago)`;
      console.log(`🔁 Weekly review due ${days} → /review`);
    }

    console.log(sep);
    console.log('');
  }
}

main().catch(() => {
  // Silencioso — el hook nunca debe interrumpir una sesión
});
