/**
 * PDF Text Extraction Script
 * 
 * To use this script:
 * 1. Install pdf-parse: npm install pdf-parse
 * 2. Run: node extract-pdf.js
 * 
 * This will extract all text from THE-ADTECH-BOOK.pdf and save it to pdf-extracted-text.txt
 */

import fs from 'fs';

try {
  const pdfParse = (await import('pdf-parse')).default;
  const dataBuffer = fs.readFileSync('./THE-ADTECH-BOOK.pdf');
  
  console.log('Extracting text from THE-ADTECH-BOOK.pdf...\n');
  
  pdfParse(dataBuffer).then(function(data) {
    console.log('✅ PDF Content Extracted');
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Text length: ${data.text.length} characters\n`);
    
    // Save full text to file
    fs.writeFileSync('./pdf-extracted-text.txt', data.text);
    console.log('✅ Full text saved to: pdf-extracted-text.txt\n');
    
    // Show preview
    console.log('=== FIRST 2000 CHARACTERS ===');
    console.log(data.text.substring(0, 2000));
    console.log('\n...\n');
    console.log('=== LAST 2000 CHARACTERS ===');
    console.log(data.text.substring(Math.max(0, data.text.length - 2000)));
  }).catch(err => {
    console.error('Error parsing PDF:', err.message);
  });
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    console.log('❌ pdf-parse is not installed\n');
    console.log('To install pdf-parse, run:');
    console.log('  npm install pdf-parse\n');
    console.log('Then run this script again:');
    console.log('  node extract-pdf.js\n');
    console.log('Alternatively, use an online PDF-to-text converter.');
  } else {
    console.error('Error:', error.message);
  }
}
