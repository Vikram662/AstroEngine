"""End-to-end check against REAL servers and a REAL (throw-away) MariaDB: sign-up, login, password reset,
2FA, API-key metering + refunds, reports billed to the customer, invoices, notifications, GSTR-1.
Run it through scripts/e2e.ps1 (it creates and removes the temporary database and servers)."""
import base64, hashlib, hmac, http.cookiejar, json, re, struct, subprocess, sys, time, urllib.error, urllib.request

import datetime, os

FE = os.environ.get("E2E_FE", "http://127.0.0.1:3010")
BE = os.environ.get("E2E_BE", "http://127.0.0.1:8010")
MYSQL = [
    os.environ.get("E2E_MYSQL_BIN", "C:/xampp/mysql/bin/mysql.exe"),
    "--host=127.0.0.1", "--port=" + os.environ.get("E2E_MYSQL_PORT", "3399"), "--user=root",
    "--password=" + os.environ.get("E2E_MYSQL_PASS", "verifypw"), "-N", "-B", os.environ.get("E2E_DB", "astro_verify"),
]
ADMIN = ("admin@astroengine.io", os.environ["E2E_ADMIN_PW"])
DEV = ("developer@astroengine.io", os.environ["E2E_DEV_PW"])
DEV_KEY = os.environ["E2E_DEV_KEY"]
SECRET = os.environ.get("E2E_INTERNAL_SECRET", "smoke-secret")
# the month before this one (YYYY-MM) and a date inside it
_first = datetime.date.today().replace(day=1)
_prev = _first - datetime.timedelta(days=1)
PREV_MONTH = _prev.strftime("%Y-%m")
PREV_DAY = _prev.replace(day=15).strftime("%Y-%m-%d 10:00:00")
results = []


def sql(q):
    out = subprocess.run(MYSQL + ["-e", q], capture_output=True, text=True)
    if out.returncode:
        raise RuntimeError(out.stderr)
    return [l.split("\t") for l in out.stdout.strip().splitlines() if l]


def check(name, ok, detail=""):
    results.append(ok)
    print(("PASS " if ok else "FAIL ") + name + (f"   [{detail}]" if detail and not ok else ""))


class Client:
    """Cookie handling by hand: the session cookie is `Secure` in production, which a plain-http
    cookie jar (correctly) refuses to send back to http://127.0.0.1."""
    def __init__(self):
        self.cookies = {}

    def req(self, method, url, body=None, headers=None, raw=False):
        h = {"Content-Type": "application/json", "X-Forwarded-For": "10.50.0.%d" % (hash((url, time.time())) % 250 + 1)}
        if self.cookies:
            h["Cookie"] = "; ".join(f"{k}={v}" for k, v in self.cookies.items())
        h.update(headers or {})
        data = json.dumps(body).encode() if body is not None else None
        r = urllib.request.Request(url, data=data, headers=h, method=method)
        try:
            resp = urllib.request.urlopen(r, timeout=60)
            code, text, hdrs, msg = resp.status, resp.read(), dict(resp.headers), resp.headers
        except urllib.error.HTTPError as e:
            code, text, hdrs, msg = e.code, e.read(), dict(e.headers), e.headers
        for sc in msg.get_all("Set-Cookie") or []:
            name, _, rest = sc.partition("=")
            val = rest.split(";")[0]
            if val == "" or "Max-Age=0" in sc:
                self.cookies.pop(name, None)
            else:
                self.cookies[name] = val
        if raw:
            return code, text, hdrs
        try:
            return code, json.loads(text or b"{}"), hdrs
        except Exception:
            return code, text.decode("utf-8", "replace"), hdrs


def totp(secret, t=None):
    key = base64.b32decode(secret + "=" * (-len(secret) % 8))
    step = int((t or time.time()) // 30)
    h = hmac.new(key, struct.pack(">Q", step), hashlib.sha1).digest()
    o = h[-1] & 15
    return "%06d" % ((struct.unpack(">I", h[o:o + 4])[0] & 0x7fffffff) % 1000000), step


def otp_from_log(logfile, email):
    txt = open(logfile, encoding="utf-8", errors="replace").read()
    blocks = [b for b in txt.split("[DISPATCH EMAIL (DEV / LOCAL LOG)]") if f"To: {email}" in b]
    return blocks[-1] if blocks else ""


LOG = sys.argv[1]
for t in ("Notification", "Invoice", "InvoiceCounter", "PdfGenerationJob", "ApiRequestLog", "Transaction"):
    sql(f"DELETE FROM {t}")
sql("UPDATE User SET walletBalance=100, monthlyUsage=0, planTier='STARTER', notificationPrefs=NULL, totpEnabled=0, totpSecret=NULL WHERE email='developer@astroengine.io'")
# Add-ons used by section 4b, created before the first metered call (the app caches the add-on list).
sql("INSERT INTO AddonPackage (id, name, category, priceMonthly, monthlyQuota, rateLimitPerMin, overageCost, description, features, icon, isActive, updatedAt) VALUES "
    "('kp', 'KP Astrology', 'CALCULATIONS', 0, 5, 60, 0.05, 'e2e', '[]', 'Star', 1, NOW()), "
    "('dosha_matching', 'Matchmaking & Dosha Engine', 'CALCULATIONS', 0, 1000, 60, 0.05, 'e2e', '[]', 'Heart', 1, NOW()) "
    "ON DUPLICATE KEY UPDATE monthlyQuota=VALUES(monthlyQuota), overageCost=VALUES(overageCost), isActive=1, updatedAt=NOW()")

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 1. sign-up with e-mail OTP, login, session")
c = Client()
email = "newuser%d@example.com" % int(time.time())
code, body, _ = c.req("POST", FE + "/api/auth/otp", {"email": email})
check("OTP request accepted", code == 200, f"{code} {body}")
time.sleep(1)
mail = otp_from_log(LOG, email)
m = re.search(r"\b(\d{6})\b", mail.split("Content:")[-1]) if mail else None
check("OTP e-mail was produced (dev log)", bool(m))
otp = m.group(1) if m else "000000"
rows = sql(f"SELECT otp, attempts FROM EmailOtp WHERE email='{email}'")
check("OTP stored hashed, attempts=0", bool(rows) and rows[0][0] != otp and len(rows[0][0]) == 64 and rows[0][1] == "0", str(rows))
code, body, _ = c.req("POST", FE + "/api/auth/session", {"email": email, "password": "short", "action": "register", "otp": otp})
check("weak password rejected", code == 400, f"{code} {body}")
code, body, _ = c.req("POST", FE + "/api/auth/session", {"email": email, "password": "Str0ng-Passw0rd!", "action": "register", "otp": "111111"})
check("wrong OTP rejected + counted", code == 400 and sql(f"SELECT attempts FROM EmailOtp WHERE email='{email}'")[0][0] == "1", f"{code}")
code, body, _ = c.req("POST", FE + "/api/auth/session", {"email": email, "password": "Str0ng-Passw0rd!", "action": "register", "otp": otp})
check("register with the right OTP", code == 200, f"{code} {body}")
code, me, _ = c.req("GET", FE + "/api/user/me")
check("session works (/api/user/me)", code == 200 and me.get("data", {}).get("email") == email, f"{code}")
bad = [k for k in me.get("data", {}) if k in ("password", "apiKeyHash", "apiKeyTestHash", "accountWebhookSecret", "totpSecret", "totpLastStep", "passwordChangedAt")]
check("no password hash / key hashes / TOTP secret in /me", not bad, str(bad))
check("OTP row burned after use", sql(f"SELECT COUNT(*) FROM EmailOtp WHERE email='{email}'")[0][0] == "0")

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 2. forgot password + session revocation")
old = Client()
old.req("POST", FE + "/api/auth/session", {"email": email, "password": "Str0ng-Passw0rd!", "action": "login"})
code, _, _ = old.req("GET", FE + "/api/user/me")
check("old session valid before reset", code == 200)
time.sleep(1.2)
r = Client()
code, body, _ = r.req("POST", FE + "/api/auth/reset", {"email": email})
check("reset request generic 200", code == 200, f"{code} {body}")
code2, body2, _ = r.req("POST", FE + "/api/auth/reset", {"email": "nobody-%d@example.com" % time.time()})
check("unknown email gives the same answer", code2 == 200 and body2 == body)
time.sleep(1)
mail = otp_from_log(LOG, email)
rc = re.findall(r"\b(\d{6})\b", mail.split("Content:")[-1])
rcode = rc[0] if rc else "000000"
check("reset e-mail produced", bool(rc))
code, body, _ = r.req("PUT", FE + "/api/auth/reset", {"email": email, "otp": rcode, "newPassword": "An0ther-Passw0rd!"})
check("password reset", code == 200, f"{code} {body}")
code, _, _ = old.req("GET", FE + "/api/user/me")
check("OLD session is revoked by the password change", code == 401, str(code))
c2 = Client()
code, _, _ = c2.req("POST", FE + "/api/auth/session", {"email": email, "password": "Str0ng-Passw0rd!", "action": "login"})
check("old password no longer works", code == 401)
code, _, _ = c2.req("POST", FE + "/api/auth/session", {"email": email, "password": "An0ther-Passw0rd!", "action": "login"})
check("new password works", code == 200)
sec_mails = open(LOG, encoding="utf-8", errors="replace").read()
check("'password changed' security e-mail queued (always on)", int(sql(f"SELECT COUNT(*) FROM Notification n JOIN User u ON u.id=n.userId WHERE u.email='{email}' AND n.event='PASSWORD_CHANGED'")[0][0]) >= 1)

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 3. two-factor authentication")
code, st, _ = c2.req("POST", FE + "/api/user/2fa", {"action": "setup"})
check("2FA setup returns a secret", code == 200 and "secret" in st, str(st))
secret = st.get("secret", "")
code, _, _ = c2.req("POST", FE + "/api/user/2fa", {"action": "enable", "code": "000000"})
check("wrong code can't enable 2FA", code == 400)
tc, step = totp(secret)
code, _, _ = c2.req("POST", FE + "/api/user/2fa", {"action": "enable", "code": tc})
check("2FA enabled with a valid code", code == 200)
c3 = Client()
code, body, _ = c3.req("POST", FE + "/api/auth/session", {"email": email, "password": "An0ther-Passw0rd!", "action": "login"})
check("login now asks for the code", code == 401 and body.get("status") == "totp_required", f"{code} {body}")
code, _, _ = c3.req("POST", FE + "/api/auth/session", {"email": email, "password": "An0ther-Passw0rd!", "action": "login", "totp": "123456"})
check("wrong code refused", code == 401)
# the code used to ENABLE 2FA (this step) must not be accepted again; use the next step
tc2, step2 = totp(secret, time.time() + 30)
code, body, _ = c3.req("POST", FE + "/api/auth/session", {"email": email, "password": "An0ther-Passw0rd!", "action": "login", "totp": tc2})
check("login succeeds with a fresh code", code == 200, f"{code} {body}")
c4 = Client()
code, _, _ = c4.req("POST", FE + "/api/auth/session", {"email": email, "password": "An0ther-Passw0rd!", "action": "login", "totp": tc2})
check("the same code cannot be replayed", code == 401, str(code))
check("totp secret stored, 2FA flag set", sql(f"SELECT totpEnabled FROM User WHERE email='{email}'")[0][0] == "1")

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 4. API-key calls: metering, headers, refund on failure")
before = sql("SELECT monthlyUsage, walletBalance FROM User WHERE email='developer@astroengine.io'")[0]
api = Client()
code, body, h = api.req("POST", BE + "/api/v1/core/planets/positions", {"dob": "1995-10-05", "tob": "14:30", "lat": 24.58, "lon": 73.71, "tz": 5.5}, {"x-api-key": DEV_KEY})
hl = {k.lower(): v for k, v in h.items()}
check("valid call -> 200", code == 200, f"{code}")
check("usage +1", int(sql("SELECT monthlyUsage FROM User WHERE email='developer@astroengine.io'")[0][0]) == int(before[0]) + 1)
check("x-quota-remaining header present", "x-quota-remaining" in hl, str(list(hl)))
check("remaining_quota in body is a number", isinstance(body.get("quota", {}).get("remaining_quota"), int), str(body.get("quota")))
time.sleep(1.5)
lat = sql("SELECT responseTime, statusCode FROM ApiRequestLog ORDER BY id DESC LIMIT 1")[0]
check("real latency recorded (not the placeholder)", lat[1] == "200" and lat[0] not in ("10", "12"), str(lat))
u1 = int(sql("SELECT monthlyUsage FROM User WHERE email='developer@astroengine.io'")[0][0])
code, body, _ = api.req("POST", BE + "/api/v1/core/planets/positions", {"dob": "garbage"}, {"x-api-key": DEV_KEY})
time.sleep(1.5)
u2 = int(sql("SELECT monthlyUsage FROM User WHERE email='developer@astroengine.io'")[0][0])
last = sql("SELECT statusCode FROM ApiRequestLog ORDER BY id DESC LIMIT 1")[0][0]
check("invalid request is refunded (usage back, log status = error)", code == 422 and u2 == u1 and last == "422", f"code={code} u1={u1} u2={u2} last={last}")
code, body, _ = api.req("POST", BE + "/api/v1/core/planets/positions", {"dob": "1995-10-05", "tob": "14:30", "lat": 24.58, "lon": 73.71}, {"x-api-key": "ak_live_" + "0" * 48})
check("unknown key -> 401", code == 401, f"{code}")
code, _, _ = api.req("POST", BE + "/api/v1/core/planets/positions", {}, {})
check("no key -> 401", code == 401)

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 4b. add-on metering under concurrency (real row locks), module ids, tarot/vastu auth")
from concurrent.futures import ThreadPoolExecutor
DEV_WHERE = "WHERE email='developer@astroengine.io'"
saved_addons = sql(f"SELECT COALESCE(activeAddons, 'null'), COALESCE(addonUsage, 'null') FROM User {DEV_WHERE}")[0]
sql(f"UPDATE User SET activeAddons='[\"kp\"]', addonUsage='{{\"pdf\": 2}}', walletBalance=100 {DEV_WHERE}")
birth = {"dob": "1995-10-05", "tob": "14:30", "lat": 24.58, "lon": 73.71, "tz": 5.5}
wk0 = float(sql(f"SELECT walletBalance FROM User {DEV_WHERE}")[0][0])
with ThreadPoolExecutor(20) as pool:
    codes = list(pool.map(lambda _: Client().req("POST", BE + "/api/v1/kp/planets", birth, {"x-api-key": DEV_KEY})[0], range(20)))
check("20 parallel KP add-on calls all succeed", codes.count(200) == 20, str(codes))
kp_usage = json.loads(sql(f"SELECT addonUsage FROM User {DEV_WHERE}")[0][0])
check("add-on counter exact under concurrency (20) and other counters kept", kp_usage.get("kp") == 20 and kp_usage.get("pdf") == 2, str(kp_usage))
wk1 = float(sql(f"SELECT walletBalance FROM User {DEV_WHERE}")[0][0])
check("only the 15 calls beyond the 5 included were charged (Rs 0.75)", abs((wk0 - wk1) - 0.75) < 0.0001, f"{wk0} -> {wk1}")
sql(f"UPDATE User SET activeAddons='[\"dosha_matching\"]' {DEV_WHERE}")
code, _, _ = api.req("POST", BE + "/api/v1/dosha-matching/manglik", birth, {"x-api-key": DEV_KEY})
check("dosha_matching add-on unlocks /dosha-matching/* (dash vs underscore ids)", code == 200, str(code))
sql(f"UPDATE User SET activeAddons='[]' {DEV_WHERE}")
code, _, _ = api.req("POST", BE + "/api/v1/tarot/daily-card", {}, {})
code_v, _, _ = api.req("GET", BE + "/api/v1/vastu/zones-guide", None, {})
check("tarot and vastu need an API key", code == 401 and code_v == 401, f"{code} {code_v}")
code, body, _ = api.req("POST", BE + "/api/v1/tarot/daily-card", {}, {"x-api-key": DEV_KEY})
check("tarot is plan-gated like other modules (STARTER -> 403)", code == 403 and body.get("detail", {}).get("error_code") == "PLAN_UPGRADE_OR_ADDON_REQUIRED", f"{code} {body}")
restore = lambda v: "NULL" if v == "null" else "'" + v.replace("'", "''") + "'"
sql(f"UPDATE User SET activeAddons={restore(saved_addons[0])}, addonUsage={restore(saved_addons[1])}, walletBalance=100 {DEV_WHERE}")

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 5. reports are billed to the customer (API + dashboard), free polling, refunds")
w0 = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
code, body, _ = api.req("POST", BE + "/api/v1/pdf/kundli/basic", {"dob": "1995-10-05", "tob": "14:30", "lat": 24.58, "lon": 73.71, "tz": 5.5, "lang": "en"}, {"x-api-key": DEV_KEY})
check("report accepted (202)", code == 202, f"{code} {body}")
w1 = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
check("customer wallet charged Rs 5 for a basic report", abs((w0 - w1) - 5.0) < 0.001, f"{w0} -> {w1}")
jid = (body.get("job_id") if isinstance(body, dict) else None)
time.sleep(4)
w2a = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
code, st, _ = api.req("GET", BE + f"/api/v1/pdf/status/{jid}", None, {"x-api-key": DEV_KEY})
w2 = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
check("status poll works and is FREE", code == 200 and abs(w2 - w1) < 0.001, f"{code} {w1}->{w2}")
check("job completed", st.get("data", {}).get("status") == "COMPLETED", str(st)[:200])
check("server file path not leaked", "file_path" not in json.dumps(st) and "owner_key_hash" not in json.dumps(st))
other = "ak_live_" + "1" * 48
code, _, _ = api.req("GET", BE + f"/api/v1/pdf/status/{jid}", None, {"x-api-key": other})
check("another key cannot read the job", code in (401, 404), str(code))
code, raw, hh = api.req("GET", BE + f"/api/v1/pdf/download/{jid}", None, {"x-api-key": DEV_KEY}, raw=True)
check("owner can download a real PDF", code == 200 and raw[:4] == b"%PDF", f"{code} {raw[:8]}")

# dashboard flow: sign in as the developer
dash = Client()
code, _, _ = dash.req("POST", FE + "/api/auth/session", {"email": DEV[0], "password": DEV[1], "action": "login"})
check("developer login", code == 200)
w3 = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
code, body, _ = dash.req("POST", FE + "/api/pdf/queue", {"reportType": "numerology", "birthData": {"dob": "1990-01-02", "tob": "10:00", "lat": 19.07, "lon": 72.87, "tz": 5.5}, "lang": "en"})
w4 = float(sql("SELECT walletBalance FROM User WHERE email='developer@astroengine.io'")[0][0])
check("dashboard report accepted", code == 200, f"{code} {body}")
check("dashboard report charged to the CUSTOMER (Rs 5 numerology)", abs((w3 - w4) - 5.0) < 0.001, f"{w3} -> {w4}")
adm_w = sql("SELECT walletBalance FROM User WHERE email='admin@astroengine.io'")[0][0]
check("admin wallet untouched", float(adm_w) == 999999.0, adm_w)
code, jobs, _ = dash.req("GET", FE + "/api/pdf/queue")
check("job listed for the customer", code == 200 and len(jobs.get("jobs", [])) >= 1, f"{code}")
code, body, _ = dash.req("POST", FE + "/api/pdf/queue", {"reportType": "kundli_basic", "birthData": {"dob": "bad"}})
check("bad birth data rejected before charging", code == 400)

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 6. wallet purchase -> consecutive GST invoice, receipt vs invoice")
sql("UPDATE User SET walletBalance=20000 WHERE email='developer@astroengine.io'")
code, body, _ = dash.req("POST", FE + "/api/billing/subscribe", {"planTier": "PRO", "paymentMethod": "WALLET"})
check("plan bought from wallet", code == 200, f"{code} {body}")
inv = sql("SELECT number, seq, gross, taxable, igst, cgst, sgst, type FROM Invoice ORDER BY seq")
check("invoice number allocated, consecutive from 000001", bool(inv) and inv[0][0].endswith("/000001") and inv[0][0].startswith("AE/"), str(inv))
check("GST maths adds up", bool(inv) and abs(float(inv[0][3]) + float(inv[0][4]) + float(inv[0][5]) + float(inv[0][6]) - float(inv[0][2])) < 0.011, str(inv))
txid = sql("SELECT id FROM Transaction WHERE paymentGateway='WALLET' ORDER BY createdAt DESC LIMIT 1")[0][0]
c_, html1, hd = dash.req("GET", FE + f"/api/billing/invoice/{txid}", raw=True)
html1 = html1.decode()
check("invoice page renders with the number", c_ == 200 and inv[0][0] in html1)
c_, html2, _ = dash.req("GET", FE + f"/api/billing/invoice/{txid}", raw=True)
check("viewing again shows the SAME number (issued once)", inv[0][0] in html2.decode() and sql("SELECT COUNT(*) FROM Invoice")[0][0] == "1")
check("invoice response is locked down (CSP nonce, no-store)", "script-src 'nonce-" in {k.lower(): v for k, v in hd.items()}.get("content-security-policy", "") and "no-store" in {k.lower(): v for k, v in hd.items()}.get("cache-control", ""))
check("invoice e-mail queued with the invoice", int(sql("SELECT COUNT(*) FROM Notification WHERE event='INVOICE_ISSUED'")[0][0]) >= 1)
check("payment e-mail queued", int(sql("SELECT COUNT(*) FROM Notification WHERE event='PAYMENT_RECEIVED'")[0][0]) >= 1)

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 7. notification preferences gate the queue; worker delivers; test button")
before_n = int(sql("SELECT COUNT(*) FROM Notification WHERE event='PAYMENT_RECEIVED'")[0][0])
code, _, _ = dash.req("PATCH", FE + "/api/user/me", {"notificationPrefs": {"emailPayments": False, "evil": True}})
check("prefs saved (junk keys dropped)", code == 200)
prefs = sql("SELECT notificationPrefs FROM User WHERE email='developer@astroengine.io'")[0][0]
check("only known switches stored", "evil" not in prefs and '"emailPayments":false' in prefs.replace(" ", ""), prefs)
sql("UPDATE User SET planTier='STARTER', walletBalance=20000 WHERE email='developer@astroengine.io'")
code, body, _ = dash.req("POST", FE + "/api/billing/subscribe", {"planTier": "PRO", "paymentMethod": "WALLET"})
after_n = int(sql("SELECT COUNT(*) FROM Notification WHERE event='PAYMENT_RECEIVED'")[0][0])
check("with 'payment received' OFF no payment e-mail is queued", after_n == before_n, f"{before_n}->{after_n} (subscribe {code})")
check("...but the tax invoice e-mail still is (its switch is on)", int(sql("SELECT COUNT(*) FROM Notification WHERE event='INVOICE_ISSUED'")[0][0]) >= 2)
code, body, _ = dash.req("POST", FE + "/api/user/notifications/test")
check("Send Test goes through the queue even with switches off", code == 200 and body.get("queued") == 1, f"{code} {body}")
code, body, _ = Client().req("POST", FE + "/api/internal/notifications/process", None, {"x-internal-secret": SECRET})
check("worker endpoint runs", code == 200, f"{code} {body}")
st = sql("SELECT status, COUNT(*) FROM Notification GROUP BY status")
check("queue drained (SENT, nothing stuck PENDING)", not any(s[0] == "PENDING" for s in st), str(st))
check("security alerts for 2FA queued", int(sql("SELECT COUNT(*) FROM Notification n JOIN User u ON u.id=n.userId WHERE n.event='TWO_FA_CHANGED' AND u.email LIKE 'newuser%'")[0][0]) >= 1)

# ────────────────────────────────────────────────────────────────────────────────────────────
print("== 8. month-end usage invoice + GSTR-1 + access control")
sql("UPDATE ApiRequestLog SET createdAt='" + PREV_DAY + "' WHERE creditsCost>0")
code, body, _ = Client().req("POST", FE + "/api/internal/invoices/monthly", {"month": PREV_MONTH}, {"x-internal-secret": SECRET})
check("monthly run", code == 200, f"{code} {body}")
usage = sql("SELECT number, gross, quantity, periodStart FROM Invoice WHERE type='USAGE'")
check("one consolidated usage invoice for the month", len(usage) == 1, str(usage))
code, body2, _ = Client().req("POST", FE + "/api/internal/invoices/monthly", {"month": PREV_MONTH}, {"x-internal-secret": SECRET})
check("running it again creates nothing new", sql("SELECT COUNT(*) FROM Invoice WHERE type='USAGE'")[0][0] == "1" and body2.get("usageInvoices", {}).get("issued") == 0, str(body2))
seqs = [int(r[0]) for r in sql("SELECT seq FROM Invoice ORDER BY seq")]
check("invoice numbers are gap-free", seqs == list(range(1, len(seqs) + 1)), str(seqs))
uid = sql("SELECT id FROM Invoice WHERE type='USAGE'")[0][0]
c_, html3, _ = dash.req("GET", FE + f"/api/billing/invoice/{uid}", raw=True)
check("usage invoice renders", c_ == 200 and b"Platform usage charges" in html3)
code, _, _ = Client().req("GET", FE + f"/api/billing/invoice/{uid}")
check("usage invoice needs a login", code == 401)
adm = Client()
code, _, _ = adm.req("POST", FE + "/api/auth/session", {"email": ADMIN[0], "password": ADMIN[1], "action": "login"})
check("admin login", code == 200)
code, csv, hh = adm.req("GET", FE + "/api/admin/reports?export=gstr1_returns", raw=True)
csvt = csv.decode()
check("GSTR-1 export (admin)", code == 200 and "AE/" in csvt and "TOTAL" in csvt, f"{code}")
code, _, _ = dash.req("GET", FE + "/api/admin/reports?export=gstr1_returns")
check("a normal customer cannot export GSTR-1", code == 403)
code, stats, _ = adm.req("GET", FE + "/api/admin/stats")
check("admin stats works with the real DB", code == 200 and "revenueBreakdown" in stats.get("data", {}), f"{code} {str(stats)[:150]}")
code, _, _ = adm.req("GET", FE + "/admin")
print()
print(f"{sum(results)}/{len(results)} checks passed")
sys.exit(0 if all(results) else 1)
