<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { closeTable, fetchTables } from "../api/client";
import type { TableRecord, TableStatus } from "../types";

const tables = ref<TableRecord[]>([]);
const loading = ref(true);
const filter = ref<TableStatus | "">("");

async function load() {
  loading.value = true;
  try {
    const data = await fetchTables(filter.value || undefined);
    tables.value = data.tables;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "桌台记录加载失败");
  } finally {
    loading.value = false;
  }
}

async function handleClose(table: TableRecord) {
  try {
    const updated = await closeTable(table.id);
    ElMessage.success(`《${table.gameName}》已结桌，库存归还至 ${updated.availableStock} 份`);
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "结桌失败");
  }
}

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h2>桌台流水</h2>
        <p>开桌自动扣减一份在库，结桌后归还；重复结桌会被拒绝，不会多加库存。</p>
      </div>
      <el-radio-group v-model="filter" @change="load">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="open">进行中</el-radio-button>
        <el-radio-button label="closed">已结桌</el-radio-button>
      </el-radio-group>
    </div>

    <el-table :data="tables" v-loading="loading" border stripe>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'open' ? 'success' : 'info'">
            {{ row.status === "open" ? "进行中" : "已结桌" }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="gameName" label="桌游" min-width="160" />
      <el-table-column label="人数" width="80">
        <template #default="{ row }">{{ row.players ?? "—" }}</template>
      </el-table-column>
      <el-table-column label="开桌时间" width="190">
        <template #default="{ row }">{{ formatTime(row.openedAt) }}</template>
      </el-table-column>
      <el-table-column label="结桌时间" width="190">
        <template #default="{ row }">{{ formatTime(row.closedAt) }}</template>
      </el-table-column>
      <el-table-column label="当前在库" width="120">
        <template #default="{ row }">{{ row.availableStock }} / {{ row.totalStock }} 份</template>
      </el-table-column>
      <el-table-column label="操作" width="110" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'open'"
            link
            type="primary"
            @click="handleClose(row)"
          >
            结桌归还
          </el-button>
          <span v-else class="done">已归还</span>
        </template>
      </el-table-column>
    </el-table>
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
}

.page-head h2 {
  margin: 0 0 6px;
}

.page-head p {
  margin: 0;
  color: color-mix(in srgb, #19212e 65%, #3268b8 35%);
}

.done {
  color: #98a2b3;
}
</style>
