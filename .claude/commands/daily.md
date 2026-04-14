# /daily — Nota diaria

Creá o revisá la nota diaria de hoy. Este ritual de 2 minutos ancla el día y conecta lo que hacés con lo que querés construir.

`$ARGUMENTS`: puede ser vacío (hoy), o una fecha en formato YYYY-MM-DD.

---

## Paso 0: Verificar vault

Leé `~/.pkm-vaults.json`. Si no existe: "Vault no configurado. Usá `/setup`."

---

## Paso 1: Determinar fecha y path

```bash
date +%Y-%m-%d
```

Path de la nota: `[vault_path]/diarios/[YYYY-MM-DD].md`

Si se pasó fecha en `$ARGUMENTS`, usá esa.

---

## Paso 2: Si la nota ya existe

Mostrá el contenido actual de la nota.

Preguntá: "¿Querés agregar algo?
**1** → Agregar a 'Capturas del día'
**2** → Completar la reflexión de cierre
**3** → Agregar una tarea
**4** → Solo ver"

Ejecutá la edición correspondiente.

---

## Paso 3: Si la nota no existe

### 3a. Preguntá la intención del día

"Antes de crear tu nota de hoy: **¿cuál es tu intención principal para el día?**
(Una frase. Puede ser una meta, un estado de ánimo, o una pregunta.)"

Guardá la respuesta como `INTENCION`.

### 3b. Crear la nota

Leé los proyectos activos del config (`active_projects`).

Creá primero el directorio si no existe:
```bash
mkdir -p [vault_path]/diarios
```

Creá el archivo `[vault_path]/diarios/[YYYY-MM-DD].md` con este contenido:

```markdown
---
tipo: diario
fecha: [YYYY-MM-DD]
dia: [día de la semana en español/inglés según config]
procesado: false
---

# [YYYY-MM-DD] — [día de la semana]

## Intención

> [INTENCION]

## Foco del día

[Para cada proyecto activo, una línea:]
### [nombre del proyecto]
- 

## Capturas del día

[Ideas, artículos, conversaciones que surgieron]

---

## Al cierre 🌙

### ¿Qué pasó realmente?

### Una cosa que aprendí o me sorprendió

### ¿Cómo me siento con el avance?

### Mañana, lo más importante es...
```

### 3c. Verificar revisión semanal

Leé `last_weekly_review` y `review_cadence_days` del config.

Si han pasado ≥ `review_cadence_days` días desde la última revisión (o si `last_weekly_review` es null y el vault tiene > 7 días):

"📋 **Recordatorio:** Esta semana corresponde revisión semanal.
¿La hacemos ahora o después? (`/review` cuando estés lista)"

---

## Paso 4: Mostrá la nota

Mostrá el contenido de la nota creada o actualizada.

Cerrá con: "Nota guardada. Buena jornada 🙌"

---

## Nota sobre el día de la semana

Para `fecha` → `día`:
- Lunes, Martes, Miércoles, Jueves, Viernes, Sábado, Domingo (español)
- Monday, Tuesday... (inglés)

Calculá el día usando la fecha ISO.
