# Project Overview

This is a Google Apps Script project that provides a tool for cleaning and validating Shopify product data within a Google Sheet. It adds a custom menu named "Product Cleanup" to the Google Sheet UI, allowing users to run various cleanup and validation tasks.

The script reads product data from an "Input" sheet, processes it based on rules defined in a "Config" sheet, and writes the cleaned data to an "Output" sheet. Any issues found during the process are logged in an "Issues" sheet.

## Key Technologies

*   **Google Apps Script:** The project is written in JavaScript using the Google Apps Script platform.
*   **Google Sheets:** The script interacts with Google Sheets to read input data, configuration, and write output results.

# Building and Running

This is a Google Apps Script project, so there is no traditional build process. The script is executed directly within the Google Sheets environment.

To use this tool:

1.  Open the Google Sheet that contains the product data.
2.  Open the Script Editor from the "Tools" menu.
3.  Copy the code from `Code.js` into a new script file in the editor.
4.  Save the script project.
5.  Reload the Google Sheet. A new "Product Cleanup" menu should appear in the UI.

The "Product Cleanup" menu provides the following options:

*   **Validate Only (Dry Run):**  Performs a validation of the product data without making any changes.
*   **▶ Run Full Cleanup:**  Performs a full cleanup of the product data.
*   **Setup Sheets & Config:** Creates the necessary "Input", "Output", "Issues", and "Config" sheets.
*   **Test Config Load:**  Tests that the configuration from the "Config" sheet can be loaded correctly.
*   **Validate Config JSONs:** Validates the JSON in the "Config" sheet.
*   **Reload Config:** Reloads the configuration from the "Config" sheet.
*   **Generate Summary Report:** Generates a summary report of the cleanup process.
*   **Clear All Outputs:** Clears the "Output", "Issues", and "Summary" sheets.

# Development Conventions

*   The script is written in a single `Code.js` file.
*   The script uses a custom menu to expose its functionality to the user.
*   Configuration is stored in a dedicated "Config" sheet in the Google Sheet.
*   The script is organized into several functions, with a main `runPipeline` function that controls the overall cleanup process.
*   The script uses a `LockService` to prevent multiple simultaneous executions.
