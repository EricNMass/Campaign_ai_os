# Campaign Automation AI Operating System

An autonomous, multi-agent enterprise operating system designed to audit, monitor, validate, and auto-correct campaign marketing workflows, URLs, UTM configurations, and email assets.

---

## Technical Stack
- **Backend**: Python 3.11, FastAPI, SQLAlchemy, SQLite (Development fallback) / PostgreSQL (Production)
- **Frontend**: React, TypeScript, Vite, Tailwind CSS (Loaded via CDN)
- **Agents**: Specialized Agent Fleet powered by Google Gemini (GenAI SDK) or OpenAI-compatible models
- **Execution**: Asynchronous browser runner powered by Python Playwright, concurrency semaphores, and video-recording pools.
- **CI/CD Integrations**: Azure DevOps pipelines status hooks, log retrieval APIs, and pull request triggers.

---

## Local Setup & Development (NO Docker Required)

Follow these steps to configure and run the application locally on macOS, Linux, or Windows:

### 1. Configure Environment Credentials
Open `.env` at the root of the workspace directory and add your Google Gemini API Key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Boot Concurrently (Backend + Frontend)
To automatically check for node packages, Python virtual environments, install dependencies, and run both the API backend and React frontend concurrently, trigger:
```bash
python3 run.py
```
- **UI Client**: [http://localhost:3000](http://localhost:3000)
- **FastAPI Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Mock Login Credentials**: Login as `admin` (Password: `admin123`), `engineer` (Password: `engineer123`), or `manager` (Password: `manager123`).

### 3. Run Automated Tests
Execute the Pytest suite inside the virtual environment:
```bash
backend/venv/bin/pytest backend/tests/
```

---

## Production Deployment Guide (Azure Cloud Architecture)

This system is engineered for scale and enterprise resilience using Azure cloud services:

```
[Users] ──> [Azure Front Door / CDN] ──> [Azure App Service / React Static Site]
                                                │
                                                ▼ (API queries)
                                      [Azure Container Apps (FastAPI API Node)]
                                       ├── Sidecar: Redis Cache (Short Term Memory)
                                       ├── DB: Azure Database for PostgreSQL
                                       ├── Vault: Azure Key Vault (Secrets Management)
                                       └── Storage: Azure Blob Storage (Screenshots, Videos, PDFs)
```

### 1. Database (PostgreSQL) & Cache (Redis)
- Provision **Azure Database for PostgreSQL Flexible Server**. Install `pgvector` extension if semantic similarity queries on long-term memory logs are required.
- Provision **Azure Cache for Redis** to act as the short-term memory system holding session checkpoints and browser queue state.
- Update connection strings in env variables:
  ```env
  DATABASE_URL=postgresql://user:pass@your-pg-server.postgres.database.azure.com:5432/campaignos
  REDIS_URL=rediss://:access-key@your-redis.redis.cache.windows.net:6380/0
  ```

### 2. Secrets Management (Azure Key Vault)
- Create an **Azure Key Vault** resource.
- Set the environment variable:
  ```env
  AZURE_KEYVAULT_URL=https://your-keyvault-name.vault.azure.net/
  ```
- The backend's `KeyVaultService` will automatically fetch parameters (Gemini keys, DevOps PAT, storage keys) from Key Vault secrets using `DefaultAzureCredential`.

### 3. Artifact Storage (Azure Blob Storage)
- Provision an **Azure Storage Account** and create a container named `campaign-artifacts`.
- Set container parameters:
  ```env
  AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=...
  AZURE_STORAGE_CONTAINER=campaign-artifacts
  ```
- Executions will automatically upload test videos, logs, and compiled PDF executive reports directly to Azure Blobs.

### 4. Compute Hosting (Azure Container Apps / App Services)
- Package the FastAPI application into a Docker container and push to **Azure Container Registry**.
- Deploy to **Azure Container Apps (ACA)**. Set scaling rules to scale up when Playwright queue counts increase.
- Serve the compiled Vite frontend (the `dist/` directory built using `npm run build`) through **Azure App Service** or **Azure Static Web Apps**.
