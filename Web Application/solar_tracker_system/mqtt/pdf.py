import fitz
from pathlib import Path

src = Path("D:/UEM/TL/TL_EP/anexo01.pdf")
out = Path("D:/UEM/TL/TL_EP/anexo00.pdf")

doc = fitz.open(src)
pairs = [
    [6, 7], [8, 9], [10, 11], [12, 13],
    [14, 15], [16, 22], [23, 24], [25, 26]
]

# Use identical page cells throughout so the final pair (26 + 27)
# has exactly the same layout and alignment as all preceding pairs.
cell_w = max(page.rect.width for page in doc)
cell_h = max(page.rect.height for page in doc)

result = fitz.open()
for pair in pairs:
    sheet = result.new_page(width=2 * cell_w, height=cell_h)
    for column, page_index in enumerate(pair):
        target = fitz.Rect(
            column * cell_w, 0,
            (column + 1) * cell_w, cell_h
        )
        sheet.show_pdf_page(target, doc, page_index, keep_proportion=True)

result.save(out, garbage=4, deflate=True)
print(f"PDF alinhado criado: {out}")
print("Pares: 7+8, 9+10, 11+12, 13+14, 15+16, 17+23, 24+25, 26+27")
