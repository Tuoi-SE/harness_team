<script lang="ts">
  import { onMount } from "svelte";
  import { navigateTo } from "$lib/stores/navigation.svelte";
  import {
    Rocket,
    Settings,
    BookOpen,
    Server,
    TerminalSquare,
    Sparkles,
    ArrowRight,
    Check,
    X,
  } from "lucide-svelte";
  import logoUrl from "$lib/assets/logo-full.png";

  let visible = $state(false);
  let step = $state(0);

  interface OnboardingStep {
    icon: typeof Rocket;
    title: string;
    description: string;
    action: string;
    page: string;
  }

  const steps: OnboardingStep[] = [
    {
      icon: Settings,
      title: "Cấu hình cài đặt",
      description: "Chọn model, mức effort và quyền truy cập. Harness đọc và ghi cùng file settings.json mà Claude Code dùng.",
      action: "Mở cài đặt",
      page: "settings",
    },
    {
      icon: BookOpen,
      title: "Viết hướng dẫn",
      description: "Tạo file CLAUDE.md để định hướng Claude Code. Thiết lập tuỳ chọn toàn cục và quy tắc theo từng dự án.",
      action: "Mở hướng dẫn",
      page: "instructions",
    },
    {
      icon: Server,
      title: "Thêm MCP Server",
      description: "Kết nối công cụ bên ngoài qua Model Context Protocol. Thêm GitHub, Slack, cơ sở dữ liệu và nhiều hơn nữa.",
      action: "Mở MCP Server",
      page: "mcp",
    },
    {
      icon: Sparkles,
      title: "Tạo Skills",
      description: "Tạo các lệnh slash có thể tái sử dụng để mở rộng Claude Code bằng workflow và template tuỳ biến.",
      action: "Mở Skills",
      page: "skills",
    },
    {
      icon: TerminalSquare,
      title: "Mở terminal",
      description: "Chạy Claude Code ngay trong Harness với terminal tích hợp đầy đủ. Nhiều tab, phiên làm việc được giữ lại.",
      action: "Mở terminal",
      page: "terminal",
    },
  ];

  function dismiss() {
    visible = false;
    localStorage.setItem("harness-onboarded", "true");
  }

  function goTo(page: string) {
    dismiss();
    navigateTo(page as Parameters<typeof navigateTo>[0]);
  }

  onMount(() => {
    const captureMode =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("capture") === "1";
    if (captureMode) {
      visible = false;
      return;
    }

    const onboarded = localStorage.getItem("harness-onboarded");
    if (!onboarded) {
      visible = true;
    }
  });
</script>

{#if visible}
  <!-- Backdrop -->
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200] flex items-center justify-center">
    <div class="w-[640px] max-h-[85vh] bg-bg-secondary border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      <!-- Header -->
      <div class="relative px-8 pt-8 pb-6 text-center border-b border-border">
        <button
          class="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-bg-hover text-text-muted hover:text-text-primary transition-colors"
          onclick={dismiss}
          aria-label="Đóng"
        >
          <X size={18} />
        </button>

        <img src={logoUrl} alt="Harness" class="w-64 h-auto mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-text-primary">Chào mừng đến với Harness</h1>
        <p class="text-sm text-text-muted mt-2 max-w-md mx-auto">
          Ứng dụng desktop để quản lý Claude Code. Mọi thứ chạy cục bộ
          — không tài khoản, không máy chủ, không telemetry.
        </p>
      </div>

      <!-- Steps -->
      <div class="flex-1 overflow-y-auto px-8 py-6">
        <p class="text-xs font-medium text-text-muted uppercase tracking-wider mb-4">Bắt đầu</p>
        <div class="space-y-3">
          {#each steps as s, i}
            {@const StepIcon = s.icon}
            <div
              class="group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                {step === i
                  ? 'border-accent/40 bg-accent/5'
                  : 'border-border hover:border-border-light hover:bg-bg-hover'}"
              onclick={() => (step = i)}
              onkeydown={(e) => e.key === "Enter" && (step = i)}
              role="button"
              tabindex="0"
            >
              <span class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                {step === i ? 'bg-accent/20 text-accent' : 'bg-bg-tertiary text-text-muted group-hover:text-text-secondary'}">
                <StepIcon size={20} />
              </span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-text-primary">{s.title}</p>
                <p class="text-xs text-text-muted mt-0.5 line-clamp-2">{s.description}</p>
              </div>
              <button
                class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                  {step === i
                    ? 'bg-accent text-white hover:bg-accent-hover'
                    : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'}"
                onclick={(e: MouseEvent) => { e.stopPropagation(); goTo(s.page); }}
              >
                {s.action}
                <ArrowRight size={12} />
              </button>
            </div>
          {/each}
        </div>
      </div>

      <!-- Footer -->
      <div class="px-8 py-4 border-t border-border flex items-center justify-between">
        <p class="text-xs text-text-muted">
          Bạn có thể mở lại bất cứ lúc nào từ hộp thoại Giới thiệu
        </p>
        <button
          class="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors"
          onclick={dismiss}
        >
          <Check size={14} />
          Bắt đầu ngay
        </button>
      </div>
    </div>
  </div>
{/if}
