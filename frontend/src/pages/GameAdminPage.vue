<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { ElMessage } from "element-plus";
import { createGame, fetchGames, updateGame } from "../api/client";
import type { Game, GameCategory, GameInput } from "../types";

const games = ref<Game[]>([]);
const loading = ref(true);

const categories: GameCategory[] = ["策略", "聚会", "卡牌", "角色扮演"];
const difficulties = [
  { value: 1, label: "1 入门" },
  { value: 2, label: "2 轻度" },
  { value: 3, label: "3 中等" },
  { value: 4, label: "4 进阶" },
  { value: 5, label: "5 硬核" },
];

const dialogVisible = ref(false);
const editingId = ref<string | null>(null);
const submitting = ref(false);
const form = reactive<GameInput>({
  name: "",
  category: "策略",
  minPlayers: 2,
  maxPlayers: 4,
  durationMinutes: 30,
  difficulty: 2,
  totalStock: 1,
  intro: "",
});

function resetForm() {
  editingId.value = null;
  form.name = "";
  form.category = "策略";
  form.minPlayers = 2;
  form.maxPlayers = 4;
  form.durationMinutes = 30;
  form.difficulty = 2;
  form.totalStock = 1;
  form.intro = "";
}

function openCreate() {
  resetForm();
  dialogVisible.value = true;
}

function openEdit(game: Game) {
  editingId.value = game.id;
  form.name = game.name;
  form.category = game.category;
  form.minPlayers = game.minPlayers;
  form.maxPlayers = game.maxPlayers;
  form.durationMinutes = game.durationMinutes;
  form.difficulty = game.difficulty;
  form.totalStock = game.totalStock;
  form.intro = game.intro;
  dialogVisible.value = true;
}

async function submit() {
  if (!form.name.trim()) {
    ElMessage.warning("请填写桌游名称");
    return;
  }
  if (form.minPlayers > form.maxPlayers) {
    ElMessage.warning("最少人数不能大于最多人数");
    return;
  }
  submitting.value = true;
  try {
    if (editingId.value) {
      await updateGame(editingId.value, { ...form });
      ElMessage.success("桌游信息已更新");
    } else {
      await createGame({ ...form });
      ElMessage.success("桌游已入库");
    }
    dialogVisible.value = false;
    await load();
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    submitting.value = false;
  }
}

async function load() {
  loading.value = true;
  try {
    const data = await fetchGames();
    games.value = data.games;
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "桌游库加载失败");
  } finally {
    loading.value = false;
  }
}

function stockType(game: Game) {
  if (game.totalStock === 0) return "info";
  if (game.availableStock === 0) return "danger";
  return "success";
}

onMounted(load);
</script>

<template>
  <section class="page">
    <div class="page-head">
      <div>
        <h2>桌游库管理</h2>
        <p>维护适合人数、单局时长、难度和在库总份数；在库份数 = 总份数 − 进行中开桌数。</p>
      </div>
      <el-button type="primary" @click="openCreate">录入桌游</el-button>
    </div>

    <el-table :data="games" v-loading="loading" border stripe class="game-table">
      <el-table-column prop="name" label="名称" min-width="140" />
      <el-table-column prop="category" label="类型" width="90" />
      <el-table-column label="适合人数" width="110">
        <template #default="{ row }">{{ row.minPlayers }}-{{ row.maxPlayers }} 人</template>
      </el-table-column>
      <el-table-column label="单局时长" width="100">
        <template #default="{ row }">{{ row.durationMinutes }} 分钟</template>
      </el-table-column>
      <el-table-column label="难度" width="110">
        <template #default="{ row }">
          <el-rate :model-value="row.difficulty" disabled />
        </template>
      </el-table-column>
      <el-table-column label="在库份数" width="150">
        <template #default="{ row }">
          <el-tag :type="stockType(row)" size="large">
            {{ row.availableStock }} / {{ row.totalStock }}
          </el-tag>
          <span v-if="row.openCount > 0" class="open-hint">已开 {{ row.openCount }} 桌</span>
        </template>
      </el-table-column>
      <el-table-column prop="intro" label="简介" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="90" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑桌游' : '录入桌游'"
      width="520px"
    >
      <el-form label-width="92px">
        <el-form-item label="名称" required>
          <el-input v-model="form.name" placeholder="如：璀璨宝石" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.category">
            <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="适合人数">
          <div class="inline-range">
            <el-input-number v-model="form.minPlayers" :min="1" :max="20" />
            <span>至</span>
            <el-input-number v-model="form.maxPlayers" :min="1" :max="20" />
            <span>人</span>
          </div>
        </el-form-item>
        <el-form-item label="单局时长">
          <el-input-number v-model="form.durationMinutes" :min="1" :max="600" :step="15" />
          <span class="field-hint">分钟</span>
        </el-form-item>
        <el-form-item label="难度">
          <el-select v-model="form.difficulty" style="width: 150px">
            <el-option v-for="d in difficulties" :key="d.value" :label="d.label" :value="d.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="在库总份数">
          <el-input-number v-model="form.totalStock" :min="0" :max="999" />
          <span class="field-hint">份（缺货填 0）</span>
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.intro" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
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

.open-hint {
  margin-left: 8px;
  font-size: 12px;
  color: #cf5c36;
}

.inline-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-hint {
  margin-left: 10px;
  color: #667085;
}
</style>
