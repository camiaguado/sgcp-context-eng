# /connect — Encontrar conexiones entre notas

Encontrá conexiones semánticas entre una nota y el resto del vault usando TF-IDF y análisis conceptual.

`$ARGUMENTS`: path de la nota (relativo o absoluto), o vacío para seleccionar interactivamente.

---

## Paso 0: Verificar vault

Leé `~/.pkm-vaults.json` para obtener el `vault_path`. Si no existe, respondé: "Vault no configurado. Usá `/setup`."

---

## Si no hay argumento

Listá las 10 notas más recientemente modificadas:
```bash
find [vault_path] -name "*.md" -not -path "*/.git/*" | xargs ls -t 2>/dev/null | head -10
```

Mostrá la lista numerada con título (primera línea # del archivo) y ruta relativa.
Preguntá: "¿Con cuál nota querés encontrar conexiones? (número o path)"

---

## Con path de nota

### 1. Ejecutar el finder

```bash
node scripts/find-connections.js "[path-absoluto]" --top=8
```

### 2. Interpretar el output JSON

El script devuelve:
```json
{
  "query": { "path": "...", "title": "...", "tags": [], "type": "..." },
  "connections": [
    {
      "path": "...",
      "title": "...",
      "score": 0.73,
      "shared_concepts": ["concepto1", "concepto2"],
      "snippet": "...",
      "relationship_hint": "complementary"
    }
  ],
  "tag_connections": [...],
  "low_note_count": false
}
```

Si `low_note_count` es true: "El vault tiene pocas notas para análisis de contenido — te muestro conexiones por tags por ahora. A medida que agregues notas, las conexiones van a ser más ricas."

### 3. Presentar resultados conversacionalmente

No uses tablas. Presentá así:

"Encontré **[N] conexiones** para '[título]':

---

**[título conexión 1]** (relevancia: alta)
Comparten: [conceptos]. [snippet de 80 chars]...
→ `[ruta relativa]`

**[título conexión 2]** (relevancia: media)
Comparten: [conceptos]. [snippet]...
→ `[ruta relativa]`

---

¿Querés agregar alguna de estas como enlace formal en la nota?"

Para el nivel de relevancia:
- score > 0.6 → "alta"
- score 0.3-0.6 → "media"
- score < 0.3 → "baja"

Para `relationship_hint`:
- `complementary` → "Se complementan"
- `extends` → "Esta nota desarrolla o aplica ideas de la otra"
- `example-of` → "Es un ejemplo concreto de"
- `contradicts` → "Puede estar en tensión con"

### 4. Agregar conexiones formales

Si acepta:

Preguntá: "¿Cuáles querés agregar? (números separados por coma)"

Para cada una elegida:
1. Leé el archivo de la nota original
2. Modificá el frontmatter: agregá el path/title al array `conexiones:`
3. Opcionalmente, agregá un `[[wikilink]]` en el cuerpo donde sea natural

Mostrá: "Agregué [N] conexiones a '[título]'."

### 5. Conexión bidireccional (opcional)

Preguntá: "¿Querés que también agregue el enlace en la dirección inversa? (agregar '[nota original]' en cada nota conectada)"

---

## Modo batch (argumento: `--huerfanas`)

Si el argumento es `--huerfanas` o `--orphans`:

1. Buscá todas las notas sin campo `conexiones` o con `conexiones: []`:
```bash
find [vault_path]/zettelkasten -name "*.md" | xargs grep -L "conexiones:" 2>/dev/null
```

2. Para cada nota huérfana, ejecutá el finder y sugeriré las top-3 conexiones.

3. Presentá un resumen: "Encontré [N] notas sin conexiones. Acá mis sugerencias para las primeras 5..."
