Gemini CLI Prompt: Evolve the Google Apps Script
Objective: Act as an expert Google Apps Script developer to analyze the current project files, propose a detailed refactoring and enhancement plan, and then execute that plan to update the script.

Part 1: Analysis and Plan Generation
Your first task is to deeply analyze the provided project files to understand their current state, purpose, and limitations.

Context Files to Analyze:

apps script.txt: The main application logic.

config tab content copied and pasted.txt: The configuration data driving the script's behavior.

Analysis Steps:

Understand the Core Logic: Review apps script.txt to identify the main functions, the overall execution pipeline (runPipeline), and the key data transformation logic, paying special attention to restructureBody, buildSEO, and cleanupTitle.

Identify Areas for Improvement: Based on the code's current structure, identify opportunities for enhancement. Focus on:

Modularity: The restructureBody function is complex and handles multiple tasks (cleanup, content assessment, generation). It should be broken down into smaller, single-responsibility helper functions.

Intelligence: The current logic for handling the Body (HTML) is binary (keep or replace). Propose a more nuanced, three-tiered approach: preserve high-quality content, augment medium-quality content, and regenerate low-quality content.

Clarity & Reporting: The script's decisions are not always transparent. Propose enhancements to the Issues log and Summary report to provide clearer insights into why a specific action was taken (e.g., "Body augmented - medium quality").

Generate a Development Plan: Based on your analysis, create a new file named dev_plan.md. This plan should be a comprehensive, step-by-step guide detailing the necessary code changes. It should include:

A Foundational Refactoring Phase to deconstruct complex functions.

An Intelligent Content Augmentation Phase to implement the new three-tiered logic.

A Testing and Reporting Phase to add more descriptive logging and update the summary report.

Output for Part 1: A new file named dev_plan.md containing the detailed development plan. Do not modify any other files at this stage.

Part 2: Plan Implementation
(Wait for user confirmation before proceeding to this part)

Your second task is to execute the development plan you created in Part 1.

Execution Steps:

Read the Plan: Ingest the steps outlined in dev_plan.md.

Modify the Code: Apply the refactoring and feature enhancements directly to the apps script.txt file.

Ensure Completeness: The final output must be a single, complete, and fully functional Google Apps Script file. All functions, helpers, and global constants must be included.

Preserve Integrity: Do not change the existing public-facing function names that are tied to the UI menu (onOpen, validateOnly, runFull, etc.).

Output for Part 2: An updated version of apps script.txt with the new, refactored, and enhanced code.