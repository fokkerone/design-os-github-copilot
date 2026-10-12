/**
 * Product data loading and markdown parsing utilities
 */

import type { ProductOverview, Problem, ProductData } from "@/types/product";
import { parseProductRoadmap } from "./model/roadmap.ts";
import { loadDataShape, hasDataShape } from "./data-shape-loader";
import { loadDesignSystem, hasDesignSystem } from "./design-system-loader";
import { loadDesignTokens } from "./design-tokens-loader";
import { loadShellInfo, hasShell } from "./shell-loader";

export { parseProductRoadmap };

// Load markdown files from /product/ directory at build time
const productFiles = import.meta.glob("/product/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Load zip files from root directory at build time
const exportZipFiles = import.meta.glob("/product-plan.zip", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

// Check for clickdummy component at build time
const clickdummyFiles = import.meta.glob("/src/clickdummy/ClickdummyApp.tsx", {
  eager: true,
}) as Record<string, unknown>;

/**
 * Parse product-overview.md content into ProductOverview structure
 *
 * Expected format:
 * # [Product Name]
 *
 * ## Description
 * [1-3 sentence product description]
 *
 * ## Problems & Solutions
 *
 * ### Problem 1: [Problem Title]
 * [How the product solves it]
 *
 * ## Key Features
 * - Feature 1
 * - Feature 2
 */
export function parseProductOverview(md: string): ProductOverview | null {
  if (!md || !md.trim()) return null;

  try {
    // Normalize line endings (Windows CRLF → LF)
    const normalizedMd = md.replace(/\r\n/g, "\n");

    // Extract product name from first # heading
    const nameMatch = normalizedMd.match(/^#\s+(.+)$/m);
    const name = nameMatch?.[1]?.trim() || "Product Overview";

    // Extract description - content between ## Description and next ##
    const descMatch = normalizedMd.match(/## Description\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/);
    const description = descMatch?.[1]?.trim() || "";

    // Extract problems - ### Problem N: Title pattern
    const problemsSection = normalizedMd.match(
      /## Problems & Solutions\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/,
    );
    const problems: Problem[] = [];

    if (problemsSection?.[1]) {
      const problemMatches = [
        ...problemsSection[1].matchAll(/### Problem \d+:\s*(.+)\n+([\s\S]*?)(?=\n### |\n## |$)/g),
      ];
      for (const match of problemMatches) {
        problems.push({
          title: match[1].trim(),
          solution: match[2].trim(),
        });
      }
    }

    // Extract features - bullet list after ## Key Features
    const featuresSection = normalizedMd.match(
      /## Key Features\s*\n+([\s\S]*?)(?=\n## |\n#[^#]|$)/,
    );
    const features: string[] = [];

    if (featuresSection?.[1]) {
      const lines = featuresSection[1].split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("- ")) {
          features.push(trimmed.slice(2).trim());
        }
      }
    }

    // Return null if we couldn't parse anything meaningful
    if (!description && problems.length === 0 && features.length === 0) {
      return null;
    }

    return { name, description, problems, features };
  } catch {
    return null;
  }
}

/**
 * Load all product data from markdown files and other sources
 */
export function loadProductData(): ProductData {
  const overviewContent = productFiles["/product/product-overview.md"];
  const roadmapContent = productFiles["/product/product-roadmap.md"];

  return {
    overview: overviewContent ? parseProductOverview(overviewContent) : null,
    roadmap: roadmapContent ? parseProductRoadmap(roadmapContent) : null,
    dataShape: loadDataShape(),
    designSystem: loadDesignSystem(),
    designTokens: loadDesignTokens(),
    shell: loadShellInfo(),
  };
}

/**
 * Check if product overview has been defined
 */
export function hasProductOverview(): boolean {
  return "/product/product-overview.md" in productFiles;
}

/**
 * Check if product roadmap has been defined
 */
export function hasProductRoadmap(): boolean {
  return "/product/product-roadmap.md" in productFiles;
}

/**
 * Check if export zip file exists
 */
export function hasExportZip(): boolean {
  return "/product-plan.zip" in exportZipFiles;
}

/**
 * Check if clickdummy has been assembled
 */
export function hasClickdummy(): boolean {
  return "/src/clickdummy/ClickdummyApp.tsx" in clickdummyFiles;
}

/**
 * Get the URL of the export zip file (if it exists)
 */
export function getExportZipUrl(): string | null {
  return exportZipFiles["/product-plan.zip"] || null;
}

// Re-export utility functions for checking individual pieces
export { hasDataShape, hasDesignSystem, hasShell };
