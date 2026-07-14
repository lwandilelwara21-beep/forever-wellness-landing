from pathlib import Path
from pypdf import PdfReader

pdf = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\NEW PRODUCTS CATALOG 01 March 2026.pdf")
out = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\price-list-extract.txt")
reader = PdfReader(str(pdf))
parts = []
for index, page in enumerate(reader.pages, start=1):
    parts.append(f"\n--- PAGE {index} ---\n" + (page.extract_text() or ""))
out.write_text("\n".join(parts), encoding="utf-8")
print(out)
print(f"PAGES {len(reader.pages)}")
