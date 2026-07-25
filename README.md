# Tor IP Aggregator + análisis de amenazas

Solución de los dos retos: una API REST que agrega nodos de salida Tor y un modelo de
amenazas STRIDE del flujo de venta/logística, soportado por una arquitectura de agentes.

## API

Fuentes elegidas:

- `check.torproject.org/torbulkexitlist`: fuente primaria, mantenida por Tor Project y con
  formato estable de una IP por línea.
- `dan.me.uk/torlist/?exit`: segunda fuente para ampliar cobertura y tolerar fallos.

No se usa BigDataCloud porque su URL propuesta es una página de insights, no un feed
documentado y estable. Las fuentes se consultan concurrentemente, las IP se validan,
normalizan y deduplican. Una fuente puede fallar sin derribar la respuesta; si todas fallan,
se sirve la caché previa como `stale` o se responde 503.

### Endpoints

| Método | Ruta | Rol | Uso |
|---|---|---|---|
| GET | `/health` | público | Health check |
| GET | `/v1/tor-ips` | reader/admin | Todas las IP agregadas |
| POST | `/v1/exclusions` | admin | Crear exclusión |
| GET | `/v1/tor-ips/filtered` | reader/admin | IPs menos exclusiones |
| GET | `/v1/exclusions` | admin | Listar exclusiones (extra) |
| DELETE | `/v1/exclusions/{ip}` | admin | Eliminar exclusión (extra) |
| GET | `/docs` | público | OpenAPI/Swagger |

### Ejecución local

Requiere Python 3.11+:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
export READER_API_KEYS='reader-local-key'
export ADMIN_API_KEYS='admin-local-key'
uvicorn app.main:app --reload
```

Abrir `http://localhost:8000/docs`. Para pruebas y lint:

```bash
pytest -q
ruff check app tests
```

### Docker Compose

```bash
cp .env.example .env
# Reemplazar ambas keys de .env por secretos aleatorios distintos
docker compose up --build -d
docker compose ps
curl http://localhost:8000/health
```

La base SQLite persiste en el volumen `tor-data`. Para detener: `docker compose down`.
Para borrar también datos: `docker compose down -v`.

### Requests de ejemplo

```bash
# 1. Lista sin filtrar
curl -sS -H 'X-API-Key: reader-local-key' \
  http://localhost:8000/v1/tor-ips

# 2. Agregar una exclusión (IPv4 o IPv6)
curl -sS -X POST -H 'X-API-Key: admin-local-key' \
  -H 'Content-Type: application/json' \
  -d '{"ip":"8.8.8.8","reason":"scanner autorizado"}' \
  http://localhost:8000/v1/exclusions

# 3. Lista filtrada
curl -sS -H 'X-API-Key: reader-local-key' \
  http://localhost:8000/v1/tor-ips/filtered
```

Respuestas incluyen `count`, `ips`, fecha de consulta, fuentes exitosas/erróneas y estado
de caché. `POST` devuelve 201 al crear y 200 si ya existía. Errores usan 401 (sin
autenticación), 403 (rol insuficiente), 422 (IP inválida) y 503 (sin fuente ni caché).

## Seguridad y decisiones

- API keys comparadas en tiempo constante y roles separados. En producción deben venir de
  un secret manager; la propuesta AWS migra a tokens OIDC.
- SQL parametrizado, validación canónica IPv4/IPv6 y límites de tamaño.
- Auditoría de método, ruta, resultado, principal y cliente hasheados; no se guardan keys.
- Caché de cinco minutos para no abusar de feeds externos.
- Container no root, sólo lectura, sin Linux capabilities y con volumen de datos dedicado.
- SQLite es adecuada para una instancia del reto. Producción multi-réplica usa PostgreSQL.

## Entregables

- [Modelo STRIDE, arquitectura de agentes, memoria, prompts y mitigación extra](docs/THREAT_MODEL.md)
- [Despliegue AWS](docs/CLOUD_DEPLOYMENT.md)
- [Informe SAST y auditoría de dependencias](docs/SAST_REPORT.md)
- `docs/SOLUCION_COMPLETA.pdf`: documentación separada generada desde los documentos.
- `docs/assets/`: capturas de requests y responses reales.
- `Dockerfile`, `compose.yaml`, pruebas automatizadas y OpenAPI interactivo.

## Estructura

```text
app/
  config.py       configuración por entorno
  database.py     exclusiones y auditoría SQLite
  main.py         API, autenticación y endpoints
  tor_sources.py  consulta, validación, caché y tolerancia a fallos
docs/             informe, cloud, PDF y evidencias
tests/            API y parser
```
