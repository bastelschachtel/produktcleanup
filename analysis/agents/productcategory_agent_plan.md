# Product Category Agent Plan (#productcategory)

## Agent Purpose
Specialized agent for optimizing Shopify product category assignment, classification accuracy, and category-based content optimization through intelligent mapping and validation.

## Current Implementation Analysis

### Core Function: `mapCollectionsAndCategory` (Code.js:280)
**Current Responsibilities:**
- Map collections to categories via `collection_aliases.json`
- Keyword-based category inference from title/description
- Default category assignment fallback
- Category validation and assignment

### Supporting Functions:
- Category-specific content rules in `restructureBody`
- Google taxonomy mapping in `applyGoogleShopping`
- Category-driven tag generation in `cleanupTags`
- Category-specific SEO in `buildSEO`

### Configuration Dependencies
- `collection_aliases.json`: Collection-to-category mapping
- `category_alignment.json`: Category-specific content rules
- `keyword_dictionary.json`: Category-specific keywords
- `google_taxonomy_map.json`: Google Shopping category mapping
- `category_keywords_inference_json`: Keyword-based category inference

## Key Issues Identified

### 1. Category Assignment Accuracy
- **Current Logic**: Collection mapping → keyword inference → default fallback
- **Issues**:
  - Collection mapping may be incomplete
  - Keyword inference is basic word matching
  - No confidence scoring for category assignments
  - No handling of multi-category products

### 2. Category Hierarchy and Relationships
- **Current**: Flat category structure
- **Issues**:
  - No parent-child category relationships
  - Missing subcategory support
  - No category similarity or overlap handling

### 3. Category Validation Gaps
- **Current**: Basic assignment validation
- **Issues**:
  - No content-category consistency validation
  - Missing vendor-category alignment checks
  - No category completeness scoring

## Agent Research Plan

### Phase 1: Category Assignment Analysis
1. **Analyze current category distribution**:
   - Review collection-to-category mappings effectiveness
   - Identify unmapped or miscategorized products
   - Analyze keyword inference accuracy

2. **Category Consistency Audit**:
   - Cross-reference product attributes with assigned categories
   - Identify category-vendor misalignments
   - Validate Google taxonomy mappings

3. **Content-Category Alignment Review**:
   - Analyze how well product content matches assigned categories
   - Identify categories with weak content rules
   - Review category-specific SEO effectiveness

### Phase 2: Enhanced Category Intelligence
1. **Multi-Signal Category Detection**:
   - Combine title, description, vendor, and collection signals
   - Develop confidence scoring for category assignments
   - Create category assignment validation rules

2. **Category Hierarchy Development**:
   - Map category relationships and dependencies
   - Develop subcategory support
   - Create category group classifications

3. **Machine Learning Approach**:
   - Product attribute pattern recognition
   - Category prediction based on multiple features
   - Confidence-based category assignment

### Phase 3: Category Optimization Framework
1. **Dynamic Category Rules**:
   - Content-driven category refinement
   - Automatic category rule generation
   - Category performance tracking

2. **Cross-Category Analysis**:
   - Identify category overlap and conflicts
   - Optimize category boundaries
   - Develop category consolidation strategies

3. **Category Quality Metrics**:
   - Category assignment confidence scoring
   - Content-category alignment metrics
   - Category-based performance tracking

## Research Focus Areas

### 1. Category Mapping Optimization
- Analyze `collection_aliases.json` completeness and accuracy
- Research German craft/hobby category standards
- Optimize keyword-based inference patterns
- Develop vendor-category relationship mapping

### 2. Content-Category Alignment
- Strengthen category validation against product attributes
- Enhance category-specific content generation
- Improve category-driven SEO optimization
- Develop category coherence scoring

### 3. Google Taxonomy Integration
- Optimize Google Shopping category mapping
- Ensure taxonomy compliance
- Enhance category-based Google Shopping optimization
- Improve product categorization for search

## Current Configuration Analysis

### `collection_aliases.json` Optimization
- Review mapping completeness
- Identify missing collection patterns
- Optimize for German market categories
- Add confidence indicators

### `category_keywords_inference_json` Enhancement
- Expand keyword patterns for better detection
- Add German-specific category keywords
- Implement weighted keyword scoring
- Add context-based category inference

### `category_alignment.json` Improvement
- Strengthen category-specific content rules
- Add category validation criteria
- Enhance category-based feature requirements
- Optimize closing line templates

## Enhanced Category Assignment Logic

### Multi-Signal Category Detection
```javascript
// Enhanced logic combining:
// 1. Collection mapping (high confidence)
// 2. Title/description keywords (medium confidence)
// 3. Vendor patterns (medium confidence)
// 4. Product attributes (low confidence)
// 5. Content analysis (validation signal)
```

### Category Confidence Scoring
```javascript
// Implement confidence levels:
// - HIGH (90-100%): Direct collection mapping
// - MEDIUM (70-89%): Multiple signal agreement
// - LOW (50-69%): Single signal or conflict
// - UNCERTAIN (<50%): Requires manual review
```

### Category Validation Framework
```javascript
// Validate assignments against:
// - Product content consistency
// - Vendor-category alignment
// - Google taxonomy compliance
// - Historical assignment patterns
```

## Success Metrics
- Increased category assignment accuracy (target: >95%)
- Reduced uncategorized products
- Improved content-category alignment scores
- Enhanced Google Shopping category compliance
- Better category-driven content quality
- Reduced manual category interventions

## Integration Points
- Phase 2 in main pipeline (after vendor normalization)
- Cross-validation with tag generation and content creation
- Google Shopping taxonomy integration
- SEO optimization based on category assignment
- Issue logging for category assignment tracking

## Testing Framework
- Category assignment accuracy validation
- A/B testing for category inference algorithms
- Category-based content performance tracking
- Google Shopping category effectiveness measurement

## Research Deliverables
1. **Category Assignment Accuracy Report**
2. **Enhanced Category Inference Algorithm**
3. **Category Validation Framework**
4. **Category-Content Alignment Optimization**
5. **Google Taxonomy Integration Improvements**
6. **Category Performance Metrics Dashboard**