/**
 * tfidf.js — Motor TF-IDF para encontrar conexiones entre notas
 * Sin dependencias externas. Funciona con vaults de hasta ~5000 notas.
 */

// ─── Stopwords (español + inglés) ────────────────────────────────────────────

export const STOPWORDS = new Set([
  // Español
  'a', 'al', 'algo', 'algunas', 'algunos', 'ante', 'antes', 'como', 'con',
  'contra', 'cual', 'cuando', 'de', 'del', 'desde', 'donde', 'durante',
  'e', 'el', 'ella', 'ellas', 'ellos', 'en', 'entre', 'era', 'eras',
  'es', 'esa', 'esas', 'ese', 'eso', 'esos', 'esta', 'estaba', 'estaban',
  'estar', 'estas', 'este', 'esto', 'estos', 'fue', 'fueron', 'hay',
  'hasta', 'hacia', 'i', 'la', 'las', 'le', 'les', 'lo', 'los', 'mas',
  'más', 'me', 'mi', 'mis', 'muy', 'ni', 'no', 'nos', 'o', 'otro',
  'otras', 'otros', 'para', 'pero', 'por', 'porque', 'que', 'qué',
  'quien', 'quién', 'se', 'si', 'sobre', 'su', 'sus', 'también',
  'tanto', 'te', 'tengo', 'tiene', 'todo', 'todos', 'tu', 'tú', 'un',
  'una', 'unas', 'uno', 'unos', 'ya', 'y', 'yo',
  // Inglés
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can', 'not',
  'that', 'this', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'he', 'she', 'we', 'you', 'i', 'my', 'your', 'his', 'her', 'our',
  'who', 'what', 'which', 'when', 'where', 'how', 'if', 'so', 'than',
  'then', 'also', 'more', 'some', 'no', 'all', 'into', 'out', 'up',
  'about', 'after', 'before', 'between', 'through', 'during', 'each',
]);

// ─── Stemmer simple (sufijos comunes español/inglés) ─────────────────────────

function stem(word) {
  const suffixes = [
    'ación', 'aciones', 'amiento', 'imientos', 'ción', 'ciones',
    'mente', 'idad', 'idades', 'ismo', 'ista', 'ando', 'iendo',
    'ando', 'aron', 'aban', 'ción', 'ing', 'tion', 'tions', 'ness',
    'ment', 'ments', 'ful', 'less', 'ive', 'ize', 'ise', 'ized',
    'ises', 'ers', 'er', 'ed', 'es', 'ly',
  ];
  let w = word.toLowerCase();
  for (const suffix of suffixes) {
    if (w.endsWith(suffix) && w.length - suffix.length >= 4) {
      return w.slice(0, w.length - suffix.length);
    }
  }
  return w;
}

/**
 * Tokeniza texto en términos normalizados.
 * @param {string} text
 * @returns {string[]}
 */
export function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ-]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t) && !/^\d+$/.test(t))
    .map(stem);
}

/**
 * Calcula TF para un documento.
 * @param {string[]} tokens
 * @returns {Map<string, number>}
 */
function computeTF(tokens) {
  const freq = new Map();
  for (const t of tokens) freq.set(t, (freq.get(t) || 0) + 1);
  const total = tokens.length || 1;
  const tf = new Map();
  for (const [t, count] of freq) tf.set(t, count / total);
  return tf;
}

/**
 * Construye el índice TF-IDF para un conjunto de documentos.
 * @param {Map<string, string>} docs - Map<path, text>
 * @returns {{ vectors: Map<path, Map<term, score>>, tokenizedDocs: Map<path, string[]> }}
 */
export function buildIndex(docs) {
  const N = docs.size;
  const tokenizedDocs = new Map();
  const dfMap = new Map(); // term → número de docs que lo contienen

  // Tokenizar todos los docs y contar document frequency
  for (const [path, text] of docs) {
    const tokens = tokenize(text);
    tokenizedDocs.set(path, tokens);
    const unique = new Set(tokens);
    for (const t of unique) dfMap.set(t, (dfMap.get(t) || 0) + 1);
  }

  // Calcular vectores TF-IDF
  const vectors = new Map();
  for (const [path, tokens] of tokenizedDocs) {
    const tf = computeTF(tokens);
    const vector = new Map();
    for (const [term, tfScore] of tf) {
      const df = dfMap.get(term) || 1;
      const idf = Math.log2(N / (1 + df));
      const score = tfScore * idf;
      if (score > 0) vector.set(term, score);
    }
    vectors.set(path, vector);
  }

  return { vectors, tokenizedDocs };
}

/**
 * Calcula similitud coseno entre dos vectores TF-IDF.
 * @param {Map<string, number>} vecA
 * @param {Map<string, number>} vecB
 * @returns {number} 0..1
 */
function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const [term, scoreA] of vecA) {
    const scoreB = vecB.get(term) || 0;
    dot += scoreA * scoreB;
  }
  for (const score of vecA.values()) normA += score * score;
  for (const score of vecB.values()) normB += score * score;

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Encuentra los N documentos más similares a una nota dada.
 * @param {string} queryPath - Path de la nota a comparar
 * @param {Map<string, string>} docs - Todos los documentos (path → text)
 * @param {Map<string, Object>} meta - Metadatos (path → { title, tags, type })
 * @param {number} topN
 * @param {number} minScore
 * @returns {Array<{ path, title, score, shared_concepts, snippet, relationship_hint }>}
 */
export function findSimilar(queryPath, docs, meta, topN = 5, minScore = 0.05) {
  if (docs.size < 3) {
    return []; // Muy pocas notas para TF-IDF confiable
  }

  const { vectors, tokenizedDocs } = buildIndex(docs);
  const queryVec = vectors.get(queryPath);

  if (!queryVec) return [];

  const queryTokens = new Set(tokenizedDocs.get(queryPath) || []);
  const results = [];

  for (const [path, vec] of vectors) {
    if (path === queryPath) continue;

    const score = cosineSimilarity(queryVec, vec);
    if (score < minScore) continue;

    // Conceptos compartidos: términos con alto TF-IDF en AMBOS documentos
    const sharedConcepts = [];
    for (const [term, qScore] of queryVec) {
      if (vec.has(term) && qScore > 0.02) {
        sharedConcepts.push({ term, score: qScore + (vec.get(term) || 0) });
      }
    }
    sharedConcepts.sort((a, b) => b.score - a.score);
    const topConcepts = sharedConcepts.slice(0, 5).map(c => c.term);

    // Relationship hint heurístico
    const noteMeta = meta.get(path) || {};
    const queryMeta = meta.get(queryPath) || {};
    let relationshipHint = 'complementary';
    if (noteMeta.type === 'permanente' && queryMeta.type === 'literatura') {
      relationshipHint = 'extends';
    } else if (noteMeta.type === 'literatura' && queryMeta.type === 'permanente') {
      relationshipHint = 'source-of';
    }

    const docText = docs.get(path) || '';
    const snippet = docText
      .split('\n')
      .find(l => l.trim().length > 30 && !l.startsWith('#') && !l.startsWith('---'))
      ?.trim()
      .slice(0, 100) || '';

    results.push({
      path,
      title: noteMeta.title || path,
      score: Math.round(score * 100) / 100,
      shared_concepts: topConcepts,
      snippet,
      relationship_hint: relationshipHint,
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, topN);
}
