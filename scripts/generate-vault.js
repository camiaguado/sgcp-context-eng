#!/usr/bin/env node
/**
 * generate-vault.js — Genera el vault PKM personalizado desde un config JSON
 *
 * Uso: node scripts/generate-vault.js <path-al-config.json>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ENGINE_ROOT = resolve(__dirname, '..');

// ─── I18N ─────────────────────────────────────────────────────────────────────

const T = {
  es: {
    inbox_created: 'Bandeja de entrada lista',
    vault_exists: 'El vault ya existe en',
    vault_created: 'Vault creado en',
    projects_created: 'Proyectos inicializados',
    areas_created: 'Áreas inicializadas',
    registered: 'Vault registrado en ~/.pkm-vaults.json',
    success: '✅ Vault listo.',
    system_map_title: 'Mapa del territorio',
    manual_title: 'Manual de uso',
    project_meta_title: 'Proyecto',
    area_meta_title: 'Área',
    resource_index_title: 'Recursos',
  },
  en: {
    inbox_created: 'Inbox ready',
    vault_exists: 'Vault already exists at',
    vault_created: 'Vault created at',
    projects_created: 'Projects initialized',
    areas_created: 'Areas initialized',
    registered: 'Vault registered in ~/.pkm-vaults.json',
    success: '✅ Vault ready.',
    system_map_title: 'System map',
    manual_title: 'User manual',
    project_meta_title: 'Project',
    area_meta_title: 'Area',
    resource_index_title: 'Resources',
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dir(path) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function file(path, content, skipIfExists = false) {
  if (skipIfExists && existsSync(path)) return;
  writeFileSync(path, content, 'utf8');
}

function touch(path) {
  file(path, '', true);
}

function gitkeep(folderPath) {
  touch(join(folderPath, '.gitkeep'));
}

function timestamp() {
  return Date.now().toString();
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function slug(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Note content generators ──────────────────────────────────────────────────

function projectMeta(config, project, t) {
  const lang = config.language;
  return `---
id: ${timestamp()}
titulo: "${project.name}"
tipo: proyecto
fecha_inicio: ${today()}
fecha_objetivo: ""
estado: activo
tags: []
areas_relacionadas: []
---

# ${project.name}

${lang === 'es' ? '## Por qué existe este proyecto' : '## Why this project exists'}

${lang === 'es' ? '[El resultado que justifica el esfuerzo]' : '[The outcome that justifies the effort]'}

${lang === 'es' ? '## Definición de done' : '## Definition of done'}

${lang === 'es' ? '[¿Cómo voy a saber que terminó?]' : "[How will I know it's complete?]"}

${lang === 'es' ? '## Notas activas' : '## Active notes'}

${lang === 'es' ? '<!-- Los archivos de trabajo van en esta misma carpeta -->' : '<!-- Working files go in this folder -->'}

${lang === 'es' ? '## Log de decisiones' : '## Decision log'}

| ${lang === 'es' ? 'Fecha' : 'Date'} | ${lang === 'es' ? 'Decisión' : 'Decision'} | ${lang === 'es' ? 'Razón' : 'Reason'} |
|-------|----------|-------|
|       |          |       |

${lang === 'es' ? '## Próximos pasos' : '## Next steps'}

- [ ]
`;
}

function areaMeta(config, area) {
  const lang = config.language;
  return `---
id: ${timestamp()}
titulo: "${area.name}"
tipo: area
fecha: ${today()}
tags: []
proyectos_relacionados: []
---

# ${area.name}

${lang === 'es' ? '## Propósito de esta área' : '## Purpose of this area'}

${lang === 'es' ? '[¿Qué responsabilidad continua representa?]' : '[What ongoing responsibility does this represent?]'}

${lang === 'es' ? '## Estándares que me importan' : '## Standards that matter to me'}

${lang === 'es' ? '[¿Qué hace que esto vaya bien? ¿Cómo sé que lo estoy atendiendo?]' : '[What makes this go well? How do I know I am tending to it?]'}

${lang === 'es' ? '## Recursos clave' : '## Key resources'}

-

${lang === 'es' ? '## Notas relacionadas' : '## Related notes'}

`;
}

function resourceIndex(config, resource) {
  const lang = config.language;
  return `---
id: ${timestamp()}
titulo: "${resource.name}"
tipo: recurso
fecha: ${today()}
tags: []
---

# ${resource.name}

${lang === 'es' ? '## Punto de entrada' : '## Entry point'}

${lang === 'es' ? '[¿Qué es este dominio de conocimiento y por qué importa para mi trabajo?]' : '[What is this knowledge domain and why does it matter for my work?]'}

${lang === 'es' ? '## Notas en esta área' : '## Notes in this area'}

${lang === 'es' ? '<!-- Usá [[wikilinks]] para conectar notas específicas -->' : '<!-- Use [[wikilinks]] to connect specific notes -->'}

${lang === 'es' ? '## Fuentes recomendadas' : '## Recommended sources'}

-
`;
}

function systemMap(config) {
  const lang = config.language;
  const f = config.folders;
  const projects = config.active_projects.map(p => `- [[${p.slug}/_meta|${p.name}]]`).join('\n');
  const areas = config.areas.map(a => `- [[${a.slug}/_meta|${a.name}]]`).join('\n');

  return `---
id: ${timestamp()}
titulo: "${lang === 'es' ? 'Mapa del territorio' : 'System map'}"
tipo: meta
fecha: ${today()}
---

# ${lang === 'es' ? 'Mapa del territorio' : 'System map'}

${lang === 'es'
    ? `> Este archivo te da una vista de pájaro de todo tu vault. Se actualiza automáticamente.`
    : `> This file gives you a bird's-eye view of your entire vault. It auto-updates.`}

## ${lang === 'es' ? 'Proyectos activos' : 'Active projects'} → \`${f.projects}/\`

${projects || (lang === 'es' ? '_(sin proyectos todavía)_' : '_(no projects yet)_')}

## ${lang === 'es' ? 'Áreas de responsabilidad' : 'Areas of responsibility'} → \`${f.areas}/\`

${areas || (lang === 'es' ? '_(sin áreas todavía)_' : '_(no areas yet)_')}

## ${lang === 'es' ? 'Ideas permanentes' : 'Permanent ideas'} → \`${f.zettelkasten}/\`

${lang === 'es' ? '_(vacío — se llena con /inbox y /capture)_' : '_(empty — filled via /inbox and /capture)_'}

## ${lang === 'es' ? 'Recursos de referencia' : 'Reference resources'} → \`${f.resources}/\`

${lang === 'es' ? '_(referencia, no procesable activamente)_' : '_(reference, not actively processed)_'}

## ${lang === 'es' ? 'Capturas (inbox)' : 'Captures (inbox)'} → \`${f.captures}/\`

${lang === 'es' ? '_(procesar con /inbox regularmente)_' : '_(process with /inbox regularly)_'}

## ${lang === 'es' ? 'Notas diarias' : 'Daily notes'} → \`${f.daily}/\`

${lang === 'es' ? '_(crear con /daily cada mañana)_' : '_(create with /daily each morning)_'}

---

${lang === 'es' ? `**Sistema creado:** ${today()} | **Propietario:** ${config.owner}` : `**System created:** ${today()} | **Owner:** ${config.owner}`}
`;
}

function userManual(config) {
  const lang = config.language;
  const f = config.folders;

  if (lang === 'es') {
    return `---
id: ${timestamp()}
titulo: "Manual de uso — ${config.owner}"
tipo: meta
fecha: ${today()}
---

# Manual de uso personal

Este manual está hecho para vos, ${config.owner}. Refleja cómo está configurado tu sistema y cuál es el flujo de trabajo recomendado.

## Tu configuración

- **Dominio:** ${config.domain}
- **Estilo de pensamiento:** ${config.thinking_style}
- **Balance:** Ideas permanentes ${config.ideas_weight} / PARA ${config.para_weight}
- **Idioma:** ${config.language}

## Flujo de trabajo diario (10 minutos)

1. **Al empezar el día** → \`/daily\`
   Creá tu nota diaria con la intención del día.

2. **Durante el día** → \`/capture [URL o idea]\`
   Capturá sin juzgar. Todo va al inbox primero.

3. **Una vez por semana** → \`/inbox\`
   Procesá las capturas: decidí qué queda, qué se elabora, qué se archiva.

## Flujo de trabajo semanal (20 minutos)

Cada 7 días: \`/review\`
- Revisás el estado de tus proyectos
- Releés 5 notas al azar (spaced repetition)
- Identificás qué capturas convertir en conocimiento permanente

## Estructura del vault

\`\`\`
${f.captures}/     ← Todo llega acá primero
${f.inbox}/        ← Items sin procesar
${f.projects}/     ← Proyectos con fecha de cierre
${f.areas}/        ← Responsabilidades continuas
${f.zettelkasten}/ ← Ideas propias permanentes
${f.resources}/    ← Referencia (no procesar activamente)
${f.daily}/        ← Notas diarias
${f.archive}/      ← Todo lo terminado o inactivo
\`\`\`

## Por qué funciona este sistema

El sistema aplica tres principios de aprendizaje con evidencia científica:

**1. Elaborative Interrogation** (al procesar /inbox)
Antes de guardar una captura como conocimiento propio, te hago tres preguntas:
¿Por qué importa? ¿Qué confirma o desafía? ¿Qué consecuencia práctica tiene?
Esto aumenta significativamente la comprensión y retención comparado con solo guardar la fuente.

**2. Spaced Repetition lite** (en /review)
En cada revisión semanal, te muestro 5 notas al azar que no viste en 14+ días.
Releer con intervalo creciente es mucho más efectivo que releer secuencialmente.

**3. Progressive Summarization** (en /capture)
Cada captura pasa por 4 capas: raw → highlights → bullets → esencia.
Esto te permite elegir cuánto detalle querés recuperar según el contexto.

## Comandos disponibles

| Comando | Qué hace |
|---------|----------|
| \`/setup\` | Configura o reconfigura el vault |
| \`/daily\` | Nota diaria |
| \`/capture [url o texto]\` | Captura información |
| \`/inbox\` | Procesa capturas pendientes |
| \`/connect [nota]\` | Encuentra conexiones entre notas |
| \`/review\` | Revisión semanal |
`;
  } else {
    return `---
id: ${timestamp()}
titulo: "User manual — ${config.owner}"
tipo: meta
fecha: ${today()}
---

# Personal User Manual

This manual is made for you, ${config.owner}. It reflects how your system is configured and the recommended workflow.

## Your configuration

- **Domain:** ${config.domain}
- **Thinking style:** ${config.thinking_style}
- **Balance:** Ideas permanentes ${config.ideas_weight} / PARA ${config.para_weight}
- **Language:** ${config.language}

## Daily workflow (10 minutes)

1. **At day start** → \`/daily\`
   Create your daily note with the day's intention.

2. **During the day** → \`/capture [URL or idea]\`
   Capture without judging. Everything goes to inbox first.

3. **Once a week** → \`/inbox\`
   Process captures: decide what stays, what gets elaborated, what gets archived.

## Weekly workflow (20 minutes)

Every 7 days: \`/review\`
- Review the status of your projects
- Re-read 5 random notes (spaced repetition)
- Identify which captures to convert into permanent knowledge

## Available commands

| Command | What it does |
|---------|-------------|
| \`/setup\` | Configure or reconfigure vault |
| \`/daily\` | Daily note |
| \`/capture [url or text]\` | Capture information |
| \`/inbox\` | Process pending captures |
| \`/connect [note]\` | Find connections between notes |
| \`/review\` | Weekly review |
`;
  }
}

// ─── Main generator ───────────────────────────────────────────────────────────

async function main() {
  const configArg = process.argv[2];
  if (!configArg) {
    console.error('Uso: node scripts/generate-vault.js <path-al-config.json>');
    process.exit(1);
  }

  const configPath = resolve(configArg);
  if (!existsSync(configPath)) {
    console.error(`Config no encontrado: ${configPath}`);
    process.exit(1);
  }

  let config;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8'));
  } catch (e) {
    console.error('Error leyendo config JSON:', e.message);
    process.exit(1);
  }

  const lang = config.language || 'es';
  const t = T[lang] || T.es;
  const vault = resolve(config.vault_path.replace('~', homedir()));

  // Actualizar vault_path con path resuelto
  config.vault_path = vault;

  console.log(`\n🏗  Generando vault en: ${vault}\n`);

  const f = config.folders;

  // ── Crear estructura de carpetas ─────────────────────────────────────────
  const folders = [
    vault,
    join(vault, f.inbox),
    join(vault, f.captures),
    join(vault, f.projects),
    join(vault, f.areas),
    join(vault, f.resources),
    join(vault, f.archive),
    join(vault, f.zettelkasten),
    join(vault, f.daily),
    join(vault, f.system),
    join(vault, f.system, 'revisiones'),
  ];

  for (const folder of folders) {
    dir(folder);
  }

  // .gitkeep en carpetas vacías
  gitkeep(join(vault, f.inbox));
  gitkeep(join(vault, f.captures));
  gitkeep(join(vault, f.archive));
  gitkeep(join(vault, f.zettelkasten));
  gitkeep(join(vault, f.daily));
  gitkeep(join(vault, f.system, 'revisiones'));

  console.log('  ✓ Estructura de carpetas creada');

  // ── Proyectos ─────────────────────────────────────────────────────────────
  for (const project of (config.active_projects || [])) {
    const projectDir = join(vault, f.projects, project.slug);
    dir(projectDir);
    file(join(projectDir, '_meta.md'), projectMeta(config, project, t));
    console.log(`  ✓ Proyecto: ${project.name}`);
  }

  // ── Áreas ─────────────────────────────────────────────────────────────────
  for (const area of (config.areas || [])) {
    const areaDir = join(vault, f.areas, area.slug);
    dir(areaDir);
    file(join(areaDir, '_meta.md'), areaMeta(config, area));
    console.log(`  ✓ Área: ${area.name}`);
  }

  // ── Recursos ──────────────────────────────────────────────────────────────
  for (const resource of (config.resources || [])) {
    const resourceDir = join(vault, f.resources, resource.slug);
    dir(resourceDir);
    file(join(resourceDir, 'index.md'), resourceIndex(config, resource));
    console.log(`  ✓ Recurso: ${resource.name}`);
  }

  // ── Sistema ───────────────────────────────────────────────────────────────
  file(join(vault, f.system, 'mapa-del-territorio.md'), systemMap(config));
  file(join(vault, f.system, 'manual-de-usuario.md'), userManual(config));
  console.log('  ✓ Sistema: mapa + manual creados');

  // ── vault.config.json ─────────────────────────────────────────────────────
  config.created_at = today();
  config.last_weekly_review = null;
  file(join(vault, 'vault.config.json'), JSON.stringify(config, null, 2));
  console.log('  ✓ vault.config.json guardado');

  // ── Registro global ───────────────────────────────────────────────────────
  const registryPath = join(homedir(), '.pkm-vaults.json');
  let registry = { vaults: [] };
  if (existsSync(registryPath)) {
    try { registry = JSON.parse(readFileSync(registryPath, 'utf8')); } catch {}
  }
  const idx = registry.vaults.findIndex(v => v.path === vault);
  const entry = { path: vault, name: `${config.owner}'s vault`, created_at: today() };
  if (idx >= 0) registry.vaults[idx] = entry;
  else registry.vaults.push(entry);
  writeFileSync(registryPath, JSON.stringify(registry, null, 2));
  console.log('  ✓ Vault registrado en ~/.pkm-vaults.json');

  // ── Limpieza del archivo temporal ─────────────────────────────────────────
  try {
    const { unlinkSync } = await import('fs');
    if (configArg.startsWith('/tmp/')) unlinkSync(configPath);
  } catch {}

  console.log(`\n${t.success}`);
  console.log(`\n📁 Tu vault: ${vault}`);
  console.log(`\nPróximos pasos:`);
  if (lang === 'es') {
    console.log('  /daily    → Creá tu primera nota diaria');
    console.log('  /capture  → Capturá un artículo o idea');
    console.log('  /inbox    → Procesá tus capturas');
  } else {
    console.log('  /daily    → Create your first daily note');
    console.log('  /capture  → Capture an article or idea');
    console.log('  /inbox    → Process your captures');
  }
  console.log('');

  // Output JSON para que Claude pueda parsearlo
  console.log(JSON.stringify({ success: true, vault_path: vault, config }));
}

main().catch(e => {
  console.error('Error generando vault:', e.message);
  process.exit(1);
});
