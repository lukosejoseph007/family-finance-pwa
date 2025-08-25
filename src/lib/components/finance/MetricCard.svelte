<script lang="ts">
  export let title: string;
  export let value: string;
  export let trend: string;
  export let accentColor: string;
</script>

<div class="p-4 rounded-xl bg-white shadow-sm border border-gray-100 hover:shadow-md transition-all">
  <div class="flex items-center justify-between mb-2">
    <h3 class="text-sm font-medium text-gray-600">{title}</h3>
    <div class="h-6 w-6 rounded-md" style="background: {accentColor}"></div>
  </div>
  <div class="text-2xl font-bold text-gray-900">{value}</div>
  <div class="text-sm mt-1" style="color: {accentColor}">{trend}</div>
</div>