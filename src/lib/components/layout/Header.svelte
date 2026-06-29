<script lang="ts">
  import { getCurrentPage, type Page } from "$lib/stores/navigation.svelte";

  const PAGE_TITLES: Record<Page, string> = {
    dashboard: "Bảng điều khiển",
    settings: "Cài đặt",
    hooks: "Hooks",
    instructions: "Hướng dẫn",
    memory: "Bộ nhớ",
    mcp: "MCP Server",
    skills: "Skills & Agent",
    rules: "Quy tắc",
    plugins: "Plugin",
    git: "Git",
    terminal: "Terminal",
    analytics: "Phân tích",
    pipelines: "Pipeline",
    sessions: "Phiên",
    templates: "Mẫu",
    "token-savings": "Tiết kiệm token",
    "context-engine": "Context Engine",
    keybindings: "Phím tắt",
  };

  const PAGE_DESCRIPTIONS: Record<Page, string> = {
    dashboard: "Tổng quan và thống kê Claude Code của bạn",
    settings: "Cấu hình toàn cục và theo dự án",
    hooks: "Các hook tự động hoá theo sự kiện",
    instructions: "Các file hướng dẫn CLAUDE.md",
    memory: "Bộ nhớ và ngữ cảnh dự án",
    mcp: "Các server Model Context Protocol",
    skills: "Skills tuỳ biến và định nghĩa agent",
    rules: "Các quy tắc theo ngữ cảnh cho Claude",
    plugins: "Duyệt và quản lý plugin",
    git: "Quản lý phiên bản cho dự án của bạn",
    terminal: "Phiên Claude Code tương tác",
    analytics: "Lượt dùng token, chi phí và dấu vết phiên",
    pipelines: "Trình dựng workflow trực quan với Claude Code",
    sessions: "Xem lại và duyệt các phiên Claude Code trước đây",
    templates: "Duyệt và thêm các cấu hình dựng sẵn",
    "token-savings": "Tối ưu mức dùng token bằng lọc output lệnh tự động",
    "context-engine": "Truy xuất có cấu trúc và ảo hoá output công cụ để tăng ngữ cảnh",
    keybindings: "Tuỳ chỉnh phím tắt Claude Code",
  };

  const currentPage = $derived(getCurrentPage());
</script>

<header class="flex items-center justify-between px-6 py-[7px] border-b border-border bg-bg-secondary">
  <div>
    <h2 class="text-lg font-semibold text-text-primary">{PAGE_TITLES[currentPage]}</h2>
    <p class="text-sm text-text-muted">{PAGE_DESCRIPTIONS[currentPage]}</p>
  </div>
</header>
