# Agent OS Starter Kit

Objetivo: operar entre 4 y 10 ideas de negocio con minima interaccion manual, usando un gestor de tareas como interfaz principal.

## Principios

1. Cada idea de negocio es un workspace aislado.
2. Toda ejecucion empieza en un ticket.
3. El supervisor no hace trabajo operativo, solo enruta.
4. Los workers entregan artefactos con formato fijo.
5. Solo hay aprobacion humana en puertas criticas.

## Arquitectura

1. Task Manager
- Fuente de verdad para backlog, prioridades y estado.
- Crea eventos: `task.created`, `task.updated`, `task.blocked`, `task.done`.

2. Supervisor Agent
- Lee tickets nuevos.
- Clasifica tipo de tarea.
- Descompone en subtareas.
- Enruta a workers por contrato.

3. Worker Agents
- `market-research`
- `product-design`
- `web-dev`
- `content-seo`
- `ops-automation`
- `qa-review`

4. n8n
- Orquestacion deterministica.
- Integraciones con email, CRM, analytics, docs, redes.
- Cron para tareas repetitivas.

5. Codex
- Implementa codigo, scripts y cambios en repos.
- Genera PRs y reportes tecnicos.

## Ciclo operativo

1. Creas o priorizas tickets en el gestor.
2. Supervisor enruta o divide.
3. Worker ejecuta y sube artefactos.
4. QA valida Definition of Done.
5. Si pasa puerta humana critica, se publica.
6. Se cierra ticket y se registra metrica.

## Que incluye este starter kit

- `docs/agent-os/venture-template.md`: plantilla para cada idea.
- `docs/agent-os/task-types.md`: tipologia de tareas y DoD.
- `docs/agent-os/human-gates.md`: puertas de aprobacion humana.
- `docs/agent-os/memory-policy.md`: memoria obligatoria para todos los agentes.
- `docs/agent-os/how-agents-work-budgetapp.md`: guia practica de creacion/asignacion de agentes.
- `docs/agent-os/clickup-setup-budgetapp.md`: setup operativo de ClickUp como gestor.
- `docs/agent-os/telegram-agent-control.md`: control de agentes por Telegram DM.
- `docs/agent-os/first-sprint-7-days.md`: arranque rapido.
- `ops/task-manager/`: esquema de tablero y ticket.
- `ops/n8n/`: contratos de workers y template de routing.
- `scripts/init-venture.js`: scaffolder para nuevos workspaces.

## Comando de inicio

```bash
npm run venture:init -- <venture-slug>
```

Ejemplo:

```bash
npm run venture:init -- saas-landing-audit
```

## Scope actual

En este repo dejamos activo solo `budgetapp` en `ops/ventures/budgetapp`.
Cuando quieras agregar otro negocio, ejecuta el mismo comando con otro slug.

## Regla local obligatoria

Seguir `~/projects/budgetapp/INSTRUCTIONS.md` para aislamiento de variables y logs.
