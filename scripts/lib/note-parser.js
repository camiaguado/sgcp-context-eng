/**
 * note-parser.js — Parseo de notas markdown con frontmatter YAML
 * Compatible con el formato de Obsidian.
 */

/**
 * Parsea una nota markdown con frontmatter YAML delimitado por `---`.
 * @param {string} content - Contenido completo del archivo
 * @returns {{ frontmatter: Object, body: string }}
 */
export function parseFrontmatter(content) {
  if (!content.startsWith('---')) {
    return { frontmatter: {}, body: content };
  }

  const end = content.indexOf('\n---', 3);
  if (end === -1) {
    return { frontmatter: {}, body: content };
  }

  const yamlStr = content.slice(4, end);
  const body = content.slice(end + 4).trimStart();
  const frontmatter = parseYaml(yamlStr);

  return { frontmatter, body };
}

/**
 * Serializa frontmatter + body a string completo.
 * @param {Object} frontmatter
 * @param {string} body
 * @returns {string}
 */
export function serializeFrontmatter(frontmatter, body) {
  const yaml = stringifyYaml(frontmatter);
  return `---\n${yaml}---\n\n${body}`;
}

/**
 * Extrae todos los [[wikilinks]] del cuerpo de la nota.
 * @param {string} body
 * @returns {string[]} array de targets de wikilink (sin corchetes)
 */
export function extractWikilinks(body) {
  const matches = body.matchAll(/\[\[([^\]|#]+)(?:[|#][^\]]*)?\]\]/g);
  return [...matches].map(m => m[1].trim());
}

/**
 * Extrae tags del cuerpo (#tag) y del frontmatter.
 * @param {string} body
 * @param {Object} frontmatter
 * @returns {string[]} array de tags sin el #
 */
export function extractTags(body, frontmatter = {}) {
  const inlineMatches = body.matchAll(/#([\w-/]+)/g);
  const inlineTags = [...inlineMatches].map(m => m[1]);
  const fmTags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
  return [...new Set([...fmTags, ...inlineTags])];
}

/**
 * Retorna el primer párrafo no vacío del body (para snippets).
 * @param {string} body
 * @param {number} maxLength
 * @returns {string}
 */
export function extractSnippet(body, maxLength = 120) {
  const lines = body.split('\n');
  for (const line of lines) {
    const clean = line.replace(/^#+\s*/, '').trim();
    if (clean.length > 20 && !clean.startsWith('---')) {
      return clean.length > maxLength ? clean.slice(0, maxLength) + '...' : clean;
    }
  }
  return '';
}

/**
 * Extrae el título de una nota: campo `titulo` del frontmatter,
 * o el primer heading `# ...` del body.
 * @param {Object} frontmatter
 * @param {string} body
 * @param {string} fallback - nombre del archivo sin extensión
 * @returns {string}
 */
export function extractTitle(frontmatter, body, fallback = 'Sin título') {
  if (frontmatter.titulo) return frontmatter.titulo;
  const headingMatch = body.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return fallback;
}

// ─── YAML Parser minimalista (sin dependencias) ──────────────────────────────
// Solo soporta el subset que usamos: strings, arrays, booleans, null.

function parseYaml(str) {
  const result = {};
  let currentKey = null;
  let currentArray = null;

  for (const rawLine of str.split('\n')) {
    const line = rawLine.replace(/\r$/, '');

    // Array item
    if (line.match(/^  - /)) {
      const value = line.replace(/^  - /, '').trim().replace(/^"(.*)"$/, '$1');
      if (currentArray !== null && currentKey) {
        result[currentKey].push(value);
      }
      continue;
    }

    // Key: value
    const kvMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*(.*)/);
    if (kvMatch) {
      currentKey = kvMatch[1];
      const rawVal = kvMatch[2].trim();

      if (rawVal === '' || rawVal === '[]') {
        result[currentKey] = rawVal === '[]' ? [] : null;
        currentArray = rawVal === '[]' ? currentKey : null;
        if (rawVal === '') currentArray = currentKey;
      } else if (rawVal === 'true') {
        result[currentKey] = true;
        currentArray = null;
      } else if (rawVal === 'false') {
        result[currentKey] = false;
        currentArray = null;
      } else if (rawVal === 'null') {
        result[currentKey] = null;
        currentArray = null;
      } else if (rawVal.startsWith('[')) {
        // Inline array: [a, b, c]
        const inner = rawVal.slice(1, -1);
        result[currentKey] = inner
          ? inner.split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1')).filter(Boolean)
          : [];
        currentArray = null;
      } else {
        result[currentKey] = rawVal.replace(/^"(.*)"$/, '$1');
        currentArray = null;
      }
    }
  }

  return result;
}

function stringifyYaml(obj) {
  let result = '';
  for (const [key, val] of Object.entries(obj)) {
    if (val === null || val === undefined) {
      result += `${key}: null\n`;
    } else if (typeof val === 'boolean') {
      result += `${key}: ${val}\n`;
    } else if (Array.isArray(val)) {
      if (val.length === 0) {
        result += `${key}: []\n`;
      } else {
        result += `${key}:\n`;
        for (const item of val) {
          result += `  - ${typeof item === 'string' && item.includes(':') ? `"${item}"` : item}\n`;
        }
      }
    } else if (typeof val === 'string') {
      const needsQuotes = val.includes(':') || val.includes('#') || val.includes('"');
      result += `${key}: ${needsQuotes ? `"${val.replace(/"/g, '\\"')}"` : val}\n`;
    } else {
      result += `${key}: ${val}\n`;
    }
  }
  return result;
}
