export type Page =
  | "dashboard"
  | "settings"
  | "hooks"
  | "instructions"
  | "memory"
  | "mcp"
  | "skills"
  | "rules"
  | "plugins"
  | "git"
  | "terminal"
  | "analytics"
  | "templates"
  | "sessions"
  | "pipelines"
  | "token-savings"
  | "context-engine"
  | "keybindings";

export interface NavItem {
  id: Page;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "Bảng điều khiển", icon: "chart" },
  { id: "settings", label: "Cài đặt", icon: "gear" },
  { id: "hooks", label: "Hooks", icon: "bolt" },
  { id: "instructions", label: "Hướng dẫn", icon: "book" },
  { id: "memory", label: "Bộ nhớ", icon: "brain" },
  { id: "mcp", label: "MCP Server", icon: "server" },
  { id: "skills", label: "Skills & Agent", icon: "sparkles" },
  { id: "rules", label: "Quy tắc", icon: "shield" },
  { id: "plugins", label: "Plugin", icon: "puzzle" },
  { id: "git", label: "Git", icon: "git" },
  { id: "pipelines", label: "Pipeline", icon: "pipelines" },
  { id: "sessions", label: "Phiên", icon: "sessions" },
  { id: "templates", label: "Mẫu", icon: "templates" },
  { id: "terminal", label: "Terminal", icon: "terminal" },
  { id: "analytics", label: "Phân tích", icon: "analytics" },
  { id: "token-savings", label: "Tiết kiệm token", icon: "savings" },
  { id: "context-engine", label: "Context Engine", icon: "network" },
  { id: "keybindings", label: "Phím tắt", icon: "keybindings" },
];

let currentPage = $state<Page>("dashboard");

if (typeof window !== "undefined") {
  const page = new URLSearchParams(window.location.search).get("page");
  if (page && NAV_ITEMS.some((item) => item.id === page)) {
    currentPage = page as Page;
  }
}

export function navigateTo(page: Page) {
  currentPage = page;
}

export function getCurrentPage(): Page {
  return currentPage;
}
