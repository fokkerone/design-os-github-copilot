/**
 * Product roadmap parsing (product/product-roadmap.md).
 * Pure module: no Vite APIs, so scripts and tests can import it directly.
 */

import type { ProductRoadmap, Section } from "../../types/product.ts";

/**
 * Slugify a string for use as an ID
 * Converts " & " to "-and-" to maintain semantic meaning
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+&\s+/g, "-and-") // Convert " & " to "-and-" first
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Parse product-roadmap.md content into ProductRoadmap structure
 *
 * Expected format:
 * # Product Roadmap
 *
 * ## Sections
 *
 * ### 1. [Section Title]
 * [One sentence description]
 *
 * ### 2. [Section Title]
 * [One sentence description]
 */
export function parseProductRoadmap(md: string): ProductRoadmap | null {
  if (!md || !md.trim()) return null;

  try {
    const sections: Section[] = [];

    // Normalize line endings (Windows CRLF → LF)
    const normalizedMd = md.replace(/\r\n/g, "\n");

    // Match sections with pattern ### N. Title
    const sectionMatches = [
      ...normalizedMd.matchAll(/### (\d+)\.\s*(.+)\n+([\s\S]*?)(?=\n### |\n## |\n#[^#]|$)/g),
    ];

    for (const match of sectionMatches) {
      const order = parseInt(match[1], 10);
      const title = match[2].trim();
      const description = match[3].trim();

      sections.push({
        id: slugify(title),
        title,
        description,
        order,
      });
    }

    // Sort by order
    sections.sort((a, b) => a.order - b.order);

    if (sections.length === 0) {
      return null;
    }

    return { sections };
  } catch {
    return null;
  }
}
