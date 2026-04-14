# /inbox — Procesar capturas

Procesá las notas capturadas y decidí dónde va cada una en el sistema PARA.

Este proceso implementa **elaborative interrogation**: antes de archivar una captura como conocimiento permanente, hacés tres preguntas que aumentan la retención y comprensión significativamente.

---

## Paso 0: Verificar vault

Leé `~/.pkm-vaults.json` para obtener `vault_path` y `language`. Si no existe, respondé: "Vault no configurado. Usá `/setup`."

---

## Paso 1: Listar inbox

Buscá archivos con `procesado: false` en la carpeta de capturas:
```bash
find [vault_path]/capturas -name "*.md" -newer /tmp/never 2>/dev/null | sort
```

También revisá `0-inbox/`:
```bash
find [vault_path]/0-inbox -name "*.md" 2>/dev/null | sort
```

Si no hay ninguno: "Tu inbox está vacío. ¡Bien hecho! 🎉"

Si hay items, mostrá: "Tenés **[N] item(s)** en el inbox. Vamos de a uno."

---

## Paso 2: Procesar cada item (de a 5 por vez máximo)

Para cada archivo, en orden cronológico:

### 2a. Mostrá resumen del item

Leé el archivo y mostrá:
```
[N de M] — "[título]"
📅 Capturado: [fecha]
🏷 Tags: [tags]
📝 [primeras 100 chars del body, sin frontmatter]
```

### 2b. Preguntá qué hacer

"¿Qué hacés con esta nota?

**1** → Moverla a un proyecto
**2** → Moverla a recursos/área de conocimiento
**3** → Convertir en nota permanente (elaborar ahora)
**4** → Archivar (no es relevante en este momento)
**5** → Borrar

(o escribí 'skip' para saltear y seguir con la siguiente)"

### 2c. Ejecutar la acción

**Opción 1 — Proyecto:**
- Mostrá lista de proyectos activos del config
- Al elegir: mover archivo a `1-proyectos/[slug]/`
- Actualizar `procesado: true` en el frontmatter
- Actualizar `proyectos: ["[slug]"]` en el frontmatter

**Opción 2 — Recursos:**
- Preguntá: "¿A qué área de conocimiento pertenece?"
- Mostrá áreas y recursos del config como sugerencia
- Al elegir: mover a `3-recursos/[slug]/`
- Actualizar `procesado: true`

**Opción 3 — Nota permanente:**
Aplicá elaborative interrogation. Hacé estas preguntas de a una:

"Para convertirla en conocimiento tuyo, necesito que la elabores un poco:

**1/3** — ¿Por qué esto es relevante para vos? ¿Qué problema o pregunta tuya ilumina?"

(Esperá respuesta)

"**2/3** — ¿Qué sabías ya sobre este tema? ¿Esto lo confirma, lo desafía, o lo amplía?"

(Esperá respuesta)

"**3/3** — ¿Qué consecuencia práctica tiene esto en tu trabajo actual?"

(Esperá respuesta)

Con las tres respuestas, creá una nota permanente nueva en `notas-permanentes/[YYYYMMDD-slug].md`:
- Usá el template de nota permanente
- El body incluye la idea central + las tres respuestas elaboradas
- Enlazá la nota original en el campo `conexiones:`
- Marcá la captura original como `procesado: true` y enlazá la permanente

Mostrá: "Creé la nota permanente '[título]' en notas-permanentes/."

**Opción 4 — Archivar:**
- Mover a `4-archivo/`
- Actualizar `procesado: true`

**Opción 5 — Borrar:**
- Confirmá: "¿Segura que querés borrar '[título]'? Esta acción no se puede deshacer."
- Si confirma: eliminá el archivo

**Skip:**
- Pasá al siguiente sin modificar

---

## Paso 3: Cierre

Después de procesar todos (o los primeros 5):

Mostrá resumen:
```
Inbox procesado:
✓ [N] movidas a proyectos
✓ [N] convertidas en notas permanentes  
✓ [N] archivadas
✓ [N] borradas
⏭ [N] salteadas
📥 [N] todavía pendientes
```

Si quedan pendientes: "Quedan [N] items. ¿Seguimos con la próxima tanda?"
