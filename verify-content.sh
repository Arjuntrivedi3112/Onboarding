#!/bin/bash

# Script to help verify PDF content is included in webpage
# This script provides a framework for comparison

echo "=== AdTech Book Content Verification ==="
echo ""
echo "This script helps verify that all content from THE-ADTECH-BOOK.pdf"
echo "is included in the webpage modules."
echo ""

# Check if PDF exists
if [ ! -f "THE-ADTECH-BOOK.pdf" ]; then
    echo "❌ Error: THE-ADTECH-BOOK.pdf not found in current directory"
    exit 1
fi

echo "✅ PDF file found: THE-ADTECH-BOOK.pdf"
echo ""

# Check if extraction script exists
if [ -f "extract-pdf.js" ]; then
    echo "✅ PDF extraction script found: extract-pdf.js"
    echo ""
    echo "To extract PDF content, run:"
    echo "  npm install pdf-parse"
    echo "  node extract-pdf.js"
    echo ""
else
    echo "⚠️  PDF extraction script not found"
    echo ""
fi

# List all module files
echo "=== Current Webpage Modules ==="
echo ""
modules=(
    "src/components/modules/BasicsModule.tsx"
    "src/components/modules/TechnologyModule.tsx"
    "src/components/modules/RTBModule.tsx"
    "src/components/modules/AdServingModule.tsx"
    "src/components/modules/TargetingModule.tsx"
    "src/components/modules/ChannelsModule.tsx"
    "src/components/modules/TrackingModule.tsx"
    "src/components/modules/IdentityModule.tsx"
    "src/components/modules/DataModule.tsx"
    "src/components/modules/AIModule.tsx"
)

for module in "${modules[@]}"; do
    if [ -f "$module" ]; then
        echo "✅ $module"
    else
        echo "❌ $module (missing)"
    fi
done

echo ""
echo "=== Next Steps ==="
echo ""
echo "1. Extract PDF text using one of these methods:"
echo "   - Install pdf-parse: npm install pdf-parse"
echo "   - Run: node extract-pdf.js"
echo "   - Or use an online PDF to text converter"
echo ""
echo "2. Review CONTENT-COMPARISON.md for detailed comparison framework"
echo ""
echo "3. Compare PDF chapters/sections with webpage modules"
echo ""
echo "4. Identify any missing topics and add them to the appropriate modules"
echo ""
