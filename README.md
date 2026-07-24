# Sentinel CTI

Plataforma web de Cyber Threat Intelligence para cadastrar, relacionar, pesquisar e
enriquecer indicadores de ameaças.

## Recursos

- CRUD e pesquisa de IOCs, CVEs, Threat Actors, campanhas e técnicas MITRE ATT&CK
- Associação de IOCs, atores e técnicas a campanhas
- Upload de PDF, validação e extração híbrida de IOCs (parser local + IA opcional)
- Consultas server-side em Shodan, Censys, VirusTotal, AbuseIPDB, GreyNoise e MISP
- Dashboard, score de risco transparente e timeline auditável
- Autenticação JWT e documentação OpenAPI/Swagger
- API FastAPI assíncrona, PostgreSQL, SQLAlchemy 2 e Repository/Unit of Work
- Interface React + TypeScript, Docker Compose e testes automatizados

## Início rápido

```bash
cp .env.example .env
# Edite JWT_SECRET, POSTGRES_PASSWORD e as chaves das integrações desejadas
docker compose up --build
```

- Aplicação: http://localhost:3000
- Swagger: http://localhost:8000/docs
- Health check: http://localhost:8000/health

Crie o primeiro usuário pelo Swagger em `POST /api/v1/auth/register`. Depois, use o
e-mail no campo `username` de `POST /api/v1/auth/login`.

## Arquitetura

```text
frontend/               React, TypeScript, Recharts
backend/app/
  api.py                controladores REST e casos de uso
  schemas.py            contratos de entrada/saída
  models.py             entidades persistidas
  repositories.py       Repository Pattern e Unit of Work
  services.py           domínio: normalização, risco, PDF e integrações
  auth.py               autenticação e dependências JWT
  database.py           infraestrutura SQLAlchemy assíncrona
docker-compose.yml      frontend, API e PostgreSQL
```

Os clientes externos ficam atrás de `EnrichmentService`; credenciais nunca chegam ao
browser. Um provedor sem chave retorna `unavailable` sem derrubar os demais resultados.
Com `OPENAI_API_KEY`, relatórios também passam por uma análise semântica; sem a chave, o
extrator local validado continua funcionando sem enviar o conteúdo a terceiros.

## API principal

| Recurso | Endpoints |
|---|---|
| Autenticação | `/api/v1/auth/register`, `/login`, `/me` |
| IOCs | `/api/v1/iocs` |
| CVEs | `/api/v1/cves` |
| Threat Actors | `/api/v1/threat-actors` |
| Campanhas | `/api/v1/campaigns` |
| MITRE | `/api/v1/mitre-techniques` |
| PDFs | `/api/v1/reports` |
| Enriquecimento | `/api/v1/lookups` |
| Analytics | `/api/v1/dashboard`, `/timeline` |

## Testes locais

```bash
cd backend
python -m venv .venv && . .venv/bin/activate
pip install -e '.[test]'
pytest

cd ../frontend
npm install
npm run build
```

## Produção

Antes de expor a aplicação, substitua os segredos padrão, aplique TLS, use um gestor de
segredos e armazenamento de objetos com antivírus para PDFs. Para alto volume, mova o
processamento de relatórios e enriquecimentos para workers e use Alembic no lugar da
criação automática de tabelas.
