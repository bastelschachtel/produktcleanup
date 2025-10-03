# Body Content Agent Plan (#body)

## Agent Purpose
Specialized agent for optimizing Shopify product body content through intelligent quality assessment, content augmentation, and SEO-optimized restructuring.

## Current Implementation Analysis

### Core Function: `restructureBody` (Code.js:393)
**Current 3-Tier System:**
- **HIGH Quality**: Preserve existing content (>200 chars with meaningful structure)
- **MEDIUM Quality**: Augment existing content with category elements
- **LOW Quality**: Regenerate using SEO templates

**Supporting Functions:**
- `assessContentQuality` (Code.js:487): Content quality evaluation
- `buildNewBodyFromTemplate` (Code.js:546): Template-based generation
- `augmentMediumQualityContent` (Code.js:522): Content enhancement
- `generateSeoMetadata` (Code.js:595): SEO meta tag generation
- `generateJsonLdProduct` (Code.js:659): Structured data creation

### Configuration Dependencies
- `category_alignment.json`: Category-specific content rules and closing lines
- `keyword_dictionary.json`: Keywords for content generation
- `seo_template_json`: HTML templates for structured content
- `sop_phase3_rules.json`: SEO rules and site configuration

## Key Issues Identified

### 1. Content Quality Assessment Limitations
- **Current Logic**: Simple character count + HTML structure detection
- **Issues**: 
  - Doesn't assess semantic quality or relevance
  - No language quality checking for German content
  - Missing product-specific content validation

### 2. Content Generation Consistency
- **Template System**: Basic category-specific templates exist
- **Issues**:
  - Limited variety in generated content
  - No dynamic content adaptation based on product attributes
  - Repetitive patterns across similar products

### 3. SEO Integration Gaps
- **Current**: Metadata generation is functional
- **Issues**:
  - No keyword density optimization
  - Limited integration with actual content body
  - Missing semantic HTML structure optimization

## Agent Research Plan

### Phase 1: Content Quality Analysis
1. **Analyze existing body content patterns** across product categories
2. **Identify content quality indicators**:
   - Product-specific information density
   - Category-appropriate feature mentions
   - SEO keyword integration quality
   - German language quality metrics

3. **Benchmark current 3-tier classification**:
   - False positives in HIGH quality assessment
   - MEDIUM content that should be LOW
   - Content preservation vs. generation effectiveness

### Phase 2: Content Enhancement Strategies
1. **German E-commerce Content Optimization**:
   - German craft/hobby product description patterns
   - Effective feature presentation for German consumers
   - Cultural context for product positioning

2. **Dynamic Content Generation**:
   - Product attribute-driven content customization
   - Vendor-specific content patterns
   - Category-specific feature highlighting

3. **SEO Content Integration**:
   - Natural keyword integration patterns
   - Semantic HTML structure optimization
   - Content length optimization for different categories

### Phase 3: Advanced Content Logic
1. **Enhanced Quality Assessment**:
   - Semantic content analysis
   - Product relevance scoring
   - Category alignment validation
   - German language quality metrics

2. **Smart Content Augmentation**:
   - Context-aware content enhancement
   - Feature-based content expansion
   - Cross-category content adaptation

3. **Template Evolution**:
   - Dynamic template selection
   - Content variation algorithms
   - A/B testing framework for content patterns

## Research Focus Areas

### 1. Content Quality Metrics
- Develop semantic analysis for German product descriptions
- Create product-specific information density metrics
- Build category-appropriate content validation

### 2. Template Optimization
- Analyze `category_alignment.json` patterns for content improvement
- Research effective German e-commerce content structures
- Develop dynamic content generation algorithms

### 3. SEO Content Integration
- Optimize keyword integration in body content
- Enhance structured data implementation
- Improve meta tag and content alignment

## Current Function Improvements Needed

### `assessContentQuality` Enhancements
```javascript
// Current: Simple length + structure check
// Needed: Semantic analysis, relevance scoring, language quality
```

### `buildNewBodyFromTemplate` Improvements
```javascript
// Current: Static template with basic placeholders
// Needed: Dynamic content based on product attributes, category rules
```

### `augmentMediumQualityContent` Expansion
```javascript
// Current: Simple feature list addition
// Needed: Intelligent content merging, context preservation
```

## Integration Opportunities

### 1. Category Alignment Integration
- Leverage `category_alignment.json` for content rules
- Use `keyword_dictionary.json` for natural keyword integration
- Apply `must_include_any_of` rules more intelligently

### 2. Vendor-Specific Content Patterns
- Develop vendor-specific content templates
- Integrate vendor information more naturally
- Create vendor-category content combinations

### 3. Multi-language Content Support
- Optimize for German language patterns
- Handle German compound words in content
- Improve German SEO content structure

## Success Metrics
- Improved content quality scores across all tiers
- Better category alignment in generated content
- Enhanced SEO keyword integration
- Reduced repetitive content patterns
- Higher content relevance scores
- Improved German language quality metrics

## Testing Strategy
- Content quality A/B testing framework
- Category-specific content performance tracking
- SEO content effectiveness measurement
- User engagement metrics (if available)

## Integration Points
- Phase 3b in main pipeline (after category assignment)
- Configuration-driven via existing JSON files
- Issue logging for content quality tracking
- Summary report integration for content metrics