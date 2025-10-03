### Development Plan for Google Apps Script Product Cleanup Tool

**Objective:** To refactor the `restructureBody` function for improved modularity and implement a more intelligent, three-tiered approach to handling existing product `Body (HTML)` content, along with enhanced reporting.

---

#### Phase 1: Foundational Refactoring (Modularity)

**Goal:** Deconstruct the complex `restructureBody` function into smaller, single-responsibility helper functions to improve readability, maintainability, and testability.

**Steps:**

1.  **Extract `extractYoutubeContent` function:**
    *   Create a new helper function `extractYoutubeContent(html)` that takes the raw `Body (HTML)` as input.
    *   This function will encapsulate the logic for identifying and extracting YouTube video iframes or links.
    *   It should return an object containing the extracted YouTube content (if any) and the `html` with YouTube content removed.
    *   Update `restructureBody` to call this new helper.

2.  **Extract `buildNewBodyFromTemplate` function:**
    *   Extract the logic from `generateStructuredContent` into a new, more clearly named helper function like `buildNewBodyFromTemplate(category, config, title, vendor)`. This function's sole responsibility is to create a complete HTML body from scratch based on configuration rules.

3.  **Extract `ensureClosingLine` function:**
    *   Create a new helper function `ensureClosingLine(html, productCategory, CFG)` that takes the current HTML body, product category, and configuration as input.
    *   This function will encapsulate the logic for adding a category-specific or generic closing line if one doesn't already exist.
    *   Update `restructureBody` to call this new helper.

4.  **Simplify `restructureBody`:**
    *   After extracting the above helpers, `restructureBody` should primarily orchestrate the calls to these new functions, making its logic clearer.

---

#### Phase 2: Intelligent Content Augmentation

**Goal:** Implement a three-tiered approach for handling existing `Body (HTML)` content: preserve high-quality, augment medium-quality, and regenerate low-quality content.

**Definitions:**
*   **High-Quality:** Existing `Body (HTML)` content that is substantial (e.g., > 200 characters after stripping HTML) and contains meaningful paragraphs or lists. This content should be preserved.
*   **Medium-Quality:** Existing `Body (HTML)` content that is not substantial enough to be considered high-quality (e.g., between 50 and 200 characters after stripping HTML) but still contains some useful information. This content should be augmented with generated SEO content.
*   **Low-Quality:** Existing `Body (HTML)` content that is very sparse (e.g., <= 50 characters after stripping HTML) or empty. This content should be completely regenerated using the SEO template.

**Steps:**

1.  **Create `assessContentQuality` function:**
    *   Create a new helper function `assessContentQuality(html)` that takes the sanitized HTML string as input.
    *   This function should implement the logic from the "Definitions" section, returning a clear quality indicator (e.g., 'HIGH', 'MEDIUM', or 'LOW').

2.  **Refactor `restructureBody` to be the Orchestrator:**
    *   The primary `restructureBody` function should be the central controller for the three-tiered logic.
    *   Its workflow will be:
        a. Sanitize the initial HTML (remove deprecated tags, etc.).
        b. Call `extractYoutubeContent`.
        c. Call `assessContentQuality` on the remaining HTML.
        d. Use a switch statement or if/else if/else block based on the returned quality level to execute the correct logic path.

3.  **Implement the Three Logic Paths within `restructureBody`:**
    *   **High-Quality Path:** If quality is 'HIGH', the function should simply call `ensureClosingLine` on the existing content and log the "Body preserved" issue.
    *   **Medium-Quality Path:** If quality is 'MEDIUM', call a new dedicated function, `augmentMediumQualityContent(existingHtml, category, config)`. This function will be responsible for intelligently combining the existing text with newly generated elements (like a `<ul>` feature list). It should then log the "Body augmented" issue.
    *   **Low-Quality Path:** If quality is 'LOW', the function should call `buildNewBodyFromTemplate` (from the corrected Phase 1) to generate the body from scratch. It should then log the "Body regenerated" issue.

4.  **Final Assembly:**
    *   After the appropriate logic path has been executed, `restructureBody` will append the preserved YouTube content to the final HTML and return the result.

---

#### Phase 3: Testing and Reporting Enhancements

**Goal:** Improve the clarity and detail of issue logging and the summary report to reflect the new content handling logic.

**Steps:**

1.  **Update `pushIssue` calls in `restructureBody` and `processExistingBodyContent`:**
    *   Ensure that the `reason` field accurately describes the action taken (e.g., "Body preserved - high quality", "Body augmented - medium quality", "Body regenerated - low quality").

2.  **Enhance Summary Report (`generateSummaryReport`):**
    *   Add new metrics to the summary report to track the breakdown of body content handling:
        *   "Bodies Preserved (High Quality)"
        *   "Bodies Augmented (Medium Quality)"
        *   "Bodies Regenerated (Low Quality)"
    *   Update the `ui.alert` message to include these new summary statistics.