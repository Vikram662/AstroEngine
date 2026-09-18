# AstroEngine — Complete Deployment & Installation Guide (Windows & Linux)

Yeh guide kisi bhi naye system (Windows Local / Windows Server / Ubuntu Linux / Cloud VPS / Render / Railway) par **AstroEngine** ko shuru se setup karne ke liye complete step-by-step documentation hai.

---

## 1. System Prerequisites (Zaroori Software)

### A. Windows System par
1. **Python 3.11+**: [python.org](https://www.python.org/downloads/) se download karein (Ensure: *"Add Python to PATH"* checkbox tick ho).
2. **Git**: [git-scm.com](https://git-scm.com/)
3. **C++ Build Tools (Optional but recommended)**: Swiss Ephemeris (`pyswisseph`) ke pre-compiled wheels Windows par direct `pip install` se chal jate hain.

### B. Linux (Ubuntu / Debian / VPS / Render) par
Linux par Swiss Ephemeris C-bindings aur system libraries ke liye ye packages install karein:
```bash
sudo apt update && sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    python3-dev \
    libffi-dev \
    libpango-1.0-0 \
    libpangoft2-1.0-0 \
    libharfbuzz0b \
    libpango1.0-dev \
    fonts-noto-core \
    fonts-noto-cjk \
    curl \
    git
```

---

## 2. Step-by-Step Backend Installation

### Step 2.1: Terminal me Backend Folder ke andar jayein
> [!IMPORTANT]
> Saara Python backend code `backend` folder ke andar hai. Isliye terminal mein pehle `backend` folder ke andar jayein:

* **Windows (PowerShell):**
  ```powershell
  cd c:\xampp\htdocs\project\backend
  ```

* **Linux / MacOS (Bash):**
  ```bash
  cd /var/www/project/backend
  ```

### Step 2.2: Python Virtual Environment (venv) Banayein aur Activate Karein

* **Windows (PowerShell):**
  ```powershell
  # backend folder ke andar reh kar:
  python -m venv venv
  .\venv\Scripts\Activate.ps1
  ```
  *(Agar script execution error aaye toh yeh command chalayein: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`)*

* **Linux / MacOS (Bash):**
  ```bash
  python3 -m venv venv
  source venv/bin/activate
  ```

### Step 2.3: Dependencies Install Karein
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

---

## 3. Swiss Ephemeris Data Files Setup (`ephe/`)

AstroEngine ko accurate planets degree aur ayanamsa ke liye Swiss Ephemeris `.se1` files ki zaroorat hoti hai.

1. Backend root mein folder banayein: `backend/ephe`
2. Official Swiss Ephemeris site se 1800–2100 CE files download karke `backend/ephe/` mein rakhein:
   - URL: `https://www.astro.com/ftp/swisseph/ephe/`
   - Files: `seas_18.se1`, `semo_18.se1`, `sepl_18.se1` (~25 MB total).
3. *(Agar files na bhi hon, toh `pyswisseph` Moshier analytical engine se auto-calculate kar leta hai, lekin production grade accuracy ke liye `.se1` files recommended hain).*

---

## 4. Cloud Services Setup (.env Configuration)

Backend folder ke andar `.env` file banayein:

```env
PORT=8000
ENVIRONMENT=production

# Next.js aur FastAPI ke beech internal handshake secret
INTERNAL_SECRET_KEY=c9f82d1a6e3b5c7f8a9e0d1b2
INTERNAL_SECRET_KEY_PREVIOUS=

EPHE_PATH=./ephe

# Upstash Redis (Rate limiting aur calculation caching ke liye)
REDIS_HOST=your-redis.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your_upstash_redis_password

# Cloudflare R2 Bucket (PDF Storage ke liye)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key_id
R2_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET_NAME=astro-pdf-reports
R2_PUBLIC_DOMAIN=https://cdn.yourdomain.com

# MySQL Database (Local XAMPP ya Railway/PlanetScale/Aiven)
DATABASE_URL=mysql://root:@localhost:3306/astro_saas

# Error Monitoring (Optional)
SENTRY_DSN=
```

---

## 5. Cloudflare R2 (Object Storage) Step-by-Step Setup

PDF reports ko store karne aur 24 ghante baad auto-expire karne ke liye Cloudflare R2 use hota hai (10 GB permanent free tier, 0 egress fee):

1. **Cloudflare Account banayein**: [cloudflare.com](https://dash.cloudflare.com/) par login karein.
2. Left sidebar mein **R2 Object Storage** par click karein.
3. **Create Bucket** par click karein:
   - Bucket Name: `astro-pdf-reports`
   - Location: Automatic ya Asia Pacific.
4. **API Token Generate Karein**:
   - R2 Dashboard mein right side par **Manage R2 API Tokens** par click karein.
   - **Create API Token** click karein.
   - Permissions: **Object Read & Write** select karein.
   - Token banne ke baad aapko 3 cheezein milengi:
     - `Account ID`
     - `Access Key ID`
     - `Secret Access Key`
   - Inhe apni `.env` file mein daalein.
5. **24-Hour Auto-Delete Lifecycle Rule Lagayein (Zaroori)**:
   - Bucket par click karein -> **Settings** tab -> **Lifecycle Rules** par jayein.
   - Rule Name: `auto-delete-24h`
   - Prefix: `reports/`
   - Action: **Delete objects after 1 day (24 hours)** select karein.
   - Isse bucket storage kabhi 10 GB limit cross nahi karega aur free tier mein hamesha rahega!

---

## 6. Upstash Redis Setup (Zero-Cost Free Tier)

1. [console.upstash.com](https://console.upstash.com/) par free account banayein.
2. **Create Database** par click karein.
3. Name: `astro-cache`, Type: Serverless Redis, Primary Region: AWS ap-south-1 (Mumbai) ya closest region.
4. Details page se:
   - Endpoint (`REDIS_HOST`)
   - Port (`REDIS_PORT` - 6379)
   - Password (`REDIS_PASSWORD`) copy karke `.env` mein daalein.

---

## 7. Server Run & Verification

### Test Suite Run Karein:
```bash
# Windows
$env:PYTHONPATH="."; .\venv\Scripts\pytest.exe tests/

# Linux
PYTHONPATH=. pytest tests/
```
Output: **`37 passed in 0.38s (100%)`** aana chahiye.

### Development Server Start Karein:
```bash
# Windows
.\venv\Scripts\uvicorn.exe app.main:app --reload --port 8000

# Linux
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Ab browser mein open karein:
- **Swagger Interactive API Docs**: `http://localhost:8000/docs`
- **ReDoc Interactive Docs**: `http://localhost:8000/redoc`
- **Health Check Probe**: `http://localhost:8000/health`

### Linux Production Systemd Service (VPS ke liye):
Agar aap Ubuntu VPS par background service chalana chahte hain:
File banayein: `/etc/systemd/system/astroengine.service`
```ini
[Unit]
Description=AstroEngine FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/var/www/project/backend
ExecStart=/var/www/project/backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```
Commands:
```bash
sudo systemctl daemon-reload
sudo systemctl enable astroengine
sudo systemctl start astroengine
sudo systemctl status astroengine
```

---

## 8. Summary Checklist Naye System Ke Liye

| Step | Action | Windows Command | Linux Command |
| :--- | :--- | :--- | :--- |
| 1 | Python Environment | `python -m venv venv` | `python3 -m venv venv` |
| 2 | Activate Environment | `.\venv\Scripts\Activate.ps1` | `source venv/bin/activate` |
| 3 | Install Packages | `pip install -r requirements.txt` | `pip install -r requirements.txt` |
| 4 | Test All Calculations | `pytest tests/` | `PYTHONPATH=. pytest tests/` |
| 5 | Run API Engine | `uvicorn app.main:app --port 8000` | `uvicorn app.main:app --host 0.0.0.0 --port 8000` |
