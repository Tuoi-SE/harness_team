<script lang="ts">
  import { onMount } from "svelte";
  import { api } from "$lib/tauri/commands";
  import type { Settings, EffortLevel, ClaudeCapabilities } from "$lib/types";

  interface Props {
    settings: Settings;
  }

  let { settings = $bindable() }: Props = $props();

  // Model + effort options are sourced live from the installed Claude CLI
  // (`claude --help`), so they never drift from what the CLI actually supports.
  const FALLBACK_EFFORT: EffortLevel[] = ["low", "medium", "high", "xhigh", "max"];
  let caps = $state<ClaudeCapabilities | null>(null);

  const effortLevels = $derived<EffortLevel[]>(caps?.effortLevels ?? FALLBACK_EFFORT);

  function knownModel(value: string): boolean {
    if (!caps) return false;
    return [...caps.modelAliases, ...caps.modelPinned].some((m) => m.value === value);
  }

  onMount(async () => {
    try {
      caps = await api.settings.getClaudeCapabilities();
    } catch {
      caps = null;
    }
  });
</script>

<div class="bg-bg-secondary border border-border rounded-lg p-4 space-y-4">
  <h3 class="text-sm font-medium text-text-secondary">Chung</h3>

  <!-- Model -->
  <div class="flex items-center justify-between">
    <div>
      <span class="text-sm text-text-primary">Model</span>
      <p class="text-xs text-text-muted">Ghi đè model mặc định</p>
    </div>
    <select
      aria-label="Model"
      class="w-64 px-3 py-1.5 text-sm bg-bg-tertiary border border-border rounded-md text-text-primary focus:outline-none focus:border-accent"
      value={settings.model ?? ""}
      onchange={(e) => {
        const val = (e.target as HTMLSelectElement).value;
        settings = { ...settings, model: val || undefined };
      }}
    >
      <option value="">Mặc định (do hệ thống chọn)</option>
      {#if caps}
        <optgroup label="Luôn mới nhất">
          {#each caps.modelAliases as m}
            <option value={m.value}>{m.label}</option>
          {/each}
        </optgroup>
        <optgroup label="Phiên bản cố định">
          {#each caps.modelPinned as m}
            <option value={m.value}>{m.label}</option>
          {/each}
        </optgroup>
      {/if}
      {#if settings.model && !knownModel(settings.model)}
        <option value={settings.model}>{settings.model} (hiện tại)</option>
      {/if}
    </select>
  </div>

  <!-- Effort Level -->
  <div class="flex items-center justify-between">
    <div>
      <span class="text-sm text-text-primary">Mức effort</span>
      <p class="text-xs text-text-muted">Điều chỉnh độ sâu suy luận</p>
    </div>
    <div class="flex gap-1 bg-bg-tertiary rounded-lg p-1" role="group" aria-label="Mức effort">
      {#each effortLevels as level}
        <button
          class="px-3 py-1 text-xs rounded-md transition-colors
            {settings.effortLevel === level
              ? 'bg-accent text-white'
              : 'text-text-muted hover:text-text-secondary'}"
          onclick={() => {
            settings = { ...settings, effortLevel: level };
          }}
        >
          {level}
        </button>
      {/each}
    </div>
  </div>

  <!-- Extended Thinking -->
  <div class="flex items-center justify-between">
    <div>
      <span class="text-sm text-text-primary">Suy nghĩ mở rộng</span>
      <p class="text-xs text-text-muted">Luôn bật suy nghĩ mở rộng</p>
    </div>
    <button
      role="switch"
      aria-checked={settings.alwaysThinkingEnabled ?? false}
      aria-label="Bật/tắt suy nghĩ mở rộng"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
        {settings.alwaysThinkingEnabled ? 'bg-accent' : 'bg-bg-tertiary border border-border'}"
      onclick={() => {
        settings = { ...settings, alwaysThinkingEnabled: !settings.alwaysThinkingEnabled };
      }}
    >
      <span
        class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
          {settings.alwaysThinkingEnabled ? 'translate-x-6' : 'translate-x-1'}"
      ></span>
    </button>
  </div>

  <!-- Auto Memory -->
  <div class="flex items-center justify-between">
    <div>
      <span class="text-sm text-text-primary">Bộ nhớ tự động</span>
      <p class="text-xs text-text-muted">Cho phép Claude lưu ngữ cảnh giữa các phiên</p>
    </div>
    <button
      role="switch"
      aria-checked={settings.autoMemoryEnabled !== false}
      aria-label="Bật/tắt bộ nhớ tự động"
      class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
        {settings.autoMemoryEnabled !== false ? 'bg-accent' : 'bg-bg-tertiary border border-border'}"
      onclick={() => {
        settings = {
          ...settings,
          autoMemoryEnabled: settings.autoMemoryEnabled === false ? true : false,
        };
      }}
    >
      <span
        class="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform
          {settings.autoMemoryEnabled !== false ? 'translate-x-6' : 'translate-x-1'}"
      ></span>
    </button>
  </div>
</div>
