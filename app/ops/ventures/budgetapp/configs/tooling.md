# Tooling And Credentials

## Task Manager

- provider: ClickUp
- workspace: budgetapp
- team_id: 9017037596
- space_id: 90173595668
- folder: none (folderless list)
- list_id: 901710026291

## n8n

- base_url: http://localhost:5678
- workflow_supervisor_id: replace-me
- worker_workflows:
  - worker-market-research
  - worker-product-design
  - worker-web-dev
  - worker-content-seo
  - worker-ops-automation

## Memory

- storage_root: /home/xanadu/disco_portatil/proyectos/budgetapp
- log_file: /home/xanadu/disco_portatil/proyectos/budgetapp/logs/logs.jsonl
- write_mode: append_only
- read_window_events: 40
- summarize_daily: true

## LLM

- primary_provider: openai
- fallback_provider: openrouter_or_ollama

## Publishing

- domain: replace-me
- hosting: vercel_or_docker
- analytics: plausible_or_posthog

## Telegram

- bot_mode: dm_only
- allowed_users_env: TELEGRAM_ALLOWED_USER_IDS
