<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/tauri/commands";
  import type {
    OptimizerStatus,
    SavingsData,
    DiscoverResult,
    FilterRules,
  } from "$lib/types";
  import {
    Gauge,
    Power,
    TrendingUp,
    Zap,
    Hash,
    Search,
    FileCode,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Save,
    Check,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
  } from "lucide-svelte";

  let status = $state<OptimizerStatus | null>(null);
  let savings = $state<SavingsData | null>(null);
  let discover = $state<DiscoverResult | null>(null);
  let filters = $state<FilterRules | null>(null);

  let loading = $state(true);
  let discoverLoading = $state(false);
  let toggling = $state(false);
  let savingFilters = $state(false);
  let filtersSaved = $state(false);
  let filterContent = $state("");
  let activeTab = $state<"overview" | "breakdown" | "discover" | "filters">("overview");
  let period = $state<"daily" | "weekly" | "monthly">("daily");
  let showAllOpportunities = $state(false);

  const isEnabled = $derived(status?.enabled ?? false);

  const maxDailySaved = $derived(() => {
    if (!savings?.daily?.length) return 1;
    return Math.max(...savings.daily.map((d) => d.savedTokens), 1);
  });

  const chartData = $derived(() => {
    if (!savings?.daily?.length) return [];
    return savings.daily.slice(-30);
  });

  const visibleOpportunities = $derived(() => {
    if (!discover?.opportunities?.length) return [];
    return showAllOpportunities
      ? discover.opportunities
      : discover.opportunities.slice(0, 10);
  });

  function formatTokens(n: number): string {
    if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toString();
  }

  function savingsColor(pct: number): string {
    if (pct >= 70) return "text-success";
    if (pct >= 40) return "text-warning";
    return "text-error";
  }

  function savingsBg(pct: number): string {
    if (pct >= 70) return "bg-success/20";
    if (pct >= 40) return "bg-warning/20";
    return "bg-error/20";
  }

  async function toggleOptimizer() {
    toggling = true;
    try {
      if (isEnabled) {
        await api.tokenSavings.disable();
      } else {
        await api.tokenSavings.enable();
      }
      status = await api.tokenSavings.status();
    } catch (e) {
      console.error("Bật/tắt thất bại:", e);
    } finally {
      toggling = false;
    }
  }

  async function refreshData() {
    loading = true;
    try {
      const [s, sv, f] = await Promise.all([
        api.tokenSavings.status(),
        api.tokenSavings.savings(period),
        api.tokenSavings.getFilters(),
      ]);
      status = s;
      savings = sv;
      filters = f;
      filterContent = f.rawContent;
    } catch (e) {
      console.error("Lỗi tải dữ liệu tiết kiệm token:", e);
    } finally {
      loading = false;
    }
  }

  async function loadDiscover() {
    if (discover) return;
    discoverLoading = true;
    try {
      discover = await api.tokenSavings.discover();
    } catch (e) {
      console.error("Lỗi tải dữ liệu khám phá:", e);
    } finally {
      discoverLoading = false;
    }
  }

  async function handleSaveFilters() {
    savingFilters = true;
    filtersSaved = false;
    try {
      await api.tokenSavings.saveFilters(filterContent);
      filtersSaved = true;
      setTimeout(() => (filtersSaved = false), 2000);
    } catch (e) {
      console.error("Lỗi lưu filters:", e);
    } finally {
      savingFilters = false;
    }
  }

  $effect(() => {
    if (!loading && status) {
      api.tokenSavings.savings(period).then((sv) => (savings = sv));
    }
  });

  onMount(() => {
    refreshData();
  });
</script>

<div class="flex flex-col h-full overflow-hidden">
  <header class="px-8 pt-8 pb-6 border-b border-border">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-accent/10 text-accent">
          <Gauge size={22} />
        </div>
        <div>
          <h1 class="text-xl font-semibold">Token Optimizer</h1>
          <p class="text-sm text-text-secondary">
            Lọc thông minh cho output Bash, lượt đọc file và kết quả tìm kiếm
          </p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button
          type="button"
          class="flex items-center justify-center w-9 h-9 rounded-lg border border-border text-text-secondary hover:bg-bg-hover hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onclick={refreshData}
          disabled={loading}
          aria-label="Làm mới"
        >
          <RefreshCw size={16} class={loading ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed {isEnabled
            ? 'bg-success/10 text-success hover:bg-success/20'
            : 'bg-accent text-white hover:bg-accent/90'}"
          onclick={toggleOptimizer}
          disabled={toggling || loading}
        >
          {#if toggling}
            <RefreshCw size={14} class="animate-spin" />
          {:else if isEnabled}
            <ToggleRight size={16} />
          {:else}
            <ToggleLeft size={16} />
          {/if}
          {toggling ? "..." : isEnabled ? "Đã bật" : "Bật"}
        </button>
      </div>
    </div>
  </header>

  <div class="flex-1 overflow-y-auto px-8 py-6 space-y-6">
    {#if loading}
      <div class="flex items-center gap-3 p-8">
        <RefreshCw size={16} class="animate-spin text-text-secondary" />
        <span class="text-sm text-text-secondary">Đang tải dữ liệu optimizer…</span>
      </div>
    {:else}
      <!-- Tabs -->
      <div class="flex gap-1 bg-bg-secondary border border-border rounded-xl p-1">
        {#each [
          { id: "overview" as const, label: "Tổng quan", icon: TrendingUp },
          { id: "breakdown" as const, label: "Phân rã", icon: Hash },
          { id: "discover" as const, label: "Khám phá", icon: Search },
          { id: "filters" as const, label: "Filters", icon: FileCode },
        ] as tab}
          {@const Icon = tab.icon}
          <button
            type="button"
            onclick={() => {
              activeTab = tab.id;
              if (tab.id === "discover") loadDiscover();
            }}
            class="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex-1 justify-center
              {activeTab === tab.id ? 'bg-bg-hover text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}"
          >
            <Icon size={13} />
            {tab.label}
          </button>
        {/each}
      </div>

      {#if activeTab === "overview"}
        {#if !isEnabled && (!savings || savings.summary.totalCommands === 0)}
          <!-- Empty state -->
          <div class="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <div class="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-5">
              <Zap size={28} class="text-accent" />
            </div>
            <h3 class="text-lg font-semibold text-text-primary mb-2">
              Tiết kiệm token trên mọi công cụ của Claude Code
            </h3>
            <p class="text-sm text-text-secondary max-w-lg mx-auto mb-8">
              Token Optimizer chặn output Bash, lượt đọc file và kết quả tìm kiếm, là ba nguồn tiêu tốn token lớn nhất. Bộ lọc thông minh loại bỏ nhiễu, giới hạn output và nén nội dung lặp lại.
            </p>
            <div class="grid grid-cols-3 gap-4 max-w-sm mx-auto mb-8">
              {#each [
                { label: "Output Bash", savings: "60-90%" },
                { label: "Đọc file", savings: "40-60%" },
                { label: "Kết quả Grep", savings: "50-70%" },
              ] as example}
                <div class="bg-bg-hover rounded-lg p-4">
                  <p class="text-xs text-text-secondary">{example.label}</p>
                  <p class="text-xl font-bold text-success mt-1">{example.savings}</p>
                </div>
              {/each}
            </div>
            <button
              type="button"
              onclick={toggleOptimizer}
              disabled={toggling}
              class="px-6 py-2.5 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {toggling ? "Đang bật..." : "Bật Token Optimizer"}
            </button>
          </div>
        {:else}
          <!-- Hero stats -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {#each [
              {
                label: "Token đã tiết kiệm",
                value: formatTokens(savings?.summary.totalSaved ?? 0),
                sub: `trên ${formatTokens(savings?.summary.totalInputTokens ?? 0)} đầu vào`,
                icon: Zap,
                iconBg: "bg-accent/15",
                iconColor: "text-accent",
                valueColor: "text-accent",
              },
              {
                label: "Lệnh",
                value: (savings?.summary.totalCommands ?? 0).toLocaleString(),
                sub: `${savings?.topCommands.length ?? 0} lệnh riêng biệt`,
                icon: Hash,
                iconBg: "bg-info/15",
                iconColor: "text-info",
                valueColor: "text-text-primary",
              },
              {
                label: "Tiết kiệm TB",
                value: `${(savings?.summary.avgSavingsPct ?? 0).toFixed(1)}%`,
                sub: savings?.summary.avgSavingsPct
                  ? savings.summary.avgSavingsPct >= 70
                    ? "Hiệu quả rất tốt"
                    : savings.summary.avgSavingsPct >= 40
                      ? "Hiệu quả tốt"
                      : "Đang cải thiện"
                  : "",
                icon: TrendingUp,
                iconBg: savings?.summary.avgSavingsPct && savings.summary.avgSavingsPct >= 70
                  ? "bg-success/15" : savings?.summary.avgSavingsPct && savings.summary.avgSavingsPct >= 40
                    ? "bg-warning/15" : "bg-error/15",
                iconColor: savingsColor(savings?.summary.avgSavingsPct ?? 0),
                valueColor: savingsColor(savings?.summary.avgSavingsPct ?? 0),
              },
              {
                label: "Trạng thái",
                value: isEnabled ? "Đang hoạt động" : "Tạm dừng",
                sub: status?.sidecarVersion ?? "",
                icon: Power,
                iconBg: isEnabled ? "bg-success/15" : "bg-bg-hover",
                iconColor: isEnabled ? "text-success" : "text-text-secondary",
                valueColor: isEnabled ? "text-success" : "text-text-secondary",
              },
            ] as card}
              {@const Icon = card.icon}
              <div class="p-4 rounded-xl border border-border bg-bg-secondary">
                <div class="flex items-center gap-2 mb-3">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center {card.iconBg}">
                    <Icon size={13} class={card.iconColor} />
                  </div>
                  <span class="text-[10px] text-text-secondary uppercase tracking-wider">
                    {card.label}
                  </span>
                </div>
                <p class="text-2xl font-bold {card.valueColor}">{card.value}</p>
                {#if card.sub}
                  <p class="text-xs text-text-secondary mt-1">{card.sub}</p>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Efficiency meter -->
          {#if savings && savings.summary.totalCommands > 0}
            <div class="bg-bg-secondary border border-border rounded-xl p-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <Gauge size={14} class="text-text-secondary" />
                  <h3 class="text-sm font-medium text-text-primary">Hiệu suất</h3>
                </div>
                <span class="text-xs font-mono {savingsColor(savings.summary.avgSavingsPct)}">
                  {savings.summary.avgSavingsPct.toFixed(1)}%
                </span>
              </div>
              <div class="w-full h-2.5 bg-bg-hover rounded-full overflow-hidden">
                <div
                  class="h-full rounded-full transition-all duration-500 {savings.summary.avgSavingsPct >= 70
                    ? 'bg-success'
                    : savings.summary.avgSavingsPct >= 40
                      ? 'bg-warning'
                      : 'bg-error'}"
                  style="width: {Math.min(savings.summary.avgSavingsPct, 100)}%"
                ></div>
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-[10px] text-text-secondary">0%</span>
                <span class="text-[10px] text-text-secondary">
                  {formatTokens(savings.summary.totalInputTokens)} đầu vào → {formatTokens(savings.summary.totalOutputTokens)} đầu ra
                </span>
                <span class="text-[10px] text-text-secondary">100%</span>
              </div>
            </div>
          {/if}

          <!-- Tool type breakdown -->
          {#if savings && savings.toolBreakdown && savings.toolBreakdown.length > 0}
            {@const totalSaved = savings.toolBreakdown.reduce((s, t) => s + t.totalSaved, 0)}
            <div class="bg-bg-secondary border border-border rounded-xl p-4">
              <div class="flex items-center gap-2 mb-4">
                <Zap size={14} class="text-text-secondary" />
                <h3 class="text-sm font-medium text-text-primary">Tiết kiệm theo công cụ</h3>
              </div>
              {#if totalSaved > 0}
                <div class="flex h-3 rounded-full overflow-hidden mb-4">
                  {#each savings.toolBreakdown as tool}
                    {@const pct = (tool.totalSaved / totalSaved) * 100}
                    {#if pct > 0}
                      <div
                        class="h-full transition-all {tool.toolType === 'Bash' ? 'bg-accent' : tool.toolType === 'Read' ? 'bg-success' : 'bg-warning'}"
                        style="width: {pct}%"
                        title="{tool.toolType}: tiết kiệm {formatTokens(tool.totalSaved)} ({pct.toFixed(0)}%)"
                      ></div>
                    {/if}
                  {/each}
                </div>
              {/if}
              <div class="grid grid-cols-3 gap-4">
                {#each savings.toolBreakdown as tool}
                  <div class="flex items-start gap-3">
                    <div class="w-2.5 h-2.5 rounded-full shrink-0 mt-1 {tool.toolType === 'Bash' ? 'bg-accent' : tool.toolType === 'Read' ? 'bg-success' : 'bg-warning'}"></div>
                    <div>
                      <p class="text-sm font-medium text-text-primary">{tool.toolType}</p>
                      <p class="text-xs text-text-secondary mt-0.5">
                        tiết kiệm {formatTokens(tool.totalSaved)}
                      </p>
                      <p class="text-[10px] text-text-secondary">
                        {tool.count} lượt chạy · TB {tool.avgSavingsPct.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Daily chart -->
          {#if chartData().length > 0}
            <div class="bg-bg-secondary border border-border rounded-xl p-4">
              <div class="flex items-center gap-2 mb-4">
                <TrendingUp size={14} class="text-text-secondary" />
                <h3 class="text-sm font-medium text-text-primary">
                  Tiết kiệm theo ngày (30 ngày gần nhất)
                </h3>
              </div>
              <div class="flex items-end gap-[2px] h-36">
                {#each chartData() as day}
                  {@const pct = (day.savedTokens / maxDailySaved()) * 100}
                  <div
                    class="flex-1 rounded-t transition-all hover:opacity-80 {day.savingsPct >= 70 ? 'bg-success/50' : day.savingsPct >= 40 ? 'bg-warning/50' : 'bg-accent/30'}"
                    style="height: {Math.max(pct, 3)}%"
                    title="{day.label}: tiết kiệm {formatTokens(day.savedTokens)} ({day.savingsPct.toFixed(0)}%) · {day.commands} lệnh"
                    role="presentation"
                  ></div>
                {/each}
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-[10px] text-text-secondary">
                  {chartData()[0]?.label ?? ""}
                </span>
                <span class="text-[10px] text-text-secondary">
                  {chartData()[chartData().length - 1]?.label ?? ""}
                </span>
              </div>
            </div>
          {/if}
        {/if}

      {:else if activeTab === "breakdown"}
        <!-- Period toggle -->
        <div class="flex gap-1 bg-bg-secondary border border-border rounded-lg p-1 w-fit">
          {#each [
            { id: "daily" as const, label: "Ngày" },
            { id: "weekly" as const, label: "Tuần" },
            { id: "monthly" as const, label: "Tháng" },
          ] as p}
            <button
              type="button"
              onclick={() => (period = p.id)}
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                {period === p.id ? 'bg-bg-hover text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}"
            >
              {p.label}
            </button>
          {/each}
        </div>

        <!-- Top commands -->
        {#if savings && savings.topCommands.length > 0}
          <div class="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">
                Các lệnh tiết kiệm nhiều nhất
              </h3>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-border text-text-secondary">
                    <th class="text-left px-4 py-2.5 text-xs font-medium">Lệnh</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Số lần</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Tiết kiệm TB</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Tổng tiết kiệm</th>
                  </tr>
                </thead>
                <tbody>
                  {#each savings.topCommands as cmd}
                    <tr class="border-b border-border/50 hover:bg-bg-hover transition-colors">
                      <td class="px-4 py-2.5 font-mono text-xs text-text-primary">
                        {cmd.command}
                      </td>
                      <td class="px-4 py-2.5 text-right text-text-secondary">
                        {cmd.count.toLocaleString()}
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <span
                          class="inline-block px-2 py-0.5 rounded text-[10px] font-medium {savingsColor(cmd.avgSavingsPct)} {savingsBg(cmd.avgSavingsPct)}"
                        >
                          {cmd.avgSavingsPct.toFixed(0)}%
                        </span>
                      </td>
                      <td class="px-4 py-2.5 text-right font-mono text-text-primary">
                        {formatTokens(cmd.totalSaved)}
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {:else}
          <div class="bg-bg-secondary border border-border rounded-xl p-8 text-center">
            <Hash size={24} class="text-text-secondary mx-auto mb-3 opacity-50" />
            <p class="text-sm text-text-secondary">
              Chưa có dữ liệu tiết kiệm. {isEnabled
                ? "Hãy chạy vài lệnh Claude Code để xem phân tích."
                : "Bật optimizer để bắt đầu theo dõi."}
            </p>
          </div>
        {/if}

        <!-- Time period table -->
        {#if savings && savings.daily.length > 0}
          <div class="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">
                {period === "daily" ? "Theo ngày" : period === "weekly" ? "Theo tuần" : "Theo tháng"}
              </h3>
            </div>
            <div class="overflow-x-auto max-h-72 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-bg-secondary">
                  <tr class="border-b border-border text-text-secondary">
                    <th class="text-left px-4 py-2.5 text-xs font-medium">Mốc thời gian</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Lệnh</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Đầu vào</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Đầu ra</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">Tiết kiệm</th>
                    <th class="text-right px-4 py-2.5 text-xs font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {#each [...savings.daily].reverse() as bucket}
                    <tr class="border-b border-border/50 hover:bg-bg-hover transition-colors">
                      <td class="px-4 py-2.5 text-xs text-text-secondary font-mono">
                        {bucket.label}
                      </td>
                      <td class="px-4 py-2.5 text-right text-text-secondary">
                        {bucket.commands}
                      </td>
                      <td class="px-4 py-2.5 text-right text-text-secondary font-mono">
                        {formatTokens(bucket.inputTokens)}
                      </td>
                      <td class="px-4 py-2.5 text-right text-text-secondary font-mono">
                        {formatTokens(bucket.outputTokens)}
                      </td>
                      <td class="px-4 py-2.5 text-right font-mono text-text-primary">
                        {formatTokens(bucket.savedTokens)}
                      </td>
                      <td class="px-4 py-2.5 text-right">
                        <span
                          class="inline-block px-2 py-0.5 rounded text-[10px] font-medium {savingsColor(bucket.savingsPct)} {savingsBg(bucket.savingsPct)}"
                        >
                          {bucket.savingsPct.toFixed(0)}%
                        </span>
                      </td>
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

      {:else if activeTab === "discover"}
        {#if discoverLoading}
          <div class="bg-bg-secondary border border-border rounded-xl p-8 text-center">
            <RefreshCw size={20} class="animate-spin mx-auto mb-3 text-text-secondary" />
            <p class="text-sm text-text-secondary">Đang phân tích lịch sử phiên…</p>
          </div>
        {:else if !discover}
          <div class="bg-bg-secondary border border-border rounded-xl p-10 text-center">
            <div class="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Search size={24} class="text-accent" />
            </div>
            <h3 class="text-base font-semibold text-text-primary mb-2">
              Khám phá cơ hội tối ưu
            </h3>
            <p class="text-sm text-text-secondary max-w-md mx-auto mb-6">
              Quét các phiên Claude Code để tìm những lệnh được hưởng lợi nhiều nhất từ tối ưu token.
            </p>
            <button
              type="button"
              onclick={loadDiscover}
              class="px-5 py-2 bg-accent/10 text-accent rounded-lg text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              Phân tích phiên
            </button>
          </div>
        {:else}
          <!-- Summary cards -->
          <div class="grid grid-cols-3 gap-4">
            {#each [
              { label: "Phiên đã quét", value: discover.sessionsScanned.toLocaleString(), color: "text-text-primary" },
              { label: "Lệnh tìm thấy", value: discover.totalCommands.toLocaleString(), color: "text-text-primary" },
              { label: "Tiết kiệm tiềm năng", value: formatTokens(discover.totalPotentialSavings), color: "text-accent", sub: "token" },
            ] as card}
              <div class="p-4 rounded-xl border border-border bg-bg-secondary">
                <p class="text-[10px] text-text-secondary uppercase tracking-wider mb-2">
                  {card.label}
                </p>
                <p class="text-2xl font-bold {card.color}">
                  {card.value}
                </p>
                {#if card.sub}
                  <p class="text-[10px] text-text-secondary mt-0.5">{card.sub}</p>
                {/if}
              </div>
            {/each}
          </div>

          <!-- Tool distribution -->
          {#if discover.toolBreakdown && discover.toolBreakdown.length > 0}
            <div class="bg-bg-secondary border border-border rounded-xl p-4">
              <h3 class="text-sm font-medium text-text-primary mb-4">
                Phân bổ token theo công cụ
              </h3>
              <div class="space-y-3">
                {#each discover.toolBreakdown as tool}
                  <div class="flex items-center gap-3">
                    <span class="text-xs font-mono text-text-primary w-12">{tool.toolType}</span>
                    <div class="flex-1 h-2.5 bg-bg-hover rounded-full overflow-hidden">
                      <div
                        class="h-full rounded-full transition-all {tool.toolType === 'Bash' ? 'bg-accent' : tool.toolType === 'Read' ? 'bg-success' : 'bg-warning'}"
                        style="width: {tool.pctOfTotal}%"
                      ></div>
                    </div>
                    <span class="text-xs text-text-secondary w-24 text-right">
                      {tool.pctOfTotal.toFixed(0)}% · {formatTokens(tool.estimatedTokens)}
                    </span>
                  </div>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Opportunities table -->
          {#if discover.opportunities.length > 0}
            <div class="bg-bg-secondary border border-border rounded-xl overflow-hidden">
              <div class="px-4 py-3 border-b border-border flex items-center justify-between">
                <h3 class="text-sm font-medium text-text-primary">
                  Cơ hội tối ưu
                </h3>
                <span class="text-xs text-text-secondary">
                  {discover.opportunities.filter((o) => o.hasFilter).length} có thể lọc
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-sm">
                  <thead>
                    <tr class="border-b border-border text-text-secondary">
                      <th class="text-left px-4 py-2.5 text-xs font-medium">Lệnh</th>
                      <th class="text-left px-4 py-2.5 text-xs font-medium">Nhóm</th>
                      <th class="text-right px-4 py-2.5 text-xs font-medium">Số lần</th>
                      <th class="text-right px-4 py-2.5 text-xs font-medium">Ước tính tiết kiệm</th>
                      <th class="text-center px-4 py-2.5 text-xs font-medium">Filter</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#each visibleOpportunities() as opp}
                      <tr class="border-b border-border/50 hover:bg-bg-hover transition-colors">
                        <td class="px-4 py-2.5 font-mono text-xs text-text-primary">
                          {opp.command}
                        </td>
                        <td class="px-4 py-2.5 text-xs text-text-secondary">
                          {opp.category}
                        </td>
                        <td class="px-4 py-2.5 text-right text-text-secondary">
                          {opp.count.toLocaleString()}
                        </td>
                        <td class="px-4 py-2.5 text-right font-mono text-accent">
                          {formatTokens(opp.estimatedSavingsTokens)}
                        </td>
                        <td class="px-4 py-2.5 text-center">
                          {#if opp.hasFilter}
                            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-success bg-success/15">
                              Có
                            </span>
                          {:else}
                            <span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium text-text-secondary bg-bg-hover">
                              Không
                            </span>
                          {/if}
                        </td>
                      </tr>
                    {/each}
                  </tbody>
                </table>
              </div>
              {#if discover.opportunities.length > 10}
                <div class="px-4 py-2.5 border-t border-border">
                  <button
                    type="button"
                    onclick={() => (showAllOpportunities = !showAllOpportunities)}
                    class="flex items-center gap-1 text-xs text-accent hover:underline"
                  >
                    {#if showAllOpportunities}
                      <ChevronUp size={12} />
                      Thu gọn
                    {:else}
                      <ChevronDown size={12} />
                      Xem toàn bộ {discover.opportunities.length} lệnh
                    {/if}
                  </button>
                </div>
              {/if}
            </div>
          {:else}
            <div class="bg-bg-secondary border border-border rounded-xl p-8 text-center">
              <Search size={24} class="text-text-secondary mx-auto mb-3 opacity-50" />
              <p class="text-sm text-text-secondary">
                Không tìm thấy dữ liệu phiên. Hãy dùng Claude Code thêm một lúc rồi quay lại.
              </p>
            </div>
          {/if}
        {/if}

      {:else if activeTab === "filters"}
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Built-in filters -->
          <div class="bg-bg-secondary border border-border rounded-xl overflow-hidden">
            <div class="px-4 py-3 border-b border-border">
              <h3 class="text-sm font-medium text-text-primary">Filters dựng sẵn</h3>
              <p class="text-[10px] text-text-secondary mt-0.5">
                {filters?.builtinCount ?? 0} đang hoạt động
              </p>
            </div>
            <div class="p-2 space-y-0.5 max-h-[28rem] overflow-y-auto">
              {#each [
                "git status", "git log", "git diff", "git show",
                "ls / tree / find", "grep / rg",
                "npm test / bun test", "npm install / bun install",
                "cargo test", "cargo build / check",
                "python / uv run", "pip install / uv add", "pytest",
                "go build / test", "bun run", "make",
                "kubectl", "docker ps / build",
                "curl", "cat / bat", "du / df / wc",
                "Read (file size cap)", "Grep (result limit)",
              ] as name}
                <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-bg-hover transition-colors">
                  <Check size={10} class="text-success shrink-0" />
                  <span class="text-text-secondary font-mono text-xs">{name}</span>
                </div>
              {/each}
            </div>
          </div>

          <!-- Custom filters editor -->
          <div class="lg:col-span-2 bg-bg-secondary border border-border rounded-xl overflow-hidden flex flex-col">
            <div class="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
              <h3 class="text-sm font-medium text-text-primary">Filters tuỳ chỉnh</h3>
                <p class="text-[10px] text-text-secondary mt-0.5">
                  {filters?.filterCount ?? 0} custom · <span class="font-mono">{filters?.path ?? ""}</span>
                </p>
              </div>
              <button
                type="button"
                onclick={handleSaveFilters}
                disabled={savingFilters}
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  {filtersSaved ? 'bg-success/10 text-success' : 'bg-accent/10 text-accent hover:bg-accent/20'}"
              >
                {#if filtersSaved}
                  <Check size={12} />
                  Đã lưu
                {:else}
                  <Save size={12} />
                  {savingFilters ? "Đang lưu..." : "Lưu"}
                {/if}
              </button>
            </div>
            <div class="flex-1">
              <textarea
                bind:value={filterContent}
                class="w-full h-80 bg-transparent text-text-primary font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
                spellcheck="false"
                placeholder="# Thêm quy tắc filter TOML tuỳ chỉnh tại đây..."
              ></textarea>
            </div>
            {#if !isEnabled}
              <div class="px-4 py-2.5 border-t border-border bg-warning/5">
                <div class="flex items-center gap-2">
                  <AlertTriangle size={12} class="text-warning shrink-0" />
                  <p class="text-[10px] text-warning">
                    Optimizer đang tắt. Hãy bật nó để filter có hiệu lực.
                  </p>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/if}
  </div>
</div>
