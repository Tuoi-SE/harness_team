<script lang="ts">
  import type { NodeProps } from "@xyflow/svelte";
  import BaseNode from "./BaseNode.svelte";
  import { Bot } from "lucide-svelte";

  let { data }: NodeProps = $props();
</script>

<BaseNode label={((data as any).label) ?? "Prompt Claude"} subtitle={((data as any).config)?.prompt?.slice(0, 40) || "Đặt prompt..."} status={((data as any).status)} color="border-accent">
  {#snippet icon()}<Bot size={14} class="text-accent" />{/snippet}
</BaseNode>
