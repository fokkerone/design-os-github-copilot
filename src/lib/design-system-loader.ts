/**
 * Design system loading utilities
 * Loads the unified design system (colors, typography, brand identity)
 */

import type { DesignSystem, ColorTokens, TypographyTokens } from "@/types/product";
import { hasDesignTokens } from "./design-tokens-loader";

// Load JSON file from product/design-system at build time
const designSystemFile = import.meta.glob("/product/design-system/design-system.json", {
  eager: true,
}) as Record<string, { default: DesignSystem }>;

// Legacy: Load separate color/typography files for backwards compatibility
const legacyFiles = import.meta.glob("/product/design-system/*.json", {
  eager: true,
}) as Record<string, { default: Record<string, string> }>;

// Check for resources folder
const resourceFiles = import.meta.glob("/product/design-system/resources/*", {
  eager: true,
}) as Record<string, unknown>;

/**
 * Load the complete design system from design-system.json
 * Falls back to legacy separate files (colors.json, typography.json) for backwards compatibility
 */
export function loadDesignSystem(): DesignSystem | null {
  // Try new unified file first
  const unifiedModule = designSystemFile["/product/design-system/design-system.json"];
  if (unifiedModule?.default) {
    return unifiedModule.default;
  }

  // Fallback to legacy separate files
  const colors = loadLegacyColorTokens();
  const typography = loadLegacyTypographyTokens();

  if (!colors && !typography) {
    return null;
  }

  return { colors, typography };
}

/**
 * Load legacy color tokens from colors.json (backwards compatibility)
 */
function loadLegacyColorTokens(): ColorTokens | null {
  const colorsModule = legacyFiles["/product/design-system/colors.json"];
  if (!colorsModule?.default) return null;

  const colors = colorsModule.default;
  if (!colors.primary || !colors.secondary || !colors.neutral) {
    return null;
  }

  return {
    primary: colors.primary,
    secondary: colors.secondary,
    neutral: colors.neutral,
  };
}

/**
 * Load legacy typography tokens from typography.json (backwards compatibility)
 */
function loadLegacyTypographyTokens(): TypographyTokens | null {
  const typographyModule = legacyFiles["/product/design-system/typography.json"];
  if (!typographyModule?.default) return null;

  const typography = typographyModule.default;
  if (!typography.heading || !typography.body) {
    return null;
  }

  return {
    heading: typography.heading,
    body: typography.body,
    mono: typography.mono || "IBM Plex Mono",
  };
}

/**
 * Check if design system has been defined
 * (agent-authored design-system.json, legacy files, or imported design tokens)
 */
export function hasDesignSystem(): boolean {
  return (
    hasDesignTokens() ||
    "/product/design-system/design-system.json" in designSystemFile ||
    "/product/design-system/colors.json" in legacyFiles ||
    "/product/design-system/typography.json" in legacyFiles
  );
}

/**
 * Get list of resource files in the design-system/resources folder
 */
export function getDesignResourceFiles(): string[] {
  return Object.keys(resourceFiles).map((path) =>
    path.replace("/product/design-system/resources/", ""),
  );
}

/**
 * Check if there are any design resources to analyze
 */
export function hasDesignResources(): boolean {
  return Object.keys(resourceFiles).length > 0;
}
