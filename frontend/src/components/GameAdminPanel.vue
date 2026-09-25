<script setup lang="ts">
import { reactive, ref } from "vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { createGame, updateGame } from "../api/client";
import { REQUEST_MESSAGES } from "../constants/messages";
import type { GameItem, GamePayload } from "../types";

defineProps<{ games: GameItem[] }>();

const emit = defineEmits<{ changed: [] }>();

const categories = ["策略", "聚会", "角色扮演", "卡牌"];

const dialogVisible = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const formRef = ref<FormInstance>();

const emptyForm: GamePayload = {
  name: "",
  category: "策略",
  minPlayers: 2,
  maxPlayers: 4,
  durationMinutes: 60,
  difficulty: 2,
  totalCopies: 1,
  stock: 1,
  description: "",
};

const form = reactive<GamePayload>({ ...emptyForm });

const rules: FormRules = {
  name: [{ required: true, message: "请输入名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择类型", trigger: "change" }],
  maxPlayers: [
    {
      validator: (_rule, value: number, callback) => {
        if (value < form.minPlayers) {
          callback(new Error("最多人数不能小于最少人数"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
  stock: [
    {
      validator: (_rule, value: number, callback) => {
        if (value > form.totalCopies) {
          callback(new Error("在库份数不能大于总份数"));
        } else {
          callback();
        }
      },
      trigger: "change",
    },
  ],
};

function openCreate() {
  editingId.value = null;
  Object.assign(form, emptyForm);
  dialogVisible.value = true;
}

function openEdit(game: GameItem) {
  editingId.value = game.id;
  Object.assign(form, {
    name: game.name,
    category: game.category,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    durationMinutes: game.durationMinutes,
    difficulty: game.difficulty,
    totalCopies: game.totalCopies,
    stock: game.stock,
    description: game.description,
  });
  dialogVisible.value = true;
}

async function save() {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await updateGame(editingId.value, { ...form });
    } else {
      await createGame({ ...form });
    }
    ElMessage.success(REQUEST_MESSAGES.gameSaved);
    dialogVisible.value = false;
    emit("changed");
  } catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "保存失败");
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <section class="work-panel">
    <header class="panel-head">
      <h2>桌游库管理（管理员）</h2>
      <el-button type="primary" size="small" @click="openCreate">新增桌游</el-button>
    </header>
    <el-table :data="games" size="large" style="width: 100%">
      <el-table-column prop="name" label="名称" min-width="130" />
      <el-table-column prop="category" label="类型" width="110" />
      <el-table-column label="适合人数" width="110">
        <template #default="{ row }">{{ row.minPlayers }}–{{ row.maxPlayers }} 人</template>
      </el-table-column>
      <el-table-column label="单局时长" width="100">
        <template #default="{ row }">{{ row.durationMinutes }} 分钟</template>
      </el-table-column>
      <el-table-column prop="difficulty" label="难度" width="70" />
      <el-table-column label="在库 / 总份数" width="130">
        <template #default="{ row }">
          <el-tag :type="row.stock > 0 ? 'success' : 'danger'" effect="plain" size="small">
            {{ row.stock }} / {{ row.totalCopies }} 份
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="简介" min-width="180" show-overflow-tooltip />
      <el-table-column label="操作" width="90">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑桌游' : '新增桌游'"
      width="min(560px, 92vw)"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="92px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" maxlength="60" />
        </el-form-item>
        <el-form-item label="类型" prop="category">
          <el-select v-model="form.category" style="width: 180px">
            <el-option v-for="item in categories" :key="item" :value="item" :label="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="适合人数">
          <el-input-number v-model="form.minPlayers" :min="1" :max="30" />
          <span class="range-sep">至</span>
          <el-form-item prop="maxPlayers" class="inline-field" label-width="0">
            <el-input-number v-model="form.maxPlayers" :min="1" :max="30" />
          </el-form-item>
        </el-form-item>
        <el-form-item label="单局时长">
          <el-input-number v-model="form.durationMinutes" :min="5" :max="720" :step="5" />
          <span class="range-sep">分钟</span>
        </el-form-item>
        <el-form-item label="难度">
          <el-rate v-model="form.difficulty" :max="5" />
        </el-form-item>
        <el-form-item label="总份数">
          <el-input-number v-model="form.totalCopies" :min="0" :max="99" />
        </el-form-item>
        <el-form-item label="在库份数" prop="stock">
          <el-input-number v-model="form.stock" :min="0" :max="99" />
        </el-form-item>
        <el-form-item label="简介">
          <el-input v-model="form.description" type="textarea" :rows="2" maxlength="300" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </section>
</template>
