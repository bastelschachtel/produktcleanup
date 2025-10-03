/************ Shopify Product Cleanup — Sheets Edition (v1.0) ************/

const LIMITS = { TITLE:70, SEO_TITLE:60, SEO_DESC_MIN:155, SEO_DESC_MAX:160 };
const IMMUTABLES = new Set(['Handle','Image Src','Variant Image','ID','Variant ID']);
const SKU_RE = /^[A-Z0-9_-]{2,16}$/;

/** PHASE 1: Critical loadConfig function - loads all JSON configs from Config sheet */
function loadConfig(shCfg) {
  const range = shCfg.getDataRange().getValues();
  const CFG = {};
  
  console.log(`Loading config from ${range.length} rows in Config sheet`);
  
  for (let i = 0; i < range.length; i++) {
    const key = String(range[i][0] || '').trim();
    const value = String(range[i][1] || '').trim();
    
    if (!key || !value) {
      console.log(`Skipping row ${i+1}: empty key or value`);
      continue;
    }
    
    console.log(`Processing config key: "${key}"`);
    
    try {
      let parsedValue = JSON.parse(value);
      
      // Map specific config keys to CFG object properties
      switch (key) {
        case 'banned_terms_json':
        case 'banned_terms':
          CFG.BANNED_TERMS = parsedValue.banned_terms || parsedValue;
          break;
        case 'category_alignment_json':
        case 'category_alignment':
          CFG.CAT_ALIGN = parsedValue.categories || parsedValue;
          break;
        case 'keyword_dictionary_json':
        case 'keyword_dictionary':
          CFG.KEYWORDS = parsedValue.dictionary || parsedValue;
          break;
        case 'collection_aliases_json':
        case 'collection_aliases':
          CFG.COLLECTION_ALIASES = parsedValue.aliases || parsedValue;
          break;
        case 'collection_seo_descriptions_json':
        case 'collection_seo_descriptions':
          CFG.COLLECTION_SEO = parsedValue;
          break;
        case 'sop_phase3_rules_json':
        case 'sop_phase3_rules':
          CFG.SOP_RULES = parsedValue;
          break;
        case 'known_vendors_json':
        case 'known_vendors':
          CFG.KNOWN_VENDORS = parsedValue;
          break;
        case 'google_taxonomy_map_json':
        case 'google_taxonomy_map':
          CFG.GOOGLE_TAX_MAP = parsedValue;
          break;
        case 'tag_relevance_map_json':
        case 'tag_relevance_map':
          CFG.TAG_RELEVANCE_MAP = parsedValue;
          break;
        case 'seo_template_json':
        case 'seo_template':
          CFG.SEO_TEMPLATE = parsedValue;
          break;
        case 'category_keywords_inference_json':
        case 'category_keywords_inference':
          CFG.CATEGORY_KEYWORDS_INFERENCE = parsedValue;
          break;
        // Phase 2 preparation
        case 'structural_tags_json':
        case 'structural_tags':
          CFG.STRUCTURAL_TAGS = parsedValue;
          break;
        case 'tag_generation_rules_json':
        case 'tag_generation_rules':
          CFG.TAG_GENERATION_RULES = parsedValue;
          break;
        default:
          CFG[key] = parsedValue;
      }
    } catch (error) {
      console.log(`Failed to parse config key "${key}": ${error.message}`);
      console.log(`JSON content preview: ${value.substring(0, 100)}...`);
      throw new Error(`Failed to parse config key "${key}": ${error.message}. JSON content: ${value}`);
    }
  }
  
  console.log('Final CFG object keys:', Object.keys(CFG));
  return CFG;
}

// --- Helper to show messages ---
function notify(msg, title, seconds) {
  SpreadsheetApp.getActiveSpreadsheet().toast(
    msg,
    title || 'Product Cleanup',
    seconds || 3
  );
}

// --- Helper: ensure sheet exists or throw error ---
function mustSheet(spreadsheet, sheetName) {
  const sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Missing required sheet: "${sheetName}". Please run "Setup Sheets & Config" first.`);
  }
  return sheet;
}

// --- Helper: escape special regex characters ---
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// --- Helper: strip HTML tags from string ---
function stripHtml(html) {
  if (!html) return '';
  return String(html).replace(/<[^>]*>/g, '').trim();
}

// --- Helper: validate row data and add validation issues ---
function validateRow(row, issues, rowNumber, productTitle, ctx, CFG) {
  // Basic validations can be added here
  // For now, this is a placeholder to prevent the "not defined" error
  return;
}

// --- Helper: Re-validate tags with updated category from Phase 4 ---
function revalidateTagsWithUpdatedCategory(row, issues, rowNumber, productTitle, ctx, CFG) {
  const tags = (row['Tags'] || '').split(',').map(tag => tag.trim()).filter(Boolean);
  const productCategory = (row['Product Category'] || '').toLowerCase();
  
  // Only proceed if we have a meaningful category (not "uncategorized")
  if (!productCategory || productCategory === 'uncategorized' || productCategory === 'allgemein') {
    return; // Skip validation if category is still not properly assigned
  }
  
  // Check category alignment with updated category
  const categoryKeywords = new Set();
  if (CFG.KEYWORDS && CFG.KEYWORDS[productCategory]) {
    const catData = CFG.KEYWORDS[productCategory];
    ['primary', 'secondary', 'attributes'].forEach(type => {
      if (catData[type]) {
        catData[type].forEach(keyword => {
          categoryKeywords.add(keyword.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, ''));
        });
      }
    });
  }
  
  // Re-validate each tag against the updated category
  for (const tag of tags) {
    if (categoryKeywords.size > 0 && !categoryKeywords.has(tag)) {
      // Only warn if tag clearly doesn't align with updated category
      const isGenericCraftTerm = ['basteln', 'kreativ', 'diy', 'hobby', 'handwerk'].includes(tag);
      if (!isGenericCraftTerm) {
        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, tag, `Tag '${tag}' may not align with updated product category '${row['Product Category']}'`, 'info', ctx.phase);
      }
    }
  }
}

// --- Helper: read sheet data as table with headers ---
function readTable(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length === 0) return { headers: [], rows: [] };
  
  const headers = data[0];
  const rows = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
  
  return { headers, rows };
}

// --- Helper: write table data to sheet ---
function writeTable(sheet, headers, rows) {
  sheet.clear();
  if (rows.length === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    return;
  }
  
  const data = [headers];
  rows.forEach(row => {
    const rowData = headers.map(header => row[header] || '');
    data.push(rowData);
  });
  
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  
  // Auto-resize columns for better readability
  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
    
    // Limit extremely wide columns for practical viewing
    const currentWidth = sheet.getColumnWidth(col);
    if (currentWidth > 400) {
      sheet.setColumnWidth(col, 400);
    }
    if (currentWidth < 80) {
      sheet.setColumnWidth(col, 80);
    }
  }
}

// --- Helper: write issues to Issues sheet ---
function writeIssues(sheet, issues) {
  sheet.clear();
  
  if (issues.length === 0) {
    sheet.getRange(1, 1, 1, 9).setValues([['Row', 'Timestamp', 'Handle', 'Product Title', 'Field', 'Original', 'Updated', 'Reason', 'Severity', 'Phase']]);
    return;
  }
  
  const headers = ['Row', 'Timestamp', 'Handle', 'Product Title', 'Field', 'Original', 'Updated', 'Reason', 'Severity', 'Phase'];
  const data = [headers];
  
  issues.forEach(issue => {
    data.push([
      issue.rowNumber,
      issue.timestamp,
      issue.handle,
      issue.productTitle,
      issue.field,
      issue.original,
      issue.updated,
      issue.reason,
      issue.severity,
      issue.phase
    ]);
  });
  
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  
  // Format headers
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#e8f0fe');
  
  // Enhanced auto-resize: Resize each column individually for better fit
  for (let col = 1; col <= headers.length; col++) {
    sheet.autoResizeColumn(col);
    
    // Set maximum widths for specific columns to prevent excessive width
    const currentWidth = sheet.getColumnWidth(col);
    const maxWidths = {
      1: 80,   // Row number
      2: 150,  // Timestamp  
      3: 200,  // Handle
      4: 250,  // Product Title
      5: 150,  // Field
      6: 300,  // Original (can be long for HTML content)
      7: 300,  // Updated (can be long for HTML content)
      8: 400,  // Reason (often contains detailed explanations)
      9: 80,   // Severity
      10: 60   // Phase
    };
    
    const maxWidth = maxWidths[col] || 200;
    if (currentWidth > maxWidth) {
      sheet.setColumnWidth(col, maxWidth);
    }
    
    // Set minimum widths for readability
    const minWidth = col === 1 || col === 9 || col === 10 ? 60 : 100;
    if (currentWidth < minWidth) {
      sheet.setColumnWidth(col, minWidth);
    }
  }
}

// --- Helper: collect an issue entry into the in-memory list ---
function pushIssue(issues, rowNumber, handle, productTitle, field, original, updated, reason, severity, phase) {
  issues.push({
    rowNumber: rowNumber,
    timestamp: new Date(),
    handle: String(handle || ''),
    productTitle: String(productTitle || ''),
    field: String(field || ''),
    original: original === undefined || original === null ? '' : String(original),
    updated: updated === undefined || updated === null ? '' : String(updated),
    reason: String(reason || ''),
    severity: (severity || 'info').toLowerCase(), // 'error' | 'warn' | 'info'
    phase: String(phase || '')
  });
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🔧 Product Cleanup')
    .addItem('Validate Only (Dry Run)', 'validateOnly')
    .addItem('▶ Run Full Cleanup', 'runFull')
    .addSeparator()
    .addItem('Setup Sheets & Config', 'setupSheetsAndConfig')
    .addItem('Test Config Load', 'testConfigLoad') 
    .addItem('Validate Config JSONs', 'validateConfigSheet')
    .addItem('📊 Check Config JSON Sizes', 'validateConfigJsonSizes')
    .addItem('🔄 Sync Local JSON to Config', 'syncLocalJsonToConfig')
    .addItem('🧪 Test SEO Description Fix', 'testSeoDescriptionFix')
    .addSeparator()
    .addItem('Generate Summary Report', 'generateSummaryReport')
    .addItem('Clear All Outputs', 'clearAllOutputs')
    .addSeparator()
    .addItem('Save Sheet Data for Gemini', 'saveSheetDataLocally')
    .addToUi();
}

/** Wrappers for the pipeline */
function validateOnly() { runPipeline({ mutate: false }); }
function runFull()      { runPipeline({ mutate: true  }); }

function runPipeline(opts){
  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(1000)) throw new Error('Another run is in progress.');

  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActive();
  const shIn   = mustSheet(ss,'Input');
  const shOut  = mustSheet(ss,'Output');
  const shIssues = mustSheet(ss,'Issues');
  const shCfg  = mustSheet(ss,'Config');

  try {
    notify('Loading config…', 'Product Cleanup', 3);
    const CFG = loadConfig(shCfg);
    
    // CRITICAL: Validate essential config sections loaded
    if (!CFG.BANNED_TERMS) {
      console.log('WARNING: banned_terms not loaded. Using empty fallback.');
      CFG.BANNED_TERMS = {};
    }
    if (!CFG.GOOGLE_TAX_MAP) {
      console.log('WARNING: google_taxonomy_map not loaded. Using empty fallback.');
      CFG.GOOGLE_TAX_MAP = {};
    }
    
    // Log what was actually loaded for debugging
    console.log('Config loaded successfully with keys:', Object.keys(CFG));

    notify('Reading input…', 'Product Cleanup', 3);
    const {headers, rows} = readTable(shIn);
    if (!headers.includes('Handle')) throw new Error('Input missing "Handle" column.');

    const issues = [];
    const cleaned = [];
    const total = rows.length;
    const batchSize = 50;

    const groupedByHandle = rows.reduce((acc, row) => {
      const handle = row['Handle'] || '';
      if (!acc[handle]) {
        acc[handle] = [];
      }
      acc[handle].push(row);
      return acc;
    }, {});

    let i = 0;
    for (const handle in groupedByHandle) {
      const productRows = groupedByHandle[handle];
      const parentRow = productRows[0]; // The first row is the parent

      for (let j = 0; j < productRows.length; j++) {
        let productTitle = '';
        let ctx = { phase:'', errors:0 };
        try {
          const row = {...productRows[j]}; // work copy
          const isParent = j === 0;
          productTitle = row['Title'] || '';
          const rowNumber = i + 2;
          ctx = { phase:'', errors:0 };

        // PHASE 1 — Basic validation
        ctx.phase = '1';
        if (!handle){
          pushIssue(issues, rowNumber, handle, productTitle, 'Handle', '', '', 'Missing handle', 'error', ctx.phase);
          ctx.errors++;
          continue;
        }

        // PHASE 2 — Normalize & categorize
        ctx.phase = '2';
        normalizeVendor(row, issues, rowNumber, productTitle, ctx, CFG);
        
        // PHASE 1 FIX: Variant category inheritance (ready for Phase 2 enhancement)
        if (isParent) {
          // Parent products: Run category assignment (Phase 2 will enhance with dynamic scoring)
          scoreAndAssignCategory(row, issues, rowNumber, productTitle, ctx, CFG);
          // Store parent category for variants
          parentRow['Product Category'] = row['Product Category'];
        } else {
          // Variant products: Inherit category from parent
          if (parentRow['Product Category']) {
            const inheritedCategory = parentRow['Product Category'];
            row['Product Category'] = inheritedCategory;
            pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Product Category', '', inheritedCategory, 'Inherited from parent product', 'info', ctx.phase);
          } else {
            // Fallback: Run category mapping for orphaned variants
            scoreAndAssignCategory(row, issues, rowNumber, productTitle, ctx, CFG);
          }
        }

        // PHASE 3a — Title
        ctx.phase = '3a';
        const titleNew = cleanupTitle(row['Title'], CFG);
        if (opts.mutate && titleNew !== row['Title']) {
          pushIssue(issues, rowNumber, handle, productTitle, 'Title', row['Title'], titleNew, 'Title normalized', 'info', ctx.phase);
          row['Title'] = titleNew;
        }

        // PHASE 3b — Body (HTML)
        ctx.phase = '3b';
        const bodyNew = restructureBody(row, issues, rowNumber, productTitle, ctx, CFG);
        if (opts.mutate && bodyNew !== row['Body (HTML)']) {
          pushIssue(issues, rowNumber, handle, productTitle, 'Body (HTML)', '(modified)', '(see Output)', 'Body restructured with SEO template', 'info', ctx.phase);
          row['Body (HTML)'] = bodyNew;
        }

        // PHASE 3c — SEO (preview or write)
        if (isParent) {
            ctx.phase = '3c';
            const originalSeoTitle = row['SEO Title'] || '';
            const originalSeoDesc = row['SEO Description'] || '';

            const built = buildSEO(originalSeoTitle, originalSeoDesc, row['Title'], row['Product Category'], CFG, row);

            if (opts.mutate) {
                // Always apply standardized SEO per SOP rules
                if (built.seoTitle !== originalSeoTitle) {
                    pushIssue(issues, rowNumber, handle, productTitle, 'SEO Title', originalSeoTitle, built.seoTitle, 'SEO title standardized per SOP', 'info', ctx.phase);
                }
                row['SEO Title'] = built.seoTitle;
                
                if (built.seoDesc !== originalSeoDesc) {
                    pushIssue(issues, rowNumber, handle, productTitle, 'SEO Description', originalSeoDesc, built.seoDesc, 'SEO description standardized per SOP', 'info', ctx.phase);
                }
                row['SEO Description'] = built.seoDesc;
                
            } else {
                // Validate mode - show what would be generated
                pushIssue(issues, rowNumber, handle, productTitle, 'SEO Title (suggested)', originalSeoTitle, built.seoTitle, 'Preview only (Validate Mode)', 'info', ctx.phase);
                pushIssue(issues, rowNumber, handle, productTitle, 'SEO Description (suggested)', originalSeoDesc, built.seoDesc, 'Preview only (Validate Mode)', 'info', ctx.phase);
            }
        } else {
            row['SEO Title'] = '';
            row['SEO Description'] = '';
        }

        // PHASE 3d — Variants & technicals
        ctx.phase = '3d';
        const vChanges = normalizeVariants(row, CFG);
        vChanges.forEach(ch => pushIssue(issues, rowNumber, handle, productTitle, ch.field, ch.original, ch.updated, ch.reason, ch.severity, ctx.phase));

        // PHASE 3e — Tags (Initial cleanup without category validation)
        ctx.phase = '3e';
        cleanupTags(row, issues, rowNumber, productTitle, ctx, CFG);

        // PHASE 4 — Validation & Google Shopping
        ctx.phase = '4';
        applyGoogleShopping(row, issues, rowNumber, productTitle, ctx, CFG);
        
        // PHASE 4b — Re-validate tags with updated category
        ctx.phase = '4b';
        revalidateTagsWithUpdatedCategory(row, issues, rowNumber, productTitle, ctx, CFG);
        
        validateRow(row, issues, rowNumber, productTitle, ctx, CFG);

        // Preserve immutables explicitly
        IMMUTABLES.forEach(h => row[h] = productRows[j][h]);

          cleaned.push(opts.mutate ? row : productRows[j]);

          // Progress
          if ((i+1) % batchSize === 0 || i === rows.length - 1) {
            notify(`Processed ${i+1}/${total}`, 'Product Cleanup', 3);
            SpreadsheetApp.flush();
          }
          i++;
        } catch (rowError) {
          // CRITICAL: Individual row error handling
          pushIssue(issues, i + 2, handle, productTitle || 'Unknown', 'System', '', '', `Row processing failed: ${rowError.message}`, 'error', ctx?.phase || 'unknown');
          if (ctx) ctx.errors++;
          i++;
          // Continue processing other rows
        }
      }
    } // end for

    // Write outputs
    writeTable(shOut, headers, cleaned);
    writeIssues(shIssues, issues);

    // Summary
    const err = issues.filter(x => x.severity === 'error').length;
    const warn = issues.filter(x => x.severity === 'warn').length;
    ui.alert(`Done. Rows: ${cleaned.length}. Issues: ${issues.length} (errors: ${err}, warnings: ${warn}). Mode: ${opts.mutate ? 'Full Cleanup' : 'Validate Only'}`);
  } catch (e) {
    const fullErrorMessage = 'Cleanup failed: ' + e.message + (e.jsonContent ? '\nJSON content: ' + e.jsonContent : '');
    console.error(fullErrorMessage); // Log full error to Apps Script console
    ui.alert('Cleanup failed. See Apps Script logs for full details.'); // Concise UI message
    throw e;
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- Core transforms ---------------- */

function normalizeVendor(row, issues, rowNumber, productTitle, ctx, CFG){
  let vendor = (row['Vendor'] || '').trim();
  const knownVendors = CFG.KNOWN_VENDORS || {};
  const title = (row['Title'] || '').toLowerCase();
  const description = (row['Body (HTML)'] || '').toLowerCase();
  const handle = (row['Handle'] || '').toLowerCase();
  const collections = (row['Collections'] || '').toLowerCase();
  const productCategory = (row['Product Category'] || '').toLowerCase();

  let finalVendor = vendor;
  let reason = '';

  // Rule for Reispapier
  if (productCategory === 'reispapier') {
    finalVendor = 'Itd Collection';
    reason = 'Vendor set to Itd Collection for Reispapier';
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', vendor, finalVendor, reason, 'info', ctx.phase);
    row['Vendor'] = finalVendor;
    return;
  }

  // Rule for Korbboden
  if (productCategory === 'korbboden') {
    finalVendor = 'Istvan';
    reason = 'Vendor set to Istvan for Korbboden';
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', vendor, finalVendor, reason, 'info', ctx.phase);
    row['Vendor'] = finalVendor;
    return;
  }

  if (vendor) {
    // Vendor field is filled, verify it
    const re = new RegExp(`\\b${escapeRegExp(vendor.toLowerCase())}\\b`);
    if (!re.test(title) && !re.test(description)) {
      reason = `Vendor \"${vendor}\" not mentioned in title or description.`;
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', vendor, vendor, reason, 'warn', ctx.phase);
    }
  } else {
    // Vendor field is empty, try to infer it
    let inferredVendor = '';
    for (const known in knownVendors) {
      const re = new RegExp(`\\b${escapeRegExp(known.toLowerCase())}\\b`);
      if (re.test(title) || re.test(description) || re.test(handle)) {
        inferredVendor = knownVendors[known];
        reason = `Inferred vendor \"${inferredVendor}\" from product data.`;
        break;
      }
    }
    if (inferredVendor) {
      finalVendor = inferredVendor;
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', '', finalVendor, reason, 'info', ctx.phase);
    }
  }

  // Special checks for Bastelschachtel
  if (finalVendor.toLowerCase() === 'bastelschachtel') {
    const handmadeKeywords = ['handmade', 'die bastelschachtel ecke', 'unsere bastelecke', 'handgegossen', 'beton', 'handgemacht'];
    const isHandmade = handmadeKeywords.some(keyword => title.includes(keyword) || collections.includes(keyword));
    if (!isHandmade) {
      finalVendor = '';
      reason = 'Vendor set to Bastelschachtel, but product does not seem to be handmade. Please verify.';
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', 'Bastelschachtel', '', reason, 'warn', ctx.phase);
    }
  }

  // If vendor is still unknown, leave it as it is.
  if (!finalVendor && !reason) {
      // reason = 'Could not determine vendor.';
      // pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Vendor', '', '', reason, 'warn', ctx.phase);
  }

  row['Vendor'] = finalVendor;
}

function mapCollectionsAndCategory(row, issues, rowNumber, productTitle, ctx, CFG){
  // Ensure 'Product Category' exists and is a string before trimming
  const existing = (row['Product Category'] ? String(row['Product Category']) : '').trim();
  const collections = (row['Collections'] ? String(row['Collections']) : '').toLowerCase().split(',').map(s=>s.trim()).filter(Boolean);
  let mappedCategory = existing;

  Logger.log(`[mapCollectionsAndCategory] Product: ${productTitle}, Initial Category: '${existing}', Collections: '${collections.join(',')}'`);

  for (const c of collections){
    if (CFG.COLLECTION_ALIASES[c]){
      const mapped = CFG.COLLECTION_ALIASES[c];
      if (typeof mapped === 'string' && mapped && mapped!==existing){
        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Product Category', existing, mapped, 'Mapped via collection_aliases', 'info', ctx.phase);
        mappedCategory = mapped;
        Logger.log(`[mapCollectionsAndCategory] Mapped Category: '${mappedCategory}' via alias '${c}'`);
        break;
      }
    }
  }

  // ENHANCED LOGIC: Smart Category Inference from Comprehensive Keyword Dictionary
  if (!mappedCategory || mappedCategory === existing) {
    const title = (row['Title'] || '').toLowerCase();
    const description = stripHtml(row['Body (HTML)'] || '').toLowerCase();
    const textToAnalyze = `${title} ${description}`;
    
    let bestCategory = '';
    let bestScore = 0;
    const minThreshold = 2; // Minimum keyword matches required
    
    // Use the comprehensive keyword dictionary for category inference
    const keywordDict = CFG.KEYWORDS || {};
    
    for (const category in keywordDict) {
      const categoryKeywords = keywordDict[category];
      let score = 0;
      
      // Primary keywords (highest weight)
      (categoryKeywords.primary || []).forEach(keyword => {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          score += 3;
        }
      });
      
      // Secondary keywords (medium weight)  
      (categoryKeywords.secondary || []).forEach(keyword => {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
      
      // Attribute keywords (lower weight)
      (categoryKeywords.attribute || []).forEach(keyword => {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          score += 1;
        }
      });
      
      if (score > bestScore && score >= minThreshold) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // Fallback to simple keyword inference if comprehensive matching fails
    if (!bestCategory) {
      const inferenceMap = CFG.CATEGORY_KEYWORDS_INFERENCE || {};
      for (const keyword in inferenceMap) {
        if (textToAnalyze.includes(keyword.toLowerCase())) {
          bestCategory = inferenceMap[keyword];
          bestScore = 1;
          break;
        }
      }
    }
    
    if (bestCategory) {
      const confidence = bestScore >= 6 ? 'HIGH' : bestScore >= 4 ? 'MEDIUM' : 'LOW';
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Product Category', existing, bestCategory, `Smart category inference (${confidence} confidence: ${bestScore} points)`, 'info', ctx.phase);
      mappedCategory = bestCategory;
      Logger.log(`[mapCollectionsAndCategory] Smart Inferred Category: '${mappedCategory}' (score: ${bestScore})`);
    }
  }

  // Original FALLBACK: If no category mapped, use default
  if (!mappedCategory && CFG.SOP_RULES?.seo_rules?.default_product_category) {
    const defaultCategory = CFG.SOP_RULES.seo_rules.default_product_category;
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Product Category', existing, defaultCategory, 'Default category assigned', 'info', ctx.phase);
    mappedCategory = defaultCategory;
    Logger.log(`[mapCollectionsAndCategory] Assigned Default Category: '${mappedCategory}'`);
  }
  row['Product Category'] = mappedCategory;
  Logger.log(`[mapCollectionsAndCategory] Final Category for ${productTitle}: '${row['Product Category']}'`);
  return mappedCategory;
}

function cleanupTitle(orig, CFG){
  let t = stripHtml(orig||'').trim();
  // replace banned terms (word boundary)
  for (const bad in CFG.BANNED_TERMS){
    const re = new RegExp(`\\b${escapeRegExp(bad)}\\b`, 'gi');
    t = t.replace(re, CFG.BANNED_TERMS[bad]);
  }
  // ALL CAPS → Title Case (only if fully caps)
  if (t && t === t.toUpperCase()) t = toTitleCase(t);
  if (t.length>LIMITS.TITLE) t = t.slice(0,LIMITS.TITLE).trim();
  return t;
}

function getProductUrl(handle, CFG) {
  const domain = CFG.SOP_RULES?.seo_rules?.shop_domain || 'your-shop.myshopify.com';
  return `https://${domain}/products/${handle}`;
}

function generateSeoBody(row, CFG) {
  if (!CFG.SEO_TEMPLATE || !CFG.SEO_TEMPLATE.body_html) {
    throw new Error('SEO body template is not configured. Please check the "seo_template_json" key in your Config sheet.');
  }
  const template = CFG.SEO_TEMPLATE.body_html;
  const productUrl = getProductUrl(row['Handle'], CFG);
  const imageUrl = row['Image Src'] || '';

  // Basic placeholders
  let content = template.replace(/\[PRODUCT_TITLE\]/g, row['Title'] || '')
                        .replace(/\[PRODUCT_DESCRIPTION\]/g, row['SEO Description'] || '')
                        .replace(/\[PRODUCT_URL\]/g, productUrl)
                        .replace(/\[PRODUCT_IMAGE_URL\]/g, imageUrl)
                        .replace(/\[PRODUCT_SKU\]/g, row['Variant SKU'] || '')
                        .replace(/\[PRODUCT_MPN\]/g, row['Variant Barcode'] || '')
                        .replace(/\[PRODUCT_VENDOR\]/g, row['Vendor'] || '')
                        .replace(/\[CURRENCY\]/g, row['Variant Price Currency'] || 'EUR')
                        .replace(/\[PRODUCT_PRICE\]/g, row['Variant Price'] || '0.00')
                        .replace(/\[SITE_NAME\]/g, CFG.SOP_RULES?.seo_rules?.site_name || 'My Shop');

  // Visible body - use existing cleaned content
  const visibleBody = buildNewBodyFromTemplate(row['Product Category'], CFG, row['Title'], row['Vendor'], row);
  content = content.replace(/\[PRODUCT_BODY_HTML\]/g, visibleBody);

  return content;
}

function extractYoutubeContent(html) {
  let youtubeContent = '';
  const youtubeRegex = /<iframe[^>]*(?:youtube\.com\/embed|youtu\.be)[^>]*><\/iframe>|https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/gi;
  const youtubeMatches = html.match(youtubeRegex);

  if (youtubeMatches) {
    youtubeContent = youtubeMatches.map(match => {
      if (match.startsWith('http')) {
        return `<p><a href=\"${match}\" target=\"_blank\">Video ansehen</a></p>`;
      }
      return match;
    }).join('\n');
    html = html.replace(youtubeRegex, '').trim(); // Remove YouTube content from original HTML
  }
  return { youtubeContent, cleanedHtml: html };
}

function restructureBody(row, issues, rowNumber, productTitle, ctx, CFG) {
  let html = (row['Body (HTML)'] || '').toString().trim();
  let productCategory = row['Product Category']; // Get product category for logging

  // a. Sanitize the initial HTML
  html = cleanVisibleHtml(html);

  // b. Call extractYoutubeContent
  const { youtubeContent, cleanedHtml } = extractYoutubeContent(html);
  html = cleanedHtml; // Update html to be the cleaned version (without YouTube)

  // c. Call assessContentQuality on the remaining HTML
  const quality = assessContentQuality(html);

  let finalBody = '';
  let bodyReason = '';

  // d. Generate the seoMetadata string
  const seoMetadata = generateSeoMetadata(row, CFG);
  // e. Initialize finalBody with seoMetadata
  finalBody += seoMetadata;

  // f. Use a switch statement or if/else if/else block based on the returned quality level
  switch (quality) {
    case 'HIGH':
      finalBody += html; // Append preserved content
      bodyReason = 'Body preserved - high quality existing content.';
      break;
    case 'MEDIUM':
      finalBody += augmentMediumQualityContent(html, productCategory, CFG, row); // Augment and append
      bodyReason = 'Body augmented - medium quality existing content.';
      break;
    case 'LOW':
    default:
      finalBody += buildNewBodyFromTemplate(productCategory, CFG, row['Title'], row['Vendor'], row); // Regenerate and append
      bodyReason = 'Body regenerated - low quality existing content.';
      break;
  }

  // Log the decision
  pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Body (HTML)', row['Body (HTML)'], finalBody, bodyReason, 'info', '3b');

  // g. Append the youtubeContent to finalBody
  if (youtubeContent) {
    finalBody += '\n' + youtubeContent;
  }

  // h. Call ensureClosingLine on finalBody
  finalBody = ensureClosingLine(finalBody, productCategory, CFG);
  
  // i. Generate the jsonLdScript
  const jsonLdScript = generateJsonLdProduct(row, CFG);
  // j. Append jsonLdScript to finalBody
  finalBody += '\n' + jsonLdScript;

  // k. Return finalBody
  return finalBody;
}

function ensureClosingLine(existingHtml, cat, CFG) {
  let html = existingHtml;
  
  // Ensure proper paragraph structure
  if (!html.startsWith('<p>') && html.trim()) {
    const firstLineMatch = html.match(/^([^<]*)/);
    if (firstLineMatch && firstLineMatch[1].trim()) {
      html = html.replace(firstLineMatch[1], `<p>${firstLineMatch[1].trim()}</p>`);
    }
  }
  
  // Get category-specific closing line
  const alignment = CFG.CAT_ALIGN[cat] || {};
  let closingLine = alignment.closing_line_templates?.[0];

  // Categories where generic closing should NOT be applied
  const excludedCategoriesForGenericClosing = ['schule']; // User mentioned 'schule'

  if (!closingLine && !excludedCategoriesForGenericClosing.includes(cat.toLowerCase())) {
    closingLine = CFG.SOP_RULES?.seo_rules?.generic_closing || 'Für kreative Projekte und saubere Ergebnisse.';
  } else if (!closingLine) {
    // Fallback if no specific closing line and generic is excluded
    closingLine = 'Für kreative Projekte und saubere Ergebnisse.'; // Default fallback
  }
  
  // Check if closing line already exists
  const closingExists = html.includes('class=\"closing-line\"');
  
  if (!closingExists) {
    html += `\n<p class=\"closing-line\">${closingLine}</p>`;
  }
  
  return html;
}

function assessContentQuality(html) {
  const plainText = stripHtml(html);
  const length = plainText.length;

  if (length > 200) {
    // Check for meaningful paragraphs or lists (a simple heuristic)
    if (html.includes('<p>') || html.includes('<ul>') || html.includes('<ol>')) {
      return 'HIGH';
    }
  }
  if (length > 50) {
    return 'MEDIUM';
  }
  return 'LOW';
}

function cleanVisibleHtml(html) {
    if (!html) return '';
    let cleaned = html;
    // Strip all HTML comments
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
    // Strip meta, link, and script tags that might be in the body
    cleaned = cleaned.replace(/<meta[^>]*>/gi, '');
    cleaned = cleaned.replace(/<link[^>]*>/gi, '');
    cleaned = cleaned.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    // Strip deprecated tags and inline styles
    cleaned = cleaned.replace(/<\/?(font|center)[^>]*>/gi, '');
    cleaned = cleaned.replace(/style="[^"]*"/gi, '');
    // Convert divs to paragraphs for consistency
    cleaned = cleaned.replace(/<div([^>]*)>/gi, '<p$1>').replace(/<\/div>/gi, '</p>');
    // Remove empty paragraphs
    cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');
    return cleaned.trim();
}

function augmentMediumQualityContent(existingHtml, cat, CFG, row) {
  let augmentedHtml = existingHtml;
  const keywords = CFG.KEYWORDS[cat] || {};
  const alignment = CFG.CAT_ALIGN[cat] || {};

  // Add features from category alignment as a list if not already present
  if (alignment.must_include_any_of?.length && !augmentedHtml.includes('<ul>')) {
    let featureList = '\n<ul>';
    alignment.must_include_any_of.slice(0, 4).forEach(feature => {
      featureList += `\n<li>${feature}</li>`;
    });
    featureList += '\n</ul>';
    augmentedHtml += featureList;
  }

  // Add a usage sentence with secondary keywords if not already present
  const secondary = keywords.secondary?.[0] || '';
  if (secondary && !augmentedHtml.includes(secondary.toLowerCase())) {
    augmentedHtml += `\n<p>Ideal für ${secondary.toLowerCase()} und vielseitige Anwendungen.</p>`;
  }

  return augmentedHtml;
}

function buildNewBodyFromTemplate(cat, CFG, title, vendor, row) {
  const keywords = CFG.KEYWORDS[cat] || {};
  const alignment = CFG.CAT_ALIGN[cat] || {};
  let newHtml = '';

  // 1. Generate a new, category-specific introductory sentence
  const primary = keywords.primary?.[0] || '';
  const intro = generateIntroSentence(primary, title, cat, vendor);
  newHtml += `<p>${intro}</p>`;
  
  // 2. Add features from category alignment as a list
  if (alignment.must_include_any_of?.length) {
    newHtml += '\n<ul>';
    alignment.must_include_any_of.slice(0, 4).forEach(feature => {
      newHtml += `\n<li>${feature}</li>`;
    });
    newHtml += '\n</ul>';
  }
  
  // 3. Add a usage sentence with secondary keywords
  const secondary = keywords.secondary?.[0] || '';
  if (secondary) {
    newHtml += `\n<p>Ideal für ${secondary.toLowerCase()} und vielseitige Anwendungen.</p>`;
  }

  // Add more details if newHtml is still short
  if (stripHtml(newHtml).length < 100) { // Arbitrary length to decide if it's still short
    const product_type = row['Type'] || '';
    if (product_type && !newHtml.includes(product_type)) {
      newHtml += `\n<p>Produkttyp: ${product_type}.</p>`;
    }
    const tags = (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean);
    if (tags.length > 0 && !newHtml.includes('tags')) { // Simple check to avoid duplicate tag info
      newHtml += `\n<p>Schlagwörter: ${tags.slice(0, 3).join(', ')}.</p>`;
    }
  }
  
  return newHtml;
}

function extractFirstMeaningfulSentence(html) {
  if (!html) return '';
  // Strip HTML tags and get first sentence
  const plainText = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const sentences = plainText.split(/[.!?]+/);
  
  return sentences[0]?.trim() || '';
}

function generateSeoMetadata(row, CFG) {
  const title = row['Title'] || '';
  let seoTitle = row['SEO Title'] || title;
  let seoDescription = row['SEO Description'] || '';
  const handle = row['Handle'] || '';
  const imageUrl = row['Image Src'] || '';
  const productUrl = getProductUrl(handle, CFG);
  const productCategory = row['Product Category'] || '';
  const vendor = row['Vendor'] || '';
  const siteName = CFG.SOP_RULES?.seo_rules?.site_name || 'My Shop';

  // Fallback for seoTitle
  if (!seoTitle) {
    seoTitle = title || `${productCategory} von ${vendor}` || `Produkt bei ${siteName}`;
  }

  // Fallback for seoDescription
  if (!seoDescription) {
    // Attempt to build a descriptive sentence using available info
    let tempDesc = '';
    if (title) {
      tempDesc += `Entdecken Sie das Produkt '${title}'. `;
    }
    if (productCategory) {
      tempDesc += `Kategorie: ${productCategory}. `;
    }
    if (vendor) {
      tempDesc += `Marke: ${vendor}. `;
    }
    tempDesc += `Jetzt bei ${siteName} entdecken.`;
    seoDescription = tempDesc.trim();
  }

  let metadataHtml = '';

  // Canonical URL
  metadataHtml += `<p><link rel=\"canonical\" href=\"${productUrl}\"></p>`;

  // Meta Description
  metadataHtml += `<p><meta name=\"description\" content=\"${seoDescription}\"></p>`;

  // Open Graph
  metadataHtml += `<p><meta property=\"og:type\" content=\"product\"></p>`;
  metadataHtml += `<p><meta property=\"og:title\" content=\"${seoTitle}\"></p>`;
  metadataHtml += `<p><meta property=\"og:description\" content=\"${seoDescription}\"></p>`;
  metadataHtml += `<p><meta property=\"og:url\" content=\"${productUrl}\"></p>`;
  if (imageUrl) {
    metadataHtml += `<p><meta property=\"og:image\" content=\"${imageUrl}\"></p>`;
    metadataHtml += `<p><meta property=\"og:image:alt\" content=\"${seoTitle} – Produktbild\"></p>`;
    metadataHtml += `<p><meta property=\"og:image:width\" content=\"1200\"></p>`;
    metadataHtml += `<p><meta property=\"og:image:height\" content=\"1200\"></p>`;
  }

  // Twitter Card
  metadataHtml += `<p><meta name=\"twitter:card\" content=\"summary_large_image\"></p>`;
  metadataHtml += `<p><meta name=\"twitter:title\" content=\"${seoTitle}\"></p>`;
  metadataHtml += `<p><meta name=\"twitter:description\" content=\"${seoDescription}\"></p>`;
  if (imageUrl) {
    metadataHtml += `<p><meta name=\"twitter:image\" content=\"${imageUrl}\"></p>`;
  }

  return metadataHtml;
}

function generateJsonLdProduct(row, CFG) {
  const title = row['Title'] || '';
  const description = row['SEO Description'] || '';
  const imageUrl = row['Image Src'] || '';
  const productUrl = getProductUrl(row['Handle'], CFG);
  const brand = row['Vendor'] || '';
  const price = row['Variant Price'] || '0.00';
  const priceCurrency = row['Variant Price Currency'] || 'EUR';
  const sku = row['Variant SKU'] || '';
  const gtin = row['Variant Barcode'] || ''; // Assuming Barcode is GTIN

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": title,
    "image": imageUrl,
    "description": description,
    "sku": sku,
    "mpn": gtin, // Using gtin for mpn as a fallback
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": priceCurrency,
      "price": price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock" // Assuming in stock by default
    }
  };

  return `<script type=\"application/ld+json\">${JSON.stringify(jsonLd, null, 2)}</script>`;
}

function generateIntroSentence(primary, title, category, vendor) { // Added vendor
  const templates = {
    'Glasätzpaste': `${primary} Professionelle Ätzpaste für dauerhafte Frost-Effekte auf Glas.`,
    'Korbböden / Peddigrohr': `${primary} Stabile Grundlage für handgefertigte Flechtarbeiten.`,
    'Paints & Mediums': `${primary} Hochwertige Farben für kreative Gestaltung und künstlerische Projekte.`,
    'Papers & Cardstock': `${primary} Qualitätspapier für Scrapbooking und Bastelarbeiten.`,
    'Jewelry Making': `${primary} Präzise Komponenten für individuelle Schmuckkreationen.`
  };

  let introSentence = templates[category];

  if (!introSentence) {
    if (primary && title) {
      introSentence = `${primary} ${title} für kreative Projekte und professionelle Ergebnisse.`;
    } else if (category && vendor) {
      introSentence = `Entdecken Sie hochwertige ${category} von ${vendor} für Ihre Projekte.`;
    } else if (category) {
      introSentence = `Entdecken Sie unsere ${category} für kreative Projekte.`;
    } else if (title) {
      introSentence = `${title} für kreative Projekte und professionelle Ergebnisse.`;
    } else {
      introSentence = `Ein vielseitiges Produkt für kreative Anwendungen.`;
    }
  }
  return introSentence;
}

function generateJsonLdProduct(row, CFG) {
  const title = row['Title'] || '';
  const description = row['SEO Description'] || '';
  const imageUrl = row['Image Src'] || '';
  const productUrl = getProductUrl(row['Handle'], CFG);
  const brand = row['Vendor'] || '';
  const price = row['Variant Price'] || '0.00';
  const priceCurrency = row['Variant Price Currency'] || 'EUR';
  const sku = row['Variant SKU'] || '';
  const gtin = row['Variant Barcode'] || ''; // Assuming Barcode is GTIN

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": title,
    "image": imageUrl,
    "description": description,
    "sku": sku,
    "mpn": gtin, // Using gtin for mpn as a fallback
    "brand": {
      "@type": "Brand",
      "name": brand
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": priceCurrency,
      "price": price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock" // Assuming in stock by default
    }
  };

  return `<script type=\"application/ld+json\">${JSON.stringify(jsonLd, null, 2)}</script>`;
}

function generateIntroSentence(primary, title, category, vendor) { // Added vendor
  const templates = {
    'Glasätzpaste': `${primary} Professionelle Ätzpaste für dauerhafte Frost-Effekte auf Glas.`,
    'Korbböden / Peddigrohr': `${primary} Stabile Grundlage für handgefertigte Flechtarbeiten.`,
    'Paints & Mediums': `${primary} Hochwertige Farben für kreative Gestaltung und künstlerische Projekte.`,
    'Papers & Cardstock': `${primary} Qualitätspapier für Scrapbooking und Bastelarbeiten.`,
    'Jewelry Making': `${primary} Präzise Komponenten für individuelle Schmuckkreationen.`
  };

  let introSentence = templates[category];

  if (!introSentence) {
    if (primary && title) {
      introSentence = `${primary} ${title} für kreative Projekte und professionelle Ergebnisse.`;
    } else if (category && vendor) {
      introSentence = `Entdecken Sie hochwertige ${category} von ${vendor} für Ihre Projekte.`;
    } else if (category) {
      introSentence = `Entdecken Sie unsere ${category} für kreative Projekte.`;
    } else if (title) {
      introSentence = `${title} für kreative Projekte und professionelle Ergebnisse.`;
    } else {
      introSentence = `Ein vielseitiges Produkt für kreative Anwendungen.`;
    }
  }
  return introSentence;
}

function extractRemainingUsefulContent(originalHtml, usedFirstLine) {
  if (!originalHtml) return '';
  let remaining = originalHtml;
  
  // Remove the used first line
  if (usedFirstLine) {
    remaining = remaining.replace(usedFirstLine, '').trim();
  }
  
  // Remove very short fragments
  remaining = remaining.replace(/<p>\s*[^<]{1,15}\s*<\/p>/gi, '');
  // Keep only substantial paragraphs or lists
  const meaningfulContent = remaining.match(/<p>[^<]{20,}.*?<\/p>|<ul>.*?<\/ul>|<ol>.*?<\/ol>/gi);
  
  return meaningfulContent ? meaningfulContent.join('\n') : '';
}

function buildSEO(origT, origD, title, cat, CFG, row) {
    const collectionKey = Object.keys(CFG.COLLECTION_ALIASES || {}).find(key => CFG.COLLECTION_ALIASES[key] === cat);
    // OPTIMIZED: Shorter, more specific foundational sentence for better space usage
    const foundationalSentence = (CFG.COLLECTION_SEO && CFG.COLLECTION_SEO[collectionKey]) || 
      (CFG.SOP_RULES && CFG.SOP_RULES.generic_seo_description) || 
      "Hochwertige Produkte für kreative Projekte und Bastelarbeiten.";
    const qualities = extractDescriptiveQualities(title, origD, CFG.KEYWORDS);

    let seoDesc = foundationalSentence;

    // ENHANCED: More specific product description integration
    if (qualities.length > 0) {
        const qualitiesString = qualities.slice(0, 2).join(' und ');
        const addition = ` '${title}' überzeugt durch ${qualitiesString}e Eigenschaften.`;
        if ((seoDesc + addition).length <= LIMITS.SEO_DESC_MAX) {
            seoDesc += addition;
        }
    } else {
        // More direct product reference
        const addition = ` Entdecken Sie '${title}' für Ihre Projekte.`;
        if ((seoDesc + addition).length <= LIMITS.SEO_DESC_MAX) {
            seoDesc += addition;
        }
    }

    // If the description is still too short, add more details
    if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
        const vendor = row['Vendor'] || '';
        if (vendor) {
            const addition = ` Von der Marke ${vendor}.`;
            if ((seoDesc + addition).length <= LIMITS.SEO_DESC_MAX) {
                seoDesc += addition;
            }
        }
    }

    if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
        const product_type = row['Type'] || '';
        if (product_type) {
            const addition = ` Ideal für ${product_type}.`;
            if ((seoDesc + addition).length <= LIMITS.SEO_DESC_MAX) {
                seoDesc += addition;
            }
        }
    }
    
    if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
        const tags = (row['Tags'] || '').split(',').map(t => t.trim()).filter(Boolean);
        if (tags.length > 0) {
            const addition = ` Perfekt für ${tags.slice(0, 2).join(', ')}.`;
            if ((seoDesc + addition).length <= LIMITS.SEO_DESC_MAX) {
                seoDesc += addition;
            }
        }
    }

    seoDesc = seoDesc.replace(/\s+/g, ' ').trim();
    
    // CRITICAL FIX: Check minimum length BEFORE truncating
    // PHASE 1 FIX: Enhanced fallback to ensure minimum length (155+ chars)
    if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
        const productCategory = row['Product Category'] || '';
        const vendor = row['Vendor'] || '';
        const productType = row['Type'] || '';
        
        // Add more specific product details to reach minimum length
        const additionalDetails = [];
        
        if (productCategory && !seoDesc.includes(productCategory)) {
            additionalDetails.push(`Kategorie: ${productCategory}.`);
        }
        
        if (vendor && !seoDesc.includes(vendor)) {
            additionalDetails.push(`Von ${vendor}.`);
        }
        
        if (productType && !seoDesc.includes(productType)) {
            additionalDetails.push(`Geeignet für ${productType}.`);
        }
        
        // Add details until we reach minimum length
        for (const detail of additionalDetails) {
            if (seoDesc.length < LIMITS.SEO_DESC_MIN && (seoDesc + ' ' + detail).length <= LIMITS.SEO_DESC_MAX) {
                seoDesc += ' ' + detail;
            }
        }
        
        // If still too short, add generic but relevant content
        if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
            const genericAdditions = [
                'Hochwertige Qualität und sorgfältige Verarbeitung.',
                'Ideal für kreative Projekte und professionelle Anwendungen.',
                'Schnelle Lieferung und erstklassiger Kundenservice.',
                'Perfekt für Hobby und professionelle Nutzung.'
            ];
            
            for (const addition of genericAdditions) {
                if (seoDesc.length < LIMITS.SEO_DESC_MIN && (seoDesc + ' ' + addition).length <= LIMITS.SEO_DESC_MAX) {
                    seoDesc += ' ' + addition;
                    break; // Only add one generic addition
                }
            }
        }
        
        // Final fallback - ensure we have at least minimum length
        if (seoDesc.length < LIMITS.SEO_DESC_MIN) {
            const baseText = `${foundationalSentence} Entdecken Sie das hochwertige Produkt '${title}' für kreative Projekte und professionelle Anwendungen. Ideal für Hobby und Beruf mit erstklassiger Qualität.`;
            seoDesc = baseText.substring(0, LIMITS.SEO_DESC_MAX);
            // Trim to last complete word
            const lastSpaceIndex = seoDesc.lastIndexOf(' ');
            if (lastSpaceIndex > LIMITS.SEO_DESC_MIN - 20) {
                seoDesc = seoDesc.substring(0, lastSpaceIndex);
            }
        }
    }
    
    // MOVED: Apply truncation AFTER ensuring minimum length
    if (seoDesc.length > LIMITS.SEO_DESC_MAX) {
        seoDesc = seoDesc.substring(0, LIMITS.SEO_DESC_MAX);
        seoDesc = seoDesc.substring(0, Math.min(seoDesc.length, seoDesc.lastIndexOf(" ")));
    }

    let seoTitle = title;
    if (seoTitle.toLowerCase().endsWith(' | bastelschachtel')) {
        seoTitle = seoTitle.substring(0, seoTitle.length - 18);
    }
    if (seoTitle.trim().toLowerCase() === 'bastelschachtel') {
        seoTitle = title;
    }
    if (seoTitle.length > LIMITS.SEO_TITLE) {
        seoTitle = seoTitle.slice(0, LIMITS.SEO_TITLE).trim();
    }

    return { seoTitle, seoDesc };
}

function extractDescriptiveQualities(title, description, keywordsConfig) {
    const text = `${title.toLowerCase()} ${stripHtml(description).toLowerCase()}`;
    const qualities = new Set();

    // Broader regex for adjectives (German)
    const adjectiveRegex = /\b([a-zäöüß]+(?:er|e|es|en|em))\b/g;
    const matches = text.match(adjectiveRegex) || [];

    const commonWords = new Set([
        'der', 'die', 'das', 'ein', 'eine', 'eines', 'einen', 'einem',
        'und', 'oder', 'aber', 'mit', 'von', 'zu', 'für', 'ist', 'sind',
        'hat', 'haben', 'wird', 'werden', 'kann', 'können', 'auch', 'sich',
        'als', 'ihr', 'ihre', 'sein', 'seine', 'wir', 'sie', 'es', 'ich', 'du',
        'nicht', 'nur', 'schon', 'noch', 'sehr', 'hier', 'dort', 'jetzt', 'immer',
        'artikel', 'produkt', 'set', 'packung', 'farbe', 'größe', 'material',
        'stück', 'zubehör', 'neu', 'hochwertig', 'verschiedene'
    ]);

    for (const match of matches) {
        if (match.length > 3 && !commonWords.has(match) && isNaN(match)) {
            qualities.add(match);
        }
    }
    
    // Also check for specific keywords from the dictionary
    if (keywordsConfig) {
        for (const category in keywordsConfig) {
            const categoryKeywords = [
                ...(keywordsConfig[category].primary || []),
                ...(keywordsConfig[category].secondary || []),
                ...(keywordsConfig[category].attributes || [])
            ];
            for (const keyword of categoryKeywords) {
                if (text.includes(keyword.toLowerCase())) {
                    qualities.add(keyword);
                }
            }
        }
    }

    return Array.from(qualities).slice(0, 3); // Return up to 3 qualities
}


function normalizeVariants(row, CFG){
  const changes = [];
  // SKU
  let sku = row['Variant SKU']||'';
  if (!SKU_RE.test(sku)){
    const newSku = genSKU(row['Vendor'], row['Title']);
    changes.push({field:'Variant SKU', original:sku, updated:newSku, reason:'Generated per SOP', severity:'info'});
    if (newSku) row['Variant SKU']=newSku;
  }
  // Grams
  if (!isFinite(Number(row['Variant Grams']))){
    changes.push({field:'Variant Grams', original:row['Variant Grams']||'', updated:'0', reason:'Defaulted to 0', severity:'info'});
    row['Variant Grams'] = '0';
  }
  // Requires Shipping / Taxable
  if (String(row['Variant Requires Shipping']).toUpperCase()!=='TRUE'){
    changes.push({field:'Variant Requires Shipping', original:row['Variant Requires Shipping']||'', updated:'TRUE', reason:'Physical product default', severity:'info'});
    row['Variant Requires Shipping']='TRUE';
  }
  if (String(row['Variant Taxable']).toUpperCase()!=='TRUE'){
    changes.push({field:'Variant Taxable', original:row['Variant Taxable']||'', updated:'TRUE', reason:'Taxable default', severity:'info'});
    row['Variant Taxable']='TRUE';
  }
  // Barcode never invented
  if (row['Variant Barcode'] && !/^[0-9]+$/.test(row['Variant Barcode'])){
    changes.push({field:'Variant Barcode', original:row['Variant Barcode'], updated:'', reason:'Invalid barcode cleared', severity:'warn'});
    row['Variant Barcode']='';
  }
  // Compare at price: (optionally enforce if present but < price, etc.)
  return changes;
}

function cleanupTags(row, issues, rowNumber, productTitle, ctx, CFG) {
  const MIN_TAGS = 5;
  const MAX_TAGS = 10;
  let rawTags = (row['Tags'] || '').toString();
  let tags = rawTags.split(',').map(tag => tag.trim()).filter(Boolean);
  let initialTagCount = tags.length;

  // 1. Normalize and validate characters (lowercase, remove accents, keep only alphanumeric and hyphens)
  tags = tags.map(tag => {
    let cleanedTag = tag.toLowerCase();
    // Remove accents/diacritics (simple approximation, might need a more robust library for full Unicode)
    cleanedTag = cleanedTag.normalize("NFD").replace(/[̀-ͯ]/g, "");
    // Keep only letters, numbers, and hyphens
    cleanedTag = cleanedTag.replace(/[^a-z0-9-]/g, '');
    return cleanedTag;
  }).filter(Boolean); // Filter out any tags that became empty after cleaning

  // 2. Remove duplicates
  tags = Array.from(new Set(tags));

  // 2.5. ENHANCED PHASE 1: Dynamic relevance filtering based on product content
  const productTitleLower = (row['Title'] || '').toLowerCase();
  const productCategoryLower = (row['Product Category'] || '').toLowerCase();
  
  // Pre-compute product type classifications (once per product, not per tag)
  const toolsProducts = productTitleLower.includes('pinsel') || productTitleLower.includes('brush') || 
                       productCategoryLower.includes('brush') || productCategoryLower.includes('tool');
  const paintProducts = productTitleLower.includes('farbe') || productTitleLower.includes('paint') || 
                       productCategoryLower.includes('paint');
  
  // Static irrelevant patterns (defined once, not per tag)
  const irrelevantPatterns = [
    { pattern: 'hibiskus', reason: 'hibiscus flowers not relevant to craft tools' },
    { pattern: 'lisa', reason: 'personal names not relevant for product tags' },
    { pattern: 'bluten', reason: 'flower-related terms not relevant for tools/supplies' },
    { pattern: 'von', reason: 'preposition indicates personal attribution' },
    { pattern: 'tshirt', reason: 'clothing items not relevant to craft supplies' },
    { pattern: 'flamingo', reason: 'animal themes not relevant to craft tools/supplies' },
    { pattern: 'kleidung', reason: 'clothing terms not relevant to craft supplies' },
    { pattern: 'shirt', reason: 'clothing items not relevant to craft supplies' },
    { pattern: 'hose', reason: 'clothing items not relevant to craft supplies' },
    { pattern: 'jacke', reason: 'clothing items not relevant to craft supplies' },
    { pattern: 'mit', reason: 'German preposition indicates composite irrelevant tags' }
  ];
  
  let tagsAfterRelevanceCheck = [];
  for (const tag of tags) {
    let isRelevant = true;
    let relevanceReason = '';
    
    // Quick length check first (fastest filter)
    if (tag.length > 20) {
      isRelevant = false;
      relevanceReason = 'tag too long (>20 chars) likely compound irrelevant term';
    }
    
    // Pattern matching (optimized with early break)
    if (isRelevant) {
      for (const {pattern, reason} of irrelevantPatterns) {
        if (tag.includes(pattern)) {
          isRelevant = false;
          relevanceReason = reason;
          break;
        }
      }
    }
    
    // Cross-product contamination detection (using pre-computed flags)
    if (isRelevant) {
      if (toolsProducts && (tag.includes('rost') || tag.includes('effekt') || tag.includes('patina'))) {
        isRelevant = false;
        relevanceReason = 'paint effect terms not relevant for tools';
      } else if (!paintProducts && !toolsProducts && (tag.includes('farb') || tag.includes('paint'))) {
        if (!productTitleLower.includes('farb') && !productTitleLower.includes('paint')) {
          isRelevant = false;
          relevanceReason = 'paint terms not relevant for non-paint products';
        }
      }
    }
    
    if (isRelevant) {
      tagsAfterRelevanceCheck.push(tag);
    } else {
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, '', `Irrelevant tag removed: ${relevanceReason}`, 'info', ctx.phase);
    }
  }
  tags = tagsAfterRelevanceCheck;

  // 3. Check banned terms
  const bannedTermsConfig = CFG.BANNED_TERMS || {};
  const bannedTermsMap = bannedTermsConfig.banned_terms || {};
  const bannedTermsList = Object.keys(bannedTermsMap);
  const enforceCaseInsensitive = bannedTermsConfig.rules?.enforce_case_insensitive || false;
  
  let tagsAfterBannedCheck = [];
  for (const tag of tags) {
    let isBanned = false;
    for (const bannedTerm of bannedTermsList) {
      if (enforceCaseInsensitive) {
        if (tag.toLowerCase() === bannedTerm.toLowerCase()) { isBanned = true; break; }
      } else {
        if (tag === bannedTerm) { isBanned = true; break; }
      }
      const re = new RegExp(`\\b${escapeRegExp(bannedTerm)}\\b`, enforceCaseInsensitive ? 'gi' : 'g');
      if (re.test(tag)) { isBanned = true; break; }
    }
    if (isBanned) {
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, '', `Banned term '${tag}' removed`, 'warn', ctx.phase);
    } else {
      tagsAfterBannedCheck.push(tag);
    }
  }
  tags = tagsAfterBannedCheck;

  // 3b. Check forbidden keywords from TAG_RELEVANCE_MAP (Google Product Taxonomy)
  const googleProductCategoryValue = row['Google Shopping / Google Product Category'];
  const googleProductCategory = (googleProductCategoryValue === null || googleProductCategoryValue === undefined)
    ? ''
    : String(googleProductCategoryValue).trim();
  const taxonomyEntry = CFG.TAG_RELEVANCE_MAP?.taxonomy_map?.[googleProductCategory];
  const forbiddenKeywords = taxonomyEntry?.forbidden_keywords || [];

  let tagsAfterForbiddenCheck = [];
  for (const tag of tags) {
    if (forbiddenKeywords.includes(tag)) {
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, '', `Forbidden keyword '${tag}' for Google Product Category '${googleProductCategory}' removed`, 'warn', ctx.phase);
    } else {
      tagsAfterForbiddenCheck.push(tag);
    }
  }
  tags = tagsAfterForbiddenCheck;

  // 4. Check length rules (warn if > 16 chars)
  for (const tag of tags) {
    if (tag.length > 16) {
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, tag, `Tag '${tag}' exceeds recommended length of 16 characters`, 'warn', ctx.phase);
    }
  }

  // 5. Check category alignment (warn if not aligned)
  const productCategory = (row['Product Category'] || '').toLowerCase();
  const categoryKeywords = new Set();

  if (CFG.KEYWORDS[productCategory]) {
    for (const type of ['primary', 'secondary', 'attributes']) {
      (CFG.KEYWORDS[productCategory][type] || []).forEach(kw => categoryKeywords.add(kw.toLowerCase()));
    }
  }

  for (const alias in CFG.COLLECTION_ALIASES) {
    const mappedCategory = CFG.COLLECTION_ALIASES[alias];
    if (typeof mappedCategory === 'string' && mappedCategory.toLowerCase() === productCategory) {
      categoryKeywords.add(alias.toLowerCase());
    }
  }

  // Skip category alignment validation in Phase 3e since category may not be final yet
  if (ctx.phase !== '3e') {
    for (const tag of tags) {
      if (!categoryKeywords.has(tag)) {
        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tag, tag, `Tag '${tag}' does not align with product category '${productCategory}'`, 'warn', ctx.phase);
      }
    }
  }

  // --- Tag Generation for products with low tag count ---
  if (tags.length < 5) {
    const generatedTags = new Set(tags); // Start with existing valid tags

    // ENHANCED LOGIC: Smart keyword extraction from title with relevance scoring
    const titleWords = (row['Title'] || '').toLowerCase().split(/\s+/).filter(Boolean);
    const stopWords = new Set(['und', 'der', 'die', 'das', 'ein', 'eine', 'eines', 'einen', 'einem', 'mit', 'von', 'zu', 'für', 'ist', 'sind', 'hat', 'haben', 'wird', 'werden', 'kann', 'können', 'auch', 'sich', 'als', 'ihr', 'ihre', 'sein', 'seine', 'wir', 'sie', 'es', 'ich', 'du', 'nicht', 'nur', 'schon', 'noch', 'sehr', 'hier', 'dort', 'jetzt', 'immer', 'artikel', 'produkt', 'packung', 'größe', 'material', 'stück', 'zubehör', 'neu', 'hochwertig', 'verschiedene', 'teilig']);

    // Priority scoring for title words based on product context
    const priorityWords = [];
    for (const word of titleWords) {
      const cleanedWord = word.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, '');
      if (cleanedWord.length > 2 && cleanedWord.length <= 16 && !stopWords.has(cleanedWord)) {
        let priority = 1;
        
        // Higher priority for core product terms
        if (['pinsel', 'brush', 'farbe', 'paint', 'acryl', 'set'].includes(cleanedWord)) {
          priority = 3;
        }
        // Medium priority for descriptive terms
        else if (['spitzig', 'rund', 'flach', 'matt', 'metallic'].includes(cleanedWord)) {
          priority = 2;
        }
        // Lower priority for brand names or compound fragments
        else if (cleanedWord.includes('pentart') || cleanedWord.length > 12) {
          priority = 0.5;
        }
        
        priorityWords.push({word: cleanedWord, priority});
      }
    }
    
    // Sort by priority and add to tags
    priorityWords.sort((a, b) => b.priority - a.priority);
    for (const {word, priority} of priorityWords) {
      if (!generatedTags.has(word)) {
        generatedTags.add(word);
        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', '', word, `Tag inferred from title (priority: ${priority}): '${word}'`, 'info', ctx.phase);
        if (generatedTags.size >= MAX_TAGS) break;
      }
    }

    // Try to get primary keywords from the category
    if (generatedTags.size < MIN_TAGS && CFG.KEYWORDS[productCategory] && CFG.KEYWORDS[productCategory].primary) {
      for (const keyword of CFG.KEYWORDS[productCategory].primary) {
        const cleanedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, '');
        if (cleanedKeyword && !bannedTerms.includes(cleanedKeyword) && cleanedKeyword.length <= 16 && !generatedTags.has(cleanedKeyword)) {
          generatedTags.add(cleanedKeyword);
          if (generatedTags.size >= MIN_TAGS) break; // Stop if we have enough
        }
      }
    }

    // If still not enough, try secondary keywords
    if (generatedTags.size < MIN_TAGS && CFG.KEYWORDS[productCategory] && CFG.KEYWORDS[productCategory].secondary) {
      for (const keyword of CFG.KEYWORDS[productCategory].secondary) {
        const cleanedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, '');
        if (cleanedKeyword && !bannedTerms.includes(cleanedKeyword) && cleanedKeyword.length <= 16 && !generatedTags.has(cleanedKeyword)) {
          generatedTags.add(cleanedKeyword);
          if (generatedTags.size >= MIN_TAGS) break;
        }
      }
    }
    
    // If still not enough, try relevant collection aliases
    if (generatedTags.size < MIN_TAGS) {
      for (const alias in CFG.COLLECTION_ALIASES) {
        const mappedCategory = CFG.COLLECTION_ALIASES[alias];
        if (typeof mappedCategory === 'string' && mappedCategory.toLowerCase() === productCategory) {
          const cleanedAlias = alias.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, '');
          if (cleanedAlias && !bannedTerms.includes(cleanedAlias) && cleanedAlias.length <= 16 && !generatedTags.has(cleanedAlias)) {
            generatedTags.add(cleanedAlias);
            if (generatedTags.size >= MIN_TAGS) break;
          }
        }
      }
    }

    // If still not enough, try required keywords from TAG_RELEVANCE_MAP (Google Product Taxonomy)
    if (generatedTags.size < MIN_TAGS) {
      const googleProductCategoryValue = row['Google Shopping / Google Product Category'];
      const googleProductCategory = (googleProductCategoryValue === null || googleProductCategoryValue === undefined)
        ? ''
        : String(googleProductCategoryValue).trim();
      const taxonomyEntry = CFG.TAG_RELEVANCE_MAP?.taxonomy_map?.[googleProductCategory];
      const requiredKeywords = taxonomyEntry?.required_keywords || [];

      for (const keyword of requiredKeywords) {
        const cleanedKeyword = keyword.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9-]/g, '');
        if (cleanedKeyword && !bannedTerms.includes(cleanedKeyword) && cleanedKeyword.length <= 16 && !generatedTags.has(cleanedKeyword)) {
          addTag(cleanedKeyword, `CFG.TAG_RELEVANCE_MAP[${googleProductCategory}].required_keywords`);
          if (generatedTags.size >= MIN_TAGS) break;
        }
      }
    }

    // 6. Default Fallback
    if (generatedTags.size < MIN_TAGS && CFG.SOP_RULES?.seo_rules?.default_tags) {
      // Add a warning if default tags are being applied
      if (CFG.SOP_RULES.seo_rules.default_tags.length > 0) {
        pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', '', '', `Applying default tags as insufficient specific tags were generated.`, 'warn', ctx.phase);
      }
      for (const defaultTag of CFG.SOP_RULES.seo_rules.default_tags) {
        addTag(defaultTag, 'CFG.SOP_RULES.seo_rules.default_tags');
        if (generatedTags.size >= MIN_TAGS) break;
      }
    }

    // Convert back to array
    const newTagsArray = Array.from(generatedTags);

    if (newTagsArray.length > tags.length) { // Only push issue if new tags were actually added
      pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tags.join(','), newTagsArray.join(','), `Tags generated to meet minimum count`, 'info', ctx.phase);
      tags = newTagsArray;
    }
  }

  // 6. ENHANCED PHASE 1: Dynamic tag count optimization
  if (tags.length > MAX_TAGS) {
    // Smart tag reduction: prioritize relevant and core terms
    const tagPriorities = tags.map(tag => {
      let score = 1;
      
      // Higher priority for product-specific terms
      if (productTitleLower.includes(tag) || tag === 'pinsel' || tag === 'farbe' || tag === 'set') {
        score += 2;
      }
      
      // Medium priority for category-aligned terms
      if (productCategoryLower.includes(tag) || 
          ['malen', 'basteln', 'kreativ', 'acryl'].includes(tag)) {
        score += 1;
      }
      
      // Lower priority for generic terms
      if (['bastelbedarf', 'zubehor', 'material'].includes(tag)) {
        score -= 1;
      }
      
      // Very low priority for long or compound terms
      if (tag.length > 12) {
        score -= 2;
      }
      
      return {tag, score};
    });
    
    // Sort by score and keep top 8 tags
    tagPriorities.sort((a, b) => b.score - a.score);
    const optimizedTags = tagPriorities.slice(0, 8).map(item => item.tag);
    
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tags.join(','), optimizedTags.join(','), `Tag count optimized from ${tags.length} to ${optimizedTags.length} tags`, 'info', ctx.phase);
    tags = optimizedTags;
  }

  // 7. Check tag count (warn if still outside 5-10)
  if (tags.length < 5 || tags.length > 10) {
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', tags.join(','), tags.join(','), `Tag count (${tags.length}) is outside the recommended range of 5-10`, 'warn', ctx.phase);
  }

  // Update the row with cleaned tags
  row['Tags'] = tags.join(',');

  // Push an info issue if tags were modified
  if (row['Tags'] !== rawTags) {
    pushIssue(issues, rowNumber, row['Handle'], productTitle, 'Tags', rawTags, row['Tags'], 'Tags normalized, duplicates/banned terms removed, and validated', 'info', ctx.phase);
  }
}

function genSKU(vendor, title){
  const v = (vendor||'BA').replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,3);
  const t = (title||'PRD').replace(/[^A-Z0-9]/gi,'').toUpperCase().slice(0,4);
  const rnd = Math.random().toString(36).slice(2,6).toUpperCase();
  return `${v}-${t}-${rnd}`;
}

/** PHASE 2 PREPARATION: Function stubs for Phase 2 intelligence enhancement */
function scoreAndAssignCategory(row, issues, rowNumber, productTitle, ctx, CFG) {
  // Phase 1: Use existing logic, Phase 2: Add dynamic scoring
  return mapCollectionsAndCategory(row, issues, rowNumber, productTitle, ctx, CFG);
}

function generateAndCleanTags(row, issues, rowNumber, productTitle, ctx, CFG) {
  // Phase 1: Use existing logic, Phase 2: Add intelligent filtering
  return cleanupTags(row, issues, rowNumber, productTitle, ctx, CFG);
}

/** Quick check that Config JSONs parse correctly and has expected keys */
function testConfigLoad() {
  const ss = SpreadsheetApp.getActive();
  const cfgSheet = ss.getSheetByName('Config');
  if (!cfgSheet) throw new Error('Missing "Config" sheet.');
  const cfg = loadConfig(cfgSheet); // uses your existing loadConfig()

  const report = [
    `✅ PHASE 1 Config loaded successfully`,
    `- banned_terms: ${Object.keys(cfg.BANNED_TERMS || {}).length} entries`,
    `- category_alignment (categories): ${Object.keys(cfg.CAT_ALIGN || {}).length}`,
    `- keyword_dictionary (categories): ${Object.keys(cfg.KEYWORDS || {}).length}`,
    `- collection_aliases: ${Object.keys(cfg.COLLECTION_ALIASES || {}).length}`,
    `- sop_phase3_rules: ${Object.keys(cfg.SOP_RULES || {}).length}`,
    `- known_vendors: ${Object.keys(cfg.KNOWN_VENDORS || {}).length}`,
    `- google_taxonomy_map: ${Object.keys(cfg.GOOGLE_TAX_MAP || {}).length} mappings`,
    `- tag_relevance_map: ${cfg.TAG_RELEVANCE_MAP ? 'loaded' : 'missing'}`,
    ``,
    `🚀 PHASE 2 Preparation:`,
    `- structural_tags: ${cfg.STRUCTURAL_TAGS ? Object.keys(cfg.STRUCTURAL_TAGS).length + ' categories' : 'missing'}`,
    `- tag_generation_rules: ${cfg.TAG_GENERATION_RULES ? 'configured' : 'missing'}`,
    ``,
    `✅ Phase 1 Ready: Foundation stabilized`,
    `✅ Phase 2 Ready: Intelligence infrastructure prepared`
  ].join('\n');

  Logger.log(report);
  SpreadsheetApp.getUi().alert(report);
}

/** Visual sanity check: marks Config rows green/red if JSON parses */
function validateConfigSheet() {
  const ss = SpreadsheetApp.getActive();
  const s = ss.getSheetByName('Config');
  if (!s) throw new Error('Missing "Config" sheet.');
  const rng = s.getDataRange().getValues();
  for (let r=0; r<rng.length; r++){
    const key = String(rng[r][0]||'').trim();
    const val = String(rng[r][1]||'').trim();
    if (!key) continue;
    try { JSON.parse(val); s.getRange(r+1,1,1,2).setBackground('#e8f5e9'); } // green
    catch(e){ s.getRange(r+1,1,1,2).setBackground('#ffebee'); } // red
  }
  SpreadsheetApp.getUi().alert('Config cells validated (green=OK, red=JSON error).');
}

/** Creates missing tabs and seeds Config keys with {} so helpers won’t fail */
function setupSheetsAndConfig() {
  const ss = SpreadsheetApp.getActive();
  const input  = ss.getSheetByName('Input')  || ss.insertSheet('Input');
  const output = ss.getSheetByName('Output') || ss.insertSheet('Output');
  const issues = ss.getSheetByName('Issues') || ss.insertSheet('Issues');
  const cfg    = ss.getSheetByName('Config') || ss.insertSheet('Config');

  // Define all desired config keys and their default values
  const defaultConfigs = {
    'banned_terms_json': '{}',
    'category_alignment_json': '{}',
    'keyword_dictionary_json': '{}',
    'collection_aliases_json': '{}',
    'collection_seo_descriptions_json': '{}',
    'sop_phase3_rules': '{}',
    'known_vendors_json': '{}',
    'seo_template_json': '{}',
    'category_keywords_inference_json': '{}',
    'google_taxonomy_map_json': '{}',
    'tag_relevance_map_json': '{}',
    // PHASE 2 PREPARATION: Config fields for intelligence enhancement
    'structural_tags_json': JSON.stringify({
      "seasonal": ["Father's Day", "Mother's Day", "Christmas", "Easter", "Valentine's Day"],
      "marketing": ["Sale", "Neu", "Bestseller", "Limited Edition"],
      "collections": ["für ihn", "für sie", "für kinder", "Weihnachten", "Ostern"]
    }),
    'tag_generation_rules_json': JSON.stringify({
      "min_word_length": 3,
      "min_occurrence": 1,
      "source_fields": ["Title", "Body (HTML)", "Product Type"],
      "blacklist_tags": ["from Lisa", "für dich", "von ihm", "hibiscus", "irrelevant"]
    })
  };

  // Read existing keys from the Config sheet
  const existingConfigData = cfg.getDataRange().getValues();
  const existingKeys = new Set(existingConfigData.map(row => String(row[0]).trim()));

  const newRows = [];
  for (const key in defaultConfigs) {
    if (!existingKeys.has(key)) {
      newRows.push([key, defaultConfigs[key]]);
    }
  }

  if (newRows.length > 0) {
    cfg.getRange(cfg.getLastRow() + 1, 1, newRows.length, 2).setValues(newRows);
    Logger.log('Missing Config keys added with placeholders.'); // Use Logger.log
  } else {
    Logger.log('All Config keys already present.'); // Use Logger.log
  }
  
  // Removed SpreadsheetApp.getUi().alert()
}

function applyGoogleShopping(row, issues, rowNumber, productTitle, ctx, CFG) {
  const cat = (row['Product Category'] || '').trim();
  const map = CFG.GOOGLE_TAX_MAP || {};
  const gsField = 'Google Shopping / Google Product Category';
  const pcField = 'Product Category';

  if (!row[gsField] || String(row[gsField]).trim() === '') {
    const mapped = map[cat] || '';
    
    if (mapped) {
      // Direct category mapping found
      pushIssue(issues, rowNumber, row['Handle'], productTitle, gsField, row[gsField] || '', mapped, 'Mapped via google_taxonomy_map', 'info', ctx.phase);
      row[gsField] = mapped;
      
      // Also update the Product Category field
      if (row[pcField] !== mapped) {
        pushIssue(issues, rowNumber, row['Handle'], productTitle, pcField, row[pcField] || '', mapped, 'Updated to match Google Product Category', 'info', ctx.phase);
        row[pcField] = mapped;
      }
    } else {
      // PHASE 1 ENHANCEMENT: Title-based fallback mapping for unmapped categories
      const title = (row['Title'] || '').toLowerCase();
      let fallbackMapping = '';
      
      // Office supplies keywords
      if (title.includes('dreiflügel') || title.includes('mappe') || title.includes('ordner')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > Filing & Organization > Folders';
      } else if (title.includes('heftschoner') || title.includes('schoner')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > Filing & Organization > Binding Supplies > Binder Accessories > Sheet Protectors';
      } else if (title.includes('aufgabenheft') || title.includes('notenheft') || title.includes('heft')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > General Office Supplies > Paper Products > Notebooks & Notepads';
      } else if (title.includes('bleistift') || title.includes('stift')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > Office Instruments > Writing & Drawing Instruments > Pens & Pencils > Pencils';
      } else if (title.includes('filzstift') || title.includes('marker')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > Office Instruments > Writing & Drawing Instruments > Pens & Pencils > Pens > Felt-Tip Pens';
      } else if (title.includes('radierer') || title.includes('gummi')) {
        fallbackMapping = 'Business & Industrial > Office Supplies > General Office Supplies > Erasers';
      } else if (title.includes('pinsel') || title.includes('brush')) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Tools > Brushes';
      } else if (title.includes('farbe') || title.includes('paint') || title.includes('acryl') || title.includes('wachspaste') || title.includes('paste')) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Drawing & Painting Supplies > Paint';
      } else if (title.includes('papier') || title.includes('paper') || title.includes('karton') || title.includes('chipboard')) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Art & Craft Paper';
      } else if (title.includes('metallic') || title.includes('chamäleon') || title.includes('chamleon') || title.includes('wachs')) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Drawing & Painting Supplies > Paint';
      } else if (title.includes('rost') || title.includes('patina') || title.includes('effekt')) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Drawing & Painting Supplies > Paint';
      } else if (title.includes('set') && (title.includes('pinsel') || title.includes('farb') || title.includes('brush'))) {
        fallbackMapping = 'Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Tools > Brushes';
      }
      
      if (fallbackMapping) {
        pushIssue(issues, rowNumber, row['Handle'], productTitle, gsField, row[gsField] || '', fallbackMapping, 'Mapped via title keyword detection', 'info', ctx.phase);
        row[gsField] = fallbackMapping;
        
        // Update Product Category to match
        if (row[pcField] !== fallbackMapping) {
          pushIssue(issues, rowNumber, row['Handle'], productTitle, pcField, row[pcField] || '', fallbackMapping, 'Updated to match Google Product Category (title-based)', 'info', ctx.phase);
          row[pcField] = fallbackMapping;
        }
      } else {
        // No mapping found - provide detailed warning
        pushIssue(issues, rowNumber, row['Handle'], productTitle, gsField, '', '', `Missing google category (no map entry for Product Category: "${cat}", title: "${row['Title'] || ''}")`, 'warn', ctx.phase);
      }
    }
  }

  // Condition = new (info if changed)
  const condField = 'Google Shopping / Condition';
  if ((row[condField] || '').toLowerCase() !== 'new') {
    pushIssue(issues, rowNumber, row['Handle'], productTitle, condField, row[condField] || '', 'new', 'Condition set to new', 'info', ctx.phase);
    row[condField] = 'new';
  }
}

// === SUMMARY REPORT GENERATOR ===
function generateSummaryReport() {
  try {
    const ss = SpreadsheetApp.getActive();
    const issuesSheet = ss.getSheetByName('Issues');
    const outputSheet = ss.getSheetByName('Output');
    
    if (!issuesSheet) {
      SpreadsheetApp.getUi().alert('No Issues sheet found. Run cleanup first.');
      return;
    }
    
    const {rows: issuesData} = readTable(issuesSheet);
    const {rows: outputData} = outputSheet ? readTable(outputSheet) : {rows: []};
    
    // Generate statistics
    const stats = {
      totalProducts: outputData.length,
      totalIssues: issuesData.length,
      errors: issuesData.filter(issue => issue.severity === 'error').length,
      warnings: issuesData.filter(issue => issue.severity === 'warn').length,
      infos: issuesData.filter(issue => issue.severity === 'info').length,
      bodiesPreserved: issuesData.filter(issue => issue.reason === 'Body preserved - high quality existing content.').length,
      bodiesAugmented: issuesData.filter(issue => issue.reason === 'Body augmented - medium quality existing content.').length,
      bodiesRegenerated: issuesData.filter(issue => issue.reason === 'Body regenerated - low quality existing content.').length
    };
    
    const successRate = stats.totalProducts > 0 ? 
      ((stats.totalProducts - stats.errors) / stats.totalProducts * 100).toFixed(1) : 0;
    
    // Create summary sheet
    const summarySheet = mustSheet(ss, 'Summary');
    summarySheet.clear();
    
    // Write summary report
    const reportData = [
      ['🔧 Shopify Product Cleanup Summary', new Date().toLocaleString()],
      ['', ''],
      ['Metric', 'Value'],
      ['Total Products Processed', stats.totalProducts],
      ['Success Rate', `${successRate}%`],
      ['Total Issues Logged', stats.totalIssues],
      ['❌ Errors', stats.errors],
      ['⚠️ Warnings', stats.warnings], 
      ['ℹ️ Info Messages', stats.infos],
      ['', ''],
      ['📊 Body Content Handling', 'Count'],
      ['Bodies Preserved (High Quality)', stats.bodiesPreserved],
      ['Bodies Augmented (Medium Quality)', stats.bodiesAugmented],
      ['Bodies Regenerated (Low Quality)', stats.bodiesRegenerated],
      ['', ''],
      ['📊 Issues by Phase', 'Count'],
    ];
    
    // Add phase breakdown
    const phaseStats = {};
    issuesData.forEach(issue => {
      const phase = issue.phase || 'unknown';
      phaseStats[phase] = (phaseStats[phase] || 0) + 1;
    });
    
    Object.entries(phaseStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([phase, count]) => {
        reportData.push([`Phase ${phase}`, count]);
      });
    
    // Write to sheet
    summarySheet.getRange(1, 1, reportData.length, 2).setValues(reportData);
    
    // Format summary
    summarySheet.getRange(1, 1, 1, 2).merge().setFontSize(16).setFontWeight('bold');
    summarySheet.getRange(3, 1, 1, 2).setFontWeight('bold').setBackground('#e8f0fe');
    summarySheet.autoResizeColumns(1, 2);
    
    SpreadsheetApp.getUi().alert('📊 Summary Generated', 
      `Summary report created!\n\n` +
      `• Products: ${stats.totalProducts}\n` +
      `• Success rate: ${successRate}%\n` +
      `• Issues: ${stats.totalIssues}\n` +
      `• Bodies Preserved: ${stats.bodiesPreserved}\n` +
      `• Bodies Augmented: ${stats.bodiesAugmented}\n` +
      `• Bodies Regenerated: ${stats.bodiesRegenerated}\n\n` +
      `Check the Summary sheet for details.`, SpreadsheetApp.getUi().ButtonSet.OK);
      
      
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Summary Error', error.message);
    console.error('Summary generation error:', error);
  }
}

function saveSheetDataLocally() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const range = sheet.getDataRange();
  const values = range.getValues();
  // Convert the 2D array data into a string (e.g., CSV format)
  let csv = values.map(row => row.join('\t')).join('\n'); // Using tab or comma as separator

  // 2. Get the containing folder
  const fileId = SpreadsheetApp.getActiveSpreadsheet().getId();
  const folder = DriveApp.getFileById(fileId).getParents().next();

  // 3. Create the local file in Google Drive
  const fileName = 'sheet_data_for_gemini.txt';
  const file = folder.createFile(fileName, csv, MimeType.PLAIN_TEXT);

  Logger.log('Data saved to file ID: ' + file.getId());
}
function populateCategoryKeywordsInference() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    Logger.log('Error: Config sheet not found!');
    return;
  }

  const data = configSheet.getDataRange().getValues();
  let found = false;

  const jsonContent = {
    "pinsel": "Art Supplies > Brushes",
    "acrylfarbe": "Paints & Mediums > Acrylic Paints",
    "wasserfarben": "Paints & Mediums > Watercolors",
    "set": "Art Supplies > Sets",
    "malen": "Art Supplies > Painting",
    "stifte": "Office Supplies > Writing & Drawing Instruments > Pens & Pencils",
    "papier": "Office Supplies > Paper Products",
    "schere": "Office Supplies > Office Instruments > Scissors & Trimmers",
    "kleber": "Business & Industrial > Office Supplies > General Office Supplies > Adhesives & Tapes",
    "notizbuch": "Office Supplies > Paper Products > Notebooks & Notepads",
    "radiergummi": "Office Supplies > Office Instruments > Writing & Drawing Instrument Accessories > Erasers",
    "lineal": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Tools > Craft Measuring & Marking Tools > Rulers",
    "locher": "Office Supplies > Paper Handling > Hole Punches",
    "taschenrechner": "Office Supplies > Office Equipment > Calculators",
    "marker": "Office Supplies > Office Instruments > Writing & Drawing Instruments > Markers & Highlighters",
    "heft": "Office Supplies > Paper Products > Notebooks & Notepads",
    "block": "Office Supplies > Paper Products > Notebooks & Notepads",
    "folie": "Office Supplies > General Office Supplies > Laminating Film, Pouches & Sheets",
    "kugelschreiber": "Office Supplies > Office Instruments > Writing & Drawing Instruments > Pens & Pencils > Pens > Ballpoint Pens",
    "gelstift": "Office Supplies > Office Instruments > Writing & Drawing Instruments > Pens & Pencils > Pens > Gel Pens",
    "spitzer": "Office Supplies > Office Instruments > Writing & Drawing Instrument Accessories > Pencil Sharpeners",
    "farbkasten": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Materials > Craft Paint, Ink & Glaze > Art & Craft Paint",
    "pinselset": "Art Supplies > Brushes",
    "schultüte": "Arts & Entertainment > Party & Celebration > Gift Giving",
    "häkelnadel": "Arts & Entertainment > Hobbies & Creative Arts > Arts & Crafts > Art & Crafting Tools > Needles & Hooks > Crochet Hooks",
    "zirkel": "Business & Industrial > Office Supplies > Office Instruments > Drafting Tools & Supplies > Drafting Compasses",
    "heftbox": "Office Supplies > Filing & Organization > Document Holders & Organizers",
    "schnellhefter": "Office Supplies > Filing & Organization > Folders",
    "ringmappe": "Office Supplies > Filing & Organization > Binding Supplies > Binders",
    "pinnwand": "Office Supplies > Presentation Supplies > Display Boards > Bulletin Boards"
  };

  for (let i = 0; i < data.length; i++) {
    if (data[i][0].toString().trim() === 'category_keywords_inference_json') {
      configSheet.getRange(i + 1, 2).setValue(JSON.stringify(jsonContent, null, 2));
      found = true;
      break;
    }
  }

  if (found) {
    Logger.log('Success: category_keywords_inference_json populated!');
  } else {
    Logger.log('Error: category_keywords_inference_json row not found. Please run setupSheetsAndConfig first.');
  }
}

function testSeoDescriptionFix() {
  // Test the SEO description generation fix
  const testRow = {
    'Title': 'Spitzige Pinsel Set 6teilig',
    'Product Category': 'Brushes & Tools',
    'Vendor': '',
    'Type': '',
    'Tags': 'acrylfarben,bastelbedarf,bastelfarben,farben,lasur,malen,pinsel,set'
  };
  
  const mockCFG = {
    COLLECTION_ALIASES: {},
    SOP_RULES: {},
    KEYWORDS: {}
  };
  
  const origTitle = 'Pinselset 6 teilig';
  const origDesc = '6 Pinsel mit rundem Kopf, zum Malen und Zeichnen.';
  const result = buildSEO(origTitle, origDesc, testRow['Title'], testRow['Product Category'], mockCFG, testRow);
  
  const report = [
    '🧪 SEO Description Fix Test Results:',
    '',
    `📏 Length: ${result.seoDesc.length} chars (Min: 155, Max: 160)`,
    `✅ Meets minimum: ${result.seoDesc.length >= 155 ? 'YES' : 'NO'}`,
    `✅ Under maximum: ${result.seoDesc.length <= 160 ? 'YES' : 'NO'}`,
    '',
    '📝 Generated Description:',
    `"${result.seoDesc}"`,
    '',
    '🎯 SEO Title:',
    `"${result.seoTitle}"`,
    '',
    '🔧 Fix Status: ' + (result.seoDesc.length >= 155 && result.seoDesc.length <= 160 ? 'SUCCESS' : 'NEEDS MORE WORK')
  ].join('\n');
  
  Logger.log(report);
  SpreadsheetApp.getUi().alert('🧪 SEO Fix Test', report, SpreadsheetApp.getUi().ButtonSet.OK);
}

function validateConfigJsonSizes() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    SpreadsheetApp.getUi().alert('Error: Config sheet not found!');
    return;
  }

  const data = configSheet.getDataRange().getValues();
  const issues = [];
  const MAX_CELL_SIZE = 50000; // Google Sheets cell limit

  for (let i = 0; i < data.length; i++) {
    const key = String(data[i][0] || '').trim();
    const value = String(data[i][1] || '').trim();
    
    if (!key || !value) continue;
    
    const cellSize = value.length;
    const isValidJson = (() => {
      try { JSON.parse(value); return true; } catch { return false; }
    })();
    
    if (cellSize > MAX_CELL_SIZE) {
      issues.push(`❌ ${key}: ${cellSize} chars (EXCEEDS LIMIT)`);
    } else if (cellSize > MAX_CELL_SIZE * 0.8) {
      issues.push(`⚠️ ${key}: ${cellSize} chars (near limit)`);
    } else if (!isValidJson) {
      issues.push(`🔧 ${key}: Invalid JSON`);
    } else {
      issues.push(`✅ ${key}: ${cellSize} chars (OK)`);
    }
  }

  const report = [
    '📊 Config JSON Size Report',
    `Limit: ${MAX_CELL_SIZE} chars per cell`,
    '',
    ...issues,
    '',
    `Total entries: ${issues.length}`
  ].join('\n');

  Logger.log(report);
  SpreadsheetApp.getUi().alert('📊 Config Validation', report, SpreadsheetApp.getUi().ButtonSet.OK);
}

function syncLocalJsonToConfig() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const configSheet = ss.getSheetByName('Config');

  if (!configSheet) {
    SpreadsheetApp.getUi().alert('Error: Config sheet not found!');
    return;
  }

  SpreadsheetApp.getUi().alert('📋 Instructions', 
    'This function will sync your local JSON files to the Config sheet.\n\n' +
    'The JSON data is embedded in the function - you can modify it as needed.\n' +
    'JSON will be MINIFIED (no formatting) for Google Sheets compatibility.\n\n' +
    'Click OK to proceed with the sync.',
    SpreadsheetApp.getUi().ButtonSet.OK);

  // Local JSON data from your files - update this section when your JSON files change
  const localJsonData = {
    'banned_terms_json': {
      "version": "2025-09-24",
      "banned_terms": {
        "hochwertig": "robust",
        "beste Qualität": "langlebig", 
        "Premium": "bewährt",
        "unschlagbar": "praktisch",
        "Top": "geeignet",
        "einzigartig": "besonders"
      },
      "rules": {
        "enforce_case_insensitive": true,
        "apply_in": ["Title", "SEO Title", "SEO Description", "Body (HTML)"]
      }
    },
    
    'collection_aliases_json': {
      "version": "2025-09-24",
      "aliases": {
        "grundmaterial_zum_korb_flechten": {
          "normalized_product_type": "Flechten Grundmaterial",
          "normalized_tags": ["Korbböden", "Peddigrohr"],
          "notes": "Alias mappt Sammelbegriff auf zwei kanonische Tag-Eltern."
        },
        "schulbedarf": {
          "normalized_product_type": "Schul- & Bürobedarf",
          "normalized_tags": ["Schule", "Ablage", "Organisation"]
        },
        "kreativfarben_medien": {
          "normalized_product_type": "Kreativfarben & Medien",
          "normalized_tags": ["Farbe", "Medium", "DIY"]
        },
        "papier_formate": {
          "normalized_product_type": "Papier & Formate", 
          "normalized_tags": ["Papier", "Format", "Grammatur"]
        },
        "deko_wohnaccessoires": {
          "normalized_product_type": "Dekoration & Wohnaccessoires",
          "normalized_tags": ["Dekoration", "Ambiente", "Wohnraum"]
        }
      },
      "rules": {
        "type_priority": "normalized_product_type überschreibt abweichende Freitext-Typen.",
        "tags_are_parent_only": "normalized_tags enthalten ausschließlich Parent-Werte (keine Attribute)."
      }
    }
  };

  const data = configSheet.getDataRange().getValues();
  let updatedCount = 0;
  let logDetails = [];

  for (let i = 0; i < data.length; i++) {
    const key = data[i][0].toString().trim();
    
    if (localJsonData[key]) {
      // CRITICAL: Minify JSON for Google Sheets cell size limits
      const jsonString = JSON.stringify(localJsonData[key]);
      configSheet.getRange(i + 1, 2).setValue(jsonString);
      updatedCount++;
      logDetails.push(`✅ Updated: ${key} (${jsonString.length} chars, minified)`);
      Logger.log(`Updated: ${key} - ${jsonString.length} chars (minified)`);
    }
  }

  const summary = `🔄 Sync Complete!\n\n` +
    `Updated ${updatedCount} config entries:\n` +
    logDetails.join('\n') + '\n\n' +
    `💡 To add more JSON files, edit the localJsonData object in the syncLocalJsonToConfig function.`;

  Logger.log(summary);
  SpreadsheetApp.getUi().alert('✅ Sync Complete', 
    `Updated ${updatedCount} config entries from local JSON files.\n\n` +
    `Check the Apps Script logs for details.`,
    SpreadsheetApp.getUi().ButtonSet.OK);
}