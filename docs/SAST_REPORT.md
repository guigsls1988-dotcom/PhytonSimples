# Informe de seguridad de código

Fecha de ejecución: 24 de julio de 2026.

## Alcance y resultados

| Control | Alcance | Resultado |
|---|---|---|
| Bandit 1.9.4 | `app/`, 382 líneas de Python | 0 hallazgos |
| pip-audit 2.10.1 | Runtime y transitivas instaladas | 0 vulnerabilidades en el conjunto de la aplicación |
| Ruff 0.16.0 | `app/`, `tests/`, `tools/` | Sin errores |
| Pytest 9.1.1 | API, roles, exclusiones, parser, IPv4/IPv6 | 8 pruebas aprobadas |

El conjunto auditado incluye FastAPI 0.140.0, Starlette 1.3.1, Pydantic 2.13.4,
HTTPX 0.28.1, Uvicorn 0.51.0, IDNA 3.15 y sus dependencias runtime. Las versiones
vulnerables preinstaladas en el sistema del runner, pero no usadas ni declaradas por esta
aplicación, no se atribuyeron al proyecto.

## Reproducción

```bash
python -m bandit -r app
python -m pip_audit -r requirements.txt
python -m ruff check app tests tools
python -m pytest -q
```

CI repite SAST, auditoría de dependencias, pruebas, lint y build de container en cada push
y pull request. Un resultado limpio no demuestra ausencia de vulnerabilidades; se
complementa con revisión de autorización, threat modelling, pruebas de abuso y escaneo
continuo.
