# Fundamentos cognitivos del sistema PKM

Este documento explica *por qué* el sistema está diseñado como está. Cada decisión arquitectónica tiene respaldo en investigación sobre cómo la gente aprende, recuerda y piensa.

---

## El problema que resuelve

La mayoría de los sistemas de notas fallan por el mismo motivo: capturan información pero no construyen conocimiento. La diferencia entre los dos es enorme:

- **Información:** un artículo guardado en favoritos
- **Conocimiento:** entender por qué ese artículo cambia cómo pensás sobre un problema

Este sistema está diseñado para cruzar ese puente sistemáticamente.

---

## Principio 1: Elaborative Interrogation

**Dónde se aplica:** procesamiento en `/inbox`, creación de notas permanentes

**Qué es:** antes de incorporar una idea como conocimiento, te hacés tres preguntas:
1. ¿Por qué es verdad/relevante esto?
2. ¿Qué confirma o desafía lo que ya sé?
3. ¿Qué consecuencia práctica tiene?

**Por qué funciona:** la investigación de Pressley, McDaniel y otros muestra que generar explicaciones propias ("elaborar") produce comprensión y retención significativamente más profunda que la relectura pasiva. El efecto es especialmente fuerte cuando las preguntas conectan el material nuevo con conocimiento previo.

**Implementación:** el comando `/inbox` no te pide que "clasifiques" una nota — te pide que la *elabores* antes de guardarla. Esas tres preguntas aparecen explícitamente en el flujo.

**Costo vs. beneficio:** toma 2-3 minutos más por nota. El beneficio es que esas notas siguen siendo útiles 6 meses después, en lugar de ser carpetas de artículos olvidados.

---

## Principio 2: Spaced Repetition (versión ligera)

**Dónde se aplica:** revisión semanal (`/review`), campo `ultima_revision` en notas permanentes

**Qué es:** volver a revisar información en intervalos crecientes en lugar de estudiarla intensamente una sola vez.

**Por qué funciona:** el "efecto de espaciado" es uno de los hallazgos más replicados en psicología cognitiva (Ebbinghaus, 1885; Cepeda et al., 2006). Recuperar activamente información después de un intervalo requiere más esfuerzo que releerla inmediatamente — y ese esfuerzo adicional ("dificultad deseable", Bjork) produce retención a largo plazo mucho más sólida.

**Implementación:** en cada revisión semanal, el sistema selecciona 5 notas al azar que no revisaste en 14+ días. No es un sistema de tarjetas con algoritmo SM-2 — es una versión pragmática que aprovecha el mismo principio sin la sobrecarga de gestionar un mazo.

**Por qué no usar Anki directamente:** Anki es excelente para hechos discretos (vocabulario, fechas). Para ideas complejas e interconectadas — el tipo de conocimiento que genera un PKM de pensamiento — la revisión contextual (ver la nota completa con sus conexiones) funciona mejor que flash cards descontextualizadas.

---

## Principio 3: Progressive Summarization

**Dónde se aplica:** captura de artículos (`/capture`), procesamiento de literatura

**Qué es:** procesar la información capturada en capas sucesivas de síntesis:
- Capa 1: contenido raw completo
- Capa 2: párrafos más relevantes destacados
- Capa 3: ideas clave como bullets
- Capa 4: esencia en una oración

**Por qué funciona:** desarrollado por Tiago Forte, este método resuelve el problema del "relectura infinita": nunca sabés a qué nivel de detalle necesitarás volver a algo. Con capas, podés recuperar en segundos (Capa 4) o en minutos (Capa 1) según el contexto.

**Implementación:** el comando `/capture` genera automáticamente las 4 capas para cualquier URL. Para texto libre, el proceso es más manual — las preguntas de elaboración cumplen un rol similar.

---

## Principio 4: Desirable Difficulties (Dificultades Deseables)

**Dónde se aplica:** spaced repetition, elaborative interrogation

**Qué es:** el principio de Robert Bjork de que las condiciones que dificultan el aprendizaje a corto plazo (requieren más esfuerzo) a menudo producen retención a largo plazo superior.

**Por qué importa aquí:** releer notas es fácil y da sensación de dominio ("fluencia"). Recuperar activamente una idea (¿qué decía esa nota sobre liderazgo distribuido?) es difícil, pero es lo que construye memoria duradera.

**Implementación:** el sistema deliberadamente no te muestra el contenido completo de las notas en la revisión semanal — te muestra el título y las primeras líneas para activar la recuperación activa antes de mostrarte el resto.

---

## Principio 5: Zettelkasten — Atomicidad y Conexión

**Dónde se aplica:** estructura de notas permanentes, campo `conexiones`, `/connect`

**Qué es:** desarrollado por el sociólogo Niklas Luhmann, quien publicó 70 libros y 400 papers usando un sistema de ~90.000 fichas interconectadas. El principio central: cada nota contiene una sola idea (atomicidad) y está explícitamente enlazada con otras notas relacionadas.

**Por qué funciona:** las notas atómicas son más fáciles de reusar en nuevos contextos. Las conexiones explícitas permiten navegar el conocimiento de formas no lineales — encontrás relaciones que no hubieras visto leyendo secuencialmente.

**Implementación:** el `zettelkasten/` del vault es para notas permanentes (una idea por nota). El campo `conexiones:` en el frontmatter es para links curados. `/connect` automatiza la *descubierta* de conexiones potenciales; vos decidís cuáles son realmente significativas.

**Tensión con PARA:** Luhmann no tenía proyectos en el sentido moderno. Este sistema combina la potencia conceptual del Zettelkasten con la orientación a la acción del PARA. Son complementarios: PARA organiza para la *acción*, Zettelkasten organiza para la *comprensión*.

---

## Principio 6: PARA — Organización por Accionabilidad

**Dónde se aplica:** estructura principal de carpetas

**Qué es:** desarrollado por Tiago Forte, PARA organiza toda la información según su accionabilidad:
- **Proyectos:** tienen un resultado y una fecha de cierre
- **Áreas:** responsabilidades continuas sin fecha de cierre
- **Recursos:** referencia, no activamente procesable
- **Archivo:** todo lo inactivo

**Por qué funciona:** la mayoría de los sistemas organizan por tema (tecnología, diseño, negocios). PARA organiza por *contexto de uso* — cuándo y cómo vas a necesitar algo. Esto reduce la fricción de encontrar información cuando la necesitás.

**Implementación:** las carpetas `1-proyectos/`, `2-areas/`, `3-recursos/`, `4-archivo/` son el corazón de la organización. Los números aseguran orden visual consistente en cualquier explorador de archivos.

---

## Por qué plain markdown

1. **Sin lock-in:** tus notas son tuyas, para siempre. Ninguna empresa puede cambiar el formato o cerrar su producto.
2. **Portabilidad:** funciona con Obsidian, Logseq, VS Code, cualquier editor de texto, git.
3. **Durabilidad:** un archivo `.md` de 2026 va a ser legible en 2050.
4. **Versionable:** podés poner el vault en git y tener historial completo.
5. **Composable:** un script de 50 líneas puede leer, indexar y conectar miles de notas.

---

## Por qué TF-IDF en lugar de embeddings semánticos

Los embeddings (como los de OpenAI) darían mejores conexiones semánticas. Se descartaron por:

1. **Dependencia de API:** requieren internet y costo por llamada
2. **Índice persistente:** necesitás un vector store, lo que agrega complejidad
3. **Privacidad:** tus notas se enviarían a un servicio externo
4. **Costo marginal real:** para un vault personal de < 5000 notas, TF-IDF con stemming cubre el 80-85% de los casos de uso. El 15% restante lo cubre la interfaz conversacional — podés decirle a Claude "también buscá notas sobre X" y recorre el gap.

---

## Referencias

- Pressley, M., McDaniel, M. A., Turnure, J. E., Wood, E., & Ahmad, M. (1987). Generation and precision of elaboration: Effects on intentional and incidental learning. *Journal of Experimental Psychology: Learning, Memory, and Cognition*.
- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In J. Metcalfe & A. Shimamura (Eds.), *Metacognition*.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin*.
- Forte, T. (2022). *Building a Second Brain*. Atria Books.
- Ahrens, S. (2017). *How to Take Smart Notes*. (Sobre el método Zettelkasten de Luhmann)
- Ebbinghaus, H. (1885). *Über das Gedächtnis*. (La curva del olvido original)
