# /review — Revisión semanal

Conducí la revisión semanal. Implementa spaced repetition lite: vas a revisar notas elegidas al azar que no viste en más de 14 días, lo cual refuerza la memoria de forma más efectiva que leer secuencialmente.

Duración estimada: 15-20 minutos.

---

## Paso 0: Verificar vault

Leé `~/.pkm-vaults.json`. Si no existe: "Vault no configurado. Usá `/setup`."

---

## Paso 1: Colectar datos de la semana

```bash
# Notas creadas/modificadas en los últimos 7 días
find [vault_path] -name "*.md" -newer [hace-7-dias] -not -path "*/.git/*" 2>/dev/null

# Capturas sin procesar
find [vault_path]/capturas [vault_path]/0-inbox -name "*.md" 2>/dev/null | xargs grep -l "procesado: false" 2>/dev/null | wc -l
```

Para "hace 7 días": `date -v -7d +%Y-%m-%d` (macOS) o `date -d '7 days ago' +%Y-%m-%d` (Linux).

Mostrá resumen:
```
📊 Esta semana:
• [N] notas nuevas o modificadas
• [N] capturas sin procesar en inbox
• Última revisión: [fecha o 'nunca']
```

---

## Paso 2: Revisión de proyectos (PARA review)

Leé `active_projects` del config.

Para cada proyecto activo:
1. Buscá la última nota modificada en `1-proyectos/[slug]/`
2. Mostrá: "**[nombre proyecto]** — última actividad: [fecha]"

Preguntá por cada uno: "¿Cómo está [proyecto]?
**a)** Sigue activo tal cual
**b)** Está en pausa o bajó de prioridad
**c)** Terminó / se archiva
**d)** Necesita atención urgente"

Para `c` → mover carpeta a `4-archivo/` y actualizar config.
Para `d` → marcalo visualmente en la revisión.

---

## Paso 3: Spaced Repetition — Notas aleatorias

Seleccioná 5 notas de la carpeta de notas permanentes para revisar. Criterio:
1. Preferí notas con `tipo: permanente`
2. Preferí notas con `ultima_revision` > 14 días atrás (o sin ese campo)
3. Si hay menos de 5 notas permanentes, incluí notas de literatura procesadas

```bash
find [vault_path]/notas-permanentes -name "*.md" 2>/dev/null | shuf | head -5
```

Para cada nota seleccionada:

Mostrá:
```
🎲 Nota aleatoria [N de 5]:
**[título]**
[primeras 3 líneas del body]
```

Preguntá: "¿Sigue siendo válido esto para vos?
**s)** Sí, lo confirmo → actualizar `ultima_revision`
**n)** No, cambió mi perspectiva → elaborar actualización
**+)** Sí, y tengo algo nuevo para agregar → enriquecer la nota"

Para `n` o `+`: Escuchá la actualización y editá el cuerpo de la nota con el enriquecimiento. Actualizá `ultima_revision`.

Para `s`: Solo actualizá `ultima_revision: [hoy]` en el frontmatter.

---

## Paso 4: Progressive Summarization pendiente

Buscá notas de literatura procesadas sin nota permanente vinculada:
```bash
find [vault_path]/capturas [vault_path]/3-recursos -name "*.md" 2>/dev/null | xargs grep -l "procesado: true" 2>/dev/null | xargs grep -L "nota_permanente:" 2>/dev/null | head -5
```

Si hay resultados:
"📚 Estas capturas están procesadas pero todavía no las convertiste en conocimiento propio:
[lista]
¿Querés elaborar alguna ahora?"

---

## Paso 5: Crear nota de revisión

Creá `[vault_path]/_sistema/revisiones/[YYYY-MM-DD]-revision-semanal.md`:

```markdown
---
tipo: revision-semanal
fecha: [YYYY-MM-DD]
notas_revisadas: [N]
proyectos_revisados: [lista]
---

# Revisión semanal — [YYYY-MM-DD]

## Estadísticas
- Notas nuevas esta semana: [N]
- Capturas procesadas: [N]
- Notas permanentes revisadas: [N]

## Estado de proyectos
[Resumen por proyecto]

## Reflexión de la semana
[Espacio para que el usuario escriba]

## Insights de la revisión aleatoria
[Lo que surgió al releer notas antiguas]

## Próxima semana: intención principal

```

---

## Paso 6: Actualizar config

Actualizá `last_weekly_review` en `vault.config.json` con la fecha de hoy:
```bash
node -e "
import { readFileSync, writeFileSync } from 'fs';
const p = '[vault_path]/vault.config.json';
const c = JSON.parse(readFileSync(p, 'utf8'));
c.last_weekly_review = '[YYYY-MM-DD]';
writeFileSync(p, JSON.stringify(c, null, 2));
console.log('Config actualizado');
" --input-type=module 2>/dev/null
```

---

## Paso 7: Cierre

"✅ **Revisión completa.**

Proyectos revisados: [N]
Notas refrescadas (spaced repetition): [N]
Próxima revisión sugerida: [fecha +7 días]

Buen trabajo manteniendo tu sistema activo 🧠"
