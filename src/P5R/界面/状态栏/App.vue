<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDataStore } from './store'

const store = useDataStore()

const info = computed(() => {
  const data = store.data || (window as any).mock_stat_data;
  const loc = data?.时间系统?.当前地点 ?? ''
  const slot = data?.时间系统?.时段 ?? ''
  const date = data?.时间系统?.日期 ?? ''
  const weather = data?.时间系统?.天气 ?? ''
  return { loc, slot, date, weather }
})

const view = ref('main')
const selectedRegion = ref('')
const selectedSpot = ref('')
const showMap = ref(false)

const toggleMap = () => {
  showMap.value = !showMap.value
  if (!showMap.value) {
    setTimeout(() => {
      view.value = 'main'
      selectedRegion.value = ''
      selectedSpot.value = ''
    }, 300)
  }
}

const mapData: Record<string, any> = {
  kichijoji: { label: '吉祥寺', x: 10, y: 18, spots: [{ id: 'darts', label: '飞镖俱乐部' }, { id: 'jazz', label: '爵士俱乐部' }, { id: 'temple', label: '寺庙' }] },
  ogikubo: { label: '荻洼', x: 20, y: 18, spots: [{ id: 'ramen', label: '拉面店' }] },
  nakano: { label: '中野', x: 30, y: 22, spots: [] },
  shinjuku: { label: '新宿', x: 35, y: 30, spots: [{ id: 'redlight', label: '欢乐街' }, { id: 'bar', label: '十字路口酒吧' }] },
  ichigaya: { label: '市谷', x: 45, y: 30, spots: [{ id: 'fishing', label: '钓鱼池' }] },
  suidobashi: { label: '水道桥', x: 60, y: 25, spots: [] },
  ueno: { label: '上野', x: 65, y: 15, spots: [{ id: 'museum', label: '美术馆' }] },
  asakusa: { label: '浅草·押上', x: 80, y: 15, spots: [{ id: 'skytree', label: '天空树' }] },
  akihabara: { label: '秋叶原', x: 75, y: 25, spots: [{ id: 'arcade', label: '游戏厅' }, { id: 'maid', label: '女仆咖啡厅' }] },
  kanda: { label: '神田', x: 80, y: 35, spots: [{ id: 'church', label: '教会' }] },
  maihama: { label: '舞滨', x: 95, y: 45, spots: [{ id: 'destiny', label: '命运乐园' }] },
  ginza: { label: '银座', x: 75, y: 55, spots: [{ id: 'sushi', label: '高级寿司店' }] },
  tsukishima: { label: '月岛', x: 90, y: 65, spots: [{ id: 'monja', label: '文字烧店' }] },
  jinbocho: { label: '神保町', x: 65, y: 40, spots: [{ id: 'bookstore', label: '古书店' }] },
  nagatacho: { label: '永田町', x: 55, y: 40, spots: [] },
  akasaka: { label: '赤坂见附', x: 55, y: 50, spots: [] },
  roppongi: { label: '六本木', x: 55, y: 60, spots: [] },
  aoyama: { label: '青山一丁目', x: 45, y: 45, spots: [{ id: 'shujin', label: '秀尽学园' }] },
  shibuya: { label: '涉谷', x: 35, y: 50, spots: [{ id: 'station', label: '站前广场' }, { id: 'central', label: '中央大街' }, { id: 'underground', label: '地下通道' }, { id: 'hideout', label: '秘密基地' }] },
  harajuku: { label: '原宿', x: 30, y: 40, spots: [{ id: 'takeshita', label: '竹下通' }] },
  meiji: { label: '明治神宫前', x: 20, y: 40, spots: [{ id: 'shrine', label: '明治神宫' }] },
  inokashira: { label: '井之头公园', x: 10, y: 45, spots: [{ id: 'park', label: '公园' }] },
  yongen: { label: '四轩茶屋', x: 15, y: 60, spots: [{ id: 'leblanc', label: '卢布朗' }, { id: 'clinic', label: '诊所' }, { id: 'laundromat', label: '投币洗衣店' }, { id: 'batting', label: '击球中心' }] },
  shinagawa: { label: '品川', x: 45, y: 70, spots: [{ id: 'aquarium', label: '水族馆' }] },
  motomachi: { label: '元町中华街', x: 10, y: 85, spots: [{ id: 'chinatown', label: '中华街' }] },
  miura: { label: '三浦海岸', x: 40, y: 90, spots: [{ id: 'beach', label: '海滨' }] },
  odaiba: { label: '台场海滨公园', x: 80, y: 85, spots: [{ id: 'ferris', label: '摩天轮' }] }
}

const regions = Object.keys(mapData).map(k => ({ id: k, ...mapData[k] }))

const lines = [
  // Inokashira / Ginza line approx
  { path: 'M 10 18 L 20 18 L 30 22 L 35 30 L 45 30 L 60 25 L 75 25 L 80 35 L 75 55', color: '#ffb300' },
  // Den-en-toshi approx
  { path: 'M 15 60 L 35 50 L 45 45 L 55 50', color: '#00e5ff' },
  // Others
  { path: 'M 35 50 L 30 40 L 20 40', color: '#8bc34a' },
  { path: 'M 35 30 L 35 50 L 45 70 L 40 90', color: '#d500f9' },
  { path: 'M 60 25 L 65 40 L 55 40 L 45 45 L 55 60', color: '#f44336' },
  { path: 'M 65 15 L 80 15', color: '#ff9800' },
  { path: 'M 75 55 L 90 65 L 80 85', color: '#03a9f4' }
]

const currentActiveRegion = computed(() => {
  const loc = info.value.loc
  for (const [key, region] of Object.entries(mapData)) {
    if (loc.includes(region.label) || (region.label === '四轩茶屋' && loc.includes('四軒茶屋'))) {
      return key
    }
  }
  return ''
})

const currentActiveSpot = computed(() => {
  const loc = info.value.loc
  const region = mapData[currentActiveRegion.value]
  if (!region) return ''
  for (const spot of region.spots) {
    if (loc.includes(spot.label)) return spot.id
  }
  return ''
})

const openSubMap = (regionId: string) => {
  selectedRegion.value = regionId
  selectedSpot.value = ''
  view.value = 'sub'
}

const selectSpot = (spotId: string) => {
  selectedSpot.value = spotId
}

const goBack = () => {
  view.value = 'main'
  selectedRegion.value = ''
  selectedSpot.value = ''
}

const travel = () => {
  if (!selectedRegion.value) return;
  let targetLocation = `东京·${mapData[selectedRegion.value].label}`
  if (selectedSpot.value) {
    const spot = mapData[selectedRegion.value].spots.find((s: any) => s.id === selectedSpot.value)
    if (spot) {
      targetLocation += `·${spot.label}`
    }
  }

  const dataTarget = store.data || (window as any).mock_stat_data;
  if (dataTarget?.时间系统) {
    dataTarget.时间系统.当前地点 = targetLocation
  }

  if (typeof (window as any).updateVariablesWith === 'function' && typeof (window as any).getVariables === 'function') {
    (window as any).updateVariablesWith((vars: any) => {
      if (!vars.stat_data) vars.stat_data = {}
      if (!vars.stat_data.时间系统) vars.stat_data.时间系统 = {}
      vars.stat_data.时间系统.当前地点 = targetLocation
      return vars
    }, { type: 'message', message_id: (window as any).getCurrentMessageId?.() ?? -1 })
  }

  toggleMap()
}

// Map Zoom & Pan State
const mapScale = ref(1)
const mapPanX = ref(0)
const mapPanY = ref(0)

const zoomIn = () => { mapScale.value = Math.min(3, mapScale.value + 0.2) }
const zoomOut = () => { mapScale.value = Math.max(0.5, mapScale.value - 0.2) }

const onWheel = (e: WheelEvent) => {
  e.preventDefault()
  const delta = e.deltaY < 0 ? 0.1 : -0.1
  mapScale.value = Math.max(0.5, Math.min(3, mapScale.value + delta))
}

let isDragging = false
let startX = 0, startY = 0

const onMouseDown = (e: MouseEvent) => {
  isDragging = true
  startX = e.clientX - mapPanX.value
  startY = e.clientY - mapPanY.value
}
const onMouseMove = (e: MouseEvent) => {
  if (!isDragging) return
  mapPanX.value = e.clientX - startX
  mapPanY.value = e.clientY - startY
}
const onMouseUp = () => { isDragging = false }
const onMouseLeave = () => { isDragging = false }

let initialPinchDistance = 0
let initialScale = 1

const onTouchStart = (e: TouchEvent) => {
  if (e.touches.length === 1) {
    isDragging = true
    startX = e.touches[0].clientX - mapPanX.value
    startY = e.touches[0].clientY - mapPanY.value
  } else if (e.touches.length === 2) {
    isDragging = false
    initialPinchDistance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    initialScale = mapScale.value
  }
}
const onTouchMove = (e: TouchEvent) => {
  if (e.touches.length === 1 && isDragging) {
    mapPanX.value = e.touches[0].clientX - startX
    mapPanY.value = e.touches[0].clientY - startY
  } else if (e.touches.length === 2) {
    const distance = Math.hypot(
      e.touches[0].clientX - e.touches[1].clientX,
      e.touches[0].clientY - e.touches[1].clientY
    )
    const delta = distance / initialPinchDistance
    mapScale.value = Math.max(0.5, Math.min(3, initialScale * delta))
  }
}
const onTouchEnd = (e: TouchEvent) => {
  if (e.touches.length < 2) {
    initialPinchDistance = 0
  }
  if (e.touches.length === 0) {
    isDragging = false
  }
}

</script>

<template>
  <div class="p5r-status-bar">
    <!-- Header Status Panel -->
    <div class="status-panel" @click="toggleMap">
      <div class="date-weather">
        <span class="date">{{ info.date || '----/--/--' }}</span>
        <span class="weather" v-if="info.weather">☁ {{ info.weather }}</span>
      </div>
      <div class="location-slot">
        <div class="location">
          <span class="icon">📍</span> {{ info.loc || 'Unknown Location' }}
        </div>
        <div class="slot">{{ info.slot || '---' }}</div>
      </div>
      <div class="toggle-icon">{{ showMap ? '▲' : '▼' }}</div>
    </div>

    <!-- Map View Panel -->
    <div class="map-container" :class="{ 'is-open': showMap }">
      <!-- Main Tokyo Map -->
      <div 
        class="map-area" 
        v-if="view === 'main'"
        @wheel="onWheel"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @touchstart="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <!-- Map Control Buttons -->
        <div class="map-controls">
          <button @click.stop="zoomIn" class="zoom-btn">+</button>
          <button @click.stop="zoomOut" class="zoom-btn">-</button>
        </div>

        <div class="map-inner" :style="{ transform: `translate(${mapPanX}px, ${mapPanY}px) scale(${mapScale})` }">
          <svg class="map-lines" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              v-for="(line, idx) in lines"
              :key="idx"
              :d="line.path"
              :stroke="line.color"
              stroke-width="1.5"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="line-path"
            />
          </svg>

          <div
            v-for="r in regions"
            :key="r.id"
            class="spot"
            :class="{ active: currentActiveRegion === r.id }"
            :style="{ left: r.x + '%', top: r.y + '%' }"
            @click.stop="openSubMap(r.id)"
          >
            <div class="spot-icon">
              <div class="spot-core"></div>
              <div class="spot-pulse" v-if="currentActiveRegion === r.id"></div>
            </div>
            <div class="spot-label">
              <span class="label-bg">{{ r.label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Sub Map (Specific Region) -->
      <div class="submap-area" v-if="view === 'sub' && selectedRegion">
        <div class="submap-header">
          <button class="back-btn" @click.stop="goBack">◀ 返回</button>
          <h2 class="submap-title">{{ mapData[selectedRegion].label }}</h2>
        </div>
        
        <div class="submap-spots">
          <div 
            v-for="spot in mapData[selectedRegion].spots" 
            :key="spot.id"
            class="submap-spot-item"
            :class="{ 
              'selected': selectedSpot === spot.id,
              'active': currentActiveRegion === selectedRegion && currentActiveSpot === spot.id
            }"
            @click.stop="selectSpot(spot.id)"
          >
            <div class="spot-indicator"></div>
            <span class="spot-name">{{ spot.label }}</span>
            <span class="current-badge" v-if="currentActiveRegion === selectedRegion && currentActiveSpot === spot.id">当前位置</span>
          </div>
        </div>

        <div class="submap-footer">
          <button class="go-btn" @click.stop="travel">前往</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Anton&family=Noto+Sans+JP:wght@700;900&display=swap');

.p5r-status-bar {
  --p5-red: #E60012;
  --p5-black: #111111;
  --p5-white: #F8F8F8;
  --p5-yellow: #FFD700;
  
  font-family: 'Noto Sans JP', sans-serif;
  background: var(--p5-black);
  border: 3px solid var(--p5-white);
  box-shadow: 8px 8px 0px rgba(230, 0, 18, 0.8), 0 0 20px rgba(0,0,0,0.5);
  border-radius: 4px;
  width: 100%;
  max-width: 400px;
  margin: 10px auto;
  overflow: hidden;
  color: var(--p5-white);
  position: relative;
  z-index: 1000;
  transform: skewX(-2deg);
}

.status-panel {
  background: var(--p5-red);
  padding: 12px 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-image: 
    linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%),
    linear-gradient(45deg, rgba(0,0,0,0.1) 25%, transparent 25%, transparent 75%, rgba(0,0,0,0.1) 75%);
  background-size: 10px 10px;
  background-position: 0 0, 5px 5px;
}

.status-panel:hover {
  filter: brightness(1.1);
}

.date-weather {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: 'Anton', sans-serif;
  font-size: 1.2rem;
  letter-spacing: 1px;
  text-shadow: 2px 2px 0 #000;
}

.date { color: var(--p5-white); }
.weather { color: var(--p5-yellow); }

.location-slot {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--p5-black);
  padding: 6px 12px;
  border-radius: 2px;
  transform: skewX(5deg);
  box-shadow: inset 0 0 10px rgba(0,0,0,0.8);
}

.location {
  font-weight: 900;
  font-size: 1rem;
  color: var(--p5-white);
  letter-spacing: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slot {
  font-weight: 900;
  color: var(--p5-red);
  background: var(--p5-white);
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 0.9rem;
  transform: skewX(-10deg);
}

.toggle-icon {
  position: absolute;
  right: 16px;
  top: 14px;
  font-size: 0.8rem;
  color: rgba(255,255,255,0.5);
}

/* Map View */
.map-container {
  height: 0;
  opacity: 0;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  background: #B21010;
}

.map-container.is-open {
  height: 280px;
  opacity: 1;
  border-top: 4px solid var(--p5-black);
}

.map-area, .submap-area {
  position: relative;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(circle at center, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.3) 100%);
  cursor: grab;
}

.map-area:active {
  cursor: grabbing;
}

.map-inner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-origin: center center;
  transition: transform 0.1s linear;
}

.map-controls {
  position: absolute;
  bottom: 10px;
  right: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  z-index: 100;
}

.zoom-btn {
  width: 30px;
  height: 30px;
  background: rgba(17,17,17,0.8);
  color: var(--p5-white);
  border: 2px solid var(--p5-red);
  border-radius: 4px;
  font-weight: 900;
  font-size: 1.2rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: skewX(-10deg);
}

.zoom-btn:hover {
  background: var(--p5-red);
}

.map-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

.line-path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: drawLine 1s forwards ease-out;
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

.spot {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 2;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: transform 0.2s;
}

.spot:hover {
  transform: translate(-50%, -50%) scale(1.2);
  z-index: 10;
}

.spot-icon {
  position: relative;
  width: 16px;
  height: 16px;
  margin-bottom: 4px;
}

.spot-core {
  width: 100%;
  height: 100%;
  background: var(--p5-white);
  border: 3px solid var(--p5-black);
  border-radius: 50%;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  transition: all 0.2s;
}

.spot:hover .spot-core {
  background: var(--p5-red);
}

.spot.active .spot-core {
  background: var(--p5-yellow);
  transform: scale(1.3);
  border-color: var(--p5-black);
}

.spot-pulse {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(255, 215, 0, 0.4);
  border-radius: 50%;
  z-index: 1;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}

.spot-label {
  font-weight: 900;
  font-size: 0.75rem;
  letter-spacing: 1px;
  transform: skewX(-5deg) rotate(-5deg);
}

.label-bg {
  background: var(--p5-black);
  color: var(--p5-white);
  padding: 2px 6px;
  box-shadow: 2px 2px 0 rgba(0,0,0,0.3);
  transition: all 0.2s;
}

.spot:hover .label-bg {
  background: var(--p5-white);
  color: var(--p5-black);
  box-shadow: 2px 2px 0 var(--p5-red);
}

.spot.active .label-bg {
  background: var(--p5-white);
  color: var(--p5-black);
  font-size: 0.85rem;
  box-shadow: 3px 3px 0 var(--p5-red);
}

/* Sub Map Styles */
.submap-area {
  display: flex;
  flex-direction: column;
  padding: 15px;
  background: var(--p5-black);
  background-image: 
    linear-gradient(45deg, rgba(230,0,18,0.1) 25%, transparent 25%, transparent 75%, rgba(230,0,18,0.1) 75%),
    linear-gradient(45deg, rgba(230,0,18,0.1) 25%, transparent 25%, transparent 75%, rgba(230,0,18,0.1) 75%);
  background-size: 14px 14px;
  background-position: 0 0, 7px 7px;
}

.submap-header {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.back-btn {
  background: var(--p5-white);
  color: var(--p5-black);
  border: none;
  font-weight: 900;
  padding: 4px 10px;
  cursor: pointer;
  transform: skewX(-10deg);
  box-shadow: 2px 2px 0 var(--p5-red);
  margin-right: 15px;
}

.back-btn:hover {
  background: var(--p5-yellow);
}

.submap-title {
  color: var(--p5-white);
  margin: 0;
  font-size: 1.5rem;
  font-weight: 900;
  text-shadow: 2px 2px 0 var(--p5-red);
  transform: skewX(-5deg);
}

.submap-spots {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 5px;
}

.submap-spot-item {
  display: flex;
  align-items: center;
  background: rgba(255,255,255,0.1);
  padding: 10px 15px;
  cursor: pointer;
  border-left: 4px solid transparent;
  transition: all 0.2s;
  position: relative;
}

.submap-spot-item:hover {
  background: rgba(230,0,18,0.3);
  border-left-color: var(--p5-red);
}

.submap-spot-item.selected {
  background: var(--p5-red);
  border-left-color: var(--p5-white);
}

.spot-indicator {
  width: 10px;
  height: 10px;
  background: var(--p5-white);
  transform: rotate(45deg);
  margin-right: 12px;
}

.submap-spot-item.active .spot-indicator {
  background: var(--p5-yellow);
  box-shadow: 0 0 8px var(--p5-yellow);
}

.spot-name {
  font-size: 1.1rem;
  font-weight: 700;
}

.current-badge {
  position: absolute;
  right: 10px;
  background: var(--p5-yellow);
  color: var(--p5-black);
  font-size: 0.7rem;
  font-weight: 900;
  padding: 2px 6px;
  border-radius: 2px;
  transform: skewX(-10deg);
}

.submap-footer {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.go-btn {
  background: var(--p5-red);
  color: var(--p5-white);
  border: 2px solid var(--p5-white);
  padding: 8px 24px;
  font-size: 1.2rem;
  font-weight: 900;
  cursor: pointer;
  transform: skewX(-10deg);
  box-shadow: 4px 4px 0 rgba(0,0,0,0.5);
  transition: all 0.2s;
}

.go-btn:hover {
  background: var(--p5-white);
  color: var(--p5-red);
  border-color: var(--p5-red);
  transform: skewX(-10deg) scale(1.05);
}
</style>
