# ArsContexta — Motor PKM personal

Sistema de gestión del conocimiento personal (PKM) basado en conversación. Genera un "segundo cerebro" personalizado en markdown puro.

## Idea central

La mayoría de los sistemas de notas acumulan información pero no construyen conocimiento. Este sistema está diseñado para cruzar ese puente — convirtiendo capturas en ideas permanentes, y ideas en conexiones que generan comprensión nueva.

## Cómo funciona

**1. Configuración conversacional** → `/setup`
Una entrevista de ~10 minutos genera tu vault personalizado: carpetas, templates, proyectos iniciales, y manual de uso propio.

**2. Captura sin fricción** → `/capture [url o idea]`
Cualquier cosa que encontrás — artículos, ideas, conversaciones — va primero al inbox. Sin decidir categorías en el momento.

**3. Procesamiento activo** → `/inbox`
Convertís capturas en conocimiento con elaborative interrogation: tres preguntas que hacen que las ideas se vuelvan tuyas.

**4. Conexiones automáticas** → `/connect [nota]`
El motor TF-IDF encuentra notas relacionadas en el vault. Vos decidís cuáles son realmente significativas.

**5. Ritual diario y semanal** → `/daily` y `/review`
La nota diaria ancla el día. La revisión semanal incluye spaced repetition lite: 5 notas al azar que no viste en 14+ días.

## Estructura del proyecto

```
.claude/
  commands/          ← Comandos /setup /capture /connect /inbox /daily /review
scripts/
  generate-vault.js  ← Generador del vault personalizado
  find-connections.js← Motor TF-IDF de conexiones
  session-orient.js  ← Contexto automático al inicio de sesión
  validate-note.js   ← Validador de estructura de notas
  lib/
    tfidf.js         ← Algoritmo TF-IDF sin dependencias
    note-parser.js   ← Parser YAML frontmatter + markdown
    vault-config.js  ← Gestión del config del vault
templates/           ← Templates de notas (permanente, literatura, reunión, etc.)
methodology/         ← Fundamentos científicos del sistema
```

## Principios científicos aplicados

| Principio | Dónde | Qué hace |
|-----------|-------|----------|
| Elaborative Interrogation | `/inbox` | 3 preguntas que aumentan comprensión y retención |
| Spaced Repetition | `/review` | 5 notas al azar no vistas en 14+ días |
| Progressive Summarization | `/capture` | 4 capas de síntesis (raw → esencia) |
| notas permanentes | `notas-permanentes/` | Notas atómicas + conexiones explícitas |
| PARA | Estructura de carpetas | Organización por accionabilidad |

Ver `methodology/research-foundation.md` para el respaldo completo.

## Primer uso

```
/setup
```

Eso es todo. El wizard te guía por el resto.

## Compatibilidad

- Las notas usan YAML frontmatter y `[[wikilinks]]` — **100% compatible con Obsidian**
- Sin dependencias npm. Requiere solo Node.js ≥ 18
- El vault puede vivir en iCloud, Dropbox, o cualquier carpeta
- Git-friendly: cada nota es un archivo de texto

## Inspiración

Inspirado en [ArsContexta](https://github.com/agenticnotetaking/arscontexta) y en los trabajos de Niklas Luhmann, Tiago Forte, y Robert Bjork.
