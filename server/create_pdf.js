
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'test_gen.pdf');

// Create a valid PDF but with very little text (< 50 chars) to trigger "scanned" detection
// Text: "Test" (4 chars)
const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
/Font <<
/F1 <<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
>>
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 55
>>
stream
BT
/F1 24 Tf
100 700 Td
(Test) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000117 00000 n 
0000000280 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
330
%%EOF`;

fs.writeFileSync(filePath, pdfContent);
console.log('Created test_gen.pdf (Scanned)');
