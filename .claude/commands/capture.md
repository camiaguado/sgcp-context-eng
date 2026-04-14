# /capture — Capturar artículos, URLs e ideas

Capturá cualquier información y guardala en el vault con el formato correcto.

`$ARGUMENTS` puede ser: una URL, texto libre, o vacío (te pregunto qué capturar).

---

## Paso 0: Verificar vault

Antes de cualquier cosa, leé la configuración del vault:
```bash
node scripts/session-orient.js 2>/dev/null
```

Si el vault no está configurado, respondé: "Tu vault no está configurado todavía. Usá `/setup` para crearlo."

Leé `~/.pkm-vaults.json` para obtener el `vault_path` y `language`.

---

## Si no hay argumento

Preguntá: "¿Qué querés capturar? Podés darme una URL, pegarme texto, o contarme una idea."

---

## Si el argumento es una URL (empieza con http o https)

### 1. Fetch del contenido
Usá `WebFetch` con la URL. Prompt: "Extraé: título, resumen de 3 oraciones, los 5 conceptos o ideas más importantes, y el argumento central del autor. Respondé en JSON."

### 2. Progressive Summarization
Procesá el contenido en 4 capas:
- **Capa 1 (raw):** Todo el contenido
- **Capa 2 (destacado):** Los 3-5 párrafos más relevantes
- **Capa 3 (bullets):** 5-7 ideas clave como bullets
- **Capa 4 (esencia):** Una sola oración que capture el argumento central

### 3. Detectar proyecto relacionado
Leé los proyectos activos del config. Si algún proyecto o área coincide semánticamente con el contenido, sugeriló.

### 4. Mostrá preview y confirmá
"Capturé: **[título]**

💡 Esencia: [capa 4]
🏷 Conceptos: [lista]
📂 ¿Lo relacionamos con algún proyecto? [lista de proyectos activos, o 'Solo en capturas']"

### 5. Crear la nota
Generá un ID timestamp: `Date.now()` en el código, o usá `date +%s%3N` en bash.

Creá el archivo en `[vault_path]/capturas/[YYYYMMDD-slug-titulo].md` con el siguiente frontmatter y cuerpo:

```markdown
---
id: [timestamp]
titulo: "[título extraído]"
tipo: literatura
fecha: [YYYY-MM-DD]
fuente: "[URL]"
autor: "[autor si lo encontraste]"
procesado: false
tags: [conceptos extraídos como array]
proyectos: []
conexiones: []
---

# [título]

**Fuente:** [URL]
**Fecha captura:** [fecha]

## Esencia

> [capa 4 — argumento central en una oración]

## Ideas clave

[bullets de capa 3]

## Highlights

[capa 2 — párrafos más relevantes]

## Mis notas iniciales

[dejar vacío para que el usuario complete]

## Preguntas que me genera

- 
```

---

## Si el argumento es texto libre

### 1. Detectar tipo
Preguntá (o inferí del texto):
- "¿Es una idea tuya o un fragmento de alguna fuente?"
- Si es idea propia → template `permanente`
- Si es fragmento → pedí la fuente, usar template `literatura`

### 2. Para ideas propias
Aplicá **elaborative interrogation** antes de guardar:
"Antes de guardarlo, tres preguntas rápidas para que sea más valioso:
1. ¿Por qué esto importa para vos?
2. ¿Qué sabés ya que esto confirma o desafía?
3. ¿Qué consecuencia práctica tiene en tu trabajo?"

Incluí las respuestas en el body de la nota.

### 3. Crear la nota
Guardá en `[vault_path]/capturas/[YYYYMMDD-slug].md` con el template apropiado.

---

## Después de guardar

Ejecutá para validar:
```bash
node scripts/validate-note.js "[ruta-de-la-nota]"
```

Mostrá cualquier advertencia de validación.

Luego ofrecé: "¿Querés que busque conexiones con notas existentes? (`/connect [ruta]`)"

Cerrá con: "Guardado en capturas/. Cuando quieras procesarlo formalmente, usá `/inbox`."
