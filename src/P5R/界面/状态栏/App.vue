<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore } from './store'

const store = useDataStore()

const info = computed(() => {
  const loc = store.stat_data?.时间系统?.当前地点 ?? ''
  const slot = store.stat_data?.时间系统?.时段 ?? ''
  return { loc, slot }
})

const activeId = computed(() => {
  const loc = (store.stat_data?.时间系统?.当前地点 ?? '').toLowerCase()
  if (loc.includes('四轩茶屋')) return 'yongen'
  if (loc.includes('涉谷') || loc.includes('渋谷')) return 'shibuya'
  if (loc.includes('秀尽') || loc.includes('学园')) return 'shujin'
  if (loc.includes('吉祥寺')) return 'kichijoji'
  if (loc.includes('新宿')) return 'shinjuku'
  if (loc.includes('印象空间')) return 'mementos'
  return ''
})

const regions = [
  { id: 'yongen', label: '四轩茶屋', x: 20, y: 50 },
  { id: 'shibuya', label: '涉谷', x: 38, y: 54 },
  { id: 'shujin', label: '秀尽学园', x: 52, y: 36 },
  { id: 'kichijoji', label: '吉祥寺', x: 12, y: 28 },
  { id: 'shinjuku', label: '新宿', x: 40, y: 20 },
  { id: 'mementos', label: '印象空间', x: 72, y: 72 },
]
</script>

<template>
  <div class="map">
    <div class="map-title">TOKYO</div>
    <div class="map-area">
      <div
        v-for="r in regions"
        :key="r.id"
        class="spot"
        :class="{ active: activeId === r.id }"
        :style="{ left: r.x + '%', top: r.y + '%' }"
      >
        <div class="spot-dot"></div>
        <div class="spot-label">{{ r.label }}</div>
      </div>
    </div>
    <div class="map-foot">
      {{ info.loc ? info.loc + '  ·  ' + info.slot : '...' }}
    </div>
  </div>
</template>

<style scoped>
.map {
  background: linear-gradient(170deg, #0a0a0a 0%, #1a0000 40%, #0d0d0d 100%);
  border: 2px solid var(--c-primary);
  border-radius: 4px;
  padding: 10px;
  min-width: 240px;
  min-height: 180px;
  box-shadow: 0 0 20px rgba(230, 0, 18, 0.2);
  color: var(--c-text);
}

.map-title {
  text-align: center;
  font-size: 0.8em;
  font-weight: 900;
  letter-spacing: 2px;
  color: var(--c-primary);
  margin-bottom: 6px;
}

.map-area {
  position: relative;
  width: 100%;
  padding-bottom: 60%;
  border: 1px solid var(--c-border);
  background:
    repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(230,0,18,0.03) 19px, rgba(230,0,18,0.03) 20px),
    repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(230,0,18,0.03) 19px, rgba(230,0,18,0.03) 20px);
}

.spot {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}
.spot:hover {
  transform: translate(-50%, -50%) scale(1.12);
}

.spot-dot {
  width: 6px;
  height: 6px;
  background: rgba(230, 0, 18, 0.3);
  border: 1px solid rgba(230, 0, 18, 0.4);
  border-radius: 50%;
  margin: 0 auto 2px;
  transition: all 0.3s;
}

.spot.active .spot-dot {
  width: 12px;
  height: 12px;
  background: var(--c-primary);
  box-shadow: 0 0 10px rgba(230, 0, 18, 0.7), 0 0 20px rgba(230, 0, 18, 0.3);
  border: 2px solid var(--c-accent);
}

.spot-label {
  font-size: 0.6em;
  color: var(--c-text-muted);
  letter-spacing: 0.5px;
  transition: color 0.3s;
}

.spot.active .spot-label {
  color: var(--c-primary);
  font-weight: 700;
}

.map-foot {
  margin-top: 6px;
  text-align: center;
  font-size: 0.65em;
  color: var(--c-text-muted);
  letter-spacing: 0.5px;
}
</style>
