from pathlib import Path
import fitz
pdf = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\NEW PRODUCTS CATALOG 01 March 2026.pdf")
out = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\price-pages\page-1.png")
with fitz.open(pdf) as doc:
    page = doc[0]
    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
    pix.save(out)
print(out)
