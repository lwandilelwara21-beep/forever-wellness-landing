from pathlib import Path
import fitz

PDF_PATH = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\2 FLPSA Approved Product Training Presentation V2.1.pdf")
OUTPUT_DIR = Path(r"c:\Users\Lwandile\Desktop\Forever living-landing page\product-images")
OUTPUT_DIR.mkdir(exist_ok=True)

PRODUCT_PAGES = {
    "forever-freedom": 15,
    "aloe-blossom-herbal-tea": 9,
    "forever-aloe-vera-gel": 10,
    "forever-aloe-berry-nectar": 13,
    "forever-aloe-peaches": 14,
    "forever-aloe-vera-gel-tri-pack": 18,
    "forever-aloe-drinks-variety-tri-pack": 19,
    "forever-aloe-berry-nectar-tri-pack": 20,
    "aloe-propolis-creme": 25,
    "forever-nature-min": 27,
    "forever-absorbent-c": 28,
    "forever-garlic-thyme": 29,
    "forever-fields-of-green": 30,
    "forever-lycium-plus": 31,
    "forever-multi-maca": 34,
    "forever-active-ha": 35,
    "forever-kids-multivitamin": 37,
    "forever-immublend": 38,
    "vitolize-for-men": 39,
    "vitolize-for-women": 40,
    "forever-arctic-sea": 41,
    "forever-argi-plus": 43,
    "forever-active-pro-b": 46,
    "forever-marine-collagen": 47,
    "forever-focus": 48,
    "forever-ivision": 49,
    "health-4-men-combo": 52,
    "forever-garcinia-plus": 54,
    "forever-lean": 55,
    "forever-c9": 63,
    "aloe-first": 66,
    "aloe-vera-gelly": 67,
    "aloe-moisturizing-lotion": 68,
    "aloe-heat-lotion": 69,
    "forever-aloe-lips": 98,
    "forever-bright-toothgel": 99,
    "dream-by-forever-deodorant-spray-for-women": 100,
    "desire-by-forever-deodorant-spray-for-men": 101,
    "aloe-ever-shield": 102,
    "aloe-avocado-face-body-soap": 105,
}

with fitz.open(PDF_PATH) as doc:
    for product_id, page_number in PRODUCT_PAGES.items():
        page = doc[page_number - 1]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.6, 1.6), alpha=False)
        pix.save(OUTPUT_DIR / f"{product_id}.png")
        print(product_id)
