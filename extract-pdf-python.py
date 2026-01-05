#!/usr/bin/env python3
"""
PDF Text Extraction Script

To use this script:
1. Install PyPDF2: pip3 install PyPDF2
2. Run: python3 extract-pdf-python.py

This will extract all text from THE-ADTECH-BOOK.pdf and save it to pdf-extracted-text.txt
"""

import sys

try:
    import PyPDF2
    
    pdf_path = 'THE-ADTECH-BOOK.pdf'
    output_path = 'pdf-extracted-text.txt'
    
    print(f"Extracting text from {pdf_path}...\n")
    
    with open(pdf_path, 'rb') as pdf_file:
        pdf_reader = PyPDF2.PdfReader(pdf_file)
        num_pages = len(pdf_reader.pages)
        
        print(f"Found {num_pages} pages")
        print("Extracting text...")
        
        full_text = []
        for i, page in enumerate(pdf_reader.pages):
            text = page.extract_text()
            full_text.append(f"\n=== PAGE {i+1} ===\n{text}")
            if (i + 1) % 10 == 0:
                print(f"Processed {i+1}/{num_pages} pages...")
        
        combined_text = "\n".join(full_text)
        
        # Save to file
        with open(output_path, 'w', encoding='utf-8') as out_file:
            out_file.write(combined_text)
        
        print(f"\n✅ Successfully extracted {len(combined_text)} characters")
        print(f"✅ Saved to {output_path}\n")
        
        # Show preview
        print("=== FIRST 2000 CHARACTERS ===")
        print(combined_text[:2000])
        print("\n...\n")
        print("=== LAST 2000 CHARACTERS ===")
        print(combined_text[-2000:])
        
except ImportError:
    print("❌ PyPDF2 is not installed\n")
    print("To install PyPDF2, run:")
    print("  pip3 install PyPDF2\n")
    print("Then run this script again:")
    print("  python3 extract-pdf-python.py\n")
    print("Alternatively, use an online PDF-to-text converter.")
    sys.exit(1)
except FileNotFoundError:
    print(f"❌ Error: THE-ADTECH-BOOK.pdf not found in current directory")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error extracting PDF: {e}")
    sys.exit(1)
