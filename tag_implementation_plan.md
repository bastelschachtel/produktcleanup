# Plan for Product Tag Implementation in Code.js

## Goal
To ensure product tags are generated and validated based on the `Product Category` (Column E in the output tab), and that this process occurs as the final step in the product cleanup pipeline.

## Research Findings

*   **`Product Category` Population:** The `Product Category` field is populated by the `mapCollectionsAndCategory` function during "PHASE 2 — Normalize & categorize". This function uses `CFG.COLLECTION_ALIASES` and falls back to `CFG.SOP_RULES.seo_rules.default_product_category` if no category is mapped.
*   **`Google Shopping / Google Product Category`:** This field is populated by `applyGoogleShopping` in "PHASE 4". The user has clarified this field is not suitable for tag generation.
*   **Current `cleanupTags` Location:** Currently, `cleanupTags` runs in "PHASE 4b" (after `applyGoogleShopping` and before `validateRow`).
*   **Current `cleanupTags` Logic:** The `cleanupTags` function correctly uses `row['Product Category']` for keyword lookups and tag generation.

## Implementation Plan

The primary change required is to adjust the order of execution in the `runPipeline` function.

### Step 1: Move `cleanupTags` to the very end of `runPipeline`

**Current `runPipeline` snippet:**
```javascript
        // PHASE 4 — Validation & Google Shopping
        ctx.phase = '4';
        applyGoogleShopping(row, issues, rowNumber, productTitle, ctx, CFG);

        // NEW PHASE 4b - Tags (using Google Product Category)
        ctx.phase = '4b';
        cleanupTags(row, issues, rowNumber, productTitle, ctx, CFG);

        // PHASE 4c - Final Validation
        validateRow(row, issues, rowNumber, productTitle, ctx, CFG);
```

**Proposed `runPipeline` snippet:**
```javascript
        // PHASE 4 — Validation & Google Shopping
        ctx.phase = '4';
        applyGoogleShopping(row, issues, rowNumber, productTitle, ctx, CFG);

        // PHASE 4a - Final Validation (renamed from 4c)
        validateRow(row, issues, rowNumber, productTitle, ctx, CFG);

        // NEW PHASE 4b - Tags (using Product Category, as the very last step)
        ctx.phase = '4b';
        cleanupTags(row, issues, rowNumber, productTitle, ctx, CFG);
```

### Step 2: Verify `cleanupTags` uses `row['Product Category']`

*   The `cleanupTags` function currently uses `const productCategory = (row['Product Category'] || '').toLowerCase();` for its keyword lookups and tag generation. This is the correct field as per the user's clarification. No changes are needed within `cleanupTags` itself for this.

### Step 3: Ensure `default_product_category` fallback is robust

*   The `mapCollectionsAndCategory` function already includes a fallback to `CFG.SOP_RULES.seo_rules.default_product_category` if no category is mapped from collections. This ensures that `row['Product Category']` will always have a value, allowing tag generation to proceed even for products without initial category information.

## Summary of Changes

The main action is a single `replace` operation in `Code.js` to reorder the calls within `runPipeline`, moving `cleanupTags` to the very end of the processing loop.

## Next Steps

Once this plan is approved, I will execute the `replace` operation in `Code.js` to move the `cleanupTags` function call.
