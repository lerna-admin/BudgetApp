# Memory Policy (Mandatory)

Todos los agentes deben registrar memoria en cada paso.

## Regla no negociable

No hay ejecucion de agente sin escritura y lectura de memoria.

## Regla de proyecto (budgetapp)

Persistir logs compartidos de agentes en:

- `BUDGETAPP_MEMORY_LOG_PATH`, o si no existe:
- `$BUDGETAPP_STORAGE_ROOT/logs/logs.jsonl`
- fallback local: `<repo>/app/logs/logs.jsonl`

No usar rutas de otros proyectos.

## Objetivo

Garantizar continuidad: que los agentes recuerden decisiones, contexto, respuestas, errores y compromisos previos.

## Capas de memoria

1. Event Memory (raw)
- Guarda cada interaccion: input, output, tool call, resultado y timestamp.

2. Task Memory
- Guarda estado por ticket: avances, bloqueos, artefactos y DoD.

3. Decision Memory
- Guarda decisiones clave: que se decidio, por que, con que tradeoff.

4. Semantic Memory
- Guarda hechos estables resumidos para recuperacion rapida.

## Reglas de escritura

1. Escribir evento al inicio de tarea.
2. Escribir evento despues de cada accion de tool.
3. Escribir evento al cerrar tarea.
4. Incluir `venture_id`, `thread_id`, `task_id`, `agent_id`.

## Reglas de lectura

1. Cargar ultimos eventos del thread antes de responder.
2. Cargar resumen semantico de la venture.
3. Cargar decisiones previas relacionadas al `task_type`.

## Retencion

1. Raw events: retencion larga (auditoria completa).
2. Resumenes: recalculo diario.
3. Hechos semanticos: actualizar por version y validez.

## Calidad de memoria

Cada evento debe tener:

- `what_happened`
- `why_it_happened`
- `next_action`
- `confidence`

## Anti patrones

- Responder sin leer memoria reciente.
- Sobrescribir historia sin versionado.
- Guardar solo resumen y perder raw events.
