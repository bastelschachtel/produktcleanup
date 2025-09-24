# produktcleanup
source files for read / write 
🛠 Shopify Product Cleanup & Standardisation
🎯 Project Goal

To build a repeatable, scalable framework for cleaning, standardizing, and governing product data in Shopify using official SOPs, best practices, controlled vocabularies, and automation.

📂 Phase Framework
Phase 1 – Input (Collect SOPs)

Collect SOPs from Shopify Help.

Store raw, tagged SOPs (category, source URL, date).

No processing until user confirms with DONE WITH INPUT.

Phase 2 – Structuring (Playbook)

Summarize SOPs into a single reference.

Resolve contradictions and overlaps.

Organize into Playbook sections: Titles, Descriptions, Media, Variants, SEO, Tags, Collections.

Highlight where business-specific choices are required.

Phase 3 – Execution (Apply & Automate)

Draft title/description/SEO templates.

Define cleanup workflows (manual + bulk edit).

Apply rules to pilot batch of products.

Govern with controlled vocabulary, banned terms, and category alignment.

Phase 4 – Validation (QA & Optimisation)

Spot-check products.

Compare SEO/CTR/conversion outcomes.

Refine Playbook rules.

Phase 5 – Institutionalisation (Governance & Scaling)

Maintain a living document.

Build training & onboarding modules.

Implement audits (monthly/quarterly).

Set up automation/AI flagging for non-standard entries.

📌 Always-On Chat Instructions

Detect current phase on session start.

Behave as collector/synthesizer/executor/validator/governor depending on phase.

Summarize progress explicitly.

Wait for DONE WITH INPUT before switching from Phase 1 to Phase 2.

🔧 JSON Rule Files
1. Banned Terms (banned_terms.json)

Defines forbidden marketing phrases and safe alternatives.

Blocks fluff like “hochwertig”, “beste Qualität”.

Enforces contextual overrides (e.g., “einzigartig” allowed only for limited motifs).

2. Category Alignment (category_alignment.json)

Category-specific rules:

Required keywords.

Forbidden themes.

Category-specific closing line templates for product descriptions.

3. Keyword Dictionary (keyword_dictionary.json)

Controlled vocabularies:

Primary keywords (must appear in titles/SEO).

Secondary keywords (supporting terms).

Attribute keywords (variants, sizes, colors, materials).

Coverage includes Korbböden, Bastelsets, Acrylfarben, Effektpasten, Jewelry Making, Seasonal Decor, etc.

4. Collection Aliases (collection_aliases.json)

Maps messy collection handles to canonical category names.

Example: grundmaterial_zum_korb_flechten → Korbböden / Peddigrohr

Ensures consistency across tags, product types, and collections.

📘 SOP References
Phase 2 Reference Guide

SOP-001 Produktdetails – Baseline product fields.

SOP-002 SKU-Formate – SKU schema & validation.

SOP-003 Produktdetailseite – Full product field schema.

SOP-004 Standard-Produkttaxonomie – Google/Shopify category alignment.

SOP-005 Produkttypen – Internal types vs categories.

SOP-006 Tag-Formate – Tagging rules.

SOP-007 Metafelder – Structured data extensions.

Phase 3 Gold Standard

Defines field-by-field cleanup rules for Shopify export schema (~3,500 SKUs).

Titles, Descriptions, SEO

Options, Variants, Media

Google Shopping fields

Reviews & Metafields

Status, QA, Governance

📂 Supporting Data

Google Product Taxonomy: Full official hierarchy for mapping categories.

Controlled Vocabulary: Updated weekly.

QA Checklist: No duplicate SKUs, all categories assigned, SEO preview valid.

🧭 Example Commands

NEW SOP ENTRY → Store SOP, tag only.

DONE WITH INPUT → Move to structuring (Phase 2).

EXECUTE ON PRODUCTS → Apply Playbook rules.

VALIDATE → Perform QA & corrections.

SCALE → Move into governance/automation.

🚀 Engineering Principles

Separation of phases – no premature processing.

Living system – Playbook evolves.

Human-in-loop – Business input required for edge cases.

Audit-ready – Every field tied to SOP or JSON dictionary.
