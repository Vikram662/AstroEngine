import os
import hashlib
import hmac
import datetime
from typing import Optional, Tuple
import httpx
from app.core.config import settings, get_dynamic_setting

STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "storage"))
REPORTS_DIR = os.path.join(STORAGE_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

def get_report_relative_path(job_id: str, report_type: str = "kundli_basic") -> str:
    """
    Standardized hierarchical storage path:
    reports/{clean_report_type}/{YYYY}/{MM}/{job_id}.pdf
    """
    clean_type = (report_type or "kundli_basic").lower().replace(" ", "_")
    now = datetime.datetime.utcnow()
    year = now.strftime("%Y")
    month = now.strftime("%m")
    return f"reports/{clean_type}/{year}/{month}/{job_id}.pdf"

def save_local_pdf(job_id: str, pdf_bytes: bytes, report_type: str = "kundli_basic") -> Tuple[str, str]:
    """Save PDF file to local server storage with structured subfolders."""
    rel_path = get_report_relative_path(job_id, report_type)
    full_path = os.path.join(STORAGE_DIR, rel_path.replace("/", os.sep))
    os.makedirs(os.path.dirname(full_path), exist_ok=True)

    with open(full_path, "wb") as f:
        f.write(pdf_bytes)
    
    # Internal / local relative download endpoint
    local_url = f"/api/v1/pdf/download/{job_id}"
    return full_path, local_url

async def upload_to_r2_async(job_id: str, pdf_bytes: bytes, report_type: str = "kundli_basic") -> Optional[str]:
    """
    Direct asynchronous upload to Cloudflare R2 via S3-Compatible REST API with AWS SigV4.
    Uploads into organized folder: reports/{report_type}/{YYYY}/{MM}/{job_id}.pdf
    """
    account_id = get_dynamic_setting("R2_ACCOUNT_ID") or settings.R2_ACCOUNT_ID
    access_key = get_dynamic_setting("R2_ACCESS_KEY_ID") or settings.R2_ACCESS_KEY_ID
    secret_key = get_dynamic_setting("R2_SECRET_ACCESS_KEY") or settings.R2_SECRET_ACCESS_KEY
    bucket_name = get_dynamic_setting("R2_BUCKET_NAME") or settings.R2_BUCKET_NAME
    public_domain = get_dynamic_setting("R2_PUBLIC_DOMAIN") or settings.R2_PUBLIC_DOMAIN

    if not (account_id and access_key and secret_key and bucket_name):
        return None

    object_key = get_report_relative_path(job_id, report_type)
    host = f"{account_id}.r2.cloudflarestorage.com"
    endpoint_url = f"https://{host}/{bucket_name}/{object_key}"

    # SigV4 Signing logic for S3 PUT Object
    t = datetime.datetime.utcnow()
    amz_date = t.strftime('%Y%m%dT%H%M%SZ')
    date_stamp = t.strftime('%Y%m%d')
    region = "auto"
    service = "s3"

    payload_hash = hashlib.sha256(pdf_bytes).hexdigest()
    canonical_uri = f"/{bucket_name}/{object_key}"
    canonical_querystring = ""
    canonical_headers = f"content-type:application/pdf\nhost:{host}\nx-amz-content-sha256:{payload_hash}\nx-amz-date:{amz_date}\n"
    signed_headers = "content-type;host;x-amz-content-sha256;x-amz-date"
    canonical_request = f"PUT\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"

    algorithm = "AWS4-HMAC-SHA256"
    credential_scope = f"{date_stamp}/{region}/{service}/aws4_request"
    string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

    def sign(key, msg):
        return hmac.new(key, msg.encode('utf-8'), hashlib.sha256).digest()

    k_date = sign(('AWS4' + secret_key).encode('utf-8'), date_stamp)
    k_region = sign(k_date, region)
    k_service = sign(k_region, service)
    k_signing = sign(k_service, 'aws4_request')
    signature = hmac.new(k_signing, string_to_sign.encode('utf-8'), hashlib.sha256).hexdigest()

    auth_header = f"{algorithm} Credential={access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"

    headers = {
        "x-amz-date": amz_date,
        "x-amz-content-sha256": payload_hash,
        "Authorization": auth_header,
        "Content-Type": "application/pdf"
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.put(endpoint_url, headers=headers, content=pdf_bytes)
            if resp.status_code in (200, 201):
                if public_domain:
                    domain = public_domain.rstrip("/")
                    return f"{domain}/{object_key}"
                return endpoint_url
    except Exception:
        # Fallback to local if network/credentials fail
        pass

    return None

async def store_report_pdf(job_id: str, pdf_bytes: bytes, report_type: str = "kundli_basic") -> Tuple[str, str]:
    """
    Saves PDF locally in structured hierarchy and attempts cloud upload to R2 into the corresponding folder.
    Returns: (file_path, public_download_url)
    """
    file_path, local_url = save_local_pdf(job_id, pdf_bytes, report_type=report_type)
    r2_url = await upload_to_r2_async(job_id, pdf_bytes, report_type=report_type)
    download_url = r2_url if r2_url else local_url
    return file_path, download_url
