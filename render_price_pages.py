from pathlib import Path
import fitz

pdf = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\NEW PRODUCTS CATALOG 01 March 2026.pdf")
out_dir = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\price-pages")
out_dir.mkdir(exist_ok=True)
for page_number in (69, 70, 80):
    with fitz.open(pdf) as doc:
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False)
        pix.save(out_dir / f"page-{page_number}.png")
        print(page_number)
