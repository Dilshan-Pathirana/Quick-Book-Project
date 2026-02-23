# Test deployment: Vercel (web) + Railway (Postgres + API)

## 1) Deploy Postgres on Railway

1. Create a new Railway project.
2. Add a **PostgreSQL** service.
3. Confirm it exposes a `DATABASE_URL` variable.

## 2) Deploy API on Railway

### Option A (recommended): Deploy from `api/` using Dockerfile

1. Add a new **Service** in the same Railway project.
2. Connect this GitHub repo.
3. Set **Root Directory** to `api`.
4. Railway should detect the `api/Dockerfile`.
5. Add Variables (Railway → Service → Variables):

- `DATABASE_URL` = from the Railway Postgres service
- `JWT_SECRET` = a strong random string
- `JWT_EXPIRES_IN` = `7d` (or your choice)
- `API_GLOBAL_PREFIX` = `api/v1`
- `PUBLIC_BASE_URL` = `https://<your-api-service>.up.railway.app`
- `VAT_RATE_PERCENT` = `0` (or your rate)

6. Deploy.

### Verify

- Open `https://<your-api-service>.up.railway.app/api/v1` (should return a hello string)

## 3) Deploy Frontend on Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `web`.
3. Set Environment Variables:

- `NEXT_PUBLIC_API_BASE_URL` = `https://<your-api-service>.up.railway.app/api/v1`

4. Deploy.

## Notes (test deployment)

- The API stores generated PDFs under `FILE_STORAGE_DIR` on the container filesystem. On Railway this may not be persistent across redeploys; for production you’d typically use object storage.
- CORS is currently enabled broadly (`app.enableCors()`), which is convenient for testing.
