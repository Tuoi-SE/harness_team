<script lang="ts">
  import type { NodeProps } from "@xyflow/svelte";
  import BaseNode from "./BaseNode.svelte";
  import { Braces } from "lucide-svelte";

  let { data }: NodeProps = $props();
  const subtitle = $derived(((data as any).config)?.path || "Đặt đường dẫn JSON...");
</script>

<BaseNode label={((data as any).label) ?? "Trích JSON"} {subtitle} status={((data as any).status)} color="border-accent">
  {#snippet icon()}<Braces size={14} class="text-accent" />{/snippet}
</BaseNode>
