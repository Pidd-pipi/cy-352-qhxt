<script setup lang="ts">
import { reactive } from "vue";
import type { CandidateItem, RecommendationResult, RecommendInput } from "../types";

defineProps<{
  result: RecommendationResult | null;
  searching: boolean;
  openingGameId: string | null;
}>();

const emit = defineEmits<{
  search: [input: RecommendInput];
  openTable: [candidate: CandidateItem];
}>();

const difficultyOptions = [
  { value: null, label: "不限难度" },
  { value: 1, label: "1 · 入门" },
  { value: 2, label: "2 · 轻策" },
  { value: 3, label: "3 · 中等" },
  { value: 4, label: "4 · 进阶" },
  { value: 5, label: "5 · 硬核" },
];

const form = reactive<RecommendInput>({
  partySize: 4,
  availableMinutes: 90,
  preferredDifficulty: null,
});

function submit() {
  emit("search", { ...form });
}

function stockTagType(stock: number): "success" | "warning" {
  return stock >= 2 ? "success" : "warning";
}
</script>

<template>
  <section class="work-panel picker-panel">
    <header class="panel-head">
      <h2>现场选游</h2>
      <p>录入人数、可用分钟和偏好难度，候选按「人数适配 → 难度偏好 → 时长余量」排序。</p>
    </header>

    <el-form class="picker-form" label-position="top" @submit.prevent="submit">
      <el-form-item label="人数">
        <el-input-number v-model="form.partySize" :min="1" :max="30" />
      </el-form-item>
      <el-form-item label="可用分钟">
        <el-input-number v-model="form.availableMinutes" :min="5" :max="720" :step="15" />
      </el-form-item>
      <el-form-item label="偏好难度">
        <el-select v-model="form.preferredDifficulty" placeholder="不限难度" style="width: 160px">
          <el-option
            v-for="option in difficultyOptions"
            :key="String(option.value)"
            :value="option.value"
            :label="option.label"
          />
        </el-select>
      </el-form-item>
      <el-form-item label=" ">
        <el-button type="primary" :loading="searching" native-type="submit">推荐桌游</el-button>
      </el-form-item>
    </el-form>

    <template v-if="result">
      <h3 class="section-title">
        候选 {{ result.candidates.length }} 款
        <small>排序依据见每张卡片，在库数量为实时库存</small>
      </h3>
      <el-empty v-if="result.candidates.length === 0" description="当前条件下没有可开桌的桌游，请调整人数或时间" />
      <div v-else class="candidate-grid">
        <article v-for="(item, index) in result.candidates" :key="item.game.id" class="candidate-card">
          <header class="candidate-head">
            <span class="rank">#{{ index + 1 }}</span>
            <strong>{{ item.game.name }}</strong>
            <el-tag size="small" effect="plain">{{ item.game.category }}</el-tag>
            <el-tag size="small" :type="stockTagType(item.game.stock)">在库 {{ item.game.stock }} 份</el-tag>
          </header>
          <p class="candidate-meta">
            {{ item.game.minPlayers }}–{{ item.game.maxPlayers }} 人 · 单局 {{ item.game.durationMinutes }} 分钟 ·
            难度 {{ item.game.difficulty }}
          </p>
          <ol class="basis-list">
            <li v-for="line in item.basis" :key="line" :class="{ muted: !item.playerFit && line.startsWith('人数不适配') }">
              {{ line }}
            </li>
          </ol>
          <footer class="candidate-foot">
            <el-button
              type="primary"
              size="small"
              :loading="openingGameId === item.game.id"
              :disabled="item.game.stock <= 0"
              @click="emit('openTable', item)"
            >
              开桌（扣 1 份）
            </el-button>
          </footer>
        </article>
      </div>

      <h3 class="section-title excluded-title">暂不可选 {{ result.excluded.length }} 款</h3>
      <el-table v-if="result.excluded.length > 0" :data="result.excluded" size="large" style="width: 100%">
        <el-table-column label="桌游" min-width="140">
          <template #default="{ row }">
            <strong>{{ row.game.name }}</strong>
            <el-tag size="small" effect="plain" class="excluded-tag">{{ row.game.category }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="适合人数" width="110">
          <template #default="{ row }">{{ row.game.minPlayers }}–{{ row.game.maxPlayers }} 人</template>
        </el-table-column>
        <el-table-column label="单局时长" width="100">
          <template #default="{ row }">{{ row.game.durationMinutes }} 分钟</template>
        </el-table-column>
        <el-table-column label="在库" width="80">
          <template #default="{ row }">{{ row.game.stock }} 份</template>
        </el-table-column>
        <el-table-column label="不可选原因" min-width="240">
          <template #default="{ row }">
            <el-tag
              v-for="reason in row.reasons"
              :key="reason"
              type="danger"
              effect="plain"
              size="small"
              class="reason-tag"
            >
              {{ reason }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </template>
  </section>
</template>
