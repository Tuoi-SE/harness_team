<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/tauri/commands";
  import type { Settings } from "$lib/types";
  import GeneralSettings from "./GeneralSettings.svelte";
  import PermissionsEditor from "./PermissionsEditor.svelte";
  import EnvVarsEditor from "./EnvVarsEditor.svelte";
  import ProjectPicker from "$lib/components/shared/ProjectPicker.svelte";
  import { getSelectedProjectPath } from "$lib/stores/project-context.svelte";
  import { Info, CreditCard, HardDrive, Trash2 } from "lucide-svelte";
  import type { BudgetSettings, DiskUsageReport } from "$lib/tauri/commands";

  let activeTab = $state<"global" | "project">("global");
  let globalSettings = $state<Settings>({});
  let projectSettings = $state<Settings>({});
  let localSettings = $state<Settings>({});
  let loading = $state(true);
  let savingGlobal = $state(false);
  let budgetSettings = $state<BudgetSettings | null>(null);
  let diskUsage = $state<DiskUsageReport | null>(null);
  let cleaning = $state<string | null>(null);
  let savingProject = $state(false);
  let savingLocal = $state(false);
  let saveMessage = $state<string | null>(null);

  const projectPath = $derived(getSelectedProjectPath());
  const isProjectTab = $derived(activeTab === "project");

  async function loadBudget() {
    try { budgetSettings = await api.budget.get(); } catch { /* silent */ }
  }

  async function loadDiskUsage() {
    try { diskUsage = await api.maintenance.getDiskUsage(); } catch { /* silent */ }
  }

  async function cleanupDir(name: string) {
    cleaning = name;
    try {
      await api.maintenance.cleanup(name);
      await loadDiskUsage();
      showSave(`Đã dọn ${name}!`);
    } catch (e) { showSave(`Lỗi: ${e}`); }
    finally { cleaning = null; }
  }

  async function saveBudget() {
    if (!budgetSettings) return;
    try {
      await api.budget.set(budgetSettings.daily_limit, budgetSettings.monthly_limit, budgetSettings.plan_type);
    showSave("Đã lưu cài đặt ngân sách!");
    } catch (e) { showSave(`Lỗi: ${e}`); }
  }

  async function loadSettings() {
    loading = true;
    try {
      if (activeTab === "global") {
        globalSettings = await api.settings.read("global");
      } else if (projectPath) {
        const [proj, local] = await Promise.all([
          api.settings.read("project", projectPath),
          api.settings.read("local", projectPath),
        ]);
        projectSettings = proj;
        localSettings = local;
      }
    } catch (e) {
      console.error("Lỗi tải cài đặt:", e);
    } finally {
      loading = false;
    }
  }

  async function saveGlobal() {
    savingGlobal = true;
    try {
      await api.settings.write("global", globalSettings);
      showSave("Đã lưu cài đặt toàn cục!");
    } catch (e) {
      showSave(`Lỗi: ${e}`);
    } finally {
      savingGlobal = false;
    }
  }

  async function saveProject() {
    if (!projectPath) return;
    savingProject = true;
    try {
      await api.settings.write("project", projectSettings, projectPath);
      showSave("Đã lưu cài đặt dự án!");
    } catch (e) {
      showSave(`Lỗi: ${e}`);
    } finally {
      savingProject = false;
    }
  }

  async function saveLocal() {
    if (!projectPath) return;
    savingLocal = true;
    try {
      await api.settings.write("local", localSettings, projectPath);
      showSave("Đã lưu ghi đè cục bộ!");
    } catch (e) {
      showSave(`Lỗi: ${e}`);
    } finally {
      savingLocal = false;
    }
  }

  function showSave(msg: string) {
    saveMessage = msg;
    setTimeout(() => (saveMessage = null), 2000);
  }

  function handleTabChange(tab: typeof activeTab) {
    activeTab = tab;
    loadSettings();
  }

  onMount(() => { loadSettings(); loadBudget(); loadDiskUsage(); });
</script>

<div class="p-6 overflow-y-auto h-full">
  <!-- Tabs + Project Picker -->
  <div class="flex items-center justify-between mb-6">
    <div class="flex items-center gap-3">
      <div class="flex gap-1 bg-bg-tertiary rounded-lg p-1">
        {#each [
          { id: "global" as const, label: "Toàn cục", hint: "~/.claude/settings.json — áp dụng cho mọi dự án" },
          { id: "project" as const, label: "Dự án", hint: "Cài đặt theo từng dự án (chia sẻ + ghi đè cục bộ)" },
        ] as tab}
          <button
            class="px-4 py-1.5 text-sm rounded-md transition-colors
              {activeTab === tab.id
                ? 'bg-bg-secondary text-text-primary'
                : 'text-text-muted hover:text-text-secondary'}"
            onclick={() => handleTabChange(tab.id)}
            title={tab.hint}
          >
            {tab.label}
          </button>
        {/each}
      </div>

      {#if isProjectTab}
        <ProjectPicker onselect={loadSettings} />
      {/if}
    </div>

    {#if saveMessage}
      <span class="text-xs {saveMessage.startsWith('Error') ? 'text-danger' : 'text-success'}">
        {saveMessage}
      </span>
    {/if}
  </div>

  {#if loading}
    <p class="text-sm text-text-muted">Đang tải...</p>
  {:else if activeTab === "global"}
    <!-- Global Settings -->
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-xs text-text-muted">
          <Info size={12} />
          <span class="font-mono">~/.claude/settings.json</span>
          <span>— áp dụng cho mọi dự án trên máy của bạn</span>
        </div>
        <button
          class="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors disabled:opacity-50"
          onclick={saveGlobal}
          disabled={savingGlobal}
        >
          {savingGlobal ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
      <!-- Harness Settings -->
      {#if budgetSettings}
        <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
          <h3 class="text-sm font-medium text-text-secondary flex items-center gap-1.5">
            <CreditCard size={14} />
            Cài đặt Harness
          </h3>

          <!-- Plan Type -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm text-text-primary">Loại gói</span>
              <p class="text-xs text-text-muted">Ảnh hưởng cách hiển thị chi phí</p>
            </div>
            <select
              class="w-48 px-3 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
              value={budgetSettings.plan_type}
              onchange={(e) => {
                if (budgetSettings) budgetSettings = { ...budgetSettings, plan_type: (e.target as HTMLSelectElement).value };
              }}
            >
              <option value="max">Max</option>
              <option value="pro">Pro</option>
              <option value="api">API (trả theo token)</option>
              <option value="team">Team</option>
              <option value="free">Free</option>
            </select>
          </div>

          <!-- Budget Limits -->
          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm text-text-primary">Cảnh báo ngân sách ngày</span>
              <p class="text-xs text-text-muted">Thông báo khi chi phí API trong ngày vượt quá</p>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-sm text-text-muted">$</span>
              <input
                type="number"
                class="w-20 px-2 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
                placeholder="—"
                value={budgetSettings.daily_limit ?? ""}
                oninput={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  if (budgetSettings) budgetSettings = { ...budgetSettings, daily_limit: isNaN(val) ? null : val };
                }}
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <span class="text-sm text-text-primary">Cảnh báo ngân sách tháng</span>
              <p class="text-xs text-text-muted">Thông báo khi chi phí API trong tháng vượt quá</p>
            </div>
            <div class="flex items-center gap-1">
              <span class="text-sm text-text-muted">$</span>
              <input
                type="number"
                class="w-20 px-2 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
                placeholder="—"
                value={budgetSettings.monthly_limit ?? ""}
                oninput={(e) => {
                  const val = parseFloat((e.target as HTMLInputElement).value);
                  if (budgetSettings) budgetSettings = { ...budgetSettings, monthly_limit: isNaN(val) ? null : val };
                }}
              />
            </div>
          </div>

          <div class="flex justify-end">
            <button
              class="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors"
              onclick={saveBudget}
            >
              Lưu cài đặt Harness
            </button>
          </div>
        </div>
      {/if}

      <GeneralSettings bind:settings={globalSettings} />
      <PermissionsEditor bind:settings={globalSettings} />
      <EnvVarsEditor bind:settings={globalSettings} />

      <!-- Maintenance -->
      {#if diskUsage}
        <div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-sm font-medium text-text-secondary flex items-center gap-1.5">
              <HardDrive size={14} />
              Dung lượng lưu trữ — {diskUsage.total_display}
            </h3>
            <button class="text-xs text-accent hover:text-accent-hover" onclick={loadDiskUsage}>Làm mới</button>
          </div>

          <div class="space-y-2">
            {#each diskUsage.entries as entry}
              <div class="flex items-center justify-between py-1.5 {entry.safe_to_delete ? '' : 'opacity-60'}">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-text-primary font-mono">{entry.name}</span>
                    <span class="text-xs text-text-muted">{entry.description}</span>
                  </div>
                </div>
                <div class="flex items-center gap-3 shrink-0">
                  <span class="text-xs font-medium text-text-secondary">{entry.size_display}</span>
                  {#if entry.safe_to_delete}
                    <button
                      class="flex items-center gap-1 px-2 py-1 text-[10px] bg-danger/10 text-danger rounded hover:bg-danger/20 transition-colors disabled:opacity-50"
                      onclick={() => cleanupDir(entry.name)}
                      disabled={cleaning === entry.name}
                    >
                      <Trash2 size={10} />
                      {cleaning === entry.name ? "..." : "Clean"}
                    </button>
                  {:else}
                    <span class="text-[10px] text-text-muted px-2">được bảo vệ</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {:else if !projectPath}
      <div class="flex items-center justify-center h-48 text-sm text-text-muted">
      Chọn một dự án để chỉnh sửa cài đặt
    </div>
  {:else}
    <!-- Project Settings: Shared + Local -->
    <div class="space-y-8">
      <!-- Shared (team) settings -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              Cài đặt chia sẻ
              <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-info/10 text-info">được git theo dõi</span>
            </h3>
            <p class="text-xs text-text-muted mt-0.5 font-mono">.claude/settings.json — được commit vào git, chia sẻ với cả nhóm</p>
          </div>
          <button
            class="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors disabled:opacity-50"
            onclick={saveProject}
            disabled={savingProject}
          >
            {savingProject ? "Đang lưu..." : "Lưu chia sẻ"}
          </button>
        </div>
        <GeneralSettings bind:settings={projectSettings} />
        <PermissionsEditor bind:settings={projectSettings} />
        <EnvVarsEditor bind:settings={projectSettings} />
      </div>

      <!-- Divider -->
      <div class="border-t border-border"></div>

      <!-- Local overrides -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-medium text-text-primary flex items-center gap-2">
              Ghi đè cục bộ
              <span class="text-xs font-normal px-2 py-0.5 rounded-full bg-warning/10 text-warning">bị git bỏ qua</span>
            </h3>
            <p class="text-xs text-text-muted mt-0.5 font-mono">.claude/settings.local.json — chỉ trên máy bạn, ghi đè phần chia sẻ</p>
          </div>
          <button
            class="px-4 py-1.5 text-sm bg-accent hover:bg-accent-hover text-white rounded-md transition-colors disabled:opacity-50"
            onclick={saveLocal}
            disabled={savingLocal}
          >
            {savingLocal ? "Đang lưu..." : "Lưu cục bộ"}
          </button>
        </div>
        <GeneralSettings bind:settings={localSettings} />
        <PermissionsEditor bind:settings={localSettings} />
        <EnvVarsEditor bind:settings={localSettings} />
      </div>
    </div>
  {/if}
</div>
