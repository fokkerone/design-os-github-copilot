import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppLayout } from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { StepIndicator, type StepStatus } from "@/components/StepIndicator";
import { NextPhaseButton } from "@/components/NextPhaseButton";
import { loadProductData } from "@/lib/product-loader";
import {
  hasDesignResources,
  getDesignResourceFiles,
} from "@/lib/design-system-loader";
import {
  ChevronRight,
  Layout,
  FileImage,
  FileText,
  Type,
  FolderOpen,
} from "lucide-react";

// Map Tailwind color names to actual color values for preview
const colorMap: Record<string, { light: string; base: string; dark: string }> =
  {
    red: { light: "#fca5a5", base: "#ef4444", dark: "#dc2626" },
    orange: { light: "#fdba74", base: "#f97316", dark: "#ea580c" },
    amber: { light: "#fcd34d", base: "#f59e0b", dark: "#d97706" },
    yellow: { light: "#fde047", base: "#eab308", dark: "#ca8a04" },
    lime: { light: "#bef264", base: "#84cc16", dark: "#65a30d" },
    green: { light: "#86efac", base: "#22c55e", dark: "#16a34a" },
    emerald: { light: "#6ee7b7", base: "#10b981", dark: "#059669" },
    teal: { light: "#5eead4", base: "#14b8a6", dark: "#0d9488" },
    cyan: { light: "#67e8f9", base: "#06b6d4", dark: "#0891b2" },
    sky: { light: "#7dd3fc", base: "#0ea5e9", dark: "#0284c7" },
    blue: { light: "#93c5fd", base: "#3b82f6", dark: "#2563eb" },
    indigo: { light: "#a5b4fc", base: "#6366f1", dark: "#4f46e5" },
    violet: { light: "#c4b5fd", base: "#8b5cf6", dark: "#7c3aed" },
    purple: { light: "#d8b4fe", base: "#a855f7", dark: "#9333ea" },
    fuchsia: { light: "#f0abfc", base: "#d946ef", dark: "#c026d3" },
    pink: { light: "#f9a8d4", base: "#ec4899", dark: "#db2777" },
    rose: { light: "#fda4af", base: "#f43f5e", dark: "#e11d48" },
    slate: { light: "#cbd5e1", base: "#64748b", dark: "#475569" },
    gray: { light: "#d1d5db", base: "#6b7280", dark: "#4b5563" },
    zinc: { light: "#d4d4d8", base: "#71717a", dark: "#52525b" },
    neutral: { light: "#d4d4d4", base: "#737373", dark: "#525252" },
    stone: { light: "#d6d3d1", base: "#78716c", dark: "#57534e" },
  };

// Categorize resource files by type
function categorizeResources(files: string[]): {
  images: string[];
  documents: string[];
  fonts: string[];
  other: string[];
} {
  const categories = {
    images: [] as string[],
    documents: [] as string[],
    fonts: [] as string[],
    other: [] as string[],
  };

  for (const file of files) {
    const ext = file.split(".").pop()?.toLowerCase() || "";
    if (["png", "jpg", "jpeg", "svg", "gif", "webp"].includes(ext)) {
      categories.images.push(file);
    } else if (["pdf", "md", "txt", "doc", "docx"].includes(ext)) {
      categories.documents.push(file);
    } else if (["ttf", "otf", "woff", "woff2"].includes(ext)) {
      categories.fonts.push(file);
    } else {
      categories.other.push(file);
    }
  }

  return categories;
}

/**
 * Determine the status of each step on the Design page
 * Steps: 1. Design System, 2. Shell Design
 */
function getDesignPageStepStatuses(
  hasDesignSystem: boolean,
  hasShell: boolean,
): StepStatus[] {
  const statuses: StepStatus[] = [];

  // Step 1: Design System
  if (hasDesignSystem) {
    statuses.push("completed");
  } else {
    statuses.push("current");
  }

  // Step 2: Shell
  if (hasShell) {
    statuses.push("completed");
  } else if (hasDesignSystem) {
    statuses.push("current");
  } else {
    statuses.push("upcoming");
  }

  return statuses;
}

export function DesignPage() {
  const productData = useMemo(() => loadProductData(), []);
  const designSystem = productData.designSystem;
  const shell = productData.shell;

  const hasDesignSystemValue = !!(
    designSystem?.colors || designSystem?.typography
  );
  const hasShell = !!shell?.spec;
  const allStepsComplete = hasDesignSystemValue && hasShell;

  const stepStatuses = getDesignPageStepStatuses(
    hasDesignSystemValue,
    hasShell,
  );

  // Get resource files for display
  const resourceFiles = getDesignResourceFiles();
  const hasResources = hasDesignResources();
  const categories = categorizeResources(resourceFiles);

  return (
    <AppLayout>
      <div className='space-y-6'>
        {/* Page intro */}
        <div className='mb-8'>
          <h1 className='text-2xl font-semibold text-stone-900 dark:text-stone-100 mb-2'>
            Design System
          </h1>
          <p className='text-stone-600 dark:text-stone-400'>
            Define the visual foundation and application shell for your product.
          </p>
        </div>

        {/* Step 1: Design System */}
        <StepIndicator step={1} status={stepStatuses[0]}>
          {!designSystem?.colors && !designSystem?.typography ? (
            <DesignSystemEmptyState hasResources={hasResources} />
          ) : (
            <Card className='border-stone-200 dark:border-stone-700 shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-semibold text-stone-900 dark:text-stone-100'>
                  Design System
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                {/* Colors */}
                {designSystem?.colors && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-4'>
                      Colors
                    </h4>
                    {typeof designSystem.colors.primary === "string" ? (
                      <div className='grid grid-cols-3 gap-6'>
                        <ColorSwatch
                          label='Primary'
                          colorName={designSystem.colors.primary}
                        />
                        <ColorSwatch
                          label='Secondary'
                          colorName={designSystem.colors.secondary}
                        />
                        <ColorSwatch
                          label='Neutral'
                          colorName={designSystem.colors.neutral}
                        />
                      </div>
                    ) : (
                      <ColorPalette
                        colors={designSystem.colors}
                      />
                    )}
                  </div>
                )}

                {/* Typography */}
                {designSystem?.typography && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-4'>
                      Typography
                    </h4>
                    <div className='grid grid-cols-3 gap-6'>
                      <div>
                        <p className='text-xs text-stone-500 dark:text-stone-400 mb-1'>
                          Heading
                        </p>
                        <p className='font-semibold text-stone-900 dark:text-stone-100'>
                          {designSystem.typography.heading}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-stone-500 dark:text-stone-400 mb-1'>
                          Body
                        </p>
                        <p className='text-stone-900 dark:text-stone-100'>
                          {designSystem.typography.body}
                        </p>
                      </div>
                      <div>
                        <p className='text-xs text-stone-500 dark:text-stone-400 mb-1'>
                          Mono
                        </p>
                        <p className='font-mono text-stone-900 dark:text-stone-100'>
                          {designSystem.typography.mono}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Brand Personality */}
                {designSystem?.personality && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3'>
                      Brand Personality
                    </h4>
                    <div className='flex flex-wrap gap-2 mb-2'>
                      {designSystem.personality.adjectives?.map((adj, i) => (
                        <Badge key={i} variant='secondary' className='text-xs'>
                          {adj}
                        </Badge>
                      ))}
                    </div>
                    {designSystem.personality.mood && (
                      <p className='text-sm text-stone-600 dark:text-stone-400'>
                        {designSystem.personality.mood}
                      </p>
                    )}
                  </div>
                )}

                {/* Brand Voice */}
                {designSystem?.voice && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3'>
                      Brand Voice
                    </h4>
                    <p className='text-sm text-stone-700 dark:text-stone-300 font-medium mb-2'>
                      {designSystem.voice.tone}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {designSystem.voice.characteristics?.map((char, i) => (
                        <span
                          key={i}
                          className='text-xs text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded'
                        >
                          {char}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* UI Style Preferences */}
                {designSystem?.uiStyle && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3'>
                      UI Style
                    </h4>
                    <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
                      {designSystem.uiStyle.borderRadius && (
                        <div className='bg-stone-50 dark:bg-stone-800/50 rounded px-3 py-2'>
                          <p className='text-xs text-stone-500 dark:text-stone-400 mb-0.5'>
                            Radius
                          </p>
                          <p className='text-sm text-stone-700 dark:text-stone-300'>
                            {typeof designSystem.uiStyle.borderRadius ===
                            "string"
                              ? designSystem.uiStyle.borderRadius
                              : Object.entries(
                                  designSystem.uiStyle.borderRadius as Record<
                                    string,
                                    string
                                  >,
                                )
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ")}
                          </p>
                        </div>
                      )}
                      {designSystem.uiStyle.shadows && (
                        <div className='bg-stone-50 dark:bg-stone-800/50 rounded px-3 py-2'>
                          <p className='text-xs text-stone-500 dark:text-stone-400 mb-0.5'>
                            Shadows
                          </p>
                          <p className='text-sm text-stone-700 dark:text-stone-300'>
                            {typeof designSystem.uiStyle.shadows === "string"
                              ? designSystem.uiStyle.shadows
                              : Object.entries(
                                  designSystem.uiStyle.shadows as Record<
                                    string,
                                    string
                                  >,
                                )
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ")}
                          </p>
                        </div>
                      )}
                      {designSystem.uiStyle.density && (
                        <div className='bg-stone-50 dark:bg-stone-800/50 rounded px-3 py-2'>
                          <p className='text-xs text-stone-500 dark:text-stone-400 mb-0.5'>
                            Density
                          </p>
                          <p className='text-sm text-stone-700 dark:text-stone-300'>
                            {designSystem.uiStyle.density}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Brand Resources */}
                {hasResources && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-3'>
                      Source Resources
                    </h4>
                    <div className='flex flex-wrap gap-4 text-xs text-stone-500 dark:text-stone-400'>
                      {categories.images.length > 0 && (
                        <div className='flex items-center gap-1.5'>
                          <FileImage className='w-3.5 h-3.5' />
                          <span>
                            {categories.images.length} image
                            {categories.images.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {categories.documents.length > 0 && (
                        <div className='flex items-center gap-1.5'>
                          <FileText className='w-3.5 h-3.5' />
                          <span>
                            {categories.documents.length} document
                            {categories.documents.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                      {categories.fonts.length > 0 && (
                        <div className='flex items-center gap-1.5'>
                          <Type className='w-3.5 h-3.5' />
                          <span>
                            {categories.fonts.length} font
                            {categories.fonts.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit hint */}
                <div className='bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-2.5'>
                  <p className='text-xs text-stone-500 dark:text-stone-400'>
                    Use the{" "}
                    <code className='font-mono text-stone-700 dark:text-stone-300'>
                      @design-system
                    </code>{" "}
                    agent to update
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </StepIndicator>

        {/* Step 2: Application Shell */}
        <StepIndicator
          step={2}
          status={stepStatuses[1]}
          isLast={!allStepsComplete}
        >
          {!shell?.spec ? (
            <EmptyState type='shell' />
          ) : (
            <Card className='border-stone-200 dark:border-stone-700 shadow-sm'>
              <CardHeader className='pb-4'>
                <CardTitle className='text-lg font-semibold text-stone-900 dark:text-stone-100'>
                  Application Shell
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Overview */}
                {shell.spec.overview && (
                  <p className='text-stone-600 dark:text-stone-400 leading-relaxed'>
                    {shell.spec.overview}
                  </p>
                )}

                {/* Navigation items */}
                {shell.spec.navigationItems.length > 0 && (
                  <div>
                    <h4 className='text-sm font-medium text-stone-500 dark:text-stone-400 uppercase tracking-wide mb-2'>
                      Navigation
                    </h4>
                    <ul className='space-y-1'>
                      {shell.spec.navigationItems.map((item, index) => {
                        // Parse markdown-style bold: **text** → <strong>text</strong>
                        const parts = item.split(/\*\*([^*]+)\*\*/);
                        return (
                          <li
                            key={index}
                            className='flex items-center gap-2 text-stone-700 dark:text-stone-300'
                          >
                            <span className='w-1 h-1 rounded-full bg-stone-400 dark:bg-stone-500' />
                            {parts.map((part, i) =>
                              i % 2 === 1 ? (
                                <strong key={i} className='font-semibold'>
                                  {part}
                                </strong>
                              ) : (
                                <span key={i}>{part}</span>
                              ),
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}

                {/* View Shell Design Link */}
                {shell.hasComponents && (
                  <div className='pt-2 border-t border-stone-100 dark:border-stone-800'>
                    <Link
                      to='/shell/design'
                      className='flex items-center justify-between gap-4 py-2 hover:text-stone-900 dark:hover:text-stone-100 transition-colors group'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-8 h-8 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center'>
                          <Layout
                            className='w-4 h-4 text-stone-600 dark:text-stone-300'
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className='font-medium text-stone-700 dark:text-stone-300 group-hover:text-stone-900 dark:group-hover:text-stone-100'>
                          View Shell Design
                        </span>
                      </div>
                      <ChevronRight
                        className='w-4 h-4 text-stone-400 dark:text-stone-500'
                        strokeWidth={1.5}
                      />
                    </Link>
                  </div>
                )}

                {/* Edit hint */}
                <div className='bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-2.5'>
                  <p className='text-xs text-stone-500 dark:text-stone-400'>
                    Use the{" "}
                    <code className='font-mono text-stone-700 dark:text-stone-300'>
                      @design-shell
                    </code>{" "}
                    agent to update
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </StepIndicator>

        {/* Next Phase Button - shown when all steps complete */}
        {allStepsComplete && (
          <StepIndicator step={3} status='current' isLast>
            <NextPhaseButton nextPhase='sections' />
          </StepIndicator>
        )}
      </div>
    </AppLayout>
  );
}

interface ColorSwatchProps {
  label: string;
  colorName: string;
}

function ColorSwatch({ label, colorName }: ColorSwatchProps) {
  const colors = colorMap[colorName] || colorMap.stone;

  return (
    <div>
      <div className='flex gap-0.5 mb-2'>
        <div
          className='flex-1 h-14 rounded-l-md'
          style={{ backgroundColor: colors.light }}
          title={`${colorName}-300`}
        />
        <div
          className='flex-2 h-14'
          style={{ backgroundColor: colors.base }}
          title={`${colorName}-500`}
        />
        <div
          className='flex-1 h-14 rounded-r-md'
          style={{ backgroundColor: colors.dark }}
          title={`${colorName}-600`}
        />
      </div>
      <p className='text-sm font-medium text-stone-900 dark:text-stone-100'>
        {label}
      </p>
      <p className='text-xs text-stone-500 dark:text-stone-400'>{colorName}</p>
    </div>
  );
}

/** Renders a nested color palette (for Apple-style design systems with object-based colors) */
function ColorPalette({ colors }: { colors: object }) {
  return (
    <div className='space-y-4'>
      {Object.entries(colors).map(([groupName, group]) => {
        if (!group || typeof group !== "object") return null;
        const entries = Object.entries(group as Record<string, string>);
        return (
          <div key={groupName}>
            <p className='text-xs font-medium text-stone-500 dark:text-stone-400 mb-2 capitalize'>
              {groupName}
            </p>
            <div className='flex flex-wrap gap-2'>
              {entries.map(([name, hex]) => (
                <div key={name} className='flex items-center gap-2'>
                  <div
                    className='w-8 h-8 rounded-md border border-stone-200 dark:border-stone-700'
                    style={{ backgroundColor: hex }}
                    title={hex}
                  />
                  <div>
                    <p className='text-xs font-medium text-stone-700 dark:text-stone-300'>
                      {name}
                    </p>
                    <p className='text-[10px] text-stone-400 font-mono'>
                      {hex}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * Custom empty state for design system that includes the resource hint
 */
function DesignSystemEmptyState({ hasResources }: { hasResources: boolean }) {
  return (
    <Card className='border-stone-200 dark:border-stone-700 shadow-sm border-dashed'>
      <CardContent className='py-8'>
        <div className='flex flex-col items-center text-center max-w-sm mx-auto'>
          <div className='w-10 h-10 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center mb-3'>
            <Layout
              className='w-5 h-5 text-stone-400 dark:text-stone-500'
              strokeWidth={1.5}
            />
          </div>
          <h3 className='text-base font-medium text-stone-600 dark:text-stone-400 mb-1'>
            No design system defined yet
          </h3>
          <p className='text-sm text-stone-500 dark:text-stone-400 mb-4'>
            Define colors, typography, and brand identity for your product
          </p>
          <div className='bg-stone-100 dark:bg-stone-800 rounded-md px-4 py-2.5 w-full space-y-2'>
            <div>
              <p className='text-xs text-stone-500 dark:text-stone-400 mb-0.5'>
                Select Copilot agent:
              </p>
              <code className='text-sm font-mono text-stone-700 dark:text-stone-300'>
                @design-system
              </code>
            </div>
            <div className='border-t border-stone-200 dark:border-stone-700 pt-2'>
              <p className='text-xs text-stone-500 dark:text-stone-400 mb-0.5'>
                Then say:
              </p>
              <p className='text-sm text-stone-600 dark:text-stone-300 italic'>
                "Help me define my design system"
              </p>
            </div>
          </div>

          {/* Brand resources hint */}
          <div className='mt-4 w-full'>
            <div className='bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-md px-4 py-3'>
              <div className='flex items-start gap-3'>
                <FolderOpen className='w-4 h-4 text-stone-400 dark:text-stone-500 mt-0.5 shrink-0' />
                <div className='space-y-2 text-left'>
                  <div>
                    <p className='text-xs font-medium text-stone-600 dark:text-stone-300 mb-1'>
                      {hasResources
                        ? "Brand resources found"
                        : "Optional: Add brand resources first"}
                    </p>
                    <code className='text-xs font-mono text-stone-500 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 rounded'>
                      product/design-system/resources/
                    </code>
                  </div>
                  {!hasResources && (
                    <div className='text-xs text-stone-500 dark:text-stone-400 space-y-1'>
                      <p className='font-medium text-stone-600 dark:text-stone-300'>
                        What to add:
                      </p>
                      <ul className='space-y-0.5 ml-1'>
                        <li className='flex items-center gap-1.5'>
                          <FileImage className='w-3 h-3' />
                          <span>Logos (SVG, PNG)</span>
                        </li>
                        <li className='flex items-center gap-1.5'>
                          <FileText className='w-3 h-3' />
                          <span>Style guides (PDF, images)</span>
                        </li>
                        <li className='flex items-center gap-1.5'>
                          <Type className='w-3 h-3' />
                          <span>Font files or names</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
