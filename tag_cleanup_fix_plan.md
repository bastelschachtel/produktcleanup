# Plan for Enhancing Product Tag Generation and Validation

## 1. Problem Statement (Assumed)

The `cleanupTags` function in `Code.js` is assumed to be not consistently generating or validating product tags accurately based on other relevant product data fields (e.g., `Product Category`, `Title`, `Vendor`). This could lead to:
*   Missing relevant tags.
*   Inaccurate or irrelevant tags.
*   Tags not adhering to defined rules (length, banned terms, category alignment).
*   Suboptimal filtering, search, and internal organization within Shopify.

## 2. Goal

To ensure the `cleanupTags` function robustly generates and validates product tags, making them appropriate and consistent with other product data fields, and strictly adhering to defined business rules. The tags should be derived intelligently from `row['Product Category']`, `row['Title']`, `row['Vendor']`, and other relevant attributes, as processed by the `runPipeline` function.

## 3. Research and Analysis

### 3.1. Review `cleanupTags` Function Logic (`Code.js`)

The `cleanupTags` function is called in `runPipeline` during `PHASE 4b`, after `mapCollectionsAndCategory` has set `row['Product Category']` and `applyGoogleShopping` has run.

*   **Current Tag Extraction**: Initial tags are extracted from `row['Tags']`.
*   **Normalization**: The current normalization steps include `toLowerCase()`, `normalize("NFD").replace(/[̀-ͯ]/g, "")` (accent removal), and `replace(/[^a-z0-9-]/g, '')` (alphanumeric/hyphen filtering).
*   **Duplicate Removal**: `Array.from(new Set(tags))` is used.
*   **Banned Terms Check**: `CFG.BANNED_TERMS` (loaded from `banned_terms_json`) is used. The current implementation checks `bannedTerms.includes(tag)`. We need to verify if `banned_terms.json`'s `rules` (e.g., `enforce_case_insensitive`, `apply_in`) are fully respected.
*   **Length Check**: A warning is pushed via `pushIssue` if a tag exceeds 16 characters. This aligns with `SOP-006_Tag_Formate.md`'s recommendation.
*   **Category Alignment Check**: `CFG.KEYWORDS[productCategory]` (from `keyword_dictionary_json`) and `CFG.COLLECTION_ALIASES` (from `collection_aliases_json`) are used to build `categoryKeywords`. The current logic checks if `categoryKeywords.has(tag)`.
*   **Tag Generation Logic**:
    *   It attempts to use `CFG.KEYWORDS[productCategory].primary` and `CFG.KEYWORDS[productCategory].secondary`.
    *   It also tries to use `CFG.COLLECTION_ALIASES` where `mappedCategory` matches `productCategory`.
    *   The fallback is `CFG.SOP_RULES?.seo_rules?.default_tags`.
    *   The generation aims for a minimum of 5 tags.
*   **Tag Count Check**: A warning is pushed via `pushIssue` if the final tag count is outside the 5-10 range, as per `sop_phase3_rules.json`.
*   **Issue Reporting**: `pushIssue` is used to log changes and warnings.

### 3.2. Examine Relevant Configuration Files (Loaded via `loadConfig` into `CFG`)

*   **`CFG.BANNED_TERMS` (from `banned_terms.json`)**:
    *   The `banned_terms.json` includes `rules` like `enforce_case_insensitive` and `apply_in`. The current `cleanupTags` only checks `bannedTerms.includes(tag)`. This might not fully respect the `enforce_case_insensitive` or word boundary rules defined in the JSON. The `apply_in` rule for other fields (Title, SEO Title, etc.) is outside the scope of `cleanupTags` but noted as a potential future enhancement for other cleanup functions.
*   **`CFG.CAT_ALIGN` (from `category_alignment.json`)**:
    *   This configuration contains `must_include_any_of` and `avoid_themes` for categories. Currently, `cleanupTags` does *not* directly leverage these for tag generation or validation. This is a significant missed opportunity.
*   **`CFG.KEYWORDS` (from `keyword_dictionary_json`)**:
    *   This is a primary source for tag generation. We need to ensure `primary`, `secondary`, and `attributes` are well-defined and comprehensive for all `Product Category` values. To support "Parent-Value" Enforcement, this file should be enhanced to explicitly mark keywords as 'parent' or 'attribute'.
*   **`CFG.COLLECTION_ALIASES` (from `collection_aliases_json`)**:
    *   Used to map collection names to canonical categories and `normalized_tags`. The `normalized_tags` could be a more direct source for tag generation.
*   **`CFG.SOP_RULES` (from `sop_phase3_rules.json`)**:
    *   The `Tags` rule specifies "5–10 Parent-Werte, keine Attribute". The current `cleanupTags` attempts to meet the count but doesn't explicitly differentiate or enforce "Parent-Werte" vs. "Attribute" during generation or validation beyond using `primary`/`secondary` keywords. This rule also implicitly sets a recommended `LIMITS.TAG_MAX_LENGTH` of 16 characters.
    *   `CFG.SOP_RULES.seo_rules.default_tags` is used as a fallback.
*   **`CFG.KNOWN_VENDORS` (from `known_vendors.json`)**:
    *   Currently, `cleanupTags` does not use vendor information for tag generation. `normalizeVendor` sets `row['Vendor']` earlier in the pipeline.

### 3.3. Interaction with Other Functions in `runPipeline`

*   **`mapCollectionsAndCategory`**: This function (PHASE 2) is critical as it populates `row['Product Category']` using `CFG.COLLECTION_ALIASES` and `CFG.SOP_RULES.seo_rules.default_product_category`. `cleanupTags` relies heavily on this field.
*   **`cleanupTitle`**: The cleaned `row['Title']` (PHASE 3a) could be a valuable source for extracting relevant keywords for tags.
*   **`normalizeVendor`**: The normalized `row['Vendor']` (PHASE 2) could be used to generate vendor-specific tags if appropriate.
*   **`restructureBody`**: The `row['Body (HTML)']` (PHASE 3b) could also be a source for keywords, though it's HTML and would require careful parsing (e.g., using `stripHtml` utility).

## 4. Proposed Solution/Plan

The solution will involve a multi-pronged approach to enhance `cleanupTags` and its supporting configurations, ensuring tighter integration with existing project data and rules.

### 4.1. Refinement of Tag Generation Logic within `cleanupTags`

*   **Prioritized Tag Sources**: Implement a clear hierarchy for tag generation, leveraging existing `Code.js` utilities:
    1.  **Explicitly defined category keywords**: Prioritize `primary` keywords from `CFG.KEYWORDS[productCategory]` (from `keyword_dictionary_json`).
    2.  **Collection Aliases**: Utilize `normalized_tags` from `CFG.COLLECTION_ALIASES` (from `collection_aliases_json`) if they map to the `Product Category`.
    3.  **Category Alignment `must_include_any_of`**: Actively use `CFG.CAT_ALIGN[productCategory].must_include_any_of` (from `category_alignment.json`) to ensure critical tags are present, generating them if missing.
    4.  **Inferred from Title/Description**: Develop a lightweight mechanism to extract relevant terms (nouns, adjectives) from `row['Title']` (after `cleanupTitle`) and `stripHtml(row['Body (HTML)'])` that are not already covered by category keywords, ensuring they pass length and banned term checks.
    5.  **Vendor-specific tags**: If `CFG.KNOWN_VENDORS` (from `known_vendors.json`) contains tags associated with vendors, consider adding them.
    6.  **Default Fallback**: Use `CFG.SOP_RULES.seo_rules.default_tags` (from `sop_phase3_rules.json`) only if the minimum tag count is still not met.
*   **Smart Tag Selection**: When generating tags to meet the 5-10 count, ensure variety and relevance. Avoid generating tags that are semantically very close to existing ones.
*   **"Parent-Value" Enforcement**: Introduce logic to differentiate between "parent-values" (broad categories) and "attributes" (specific details like color, size) during tag generation, as per `CFG.SOP_RULES.Tags` rule. This will require enhancing `keyword_dictionary.json` to explicitly mark keywords with a `type` property (e.g., `"type": "parent"` or `"type": "attribute"`). Tags generated from `attribute` keywords should be flagged or excluded from the final tag list if the `parent-value` rule is strictly enforced.

### 4.2. Validation Enhancements within `cleanupTags`

*   **Stricter Banned Term Matching**: Modify the banned term check to use `RegExp` with word boundaries and case-insensitivity, respecting `CFG.BANNED_TERMS.rules`. The check should determine if a tag *is* a banned term, or if a banned term exists as a *whole word* within a tag.
    *   *Conceptual Code Snippet (within `cleanupTags`):*
        ```javascript
        const bannedTermsConfig = CFG.BANNED_TERMS;
        const bannedTermsMap = bannedTermsConfig.banned_terms || {};
        const bannedTermsList = Object.keys(bannedTermsMap);
        let tagsAfterBannedCheck = [];
        for (const tag of tags) {
            let isBanned = false;
            for (const bannedTerm of bannedTermsList) {
                // Check if the tag itself is an exact banned term (case-insensitive if rule applies)
                if (bannedTermsConfig.rules.enforce_case_insensitive) {
                    if (tag.toLowerCase() === bannedTerm.toLowerCase()) {
                        isBanned = true;
                        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, '', `Banned term '${bannedTerm}' removed`, 'warn', ctx.phase);
                        break;
                    }
                }
                // Check if a banned term exists as a whole word within the tag
                const re = new RegExp(`\\b${escapeRegExp(bannedTerm)}\\b`, bannedTermsConfig.rules.enforce_case_insensitive ? 'gi' : 'g');
                if (re.test(tag)) {
                    isBanned = true;
                    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, '', `Banned term '${bannedTerm}' found within tag '${tag}'`, 'warn', ctx.phase);
                    break;
                }
            }
            if (!isBanned) {
                tagsAfterBannedCheck.push(tag);
            }
        }
        tags = tagsAfterBannedCheck;
        ```
*   **Category Alignment Enforcement**:
    *   Leverage `CFG.CAT_ALIGN[productCategory].must_include_any_of` to *suggest* or *generate* tags if critical category-specific terms are missing. These generated tags should be prioritized.
    *   Use `CFG.CAT_ALIGN[productCategory].avoid_themes` to *warn* or *remove* any existing tags that match these themes. If a tag matches an `avoid_themes` entry, it should be removed and an `error` or `warn` issue pushed via `pushIssue`.
*   **Redundancy Check**: Implement a simpler redundancy check beyond exact duplicates. This could involve:
    *   **Configurable Synonyms**: Allow `keyword_dictionary.json` to define simple synonym groups. If a tag is a synonym of another already present tag, one should be removed.
    *   **Stemming/Lemmatization (Advanced)**: Acknowledge this as a complex, potentially out-of-scope feature for Apps Script, but note it for future consideration if simpler methods are insufficient.
*   **Length Enforcement**: Define `const LIMITS.TAG_MAX_LENGTH = 16;` in `Code.js`. Any generated or existing tag exceeding this length should trigger a `warn` via `pushIssue`. For strict enforcement, tags could be truncated, but this should be a configurable option.

### 4.3. Configuration Review and Potential Enhancements

*   **`keyword_dictionary.json`**: Add a `type` property (`"parent"`, `"attribute"`) to keywords to support "Parent-Value" Enforcement. Potentially add a `weight` or `priority` to keywords to guide generation. Introduce a `synonyms` section for simple redundancy checks.
*   **`category_alignment.json`**: Explicitly define `suggested_tags` or `required_tags` per category to guide generation, in addition to `must_include_any_of`.
*   **`sop_phase3_rules.json`**: Refine the `Tags` rule to include more specific guidance on "Parent-Werte" vs. "Attribute" examples. Explicitly define `TAG_MAX_LENGTH` within this config for centralized management.

### 4.4. Error Handling and Reporting (using `pushIssue` utility function)

*   Improve `pushIssue` messages to be more specific about *why* a tag was added, removed, or flagged (e.g., "Tag generated from primary keyword in `CFG.KEYWORDS`," "Banned term removed from `CFG.BANNED_TERMS`," "Tag does not align with `Product Category` based on `CFG.CAT_ALIGN`").
*   Use appropriate severity levels (`error`, `warn`, `info`) based on the rule violation (e.g., `error` for banned terms, `warn` for length, `info` for generation).

## 5. Detailed Steps (Research and Planning Only)

1.  **Deep Dive into `cleanupTags`**:
    *   Create a detailed flow diagram of the existing `cleanupTags` function, noting all interactions with `CFG` and `row` properties.
    *   Document each step of tag processing (normalization, filtering, generation, validation) with explicit references to `Code.js` lines and `CFG` keys.
2.  **Configuration Cross-Reference**:
    *   For each rule/entry in `CFG.BANNED_TERMS`, `CFG.CAT_ALIGN`, `CFG.KEYWORDS`, `CFG.COLLECTION_ALIASES`, and `CFG.SOP_RULES`, identify how it *should* interact with `cleanupTags`.
    *   Note any discrepancies or areas where the current `cleanupTags` logic doesn't fully leverage the configuration, especially `CFG.CAT_ALIGN.must_include_any_of` and `avoid_themes`.
3.  **Keyword Extraction Strategy**:
    *   Research simple regex patterns or string matching techniques suitable for Google Apps Script to extract potential tags from `row['Title']` (after `cleanupTitle`) and `stripHtml(row['Body (HTML)'])`.
    *   Define criteria for what constitutes a "parent-value" tag versus an "attribute" tag based on `CFG.SOP_RULES.Tags` and potential enhancements to `keyword_dictionary.json` (e.g., `type` property).
4.  **Tag Generation Algorithm Design**:
    *   Outline a step-by-step algorithm for generating tags, incorporating the prioritized sources (including `CFG.CAT_ALIGN.must_include_any_of`) and "Parent-Value" Enforcement.
    *   Include logic for ensuring the 5-10 tag count is met with relevant, non-redundant tags, potentially using a scoring mechanism for tag relevance.
5.  **Validation Rule Definition**:
    *   Formalize all validation rules (length, banned terms, category alignment, redundancy) into clear, testable conditions, explicitly referencing `CFG` values and `Code.js` utilities like `escapeRegExp`.
6.  **Test Case Identification**:
    *   Based on the assumed problems and desired outcomes, identify specific product data scenarios (input `row` examples) that would expose current `cleanupTags` issues and verify the proposed improvements.
    *   Include edge cases (e.g., product with no initial tags, product with many irrelevant tags, product with a very long title, products with `Product Category` values that have `must_include_any_of` or `avoid_themes` defined in `category_alignment.json`).
7.  **Refine `pushIssue` Messages**:
    *   Draft improved `reason` strings for various tag-related issues to provide clearer feedback in the "Issues" sheet, explicitly mentioning the `CFG` source of the rule (e.g., "Tag generated from primary keyword in `CFG.KEYWORDS`," "Banned term removed from `CFG.BANNED_TERMS`," "Tag does not align with `Product Category` based on `CFG.CAT_ALIGN`").

This plan will serve as a blueprint for a subsequent implementation phase, ensuring all aspects of tag generation and validation are thoroughly considered and addressed within the existing project context.
