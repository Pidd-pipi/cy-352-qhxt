<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  checkHealth,
  closeTable,
  fetchGames,
  fetchOpenTables,
  fetchRecommendation,
  openTable,
} from "./api/client";
import { APP_CODE, APP_NAME } from "./constants/app";
import { REQUEST_MESSAGES } from "./constants/messages";
import type {
  CandidateItem,
  GameItem,
  RecommendationResult,
  RecommendInput,
  TableSessionItem,
} from "./types";
import PickerPanel from "./components/PickerPanel.vue";
import OpenTablesPanel from "./components/OpenTablesPanel.vue";
import GameAdminPanel from "./components/GameAdminPanel.vue";

const notice = ref(REQUEST_MESSAGES.backendOffline);
const backendOnline = ref(false);

const games = ref<GameItem[]>([]);
const recommendation = ref<RecommendationResult | null>(null);
const sessions = ref<TableSessionItem[]>([]);

const searching = ref(false);
const openingGameId = ref<string | null>(null);
const closingId = ref<string | null>(null);

let lastInput: RecommendInput = { partySize: 4, availableMinutes: 90, preferredDifficulty: null };

async function refreshGames() {
  games.value = (await fetchGames()).games;
}

async function refreshSessions() {
  sessions.value = (await fetchOpenTables()).sessions;
}

async function runRecommendation(input: RecommendInput) {
  lastInput = input;
  searching.value = true;
  try {
    recommendation.value = await fetchRecommendation(input);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : REQUEST_MESSAGES.recommendFailed);
  } finally {
    searching.value = false;
  }
}

/** 开桌/结桌/改库存后统一刷新：候选排序、在库数量、开桌列表都依赖最新库存 */
async function refreshAll() {
  await Promise.all([refreshGames(), refreshSessions(), runRecommendation(lastInput)]);
}

async function handleOpenTable(candidate: CandidateItem) {
  openingGameId.value = candidate.game.id;
  try {
    await openTable(candidate.game.id, lastInput.partySize);
    ElMessage.success(`「${candidate.game.name}」${REQUEST_MESSAGES.openTableSuccess}`);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "开桌失败");
  } finally {
    openingGameId.value = null;
    await refreshAll();
  }
}

async function handleCloseTable(session: TableSessionItem) {
  closingId.value = session.id;
  try {
    const result = await closeTable(session.id);
    ElMessage[result.alreadyClosed ? "info" : "success"](
      result.alreadyClosed
        ? `「${session.gameName}」${REQUEST_MESSAGES.closeTableRepeated}`
        : `「${session.gameName}」${REQUEST_MESSAGES.closeTableSuccess}`,
    );
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "结桌失败");
  } finally {
    closingId.value = null;
    await refreshAll();
  }
}

async function handleLibraryChanged() {
  await refreshAll();
}

onMounted(async () => {
  try {
    await checkHealth();
    backendOnline.value = true;
    notice.value = REQUEST_MESSAGES.backendOnline;
    await refreshGames();
    await refreshSessions();
    await runRecommendation(lastInput);
  } catch {
    notice.value = REQUEST_MESSAGES.backendOffline;
  }
});
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div>
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }} · 现场选游</h1>
      </div>
      <el-tag :type="backendOnline ? 'success' : 'danger'" effect="dark">{{ notice }}</el-tag>
    </header>
    <section class="workspace">
      <PickerPanel
        :result="recommendation"
        :searching="searching"
        :opening-game-id="openingGameId"
        @search="runRecommendation"
        @open-table="handleOpenTable"
      />
      <OpenTablesPanel
        :sessions="sessions"
        :closing-id="closingId"
        @close-table="handleCloseTable"
        @refresh="refreshSessions"
      />
      <GameAdminPanel :games="games" @changed="handleLibraryChanged" />
    </section>
  </main>
</template>
