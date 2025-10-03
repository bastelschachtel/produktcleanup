# MASTER_DEV.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Shopify Product Cleanup Tool** implemented as a Google Apps Script that processes product data within Google Sheets. The tool operates on a Google Apps Script deployment and is managed via `clasp` for code synchronization between local development and Google Apps Script.

## Architecture & Data Flow

### Core Pipeline (runPipeline function in Code.js:54)
The cleanup process follows a structured 4-phase pipeline:

1. **Phase 1**: Basic validation (Handle validation)
2. **Phase 2**: Normalize & categorize (Vendor mapping, Product Category assignment via collection_aliases.json)
3. **Phase 3**: Content transformation
   - 3a: Title cleanup (banned terms replacement, length limits)
   - 3b: Body restructuring (3-tier content quality assessment: preserve/augment/regenerate)
   - 3c: SEO generation (standardized titles and descriptions)
   - 3d: Variant normalization (SKU generation, shipping/tax defaults)
   - 3e: Tag cleanup and generation
4. **Phase 4**: Google Shopping mapping and final validation

### Configuration System
All business rules are stored as JSON in a "Config" sheet with these key files:
- `banned_terms.json`: Word replacements and enforcement rules
- `keyword_dictionary.json`: Category-specific keywords (primary/secondary/attributes)
- `category_alignment.json`: Category-specific content rules and closing lines
- `collection_aliases.json`: Maps Shopify collections to product categories
- `sop_phase3_rules.json`: SEO rules and defaults
- `known_vendors.json`: Vendor inference patterns
- `tag_relevance_map.json`: Google taxonomy mapping for tag validation

### Sheet Structure
- **Input**: Source product data from Shopify export
- **Output**: Cleaned product data ready for Shopify import
- **Issues**: Detailed audit trail of all changes with severity levels (error/warn/info)
- **Config**: JSON configuration storage
- **Summary**: Generated statistics and reports

## Development Commands

### Google Apps Script Management
```bash
# Deploy to Google Apps Script (requires clasp setup)
clasp push

# Pull latest from Google Apps Script
clasp pull

# Open Apps Script editor
clasp open
```

### Local Development
```bash
# No build process - direct JavaScript execution in Google Apps Script environment
# Configuration is managed through Google Sheets interface
```

## Key Functions & Responsibilities

### Content Processing (`restructureBody` - Code.js:393)
Implements 3-tier content quality assessment:
- **HIGH**: Preserve existing content (>200 chars with meaningful structure)
- **MEDIUM**: Augment existing content with category-specific elements
- **LOW**: Regenerate using SEO templates and category alignment rules

### Tag Management (`cleanupTags` - Code.js:955)
- Enforces 5-10 tag limit per product
- Character normalization (alphanumeric + hyphens only)
- Banned terms filtering via banned_terms.json
- Category alignment validation using keyword_dictionary.json
- Auto-generation from title keywords and category rules

### SEO Generation (`buildSEO` - Code.js:802)
- Length limits: Title ≤70 chars, Description 155-160 chars
- Category-specific foundational sentences from collection_seo_descriptions.json
- Quality extraction from existing content
- Vendor and product type integration

## Communication with Gemini CLI

This repository serves as a communication bridge between Claude (local) and Gemini CLI (Google Apps Script environment via clasp). 

### Workflow
1. Claude analyzes issues and creates plans in `/analysis` folder
2. Plans are implemented in Code.js
3. Changes are pushed to Google Apps Script via `clasp push`
4. Gemini CLI processes results and provides feedback
5. Issues and improvements are tracked in `/analysis/issues`

### Agent Specializations
The system supports specialized processing agents for:
- **#tagging**: Tag generation, validation, and optimization
- **#body**: Content quality assessment and restructuring  
- **#productcategory**: Category mapping and classification

## Error Handling & Validation

- Document lock system prevents concurrent executions (LockService)
- Comprehensive issue logging with phase tracking
- Immutable field protection (Handle, Image Src, IDs)
- JSON configuration validation with visual feedback
- Dry-run mode for validation without mutations

## Configuration Management

### Adding New Categories
1. Update `keyword_dictionary.json` with primary/secondary/attribute keywords
2. Add category rules to `category_alignment.json`
3. Map collections in `collection_aliases.json`
4. Update Google taxonomy in `google_taxonomy_map.json`

### Modifying Content Rules
- SEO templates: Update `seo_template_json` in Config sheet
- Content quality thresholds: Modify `assessContentQuality` function
- Tag generation rules: Update MIN_TAGS/MAX_TAGS constants and validation logic

## Testing & Validation

### Manual Testing
- Use "Validate Only (Dry Run)" menu option for non-destructive testing
- "Test Config Load" validates JSON parsing
- "Generate Summary Report" provides processing statistics

### Config Validation
- "Validate Config JSONs" marks Config sheet cells green/red for JSON validity
- "Setup Sheets & Config" initializes missing configuration keys

## Performance Considerations

- Batch processing in groups of 50 products
- Progress notifications every batch
- LockService prevents concurrent runs
- Immutable field preservation for data integrity

## Security & Best Practices

- No sensitive data storage in code
- Configuration-driven business logic
- Comprehensive audit logging
- Proper error boundary handling with user-friendly messages