# SEO Description Overhaul Plan

## 1. Objective

To completely redesign the SEO description generation logic in `Code.js`. The new logic will produce highly specific, compelling, and category-aware descriptions that are strictly capped at 160 characters.

## 2. Core Concepts

The new approach will be based on a "foundational sentence" model. Each product collection will have a base sentence that we can build upon. This ensures that every product in a collection has a consistent and relevant starting point for its SEO description.

We will then enrich this foundational sentence with specific details about the product, such as its name and descriptive qualities, which we will infer from the product's title and original description.

## 3. Supporting Documents

To support this new logic, we will need to create a new configuration file:

*   **`collection_seo_descriptions.json`**: This file will be a simple JSON object that maps each of your collections to a foundational SEO description sentence.

    *Example:*
    ```json
    {
      "Sticker": "Entdecken Sie unsere einzigartigen Sticker, perfekt für die Personalisierung Ihrer Alltagsgegenstände.",
      "Schulbedarf": "Alles für den perfekten Start ins neue Schuljahr – von Stiften bis zu Heften.",
      "Farben & Lacke": "Hochwertige Farben und Lacke für brillante Ergebnisse bei all Ihren kreativen Projekten."
    }
    ```

## 4. Automated Foundational Sentence Generation

To accelerate the implementation process, I will automatically generate the foundational SEO description sentences for each collection. This will be done by analyzing the collection names and using a set of predefined templates to create relevant and natural-sounding sentences.

**Process:**

1.  **Extract Collections**: I will read the `collection_aliases.json` file to get a complete list of your product collections.
2.  **Generate Sentences**: For each collection, I will generate a foundational sentence. For example, for a collection named "Sticker", I might generate: "Entdecken Sie unsere vielfältige Auswahl an Stickern, perfekt für die Dekoration und Personalisierung."
3.  **Create `collection_seo_descriptions.json`**: I will create the `collection_seo_descriptions.json` file and populate it with the generated sentences.
4.  **User Review**: I will then present the generated sentences to you for review and approval. This will give you the opportunity to make any necessary adjustments before I proceed with the rest of the implementation.



1.  **Create `collection_seo_descriptions.json`**: I will need you to provide the foundational sentences for each of your collections. I will then create this file and add it to your project.

2.  **Update `loadConfig`**: I will modify the `loadConfig` function in `Code.js` to load our new `collection_seo_descriptions.json` file.

3.  **Overhaul `buildSEO` function**: I will completely rewrite the `buildSEO` function in `Code.js` to implement the new logic. The new function will:
    a.  Identify the product's primary collection.
    b.  Retrieve the corresponding foundational sentence from our new config file.
    c.  Analyze the product's title and original description to extract key descriptive qualities (e.g., "wasserfest", "extra weich", "glänzend").
    d.  Intelligently weave the product title and these descriptive qualities into the foundational sentence.
    e.  Ensure the final description is grammatically correct, natural-sounding, and strictly truncated to 160 characters without cutting off words.

## 5. Brainstorming & Smooth Implementation

To make this as smooth as possible, here are some additional thoughts:

*   **Keyword Extraction**: To extract "descriptive qualities", I will build a simple keyword extractor that looks for common adjectives and material nouns in your product titles and descriptions. This will be a regex-based approach that is well-suited for the Google Apps Script environment.
*   **Sentence Construction**: I will create a few sentence patterns to combine the foundational sentence, product name, and keywords in a way that sounds natural. For example:
    *   `[Foundational Sentence] Das Produkt '[Product Name]' ist [Keyword 1] und [Keyword 2].`
    *   `[Foundational Sentence] Erleben Sie '[Product Name]', das sich durch seine [Keyword 1] und [Keyword 2] Eigenschaften auszeichnet.`
*   **Fallback Logic**: If a collection does not have a foundational sentence, or if no descriptive qualities can be extracted, the script will have a robust fallback mechanism to generate a more generic (but still high-quality) description.

## 6. What I Need From You

To proceed, I need you to provide the foundational SEO description sentences for each of your product collections. Please provide this information in a JSON format, similar to the example in section 3.

Once you provide this information, I will create the `collection_seo_descriptions.json` file and then proceed with the code modifications.

This plan will ensure that we create a powerful and flexible SEO description generator that is perfectly aligned with your goals. I am ready to proceed as soon as you provide the necessary information.
