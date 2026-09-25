<script setup lang="ts">
import type { TableSessionItem } from "../types";

defineProps<{
  sessions: TableSessionItem[];
  closingId: string | null;
}>();

const emit = defineEmits<{
  closeTable: [session: TableSessionItem];
  refresh: [];
}>();

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

function elapsedLabel(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时 ${minutes % 60} 分`;
}
</script>

<template>
  <section class="work-panel">
    <header class="panel-head">
      <h2>开桌中 {{ sessions.length }} 桌</h2>
      <el-button size="small" @click="emit('refresh')">刷新</el-button>
    </header>
    <el-empty v-if="sessions.length === 0" description="当前没有开桌，从上方候选里开一桌吧" />
    <el-table v-else :data="sessions" size="large" style="width: 100%">
      <el-table-column prop="gameName" label="桌游" min-width="140" />
      <el-table-column label="人数" width="90">
        <template #default="{ row }">{{ row.partySize }} 人</template>
      </el-table-column>
      <el-table-column label="开桌时间" min-width="170">
        <template #default="{ row }">{{ formatTime(row.openedAt) }}</template>
      </el-table-column>
      <el-table-column label="已玩" width="130">
        <template #default="{ row }">{{ elapsedLabel(row.openedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="160">
        <template #default="{ row }">
          <el-button
            type="warning"
            size="small"
            :loading="closingId === row.id"
            @click="emit('closeTable', row)"
          >
            结桌（还 1 份）
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>
