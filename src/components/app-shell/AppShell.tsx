import { useEffect, useState } from "react";
import { Menu, Moon, PanelLeft, Sun, X } from "lucide-react";
import { MainNav } from "./MainNav";
import Logo from "@/components/logo";
import doodle from "@/assets/doodle.svg";
import type { NavItem } from "@/lib/navigation";

export type ShellTheme = "dark" | "light";

export interface AppShellProps {
  children: React.ReactNode;
  navigation: NavItem[];
  theme?: ShellTheme;
  /** Controlled sidebar state (desktop). Omit to let the shell manage it. */
  sidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  onNavigate?: (href: string) => void;
  onThemeChange?: (theme: ShellTheme) => void;
}

export function AppShell({
  children,
  navigation,
  theme = "dark",
  sidebarCollapsed,
  onSidebarCollapsedChange,
  onNavigate,
  onThemeChange,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const collapsed = sidebarCollapsed ?? internalCollapsed;
  // The sidebar clips only while collapsed or animating its width
  const [prevCollapsed, setPrevCollapsed] = useState(collapsed);
  const [animating, setAnimating] = useState(false);
  if (prevCollapsed !== collapsed) {
    setPrevCollapsed(collapsed);
    setAnimating(true);
  }
  const toggleSidebar = () => {
    const next = !collapsed;
    setInternalCollapsed(next);
    onSidebarCollapsedChange?.(next);
  };

  // Linear shortcut: "[" toggles the sidebar (ignored while typing)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        t &&
        (t.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName));
      if (e.key === "[" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const navigate = (href: string) => {
    setDrawerOpen(false);
    onNavigate?.(href);
  };

  const nextTheme: ShellTheme = theme === "dark" ? "light" : "dark";

  const sidebar = (
    <div className='flex h-full flex-col pt-2'>
      <div className='flex h-32 shrink-0 items-center gap-2 pl-4 pr-2'>
        <Logo className='h-15 text-black dark:text-white' />
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto pb-4 pt-3'>
        <MainNav items={navigation} onNavigate={navigate} />
      </div>
      <div className='shrink-0 px-2 pb-2'>
        <IconButton
          label={`Switch to ${nextTheme} theme`}
          onClick={() => onThemeChange?.(nextTheme)}
        >
          {theme === "dark" ? (
            <Moon className='size-4' strokeWidth={1.75} />
          ) : (
            <Sun className='size-4' strokeWidth={1.75} />
          )}
        </IconButton>
      </div>
    </div>
  );

  return (
    // The shell sets its own `dark` or `light` scope so it does not depend on the page theme.
    <div className={theme} style={{ colorScheme: theme }}>
      <div className="relative isolate flex h-screen w-full overflow-hidden bg-background font-['Inter',sans-serif] text-foreground antialiased">
        {/* Doodle tile behind the frame (sidebar, gutters). The SVG is a mask, so it is tinted per theme; the content panel covers it. */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 -z-10 bg-foreground/10'
          style={{
            maskImage: `url(${doodle})`,
            WebkitMaskImage: `url(${doodle})`,
            maskRepeat: "repeat",
            WebkitMaskRepeat: "repeat",
            maskSize: "460px auto",
            WebkitMaskSize: "360px auto",
          }}
        />
        {/* Desktop sidebar */}
        <aside
          aria-hidden={collapsed}
          onTransitionEnd={(e) =>
            e.target === e.currentTarget && setAnimating(false)
          }
          className={`relative z-30 hidden shrink-0 transition-[width] duration-200 ease-out md:block ${
            collapsed ? "w-0" : "w-[238px]"
          } ${collapsed || animating ? "overflow-hidden" : ""}`}
        >
          <div className='h-full w-[238px]' inert={collapsed}>
            {sidebar}
          </div>
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className='fixed inset-0 z-40 md:hidden'>
            <div
              className='absolute inset-0 bg-rwe-black-a-25'
              onClick={() => setDrawerOpen(false)}
            />
            <aside className='absolute inset-y-0 left-0 w-[280px] bg-muted shadow-xl'>
              <button
                type='button'
                aria-label='Close navigation'
                onClick={() => setDrawerOpen(false)}
                className='absolute right-2 top-16 z-10 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent'
              >
                <X className='size-4' />
              </button>
              {sidebar}
            </aside>
          </div>
        )}

        <div className='flex min-w-0 flex-1 flex-col'>
          {/* Mobile top bar */}
          <div className='flex h-12 shrink-0 items-center gap-2 border-b border-border px-2 md:hidden'>
            <IconButton
              label='Open navigation'
              onClick={() => setDrawerOpen(true)}
            >
              <Menu className='size-5' strokeWidth={1.75} />
            </IconButton>
            <span className='truncate text-sm font-semibold'>Design OS</span>
          </div>

          {/* Content panel. The sidebar toggle sits at the left edge of the 48px header. */}
          <main
            className={`relative min-h-0 flex-1 overflow-y-auto bg-card md:mr-1.5 md:mt-1.5 md:[&>*>header:first-child]:pl-12 ${
              collapsed ? "md:ml-1.5" : ""
            } md:rounded-lg md:border md:border-border`}
          >
            <span className='absolute left-2 top-2 z-10 hidden md:block'>
              <IconButton
                label={collapsed ? "Show sidebar ( [ )" : "Hide sidebar ( [ )"}
                onClick={toggleSidebar}
              >
                <PanelLeft className='size-4' strokeWidth={1.75} />
              </IconButton>
            </span>
            {children}
          </main>

          <div className='hidden h-2 shrink-0 md:block' />
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      aria-label={label}
      onClick={onClick}
      className='flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rwe-focus'
    >
      {children}
    </button>
  );
}
