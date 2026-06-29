<script lang="ts">
  import { api } from "$lib/tauri/commands";
  import { getSelectedProjectPath } from "$lib/stores/project-context.svelte";
  import type { HookHandler } from "$lib/types";
  import {
    Search,
    Sparkles,
    Bot,
    Shield,
    Zap,
    Server,
    LayoutGrid,
    Check,
    Download,
  } from "lucide-svelte";

  interface Template {
    id: string;
    name: string;
    description: string;
    category: "skill" | "agent" | "rule" | "hook" | "mcp";
    content?: string;
    paths?: string[];
    event?: string;
    matcher?: string;
    hookType?: "command" | "http" | "prompt" | "agent";
    hookValue?: string;
    mcpType?: "stdio" | "sse";
    mcpCommand?: string;
    mcpArgs?: string;
    mcpUrl?: string;
  }

  let activeCategory = $state<Template["category"] | "all">("all");
  let search = $state("");
  let installing = $state<string | null>(null);
  let installed = $state<Set<string>>(new Set());

  const projectPath = $derived(getSelectedProjectPath());

  const CATEGORIES = [
    { id: "all" as const, label: "Tất cả", icon: LayoutGrid, color: "" },
    {
      id: "skill" as const,
      label: "Skills",
      icon: Sparkles,
      color: "text-warning",
    },
    { id: "agent" as const, label: "Agents", icon: Bot, color: "text-accent" },
    { id: "rule" as const, label: "Rules", icon: Shield, color: "text-info" },
    { id: "hook" as const, label: "Hooks", icon: Zap, color: "text-success" },
    { id: "mcp" as const, label: "MCP", icon: Server, color: "text-danger" },
  ];

  const CATEGORY_COLORS: Record<string, string> = {
    skill: "bg-warning/10 text-warning border-warning/20",
    agent: "bg-accent/10 text-accent border-accent/20",
    rule: "bg-info/10 text-info border-info/20",
    hook: "bg-success/10 text-success border-success/20",
    mcp: "bg-danger/10 text-danger border-danger/20",
  };

  const TEMPLATES: Template[] = [
    // Skills
    {
      id: "skill-code-review",
      name: "Code Review",
      description: "Rà soát code về chất lượng, lỗi và best practices",
      category: "skill",
      content:
        '---\nname: code-review\ndescription: Rà soát code về chất lượng, lỗi và best practices\nuser-invocable: true\nargument-hint: "[file or PR]"\n---\n\nRà soát đoạn code được chỉ định để tìm:\n- Lỗi logic và edge cases\n- Vấn đề performance\n- Lỗ hổng bảo mật\n- Code style và độ dễ đọc\n\nĐưa ra góp ý có thể hành động được kèm tham chiếu dòng cụ thể.\n',
    },
    {
      id: "skill-deploy",
      name: "Deploy",
      description: "Deploy ứng dụng lên môi trường",
      category: "skill",
      content:
        '---\nname: deploy\ndescription: Deploy ứng dụng\ndisable-model-invocation: true\nuser-invocable: true\nargument-hint: "[environment]"\nallowed-tools: Bash\n---\n\n## Deploy lên $ARGUMENTS\n\n1. Chạy kiểm thử\n2. Build ứng dụng\n3. Deploy lên môi trường $ARGUMENTS\n4. Xác minh deployment\n',
    },
    {
      id: "skill-explain",
      name: "Giải thích code",
      description: "Giải thích chi tiết cấu trúc và logic của code",
      category: "skill",
      content:
        '---\nname: explain-code\ndescription: Giải thích cấu trúc và logic của code\nuser-invocable: true\nargument-hint: "[file path]"\ncontext: fork\nagent: Explore\n---\n\nGiải thích chi tiết $ARGUMENTS:\n1. Nó làm gì\n2. Nó hoạt động ra sao\n3. Các pattern chính được dùng\n4. Dependencies\n',
    },
    {
      id: "skill-test-runner",
      name: "Test Runner",
      description: "Chạy và phân tích kết quả kiểm thử",
      category: "skill",
      content:
        "---\nname: test-runner\ndescription: Chạy test và phân tích kết quả\nuser-invocable: true\nallowed-tools: Bash, Read\n---\n\nChạy test suite của dự án:\n1. Xác định test framework\n2. Chạy toàn bộ test\n3. Phân tích lỗi thất bại\n4. Đề xuất cách sửa\n",
    },
    {
      id: "skill-pr-review",
      name: "PR Review",
      description: "Rà soát thay đổi trong pull request",
      category: "skill",
      content:
        '---\nname: pr-review\ndescription: Rà soát pull request\nuser-invocable: true\nargument-hint: "[PR number]"\nallowed-tools: Bash, Read, Glob, Grep\n---\n\nRà soát PR #$ARGUMENTS:\n1. Lấy diff: !`gh pr diff $0`\n2. Phân tích về tính đúng đắn, bảo mật, performance\n3. Đề xuất approve hoặc changes\n',
    },
    {
      id: "skill-refactor",
      name: "Refactor",
      description: "Refactor code để cấu trúc tốt hơn",
      category: "skill",
      content:
        '---\nname: refactor\ndescription: Refactor code để cấu trúc tốt hơn\nuser-invocable: true\nargument-hint: "[file or module]"\n---\n\nRefactor $ARGUMENTS:\n1. Xác định code smells\n2. Tách hàm hoặc module\n3. Đơn giản hoá logic phức tạp\n4. Đảm bảo test pass\n',
    },

    // Agents
    {
      id: "agent-bug-fixer",
      name: "Bug Fixer",
      description: "Điều tra và sửa các lỗi được báo cáo",
      category: "agent",
      content:
        "---\nname: bug-fixer\ndescription: Điều tra và sửa các lỗi được báo cáo\nmodel: opus\neffort: high\ntools: Read, Glob, Grep, Edit, Bash\npermissions: acceptEdits\n---\n\nBạn là một debugger giàu kinh nghiệm:\n1. Tái hiện lỗi\n2. Xác định nguyên nhân gốc\n3. Triển khai bản sửa tối thiểu\n4. Xác minh test vẫn pass\n",
    },
    {
      id: "agent-security",
      name: "Security Auditor",
      description: "Audit code để tìm lỗ hổng bảo mật",
      category: "agent",
      content:
        "---\nname: security-auditor\ndescription: Audit code để tìm lỗ hổng bảo mật\nmodel: opus\ntools: Read, Glob, Grep\npermissions: plan\nmemory: project\n---\n\nPhân tích code để tìm lỗi trong OWASP Top 10, injection, lỗi auth và secrets trong code.\nĐưa ra mức độ nghiêm trọng và cách khắc phục.\n",
    },
    {
      id: "agent-docs",
      name: "Docs Generator",
      description: "Sinh tài liệu đầy đủ",
      category: "agent",
      content:
        "---\nname: docs-generator\ndescription: Sinh tài liệu đầy đủ\nmodel: sonnet\ntools: Read, Glob, Grep, Write\n---\n\nSinh tài liệu:\n1. Comment JSDoc/TSDoc\n2. Các phần README\n3. Ví dụ sử dụng\n",
    },
    {
      id: "agent-perf",
      name: "Performance Optimizer",
      description: "Phân tích và tối ưu performance của code",
      category: "agent",
      content:
        "---\nname: performance-optimizer\ndescription: Tối ưu performance của code\nmodel: opus\ntools: Read, Glob, Grep, Edit, Bash\nmemory: project\n---\n\nProfile các hot path, xác định bottleneck và đề xuất tối ưu kèm benchmark.\n",
    },

    // Rules
    {
      id: "rule-ts",
      name: "TypeScript Strict",
      description: "Áp dụng các quy tắc TypeScript nghiêm ngặt",
      category: "rule",
      paths: ["**/*.ts", "**/*.tsx"],
      content:
        "# Quy tắc TypeScript\n\n- Dùng strict mode, không dùng `any`\n- Ưu tiên named export hơn default export\n- Khai báo rõ kiểu trả về\n- Không để biến không dùng tới",
    },
    {
      id: "rule-api",
      name: "Thiết kế API",
      description: "Quy ước cho REST API",
      category: "rule",
      paths: ["src/api/**/*"],
      content:
        "# Quy tắc API\n\n- Validate mọi input\n- Dùng định dạng lỗi chuẩn\n- Trả về đúng HTTP status code\n- Có phân trang cho danh sách",
    },
    {
      id: "rule-testing",
      name: "Kiểm thử",
      description: "Tiêu chuẩn và pattern kiểm thử",
      category: "rule",
      paths: ["**/*.test.*"],
      content:
        "# Quy tắc kiểm thử\n\n- Đặt test cùng vị trí với source\n- Dùng tên rõ nghĩa\n- Không để test phụ thuộc lẫn nhau\n- Mục tiêu 80%+ coverage cho luồng quan trọng",
    },
    {
      id: "rule-security",
      name: "Security",
      description: "Best practices bảo mật",
      category: "rule",
      paths: [],
      content:
        "# Quy tắc bảo mật\n\n- Không bao giờ commit secrets\n- Sanitize input người dùng\n- Dùng parameterized query\n- Dùng HTTPS cho API bên ngoài",
    },
    {
      id: "rule-git",
      name: "Git Conventions",
      description: "Tiêu chuẩn commit và branch",
      category: "rule",
      paths: [],
      content:
        "# Quy tắc Git\n\n- Dùng conventional commits\n- Giữ commit atomic\n- Viết ở thể mệnh lệnh\n- Tham chiếu issue liên quan",
    },
    {
      id: "rule-errors",
      name: "Error Handling",
      description: "Pattern xử lý lỗi",
      category: "rule",
      paths: ["src/**/*"],
      content:
        "# Xử lý lỗi\n\n- Không nuốt lỗi\n- Dùng custom error class\n- Luôn kèm ngữ cảnh\n- Trả về thông điệp thân thiện",
    },
    {
      id: "rule-a11y",
      name: "Accessibility",
      description: "Tiêu chuẩn accessibility cho UI",
      category: "rule",
      paths: ["**/*.svelte", "**/*.tsx"],
      content:
        "# Accessibility\n\n- Có alt text cho ảnh\n- Dùng HTML mang ngữ nghĩa\n- Hỗ trợ điều hướng bằng bàn phím\n- Đảm bảo độ tương phản màu\n- Thêm aria-label",
    },
    {
      id: "rule-perf",
      name: "Performance",
      description: "Hướng dẫn tối ưu performance",
      category: "rule",
      paths: [],
      content:
        "# Performance\n\n- Tránh truy vấn N+1\n- Dùng phân trang\n- Lazy loading khi phù hợp\n- Profile trước khi tối ưu",
    },

    // Hooks
    {
      id: "hook-bash",
      name: "Bash Validator",
      description: "Kiểm tra lệnh bash trước khi chạy",
      category: "hook",
      event: "PreToolUse",
      matcher: "Bash",
      hookType: "command",
      hookValue: ".claude/hooks/validate.sh",
    },
    {
      id: "hook-webhook",
      name: "HTTP Webhook",
      description: "Gửi sự kiện tới một endpoint",
      category: "hook",
      event: "PreToolUse",
      matcher: "",
      hookType: "http",
      hookValue: "http://localhost:8080/hook",
    },
    {
      id: "hook-guard",
      name: "Prompt Guard",
      description: "AI kiểm tra hành động",
      category: "hook",
      event: "PreToolUse",
      matcher: "",
      hookType: "prompt",
      hookValue: "Kiểm tra xem hành động này có an toàn không",
    },
    {
      id: "hook-log",
      name: "Log Usage",
      description: "Ghi việc dùng công cụ vào file",
      category: "hook",
      event: "PostToolUse",
      matcher: "",
      hookType: "command",
      hookValue: 'echo "$(date): tool used" >> ~/.claude/usage.log',
    },
    {
      id: "hook-cleanup",
      name: "Dọn phiên",
      description: "Chạy dọn dẹp khi phiên kết thúc",
      category: "hook",
      event: "SessionEnd",
      matcher: "",
      hookType: "command",
      hookValue: "echo 'Session ended'",
    },

    // MCP
    {
      id: "mcp-fs",
      name: "Filesystem",
      description: "Đọc và ghi file cục bộ",
      category: "mcp",
      mcpType: "stdio",
      mcpCommand: "npx",
      mcpArgs: "-y @modelcontextprotocol/server-filesystem /path/to/dir",
    },
    {
      id: "mcp-github",
      name: "GitHub",
      description: "Truy cập GitHub API",
      category: "mcp",
      mcpType: "stdio",
      mcpCommand: "npx",
      mcpArgs: "-y @modelcontextprotocol/server-github",
    },
    {
      id: "mcp-postgres",
      name: "PostgreSQL",
      description: "Truy vấn database PostgreSQL",
      category: "mcp",
      mcpType: "stdio",
      mcpCommand: "npx",
      mcpArgs:
        "-y @modelcontextprotocol/server-postgres postgresql://localhost/mydb",
    },
    {
      id: "mcp-memory",
      name: "Memory",
      description: "Kho nhớ bền vững",
      category: "mcp",
      mcpType: "stdio",
      mcpCommand: "npx",
      mcpArgs: "-y @modelcontextprotocol/server-memory",
    },
    {
      id: "mcp-sqlite",
      name: "SQLite",
      description: "Truy vấn database SQLite",
      category: "mcp",
      mcpType: "stdio",
      mcpCommand: "npx",
      mcpArgs: "-y @modelcontextprotocol/server-sqlite /path/to/db.sqlite",
    },
  ];

  const filtered = $derived(
    TEMPLATES.filter((t) => {
      if (activeCategory !== "all" && t.category !== activeCategory)
        return false;
      if (
        search &&
        !t.name.toLowerCase().includes(search.toLowerCase()) &&
        !t.description.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    }),
  );

  const categoryCounts = $derived(
    CATEGORIES.map((c) => ({
      ...c,
      count:
        c.id === "all"
          ? TEMPLATES.length
          : TEMPLATES.filter((t) => t.category === c.id).length,
    })),
  );

  async function installTemplate(template: Template) {
    installing = template.id;
    try {
      const pp = projectPath ?? undefined;
      const name = template.name.toLowerCase().replace(/\s+/g, "-");

      switch (template.category) {
        case "skill":
          await api.skills.write("global", name, template.content ?? "", pp);
          break;
        case "agent":
          await api.agents.write("global", name, template.content ?? "", pp);
          break;
        case "rule":
          await api.rules.write(
            "global",
            name + ".md",
            template.paths ?? [],
            template.content ?? "",
            pp,
          );
          break;
        case "hook": {
          const hooks = (await api.hooks.get("global")) as Record<
            string,
            Array<{ matcher?: string; hooks: HookHandler[] }>
          >;
          const event = template.event ?? "PreToolUse";
          const handler: HookHandler = { type: template.hookType ?? "command" };
          if (handler.type === "command") handler.command = template.hookValue;
          else if (handler.type === "http") handler.url = template.hookValue;
          else handler.prompt = template.hookValue;
          if (!hooks[event]) hooks[event] = [];
          hooks[event].push({
            matcher: template.matcher || undefined,
            hooks: [handler],
          });
          await api.hooks.set("global", hooks);
          break;
        }
        case "mcp":
          if (template.mcpUrl) {
            await api.mcp.upsert("global", name, { url: template.mcpUrl });
          } else {
            await api.mcp.upsert("global", name, {
              command: template.mcpCommand ?? "",
              args: (template.mcpArgs ?? "").split(/\s+/).filter(Boolean),
            });
          }
          break;
      }

      installed = new Set([...installed, template.id]);
    } catch (e) {
      console.error("Failed to install:", e);
    } finally {
      installing = null;
    }
  }
</script>

<div class="p-6 overflow-y-auto h-full space-y-4">
  <!-- Category cards -->
  <div class="flex gap-2 overflow-x-auto pb-1">
    {#each categoryCounts as cat}
      {@const Icon = cat.icon}
      <button
        class="flex items-center gap-2 px-4 py-3 rounded-lg border transition-colors shrink-0
          {activeCategory === cat.id
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-bg-secondary border-border text-text-secondary hover:border-border-light'}"
        onclick={() => (activeCategory = cat.id)}
      >
        <Icon size={16} />
        <span class="text-sm font-medium">{cat.label}</span>
        <span class="text-xs opacity-60">{cat.count}</span>
      </button>
    {/each}
  </div>

  <!-- Search -->
  <div class="relative">
    <Search size={14} class="absolute left-3 top-2.5 text-text-muted" />
    <input
      type="text"
      class="w-full pl-9 pr-3 py-2 text-sm bg-bg-secondary border border-border rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
      placeholder="Tìm mẫu..."
      bind:value={search}
    />
  </div>

  <!-- Grid -->
  <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {#each filtered as template}
      {@const isInstalled = installed.has(template.id)}
      <div
        class="bg-bg-secondary border border-border rounded-lg p-4 flex flex-col justify-between hover:border-accent/30 transition-colors group"
      >
        <div>
          <div class="flex items-center justify-between mb-2">
            <span
              class="text-[10px] px-2 py-0.5 rounded-full border {CATEGORY_COLORS[
                template.category
              ]}">{template.category}</span
            >
          </div>
          <p class="text-sm font-medium text-text-primary">{template.name}</p>
          <p class="text-xs text-text-muted mt-1 line-clamp-2">
            {template.description}
          </p>
        </div>
        <div class="mt-3">
          {#if isInstalled}
            <div class="flex items-center gap-1 text-xs text-success">
              <Check size={12} />
              Đã thêm
            </div>
          {:else}
            <button
              class="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-md transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed bg-accent/10 text-accent hover:bg-accent/20"
              onclick={() => installTemplate(template)}
              disabled={installing === template.id}
            >
              {#if installing === template.id}
                Đang thêm...
              {:else}
                <Download size={12} />
                Thêm vào toàn cục
              {/if}
            </button>
          {/if}
        </div>
      </div>
    {/each}
  </div>

  {#if filtered.length === 0}
    <div class="text-center py-12">
      <Search size={24} class="mx-auto mb-3 opacity-20 text-text-muted" />
      <p class="text-sm text-text-muted">Không có mẫu nào khớp với tìm kiếm</p>
    </div>
  {/if}
</div>
