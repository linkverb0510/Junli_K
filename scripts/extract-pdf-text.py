from pathlib import Path
import sys

from pypdf import PdfReader


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: extract-pdf-text.py <pdf-path>", file=sys.stderr)
        return 1

    pdf_path = Path(sys.argv[1])
    reader = PdfReader(str(pdf_path))

    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        print(f"===== PAGE {index} =====")
        print(text)
        print()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
