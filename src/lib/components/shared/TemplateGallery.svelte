<script lang="ts">
  import { Search, X, Sparkles, Bot, Shield, Zap, Server, LayoutGrid } from "lucide-svelte";

  export interface Template {
    id: string;
    name: string;
    description: string;
    category: "skill" | "agent" | "rule" | "hook" | "mcp";
    content?: string;
    // For rules
    paths?: string[];
    // For hooks
    event?: string;
    matcher?: string;
    hookType?: "command" | "http" | "prompt" | "agent";
    hookValue?: string;
    // For MCP
    mcpType?: "stdio" | "sse";
    mcpCommand?: string;
    mcpArgs?: string;
    mcpUrl?: string;
  }

  interface Props {
    open: boolean;
    defaultCategory?: Template["category"] | "all";
    onselect: (template: Template) => void;
    onclose: () => void;
  }

  const { open, defaultCategory = "all", onselect, onclose }: Props = $props();

  let activeCategory = $state<Template["category"] | "all">("all");
  let search = $state("");

  // Reset when opening
  $effect(() => {
    if (open) {
      activeCategory = defaultCategory;
      search = "";
    }
  });

  const CATEGORIES = [
    { id: "all" as const, label: "Tất cả", icon: LayoutGrid },
    { id: "skill" as const, label: "Skills", icon: Sparkles },
    { id: "agent" as const, label: "Agents", icon: Bot },
    { id: "rule" as const, label: "Quy tắc", icon: Shield },
    { id: "hook" as const, label: "Hooks", icon: Zap },
    { id: "mcp" as const, label: "MCP", icon: Server },
  ];

  const TEMPLATES: Template[] = [
    // Skills
    { id: "skill-code-review", name: "Code Review", description: "Rà soát code về chất lượng, lỗi và best practices", category: "skill", content: "---\nname: code-review\ndescription: Rà soát code về chất lượng, lỗi và best practices\nuser-invocable: true\nargument-hint: \"[file or PR]\"\n---\n\nRà soát đoạn code được chỉ định để tìm:\n- Lỗi logic và edge cases\n- Vấn đề performance\n- Lỗ hổng bảo mật\n- Code style và độ dễ đọc\n\nĐưa ra góp ý có thể hành động được kèm tham chiếu dòng cụ thể.\n" },
    { id: "skill-deploy", name: "Deploy", description: "Deploy ứng dụng lên môi trường", category: "skill", content: "---\nname: deploy\ndescription: Deploy ứng dụng\ndisable-model-invocation: true\nuser-invocable: true\nargument-hint: \"[environment]\"\nallowed-tools: Bash\n---\n\n## Deploy lên $ARGUMENTS\n\n1. Chạy kiểm thử\n2. Build ứng dụng\n3. Deploy lên môi trường $ARGUMENTS\n4. Xác minh deployment\n" },
    { id: "skill-explain", name: "Giải thích code", description: "Giải thích chi tiết cấu trúc và logic của code", category: "skill", content: "---\nname: explain-code\ndescription: Giải thích cấu trúc và logic của code\nuser-invocable: true\nargument-hint: \"[file path]\"\ncontext: fork\nagent: Explore\n---\n\nGiải thích chi tiết $ARGUMENTS:\n1. Nó làm gì\n2. Nó hoạt động ra sao\n3. Các pattern chính được dùng\n4. Dependencies\n" },
    { id: "skill-test-runner", name: "Test Runner", description: "Chạy và phân tích kết quả kiểm thử", category: "skill", content: "---\nname: test-runner\ndescription: Chạy test và phân tích kết quả\nuser-invocable: true\nallowed-tools: Bash, Read\n---\n\nChạy test suite của dự án:\n1. Xác định test framework\n2. Chạy toàn bộ test\n3. Phân tích lỗi thất bại\n4. Đề xuất cách sửa các test đang fail\n" },
    { id: "skill-pr-review", name: "PR Review", description: "Rà soát thay đổi trong pull request", category: "skill", content: "---\nname: pr-review\ndescription: Rà soát pull request\nuser-invocable: true\nargument-hint: \"[PR number]\"\nallowed-tools: Bash, Read, Glob, Grep\n---\n\nRà soát PR #$ARGUMENTS:\n\n1. Lấy PR diff: !`gh pr diff $0`\n2. Lấy mô tả PR: !`gh pr view $0`\n3. Phân tích thay đổi về:\n   - Tính đúng đắn\n   - Độ phủ kiểm thử\n   - Vấn đề bảo mật\n   - Ảnh hưởng đến performance\n4. Tóm tắt và đề xuất approve hay request-changes\n" },
    { id: "skill-refactor", name: "Refactor", description: "Refactor code để cấu trúc tốt hơn", category: "skill", content: "---\nname: refactor\ndescription: Refactor code để cấu trúc và độ rõ ràng tốt hơn\nuser-invocable: true\nargument-hint: \"[file or module]\"\n---\n\nRefactor $ARGUMENTS:\n1. Xác định code smells\n2. Tách hàm hoặc module\n3. Đơn giản hoá logic phức tạp\n4. Cải thiện cách đặt tên\n5. Đảm bảo test vẫn pass\n" },

    // Agents
    { id: "agent-bug-fixer", name: "Bug Fixer", description: "Điều tra và sửa các lỗi được báo cáo", category: "agent", content: "---\nname: bug-fixer\ndescription: Điều tra và sửa các lỗi được báo cáo\nmodel: opus\neffort: high\ntools: Read, Glob, Grep, Edit, Bash\npermissions: acceptEdits\n---\n\nBạn là một debugger giàu kinh nghiệm. Khi nhận được bug report:\n1. Tái hiện lỗi bằng cách đọc code liên quan\n2. Xác định nguyên nhân gốc\n3. Triển khai bản sửa tối thiểu\n4. Xác minh bản sửa không làm hỏng test hiện có\n" },
    { id: "agent-security", name: "Security Auditor", description: "Audit code để tìm lỗ hổng bảo mật", category: "agent", content: "---\nname: security-auditor\ndescription: Audit code để tìm lỗ hổng bảo mật\nmodel: opus\ntools: Read, Glob, Grep\npermissions: plan\nmemory: project\n---\n\nBạn là chuyên gia bảo mật. Hãy phân tích code để tìm:\n- Lỗ hổng trong OWASP Top 10\n- Các kiểu injection (SQL, XSS, command)\n- Lỗi authentication hoặc authorization\n- Secrets trong code\n- Lỗ hổng từ dependencies\n\nĐưa ra mức độ nghiêm trọng và các bước khắc phục.\n" },
    { id: "agent-docs", name: "Docs Generator", description: "Sinh tài liệu đầy đủ", category: "agent", content: "---\nname: docs-generator\ndescription: Sinh tài liệu đầy đủ\nmodel: sonnet\ntools: Read, Glob, Grep, Write\n---\n\nBạn tạo tài liệu. Với mỗi file hoặc module:\n1. Đọc và hiểu code\n2. Sinh comment JSDoc/TSDoc\n3. Tạo các phần README\n4. Thêm ví dụ sử dụng\n" },
    { id: "agent-perf", name: "Performance Optimizer", description: "Phân tích và tối ưu performance của code", category: "agent", content: "---\nname: performance-optimizer\ndescription: Phân tích và tối ưu performance của code\nmodel: opus\ntools: Read, Glob, Grep, Edit, Bash\nmemory: project\n---\n\nBạn là chuyên gia performance. Khi phân tích code:\n1. Profile các hot path\n2. Xác định bottleneck (O(n^2), cấp phát không cần thiết)\n3. Đề xuất tối ưu kèm benchmark\n4. Triển khai thay đổi\n" },

    // Rules
    { id: "rule-ts-strict", name: "TypeScript Strict", description: "Áp dụng các quy tắc TypeScript nghiêm ngặt", category: "rule", paths: ["**/*.ts", "**/*.tsx"], content: "# Quy tắc TypeScript\n\n- Dùng strict mode, không dùng kiểu `any`\n- Ưu tiên named export hơn default export\n- Ưu tiên interface hơn type alias cho object\n- Khai báo rõ kiểu trả về cho public function\n- Không để biến hoặc import không dùng tới" },
    { id: "rule-api", name: "Thiết kế API", description: "Quy ước và kiểm tra cho REST API", category: "rule", paths: ["src/api/**/*", "src/routes/**/*"], content: "# Quy tắc thiết kế API\n\n- Mọi endpoint phải validate input\n- Dùng định dạng lỗi chuẩn: `{ error: string, code: number }`\n- Trả về đúng HTTP status code\n- Có phân trang cho endpoint trả danh sách\n- Tài liệu hoá endpoint bằng JSDoc" },
    { id: "rule-testing", name: "Tiêu chuẩn kiểm thử", description: "Quy tắc đặt tên, coverage và pattern kiểm thử", category: "rule", paths: ["**/*.test.*", "**/*.spec.*"], content: "# Quy tắc kiểm thử\n\n- Đặt file test cùng vị trí với source file\n- Dùng tên rõ nghĩa: 'should [behavior] when [condition]'\n- Không để test phụ thuộc state của test khác\n- Mock dịch vụ bên ngoài, không mock module nội bộ\n- Mục tiêu 80%+ coverage cho luồng quan trọng" },
    { id: "rule-security", name: "Bảo mật", description: "Best practices bảo mật cho code", category: "rule", paths: [], content: "# Quy tắc bảo mật\n\n- Không bao giờ commit secrets, API keys hoặc credentials\n- Sanitize input người dùng trước khi query database\n- Dùng parameterized query, không nối chuỗi trực tiếp\n- Validate mọi dữ liệu từ bên ngoài ở ranh giới hệ thống\n- Dùng HTTPS cho mọi lời gọi API ra ngoài" },
    { id: "rule-git", name: "Quy ước Git", description: "Quy tắc commit message và branch", category: "rule", paths: [], content: "# Quy tắc commit Git\n\n- Dùng conventional commits: `type(scope): description`\n- Các type: feat, fix, refactor, test, docs, chore\n- Giữ commit atomic và tập trung vào một việc\n- Viết ở thể mệnh lệnh: 'add feature' thay vì 'added feature'\n- Tham chiếu mã issue khi phù hợp" },
    { id: "rule-errors", name: "Xử lý lỗi", description: "Pattern xử lý lỗi", category: "rule", paths: ["src/**/*"], content: "# Quy tắc xử lý lỗi\n\n- Không nuốt lỗi một cách im lặng\n- Dùng custom error class cho lỗi nghiệp vụ\n- Luôn kèm ngữ cảnh của lỗi\n- Log lỗi tại nơi xử lý, không phải chỉ nơi catch\n- Trả về thông điệp thân thiện cho người dùng, còn chi tiết kỹ thuật thì ghi log" },
    { id: "rule-a11y", name: "Accessibility", description: "Tiêu chuẩn accessibility cho UI", category: "rule", paths: ["**/*.svelte", "**/*.tsx", "**/*.jsx"], content: "# Quy tắc accessibility\n\n- Mọi hình ảnh phải có alt text\n- Dùng phần tử HTML mang ngữ nghĩa\n- Đảm bảo điều hướng bằng bàn phím hoạt động\n- Giữ độ tương phản màu đủ tốt\n- Thêm aria-label cho nút chỉ có icon" },
    { id: "rule-perf", name: "Performance", description: "Hướng dẫn tối ưu performance", category: "rule", paths: [], content: "# Quy tắc performance\n\n- Tránh truy vấn N+1, hãy dùng batch loading\n- Dùng phân trang cho tập dữ liệu lớn\n- Lazy-load tài nguyên không quan trọng\n- Profile trước khi tối ưu\n- Cache các phép tính tốn kém" },

    // Hooks
    { id: "hook-bash-validator", name: "Bash Validator", description: "Kiểm tra lệnh bash trước khi chạy", category: "hook", event: "PreToolUse", matcher: "Bash", hookType: "command", hookValue: ".claude/hooks/validate.sh" },
    { id: "hook-webhook", name: "HTTP Webhook", description: "Gửi sự kiện tới một HTTP endpoint", category: "hook", event: "PreToolUse", matcher: "", hookType: "http", hookValue: "http://localhost:8080/hook" },
    { id: "hook-prompt-guard", name: "Prompt Guard", description: "AI kiểm tra hành động trước khi thực thi", category: "hook", event: "PreToolUse", matcher: "", hookType: "prompt", hookValue: "Kiểm tra xem hành động này có an toàn và phù hợp không" },
    { id: "hook-log-usage", name: "Log Usage", description: "Ghi lại việc dùng công cụ vào file", category: "hook", event: "PostToolUse", matcher: "", hookType: "command", hookValue: "echo \"$(date): tool used\" >> ~/.claude/usage.log" },
    { id: "hook-cleanup", name: "Dọn phiên", description: "Chạy dọn dẹp khi phiên kết thúc", category: "hook", event: "SessionEnd", matcher: "", hookType: "command", hookValue: "echo 'Session ended'" },

    // MCP
    { id: "mcp-filesystem", name: "Filesystem", description: "Đọc và ghi file cục bộ qua MCP", category: "mcp", mcpType: "stdio", mcpCommand: "npx", mcpArgs: "-y @modelcontextprotocol/server-filesystem /path/to/dir" },
    { id: "mcp-github", name: "GitHub", description: "Truy cập GitHub API qua MCP", category: "mcp", mcpType: "stdio", mcpCommand: "npx", mcpArgs: "-y @modelcontextprotocol/server-github" },
    { id: "mcp-postgres", name: "PostgreSQL", description: "Truy vấn database PostgreSQL", category: "mcp", mcpType: "stdio", mcpCommand: "npx", mcpArgs: "-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb" },
    { id: "mcp-memory", name: "Memory", description: "Kho nhớ bền vững qua MCP", category: "mcp", mcpType: "stdio", mcpCommand: "npx", mcpArgs: "-y @modelcontextprotocol/server-memory" },
    { id: "mcp-sqlite", name: "SQLite", description: "Truy vấn database SQLite", category: "mcp", mcpType: "stdio", mcpCommand: "npx", mcpArgs: "-y @modelcontextprotocol/server-sqlite /path/to/db.sqlite" },
  ];

  const CATEGORY_COLORS: Record<string, string> = {
    skill: "bg-warning/10 text-warning",
    agent: "bg-accent/10 text-accent",
    rule: "bg-info/10 text-info",
    hook: "bg-success/10 text-success",
    mcp: "bg-danger/10 text-danger",
  };

  const filtered = $derived(
    TEMPLATES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory) return false;
      if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    }),
  );
</script>

{#if open}
  <!-- Backdrop -->
  <button class="fixed inset-0 bg-black/50 z-50" onclick={onclose} aria-label="Đóng thư viện mẫu"></button>

  <!-- Bottom sheet -->
  <div class="fixed bottom-0 left-0 right-0 z-50 bg-bg-secondary border-t border-border rounded-t-2xl shadow-2xl" style="height: 65vh">
    <!-- Handle -->
    <div class="flex justify-center pt-2 pb-1">
      <div class="w-10 h-1 rounded-full bg-border"></div>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between px-6 pb-3">
      <div>
        <h2 class="text-lg font-semibold text-text-primary">Thư viện mẫu</h2>
        <p class="text-xs text-text-muted">{TEMPLATES.length} mẫu trong {CATEGORIES.length - 1} nhóm</p>
      </div>
      <button class="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-bg-hover" onclick={onclose} aria-label="Đóng">
        <X size={18} />
      </button>
    </div>

    <!-- Category tabs + Search -->
    <div class="px-6 pb-3 space-y-2">
      <div class="flex gap-1 overflow-x-auto">
        {#each CATEGORIES as cat}
          {@const Icon = cat.icon}
          <button
            class="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg shrink-0 transition-colors
              {activeCategory === cat.id ? 'bg-accent text-white' : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'}"
            onclick={() => (activeCategory = cat.id)}
          >
            <Icon size={12} />
            {cat.label}
            <span class="opacity-60">
              ({cat.id === "all" ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === cat.id).length})
            </span>
          </button>
        {/each}
      </div>
      <div class="relative">
        <Search size={14} class="absolute left-3 top-2.5 text-text-muted" />
        <input type="text" class="w-full pl-9 pr-3 py-2 text-sm bg-bg-tertiary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent" placeholder="Tìm mẫu..." bind:value={search} />
      </div>
    </div>

    <!-- Template grid -->
    <div class="px-6 pb-6 overflow-y-auto" style="height: calc(65vh - 170px)">
      <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {#each filtered as template}
          <button
            class="text-left p-4 bg-bg-tertiary border border-border rounded-lg hover:border-accent/30 transition-colors group"
            onclick={() => { onselect(template); onclose(); }}
          >
            <div class="flex items-start justify-between mb-2">
              <span class="text-[10px] px-1.5 py-0.5 rounded-full {CATEGORY_COLORS[template.category]}">{template.category}</span>
              <span class="text-[10px] text-accent opacity-0 group-hover:opacity-100 transition-opacity">+ Thêm</span>
            </div>
            <p class="text-sm font-medium text-text-primary">{template.name}</p>
            <p class="text-xs text-text-muted mt-1 line-clamp-2">{template.description}</p>
          </button>
        {/each}
      </div>
      {#if filtered.length === 0}
        <p class="text-sm text-text-muted text-center py-8">Không có mẫu nào khớp với từ khoá tìm kiếm</p>
      {/if}
    </div>
  </div>
{/if}
