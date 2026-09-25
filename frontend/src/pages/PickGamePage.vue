<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import { fetchGames, fetchRecommend, openTable } from "../api/client";
import type { Candidate, Game, RecommendResult } from "../types";

const games = ref<Game[]>([]);
const loadingGames = ref(true);

// 前台录入
const players = ref(4);
const availableMinutes = ref(90);
const preferredDifficulty = ref<number | null>(null);
const difficultyOptions = [
  { value: 1, label: "1 入门" },
  { value: 2, label: "2 轻度" },
  { value: 3, label: "3 中等" },
  { value: 4, label: "4 进阶" },
  { value: 5, label: "5 硬核" },
];

const loading = ref(false);
const result = ref<RecommendResult | null>(null);

const hasResult = computed(() => result.value !== null);

async function loadGames() {
  loadingGames.value = true;
  try {
    const data = await fetchGames();
    games.value = data.games;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "桌游库加载失败");
  } finally {
    loadingGames.value = false;
  }
}

async function search() {
  loading.value = true;
  try {
    result.value = await fetchRecommend({
      players: players.value,
      availableMinutes: availableMinutes.value,
      preferredDifficulty: preferredDifficulty.value,
    });
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "推荐查询失败");
  } finally {
    loading.value = false;
  }
}

async function handleOpen(candidate: Candidate) {
  if (candidate.availableStock <= 0) {
    ElMessage.warning("该桌游当前没有在库份数");
    return;
  }
  try {
    const table = await openTable(candidate.id, players.value);
    ElMessage.success(`已开桌《${candidate.name}》，扣减 1 份，剩余在库 ${table.availableStock} 份`);
    await Promise.all([loadGames(), search()]);
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "开桌失败，可能最后一份已被抢走");
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("zh-CN", { hour12: false });
}

onMounted(loadGames);
</script>

<template>
  <section class="page">
    <div class="page-head">
      <h2>现场选游</h2>
      <p>录入到店人数、可玩时长和难度偏好，系统自动排除无库存 / 时长不够的桌游，并给出排序依据。</p>
    </div>

    <el-card class="form-card" shadow="never">
      <el-form label-position="top" class="pick-form" @submit.prevent>
        <el-form-item label="到店人数">
          <el-input-number v-model="players" :min="1" :max="20" :step="1" />
          <span class="field-hint">人</span>
        </el-form-item>
        <el-form-item label="可用时间">
          <el-input-number v-model="availableMinutes" :min="5" :max="600" :step="15" />
          <span class="field-hint">分钟</span>
        </el-form-item>
        <el-form-item label="偏好难度">
          <el-select v-model="preferredDifficulty" placeholder="不限" clearable style="width: 160px">
            <el-option v-for="opt in difficultyOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
        <el-form-item class="form-action">
          <el-button type="primary" size="large" :loading="loading" @click="search">匹配桌游</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <template v-if="hasResult">
      <el-alert
        class="rule-alert"
        type="info"
        :closable="false"
        :title="result!.sortRule"
      />

      <div class="result-grid">
        <section class="result-col">
          <h3 class="col-title">
            可开候选
            <el-tag type="success" round>{{ result!.candidates.length }}</el-tag>
          </h3>

          <el-empty v-if="result!.candidates.length === 0" description="当前条件下没有可开的桌游" />

          <el-card
            v-for="(candidate, index) in result!.candidates"
            :key="candidate.id"
            class="candidate-card"
            shadow="hover"
          >
            <template #header>
              <div class="candidate-head">
                <div class="rank" :class="{ top: index === 0 }">{{ index + 1 }}</div>
                <div class="candidate-title">
                  <strong>{{ candidate.name }}</strong>
                  <div class="tags">
                    <el-tag size="small">{{ candidate.category }}</el-tag>
                    <el-tag
                      size="small"
                      :type="candidate.fit.playerFit ? 'success' : 'warning'"
                    >
                      {{ candidate.fit.playerFit ? "人数适配" : "人数需放宽" }}
                    </el-tag>
                    <el-tag size="small" type="info">{{ candidate.minPlayers }}-{{ candidate.maxPlayers }} 人</el-tag>
                    <el-tag size="small" type="info">{{ candidate.durationMinutes }} 分钟</el-tag>
                    <el-tag size="small" type="info">难度 {{ candidate.difficulty }}</el-tag>
                  </div>
                </div>
                <div class="stock-block">
                  <span class="stock-num" :class="{ zero: candidate.availableStock === 0 }">
                    在库 {{ candidate.availableStock }}
                  </span>
                  <span class="stock-sub">共 {{ candidate.totalStock }} 份 / 已开 {{ candidate.openCount }} 桌</span>
                </div>
              </div>
            </template>

            <p v-if="candidate.intro" class="intro">{{ candidate.intro }}</p>

            <ul class="basis-list">
              <li v-for="(basis, i) in candidate.sortBasis" :key="i">{{ basis }}</li>
            </ul>

            <div class="candidate-foot">
              <span class="margin-hint">时长余量 {{ candidate.fit.timeMargin }} 分钟</span>
              <el-button
                type="primary"
                :disabled="candidate.availableStock === 0"
                @click="handleOpen(candidate)"
              >
                开桌（扣 1 份）
              </el-button>
            </div>
          </el-card>
        </section>

        <section class="result-col excluded-col">
          <h3 class="col-title">
            不可开桌游
            <el-tag type="danger" round>{{ result!.excluded.length }}</el-tag>
          </h3>

          <el-empty v-if="result!.excluded.length === 0" description="没有被排除的桌游" />

          <el-card
            v-for="game in result!.excluded"
            :key="game.id"
            class="excluded-card"
            shadow="never"
          >
            <div class="excluded-head">
              <strong>{{ game.name }}</strong>
              <el-tag size="small" type="info">{{ game.durationMinutes }} 分钟</el-tag>
            </div>
            <ul class="reason-list">
              <li v-for="(reason, i) in game.reasons" :key="i">{{ reason }}</li>
            </ul>
          </el-card>
        </section>
      </div>
    </template>

    <el-skeleton v-else-if="loadingGames" :rows="4" animated />
  </section>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-head h2 {
  margin: 0 0 6px;
}

.page-head p {
  margin: 0;
  color: color-mix(in srgb, #19212e 65%, #3268b8 35%);
}

.form-card :deep(.el-card__body) {
  padding: 20px 24px 4px;
}

.pick-form {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px 18px;
  align-items: end;
}

.field-hint {
  margin-left: 10px;
  color: #667085;
}

.form-action :deep(.el-form-item__content) {
  justify-content: flex-end;
}

.rule-alert {
  font-weight: 700;
}

.result-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

.result-col {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.col-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0;
}

.candidate-card :deep(.el-card__header) {
  padding: 14px 18px;
}

.candidate-head {
  display: flex;
  align-items: center;
  gap: 14px;
}

.rank {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: color-mix(in srgb, #3268b8 18%, white);
  color: #3268b8;
  display: grid;
  place-items: center;
  font-weight: 800;
  flex: 0 0 auto;
}

.rank.top {
  background: #3268b8;
  color: #fff;
}

.candidate-title {
  flex: 1;
  min-width: 0;
}

.candidate-title strong {
  font-size: 17px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.stock-block {
  text-align: right;
  flex: 0 0 auto;
}

.stock-num {
  display: block;
  font-size: 22px;
  font-weight: 800;
  color: #1a7f37;
}

.stock-num.zero {
  color: #c0392b;
}

.stock-sub {
  font-size: 12px;
  color: #667085;
}

.intro {
  margin: 0 0 10px;
  color: #475467;
  font-size: 14px;
}

.basis-list {
  margin: 0;
  padding-left: 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13.5px;
  color: #344054;
}

.candidate-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
}

.margin-hint {
  font-weight: 700;
  color: #3268b8;
}

.excluded-card {
  opacity: 0.92;
}

.excluded-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.reason-list {
  margin: 0;
  padding-left: 20px;
  color: #c0392b;
  font-size: 13.5px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

@media (max-width: 960px) {
  .pick-form {
    grid-template-columns: 1fr 1fr;
  }

  .result-grid {
    grid-template-columns: 1fr;
  }
}
</style>
