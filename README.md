# 🛠 Shopify Product Cleanup & Standardisation

## 🎯 Project Goal
To build a repeatable, scalable framework for cleaning, standardizing, and governing product data in Shopify using official SOPs, best practices, controlled vocabularies, and automation:contentReference[oaicite:0]{index=0}.  

---

## 📂 Phase Framework

### Phase 1 – Input (Collect SOPs)  
- Collect SOPs from Shopify Help.  
- Store raw, tagged SOPs (category, source URL, date).  
- No processing until user confirms with **`DONE WITH INPUT`**:contentReference[oaicite:1]{index=1}.  

### Phase 2 – Structuring (Playbook)  
- Summarize SOPs into a single reference.  
- Resolve contradictions and overlaps.  
- Organize into Playbook sections: Titles, Descriptions, Media, Variants, SEO, Tags, Collections.  
- Highlight where business-specific choices are required:contentReference[oaicite:2]{index=2}.  

### Phase 3 – Execution (Apply & Automate)  
- Draft title/description/SEO templates.  
- Define cleanup workflows (manual + bulk edit).  
- Apply rules to pilot batch of products.  
- Govern with controlled vocabulary, banned terms, and category alignment:contentReference[oaicite:3]{index=3}:contentReference[oaicite:4]{index=4}.  

### Phase 4 – Validation (QA & Optimisation)  
- Spot-check products.  
- Compare SEO/CTR/conversion outcomes.  
- Refine Playbook rules.  

### Phase 5 – Institutionalisation (Governance & Scaling)  
- Maintain a **living document**.  
- Build training & onboarding modules.  
- Implement audits (monthly/quarterly).  
- Set up automation/AI flagging for non-standard entries:contentReference[oaicite:5]{index=5}.  

---

## 📌 Always-On Chat Instructions
- Detect current phase on session start.  
- Behave as collector/synthesizer/executor/validator/governor depending on phase.  
- Summarize progress explicitly.  
- Wait for `DONE WITH INPUT` before switching from Phase 1 to Phase 2:contentReference[oaicite:6]{index=6}.  

---

## 🔧 JSON Rule Files

### 1. **Banned Terms** (`banned_terms.json`)  
Defines forbidden marketing phrases and safe alternatives.  
- Blocks fluff like *“hochwertig”*, *“beste Qualität”*.  
- Enforces contextual overrides (e.g., *“einzigartig”* allowed only for limited motifs):contentReference[oaicite:7]{index=7}.  

### 2. **Category Alignment** (`category_alignment.json`)  
Category-specific rules:  
- Required keywords.  
- Forbidden themes.  
- Category-specific **closing line templates** for product descriptions:contentReference[oaicite:8]{index=8}.  

### 3. **Keyword Dictionary** (`keyword_dictionary.json`)  
Controlled vocabularies:  
- **Primary keywords** (must appear in titles/SEO).  
- **Secondary keywords** (supporting terms).  
- **Attribute keywords** (variants, sizes, colors, materials).  
- Coverage includes Korbböden, Bastelsets, Acrylfarben, Effektpasten, Jewelry Making, Seasonal Decor, etc.:contentReference[oaicite:9]{index=9}  

### 4. **Collection Aliases** (`collection_aliases.json`)  
Maps messy collection handles to canonical category names.  
- Example: `grundmaterial_zum_korb_flechten` → **Korbböden / Peddigrohr**  
- Ensures consistency across tags, product types, and collections:contentReference[oaicite:10]{index=10}.  

---

## 📘 SOP References

### Phase 2 Reference Guide  
- **SOP-001 Produktdetails** – Baseline product fields.  
- **SOP-002 SKU-Formate** – SKU schema & validation.  
- **SOP-003 Produktdetailseite** – Full product field schema.  
- **SOP-004 Standard-Produkttaxonomie** – Google/Shopify category alignment.  
- **SOP-005 Produkttypen** – Internal types vs categories.  
- **SOP-006 Tag-Formate** – Tagging rules.  
- **SOP-007 Metafelder** – Structured data extensions:contentReference[oaicite:11]{index=11}.  

### Phase 3 Gold Standard  
Defines **field-by-field cleanup rules** for Shopify export schema (~3,500 SKUs).  
- Titles, Descriptions, SEO  
- Options, Variants, Media  
- Google Shopping fields  
- Reviews & Metafields  
- Status, QA, Governance:contentReference[oaicite:12]{index=12}:contentReference[oaicite:13]{index=13}  

---

## 📂 Supporting Data

- **Google Product Taxonomy**: Full official hierarchy for mapping categories:contentReference[oaicite:14]{index=14}.  
- **Controlled Vocabulary**: Updated weekly.  
- **QA Checklist**: No duplicate SKUs, all categories assigned, SEO preview valid.  

---

## 🧭 Example Commands
- **`NEW SOP ENTRY`** → Store SOP, tag only.  
- **`DONE WITH INPUT`** → Move to structuring (Phase 2).  
- **`EXECUTE ON PRODUCTS`** → Apply Playbook rules.  
- **`VALIDATE`** → Perform QA & corrections.  
- **`SCALE`** → Move into governance/automation:contentReference[oaicite:15]{index=15}.  

---

## 🚀 Engineering Principles
- **Separation of phases** – no premature processing.  
- **Living system** – Playbook evolves.  
- **Human-in-loop** – Business input required for edge cases.  
- **Audit-ready** – Every field tied to SOP or JSON dictionary:contentReference[oaicite:16]{index=16}.  
