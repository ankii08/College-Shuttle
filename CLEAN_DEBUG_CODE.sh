#!/bin/bash
# CLEAN_DEBUG_CODE.sh - Remove debug statements for production

echo "🧹 Cleaning debug code for production..."

# Remove console.log statements (keep console.error for proper logging)
find . -name "*.tsx" -o -name "*.ts" | grep -v node_modules | grep -v .next | while read file; do
    # Remove console.log but keep console.error and console.warn
    sed -i '' 's/console\.log.*;//g' "$file"
    echo "Cleaned: $file"
done

echo "✅ Debug code cleanup complete"
echo "Note: console.error and console.warn statements preserved for proper error logging"
