<script setup lang="ts">
import { onMounted, ref } from "vue";
import { fetchOverview } from "../api/client";
import { REQUEST_MESSAGES } from "../constants/messages";
import { createFallbackOverview } from "../state/dashboard";
import type { OverviewResponse } from "../types";
import FeatureStrip from "../components/FeatureStrip.vue";
import MetricGrid from "../components/MetricGrid.vue";
import OperationsTable from "../components/OperationsTable.vue";

const overview = ref<OverviewResponse>(createFallbackOverview());
const notice = ref(REQUEST_MESSAGES.overviewFallback);

onMounted(async () => {
  try {
    overview.value = await fetchOverview();
    notice.value = "后端服务已联通，当前展示实时接口数据。";
  } catch {
    notice.value = REQUEST_MESSAGES.overviewFallback;
  }
});
</script>

<template>
  <div class="lead-grid">
    <article class="hero-panel">
      <span class="pill">{{ notice }}</span>
      <h2>{{ overview.appName }}</h2>
      <p>{{ overview.description }}</p>
      <p>
        前台可在「现场选游」录入人数、可用分钟与偏好难度，系统自动筛掉无库存 / 时长不够的桌游，
        并按人数适配、难度偏好、时长余量给出候选顺序。
      </p>
    </article>
    <MetricGrid :items="overview.kpis" />
  </div>
  <FeatureStrip :items="overview.features" />
  <section class="work-panel">
    <h2>运营任务流</h2>
    <OperationsTable :records="overview.records" />
  </section>
</template>
