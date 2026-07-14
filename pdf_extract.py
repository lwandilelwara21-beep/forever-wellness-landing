from pathlib import Path

pdf = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\2 FLPSA Approved Product Training Presentation V2.1.pdf")
out = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\pdf-extract.txt")

try:
    from pypdf import PdfReader
except Exception:
    from PyPDF2 import PdfReader

reader = PdfReader(str(pdf))
parts = []
for index, page in enumerate(reader.pages, start=1):
    parts.append(f"\n--- PAGE {index} ---\n" + (page.extract_text() or ""))

out.write_text("\n".join(parts), encoding="utf-8")
print(out)
print(f"PAGES {len(reader.pages)}")
