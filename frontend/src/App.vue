<script setup lang="ts">
import { RouterLink, RouterView } from "vue-router";
import { APP_CODE, APP_NAME } from "./constants/app";
import { navItems } from "./routes";
</script>

<template>
  <main class="app-shell">
    <header class="topbar">
      <div class="brand">
        <span class="brand-code">{{ APP_CODE }}</span>
        <h1 class="brand-title">{{ APP_NAME }}</h1>
      </div>
      <nav class="nav">
        <RouterLink v-for="item in navItems" :key="item.path" :to="item.path" class="nav-link">
          {{ item.label }}
        </RouterLink>
      </nav>
    </header>
    <section class="workspace">
      <RouterView />
    </section>
  </main>
</template>

<style scoped>
.brand {
  display: flex;
  flex-direction: column;
}

.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.nav-link {
  padding: 8px 16px;
  border-radius: 999px;
  color: #19212e;
  text-decoration: none;
  font-weight: 700;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: color-mix(in srgb, #3268b8 12%, white);
}

.nav-link.router-link-active {
  background: #3268b8;
  color: #fff;
}

@media (max-width: 860px) {
  .nav {
    width: 100%;
  }
}
</style>
