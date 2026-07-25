"""Generate the PDF documentation and real endpoint evidence.

Run while the API is available at http://127.0.0.1:8000.
"""

from __future__ import annotations

import html
import json
import textwrap
import urllib.error
import urllib.request
from pathlib import Path

import markdown
from PIL import Image, ImageDraw, ImageFont
from weasyprint import HTML

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "docs" / "assets"
BASE_URL = "http://127.0.0.1:8000"

CSS = """
@page { size: A4; margin: 16mm 14mm; }
body { color: #172033; font: 14px/1.5 Arial, sans-serif; margin: 0 auto; max-width: 1080px; }
h1, h2, h3 { color: #172b4d; page-break-after: avoid; }
h1 { border-bottom: 3px solid #3483fa; padding-bottom: 8px; }
h2 { border-bottom: 1px solid #ccd5e0; padding-bottom: 4px; }
table { border-collapse: collapse; font-size: 11px; width: 100%; }
th, td { border: 1px solid #aeb9c7; padding: 5px; text-align: left; vertical-align: top; }
th { background: #eaf2ff; }
pre { background: #111827; border-radius: 6px; color: #e5e7eb; font-size: 10px;
      overflow-wrap: anywhere; padding: 12px; white-space: pre-wrap; }
code { font-family: "DejaVu Sans Mono", monospace; }
blockquote { border-left: 4px solid #3483fa; margin-left: 0; padding-left: 12px; }
img { max-width: 100%; }
"""


def generate_pdf() -> None:
    documents = [
        ("README / Operación", ROOT / "README.md"),
        ("Modelo de amenazas", ROOT / "docs" / "THREAT_MODEL.md"),
        ("Despliegue cloud", ROOT / "docs" / "CLOUD_DEPLOYMENT.md"),
        ("Informe de seguridad", ROOT / "docs" / "SAST_REPORT.md"),
    ]
    sections = []
    for title, path in documents:
        rendered = markdown.markdown(
            path.read_text(encoding="utf-8"),
            extensions=["fenced_code", "tables", "sane_lists"],
        )
        sections.append(
            f"<section><div class='document-label'>{html.escape(title)}</div>{rendered}</section>"
        )

    body = (
        "<h1>Solución completa — Tor IP Aggregator y Threat Modelling</h1>"
        "<p>Documento generado desde las fuentes versionadas del repositorio.</p>"
        + "<div style='page-break-after:always'></div>".join(sections)
    )
    document = (
        f"<!doctype html><meta charset='utf-8'><style>{CSS}</style><body>{body}</body>"
    )
    HTML(string=document, base_url=str(ROOT)).write_pdf(
        ROOT / "docs" / "SOLUCION_COMPLETA.pdf"
    )


def request(
    method: str, path: str, key: str, payload: dict[str, str] | None = None
) -> tuple[int, dict[str, object]]:
    data = json.dumps(payload).encode() if payload else None
    headers = {"X-API-Key": key}
    if data:
        headers["Content-Type"] = "application/json"
    request_object = urllib.request.Request(
        BASE_URL + path, method=method, headers=headers, data=data
    )
    try:
        with urllib.request.urlopen(request_object, timeout=20) as response:
            content = response.read()
            return response.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as error:
        content = error.read()
        return error.code, json.loads(content) if content else {}


def summarized_response(response: dict[str, object]) -> str:
    shown = dict(response)
    ips = shown.get("ips")
    if isinstance(ips, list) and len(ips) > 10:
        shown["ips"] = [*ips[:10], f"… {len(ips) - 10} IPs adicionales"]
    return json.dumps(shown, indent=2, ensure_ascii=False)


def screenshot(
    name: str, title: str, command: str, status: int, response: dict[str, object]
) -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    image = Image.new("RGB", (1280, 900), "#eef2f7")
    draw = ImageDraw.Draw(image)
    title_font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 30
    )
    mono = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 16)
    bold = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf", 17
    )
    draw.rounded_rectangle(
        (35, 35, 1245, 865), radius=14, fill="white", outline="#ccd5e0"
    )
    draw.text((65, 65), title, font=title_font, fill="#172b4d")
    draw.rounded_rectangle((65, 125, 1215, 810), radius=10, fill="#0b1020")
    y = 150
    for line in textwrap.wrap(f"$ {command}", width=105, subsequent_indent="  "):
        draw.text((90, y), line, font=mono, fill="#93c5fd")
        y += 25
    y += 10
    draw.text((90, y), f"HTTP {status}", font=bold, fill="#6ee7b7")
    y += 34
    for line in summarized_response(response).splitlines():
        draw.text((90, y), line[:112], font=mono, fill="#e5e7eb")
        y += 22
        if y > 780:
            break
    draw.text(
        (65, 825),
        "Evidencia generada contra una instancia real de la aplicación.",
        font=mono,
        fill="#526174",
    )
    image.save(ASSETS / f"{name}.png", optimize=True)


def generate_evidence() -> None:
    status_all, all_ips = request("GET", "/v1/tor-ips", "reader-local-key")
    candidates = all_ips.get("ips", [])
    if status_all != 200 or not isinstance(candidates, list) or not candidates:
        raise RuntimeError("La API no devolvió una lista Tor utilizable")
    _, exclusions = request("GET", "/v1/exclusions", "admin-local-key")
    items = exclusions.get("items", [])
    if isinstance(items, list):
        for item in items:
            if isinstance(item, dict) and "ip" in item:
                request("DELETE", f"/v1/exclusions/{item['ip']}", "admin-local-key")
    excluded_ip = str(candidates[0])
    status_post, post = request(
        "POST",
        "/v1/exclusions",
        "admin-local-key",
        {"ip": excluded_ip, "reason": "evidencia del challenge"},
    )
    status_filtered, filtered = request(
        "GET", "/v1/tor-ips/filtered", "reader-local-key"
    )

    screenshot(
        "01-get-tor-ips",
        "GET — listado Tor unificado",
        "curl -H 'X-API-Key: reader-local-key' http://localhost:8000/v1/tor-ips",
        status_all,
        all_ips,
    )
    screenshot(
        "02-post-exclusion",
        "POST — agregar exclusión",
        "curl -X POST -H 'X-API-Key: admin-local-key' "
        f'-d \'{{"ip":"{excluded_ip}","reason":"evidencia del challenge"}}\' '
        "http://localhost:8000/v1/exclusions",
        status_post,
        post,
    )
    screenshot(
        "03-get-filtered",
        "GET — listado Tor filtrado",
        "curl -H 'X-API-Key: reader-local-key' "
        "http://localhost:8000/v1/tor-ips/filtered",
        status_filtered,
        filtered,
    )


if __name__ == "__main__":
    generate_pdf()
    generate_evidence()
    print("PDF y evidencias generados correctamente")
