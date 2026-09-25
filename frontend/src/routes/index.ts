import { createRouter, createWebHistory } from "vue-router";
import OverviewPage from "../pages/OverviewPage.vue";
import PickGamePage from "../pages/PickGamePage.vue";
import GameAdminPage from "../pages/GameAdminPage.vue";
import TablesPage from "../pages/TablesPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", component: OverviewPage, meta: { title: "运营总览" } },
    { path: "/pick", component: PickGamePage, meta: { title: "现场选游" } },
    { path: "/games", component: GameAdminPage, meta: { title: "桌游库管理" } },
    { path: "/tables", component: TablesPage, meta: { title: "桌台流水" } },
  ],
});

export const navItems = [
  { path: "/", label: "运营总览" },
  { path: "/pick", label: "现场选游" },
  { path: "/games", label: "桌游库管理" },
  { path: "/tables", label: "桌台流水" },
];
