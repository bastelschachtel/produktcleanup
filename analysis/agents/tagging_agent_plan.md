# Tagging Agent Plan (#tagging)

## Agent Purpose
Specialized agent for optimizing Shopify product tag generation, validation, and alignment with category-specific rules and SEO best practices.

## Current Implementation Analysis

### Core Function: `cleanupTags` (Code.js:955)
**Current Responsibilities:**
- Character normalization (alphanumeric + hyphens only)
- Duplicate removal
- Banned terms filtering via `banned_terms.json`
- Google Product Category forbidden keyword checking
- Length validation (≤16 chars recommended)
- Category alignment validation using `keyword_dictionary.json`
- Tag generation for products with <5 tags
- Final count validation (5-10 tags recommended)

### Configuration Dependencies
- `banned_terms.json`: Terms to filter/replace
- `keyword_dictionary.json`: Category-specific keywords (primary/secondary/attributes)
- `collection_aliases.json`: Category mapping
- `tag_relevance_map.json`: Google taxonomy forbidden keywords
- `sop_phase3_rules.json`: Default tags and rules

## Key Issues Identified

### 1. Tag Generation Logic Gaps
- **Title Word Extraction**: Good but needs refinement for German compound words
- **Stop Words**: Comprehensive list but could be expanded
- **Keyword Prioritization**: No clear hierarchy when multiple categories apply

### 2. Category Alignment Validation
- **Current**: Warns when tags don't align with category keywords
- **Issue**: No automatic correction or suggestion mechanism
- **Opportunity**: Could auto-suggest category-appropriate alternatives

### 3. Google Taxonomy Integration
- **Current**: Filters forbidden keywords for Google Product Category
- **Issue**: Limited to filtering, no positive reinforcement of required keywords
- **Opportunity**: Proactive addition of taxonomy-required keywords

## Agent Research Plan

### Phase 1: Tag Quality Assessment
1. **Analyze existing tag patterns** across different product categories
2. **Identify common tag quality issues**:
   - Over-generic tags (e.g., "produkt", "artikel")
   - Under-specific tags missing category context
   - Inconsistent formatting patterns
3. **Benchmark tag performance** against category alignment rules

### Phase 2: Enhancement Opportunities
1. **German Language Optimization**:
   - Compound word detection and splitting
   - Stemming for tag normalization
   - Synonym detection for consolidation

2. **Smart Tag Suggestion**:
   - Category-specific tag templates
   - Title-to-tag extraction patterns
   - Vendor-specific tag patterns

3. **Quality Scoring System**:
   - Relevance score based on category alignment
   - Specificity score (avoid generic terms)
   - SEO value score (search potential)

### Phase 3: Implementation Strategy
1. **Enhanced Tag Generation**:
   - Priority-based keyword selection
   - Context-aware tag suggestions
   - Automatic category alignment correction

2. **Validation Improvements**:
   - Multi-level validation (syntax, semantics, SEO)
   - Suggestion engine for rejected tags
   - Batch tag optimization

3. **Reporting Enhancements**:
   - Tag quality metrics in summary reports
   - Category-specific tag coverage analysis
   - Tag performance recommendations

## Research Focus Areas

### 1. Category-Specific Tag Patterns
- Analyze `keyword_dictionary.json` for optimal tag combinations per category
- Identify tag patterns that work well for specific product types
- Map vendor-specific tagging patterns

### 2. German E-commerce Tag Optimization
- Research German Shopify SEO best practices for tags
- Analyze competitor tag patterns in craft/hobby space
- Optimize for German search behavior

### 3. Tag Hierarchy and Prioritization
- Develop tag importance scoring algorithm
- Create category-specific tag templates
- Implement smart tag selection based on available space

## Success Metrics
- Increase in category-aligned tags (target: >90%)
- Reduction in generic/low-value tags
- Improved tag count compliance (5-10 range)
- Enhanced tag relevance scores
- Reduced manual tag intervention needed

## Integration Points
- Phase 3e in main pipeline (after category assignment)
- Configuration-driven via existing JSON files
- Issue logging integration for audit trail
- Summary report integration for metrics tracking