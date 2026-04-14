#!/usr/bin/env node
/**
 * validate-note.js — Validador de notas markdown del vault
 *
 * Corre como hook PostToolUse (Write). Recibe info del tool call via stdin JSON.
 * Imprime advertencias a stdout si la nota tiene problemas de estructura.
 * NUNCA falla ni bloquea — solo avisa.
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

const REGISTRY_PATH = join(homedir(), '.pkm-vaults.json');

function isInVault(filePath) {
  if (!existsSync(REGISTRY_PATH)) return false;
  try {
    const registry = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
    return registry.vaults.some(v => filePath.startsWith(v.path));
  } catch { return false; }
}

function parseFrontmatter(content) {
  if (!content.startsWith('---')) return null;
  const end = content.indexOf('\n---', 3);
  if (end === -1) return null;
  const yaml = content.slice(4, end);
  const fm = {};
  for (const line of yaml.split('\n')) {
    const m = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
    if (m) fm[m[1]] = m[2].trim().replace(/^"(.*)"$/, '$1');
  }
  return fm;
}

async function main() {
  // Leer tool call info desde stdin
  let stdinData = '';
  try {
    for await (const chunk of process.stdin) {
      stdinData += chunk;
    }
  } catch { process.exit(0); }

  let filePath = null;
  let fileContent = null;

  // Intentar parsear el JSON del hook
  if (stdinData.trim()) {
    try {
      const hookData = JSON.parse(stdinData);
      // PostToolUse format: { tool_name, tool_input: { file_path, content }, tool_response }
      filePath = hookData?.tool_input?.file_path || hookData?.input?.file_path;
      fileContent = hookData?.tool_input?.content || hookData?.input?.content;
    } catch {}
  }

  // Si no tenemos path, intentar con argv
  if (!filePath && process.argv[2]) {
    filePath = process.argv[2];
  }

  if (!filePath) process.exit(0);

  // Resolver path
  filePath = resolve(filePath);

  // Solo validar archivos .md dentro del vault
  if (!filePath.endsWith('.md')) process.exit(0);
  if (!isInVault(filePath)) process.exit(0);

  // Leer contenido si no lo tenemos ya
  if (!fileContent) {
    if (!existsSync(filePath)) process.exit(0);
    try { fileContent = readFileSync(filePath, 'utf8'); } catch { process.exit(0); }
  }

  // No validar archivos muy pequeños (como .gitkeep o stubs)
  if (fileContent.trim().length < 10) process.exit(0);

  const fm = parseFrontmatter(fileContent);
  const warnings = [];

  if (!fm) {
    // Nota sin frontmatter
    if (fileContent.trim().length > 50) {
      warnings.push('⚠ Sin frontmatter — considera agregar id, titulo y tipo');
    }
  } else {
    if (!fm.titulo && !fm.title) {
      warnings.push('⚠ Campo "titulo" faltante en el frontmatter');
    }
    if (!fm.tipo && !fm.type) {
      warnings.push('⚠ Campo "tipo" faltante (permanente | literatura | reunion | diario | proyecto)');
    }
    if (!fm.fecha && !fm.date) {
      warnings.push('⚠ Campo "fecha" faltante');
    }
    const tipo = fm.tipo || fm.type || '';
    if ((tipo === 'literatura' || tipo === 'literature') && !fm.fuente && !fm.source) {
      warnings.push('⚠ Nota de literatura sin "fuente" — ¿querés agregar la URL?');
    }
    const bodyStart = fileContent.indexOf('\n---', 3) + 4;
    const body = fileContent.slice(bodyStart).trim();
    if (body.length < 50 && tipo !== 'diario' && tipo !== 'daily') {
      warnings.push('ℹ Nota muy corta — ¿está completa?');
    }
    if (body.length > 300 && (!fm.tags || fm.tags === '[]' || fm.tags === '')) {
      warnings.push('ℹ Nota sin tags — considera agregar algunos para mejorar las conexiones');
    }
  }

  if (warnings.length > 0) {
    console.log('\n🔍 VALIDACIÓN PKM:');
    for (const w of warnings) {
      console.log(`   ${w}`);
    }
    console.log('');
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
