<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick } from 'vue'

// ---- 状态 ----
const view = ref<'start'|'game'>('start')
const mode = ref('Joker')
const jokerName = ref('雨宫莲')
const customName = ref('')
const customGender = ref('男')
const startPhase = ref('序章')
const msg = ref('')
const fullscreen = ref(false)
const showCoop = ref(true)
const showSum = ref(false)
const showMem = ref(false)
const sumResult = ref('')
const ci = ref('')
const curPage = ref(-1)
const stateSnap = ref<any>(null)
const pollTimer = ref<any>(null)

const state = reactive<any>({})
const pages = reactive<Array<{userAction:string, aiResponse:string}>>([])

const MEM_KEY = 'p5r_mem'
const mem = reactive({
  autoSummary: true, interval: 15, count: 0,
  facts: [] as string[], events: [] as string[],
  history: [] as string[], summaries: [] as string[],
  pending: false
})

// ---- 地图数据 ----
const mapData: Record<string,any> = {
  yongen:{label:'四轩茶屋',x:15,y:62,subs:[{id:'alley',label:'小巷',spots:[{id:'leblanc',label:'卢布朗'},{id:'clinic',label:'诊所'},{id:'bathhouse',label:'澡堂'}]}]},
  shibuya:{label:'涉谷',x:35,y:50,subs:[{id:'station',label:'站前广场'},{id:'central',label:'中央大街'},{id:'underground',label:'地下通道'}]},
  aoyama:{label:'青山一丁目',x:45,y:45,subs:[{id:'shujin_1f',label:'秀尽学园一楼',spots:[{id:'courtyard',label:'中庭'},{id:'nurse_office',label:'医务室'}]},{id:'shujin_2f',label:'秀尽学园二楼',spots:[{id:'class_2d',label:'教室2-D'}]},{id:'shujin_3f',label:'秀尽学园三楼',spots:[{id:'library',label:'图书室'},{id:'rooftop',label:'天台'}]}]},
  shinjuku:{label:'新宿',x:35,y:30,subs:[{id:'shinjuku_main',label:'新宿',spots:[{id:'redlight',label:'欢乐街'}]}]},
  akihabara:{label:'秋叶原',x:75,y:25,subs:[{id:'akihabara_main',label:'秋叶原',spots:[{id:'arcade',label:'游戏厅'}]}]},
  kanda:{label:'神田',x:80,y:35,subs:[{id:'kanda_main',label:'神田',spots:[{id:'church',label:'教会'}]}]},
  ginza:{label:'银座',x:75,y:55,subs:[{id:'ginza_main',label:'银座',spots:[]}]},
  ueno:{label:'上野',x:65,y:15,subs:[{id:'ueno_main',label:'上野',spots:[]}]},
  ichigaya:{label:'市谷',x:45,y:30,subs:[{id:'ichigaya_main',label:'市谷',spots:[{id:'fishing',label:'钓鱼池'}]}]},
  kichijoji:{label:'吉祥寺',x:10,y:18,subs:[{id:'kichijoji_main',label:'吉祥寺',spots:[{id:'darts',label:'飞镖俱乐部'}]}]},
  odaiba:{label:'台场',x:80,y:85,subs:[{id:'odaiba_main',label:'台场',spots:[{id:'ferris',label:'摩天轮'}]}]},
  motomachi:{label:'元町中华街',x:10,y:85,subs:[{id:'motomachi_main',label:'元町中华街',spots:[]}]}
}
const mapLines = [
  {d:'M10,18 L20,18 L30,22 L35,30 L45,30 L60,25 L75,25 L80,35 L75,55',c:'#ffb300'},
  {d:'M15,62 L35,50 L45,45 L55,50',c:'#00e5ff'},
  {d:'M35,30 L35,50 L45,70 L40,90',c:'#d500f9'},
  {d:'M60,25 L65,40 L55,40 L45,45 L55,60',c:'#f44336'}
]
const mapOpen = ref(false)
const mapScale = ref(1)
const mapView = ref('main')
const mapSel = ref('')
const mapSub = ref('')

// ---- computed ----
const mc = computed(() => state.主角信息 || {})
const ts = computed(() => state.时间系统 || {})
const pp = computed(() => state.剧情进度 || {})
const res = computed(() => state.资源 || {})
const hasST = computed(() => typeof (window as any).SillyTavern !== 'undefined')
const hasMemory = computed(() => mem.events.length > 0)
const loadInfo = computed(() => {
  const s = state, m = s.主角信息 || {}, t = s.时间系统 || {}, p = s.剧情进度 || {}
  return `🃏 ${m.姓名||'?'} | 📅 ${t.日期||'?'} | 📍 ${t.当前地点||'?'} | 📋 ${p.当前阶段||'?'}<br>📝 ${mem.facts.length}事实 ${mem.events.length}事件 ${mem.history.length}轮`
})
const activeRegion = computed(() => {
  const loc = ts.value.当前地点 || ''
  for (const k in mapData) { if (loc.includes(mapData[k].label)) return k }
  return ''
})
const partyList = computed(() => {
  const pt = state.怪盗团 || {}
  return ['坂本龙司','摩尔加纳','高卷杏','喜多川祐介','新岛真','佐仓双叶','奥村春'].map(nm => {
    const c = pt[nm] || {}; return {name:nm, present:c.在场状态==='在场', rel:c.关系||'陌生', coop:c.COOP等级||0}
  })
})
const coopList = computed(() => {
  const coop = state.COOP角色 || {}
  return ['佐仓惣治郎','武见妙','川上贞代','御船千早','三岛由辉','明智吾郎','岩井宗久','大宅一子','吉田寅之助','东乡一二三','织田信也','新岛冴','芳泽霞','丸喜拓人'].map(nm => {
    const c = coop[nm] || {}; return {name:nm, coop:c.COOP等级||0}
  })
})
const mapPlace = computed(() => { const p = (ts.value.当前地点||'').split('·'); return p[p.length-2] || '' })
const mapArea = computed(() => { const p = (ts.value.当前地点||'').split('·'); return p[p.length-1] || '' })

// ---- 工具 ----
const toast = (m:string) => { const t = document.createElement('div'); t.style.cssText = 'position:fixed;bottom:1rem;right:1rem;padding:.4rem .8rem;background:#E60012;color:#fff;font-size:.7rem;z-index:9999'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.remove(), 2500) }
const loadMem = () => { try { const r = localStorage.getItem(MEM_KEY); if (r) Object.assign(mem, JSON.parse(r)) } catch(e) {} }
const saveMem = () => { try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)) } catch(e) {} }
const loadState = () => {
  const ST = (window as any).SillyTavern
  if (ST?.chat) { for (let i = ST.chat.length-1; i>=0; i--) { const e = ST.chat[i]?.extra; if (e?.p5r_state) { Object.assign(state, e.p5r_state); return } } }
}
const saveState = () => {
  let mid = -1
  if (typeof (window as any).getCurrentMessageId === 'function') mid = (window as any).getCurrentMessageId()
  else if ((window as any).SillyTavern?.chat) mid = (window as any).SillyTavern.chat.length - 1
  if (mid >= 0 && (window as any).SillyTavern?.chat?.[mid]) {
    if (!(window as any).SillyTavern.chat[mid].extra) (window as any).SillyTavern.chat[mid].extra = {}
    ;(window as any).SillyTavern.chat[mid].extra.p5r_state = JSON.parse(JSON.stringify(state))
  }
}
const buildInit = () => {
  const mb = () => ({在场状态:'不在场',关系:'陌生',态度:'陌生',COOP等级:0,互动记录:{难忘事件:[],最近互动:''}})
  const mM = () => { const o:any = mb(); o.外貌特征={}; o.当前服装={上装:'',下装:'',鞋子:''}; o.效果状态={}; o.性经验={性交次数:0,性伴侣数:0,性癖好:[]}; o.生理状态={阴茎状态:'未勃起'}; return o }
  const mF = () => { const o:any = mM(); o.当前服装.内衣=''; o.当前服装.袜子=''; o.性经验={处女:true,性交次数:0,性伴侣数:0,初次对象:'',口交经验:'',性交经验:'',性癖好:[]}; o.生理状态={阴道润滑:'',乳头状态:'',阴蒂状态:'',子宫状态:''}; return o }
  const nm = mode.value === 'Joker' ? jokerName.value : (customName.value || '主角')
  const init:any = {
    主角信息:{身份:mode.value==='Joker'?'Joker':'自定义',姓名:nm,性别:mode.value==='Joker'?'男':customGender.value,年龄:16,外貌:'',性格:'',五维:{知识:1,勇气:1,灵巧:1,温柔:1,魅力:1}},
    时间系统:{日期:'2015年04月09日-星期四',时段:'放学后',天气:'阴',当前地点:'东京·四轩茶屋'},
    剧情进度:{当前阶段:startPhase.value,当前宫殿:'',截止日:'',攻略状态:'未开始',剩余天数:0,宫殿主结局:'未攻略',已触发主线事件:[]},
    资源:{金钱:0,道具:{}},日历:{临时:{},重复:{}},事件信号:[],
    怪盗团:{坂本龙司:mM(),摩尔加纳:mb(),高卷杏:mF(),喜多川祐介:mM(),新岛真:mF(),佐仓双叶:mF(),奥村春:mF()},
    COOP角色:(() => { const o:any = {}; ['明智吾郎','武见妙','川上贞代','御船千早','佐仓惣治郎','岩井宗久','大宅一子','三岛由辉','吉田寅之助','东乡一二三','织田信也','新岛冴','芳泽霞','丸喜拓人'].forEach(n => { o[n] = mb() }); o.佐仓惣治郎.在场状态='在场'; return o })()
  }
  return init
}

// ---- 游戏操作 ----
const startGame = () => {
  Object.assign(state, buildInit())
  view.value = 'game'; pages.length = 0; curPage.value = -1; saveState(); startPoll()
  Object.assign(mem, { autoSummary: mem.autoSummary, interval: mem.interval, count:0, facts:[], events:[], history:[], summaries:[], pending:false })
  mem.events.push('故事开始: '+state.主角信息.姓名+'抵达'+state.时间系统.当前地点); saveMem()
  toast('心之怪盗团，参上！')
}
const loadGame = () => { view.value = 'game'; pages.length = 0; curPage.value = -1; startPoll() }

const doAction = (action: string) => {
  pages.push({ userAction: action, aiResponse: '' }); curPage.value = -1
  stateSnap.value = JSON.parse(JSON.stringify(state))
  let ctx = ''
  if (mem.summaries.length > 0) ctx += '[摘要]\n' + mem.summaries.map(s => '- '+s).join('\n') + '\n\n'
  if (mem.facts.length > 0) ctx += '[事实]\n' + mem.facts.map(f => '- '+f).join('\n') + '\n\n'
  ctx += `[当前] ${ts.value.日期||''} ${ts.value.时段||''} ${ts.value.当前地点||''} 阶段:${pp.value.当前阶段||''}\n`
  if (pages.length > 1) { const prev = pages[pages.length-2]; if (prev?.aiResponse) { const tail = prev.aiResponse.slice(-500); ctx += '\n[上一轮结尾]\n' + tail + '\n' } }
  mem.count++
  if (mem.autoSummary && mem.count >= mem.interval) { mem.count = 0; mem.pending = true }
  let sumReq = mem.pending ? '\n\n[后台] 请在回复中用<summary>标签输出对话摘要。' : ''
  if (mem.pending) { mem.pending = false; saveMem() }
  saveMem()
  const isFirst = pages.length <= 1
  const prompt = (isFirst?'':'【请严格接续上一轮AI回复的结尾继续推进，不要重新开场】\n') + ctx + '\n[玩家行动] ' + action + '\n请根据以上前文推进剧情。回复末尾以JSONPatch格式包含<UpdateVariable>块更新变量。' + sumReq
  toast(action)
  const gen = (window as any).generate
  if (typeof gen === 'function') {
    gen({ user_input: prompt }).then((r:any) => handleResp(r, action)).catch((e:any) => toast('失败: '+e.message))
  } else if ((window as any).SillyTavern?.sendUserMessage) {
    (window as any).SillyTavern.sendUserMessage(prompt); toast('已发送')
  }
}

const handleResp = (resp: any, action: string) => {
  let text = typeof resp === 'string' ? resp : (resp?.message || resp?.text || '')
  if (!text) return
  const sm = text.match(/<summary>([\s\S]*?)<\/summary>/i)
  if (sm) { mem.summaries.push(sm[1].trim()); if (mem.summaries.length > 5) mem.summaries.shift(); text = text.replace(/<summary>[\s\S]*?<\/summary>/gi, ''); saveMem() }
  text = text.replace(/\[metacognition\][\s\S]*?(?:<\/thinking>|(?=<content>))/gi, '')
  text = text.replace(/```[\s\S]*?```/g, '')
  text = text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
  const um = text.match(/<UpdateVariable>([\s\S]*?)<\/UpdateVariable>/)
  let narrative = text
  if (um) { narrative = text.replace(/<UpdateVariable>[\s\S]*?<\/UpdateVariable>/, '').trim(); applyUpdate(um[1]) }
  const dm = narrative.match(/(\d{4}年\d{1,2}月\d{1,2}日)/)
  if (dm && !mem.facts.includes('时间: '+dm[1])) { mem.facts.push('时间: '+dm[1]); if (mem.facts.length > 20) mem.facts.shift() }
  if (narrative && pages.length > 0) { pages[pages.length-1].aiResponse = narrative; mem.history.push('玩家: '+action+' | AI: '+narrative.substring(0,150)+'...'); if (mem.history.length > 20) mem.history.shift() }
  saveState(); saveMem()
}

const applyUpdate = (ut: string) => {
  try {
    const jm = ut.match(/<JSONPatch>([\s\S]*?)<\/JSONPatch>/)
    if (jm) {
      JSON.parse(jm[1]).forEach((p:any) => {
        const path = p.path.replace(/^\//, '').replace(/\//g, '.')
        if (p.op === 'replace' || p.op === 'add') setPath(state, path, p.value)
        else if (p.op === 'delta') { const cur = getPath(state, path); setPath(state, path, (parseFloat(cur)||0) + (parseFloat(p.value)||0)) }
        else if (p.op === 'remove') delPath(state, path)
      })
    }
  } catch(e) {}
}
const getPath = (o:any, p:string) => p.split('.').reduce((ov:any, k) => ov?.[k], o)
const setPath = (o:any, p:string, v:any) => { const ks = p.split('.'), l = ks.pop()!, t = ks.reduce((ov:any, k) => { if (!ov[k]) ov[k] = {}; return ov[k] }, o); t[l] = v }
const delPath = (o:any, p:string) => { const ks = p.split('.'), l = ks.pop()!, t = ks.reduce((ov:any, k) => ov?.[k], o); if (t) delete t[l] }

const reroll = () => {
  if (pages.length === 0) return; const p = pages[pages.length-1]
  if (stateSnap.value) Object.assign(state, JSON.parse(JSON.stringify(stateSnap.value)))
  if (mem.history.length > 0) mem.history.pop(); p.aiResponse = ''; curPage.value = -1; doAction(p.userAction); toast('重roll中...')
}
const sendCustom = () => { const t = ci.value.trim(); if (!t) return; ci.value = ''; doAction(t) }
const startPoll = () => {
  if (pollTimer.value) clearInterval(pollTimer.value)
  const ST = (window as any).SillyTavern; if (!ST) return
  let last = ST.chat?.length || 0
  pollTimer.value = setInterval(() => {
    const cur = ST.chat?.length || 0
    if (cur !== last) { last = cur; loadState(); const lm = ST.chat[cur-1]; if (lm?.mes && !lm.is_user && pages.length > 0) { pages[pages.length-1].aiResponse = lm.mes } }
  }, 2000)
}
const clearPoll = () => { if (pollTimer.value) clearInterval(pollTimer.value) }

const doBigSum = () => {
  showMem.value = false; sumResult.value = '⏳ 生成大总结...'
  let p = '请完整总结以下全部剧情（500字以内）:\n\n对话历史:\n'
  mem.history.forEach(h => p += h + '\n')
  const gen = (window as any).generate
  if (typeof gen === 'function') { gen({user_input:p}).then((r:any) => { sumResult.value = typeof r==='string'?r:(r?.message||'') }) }
}
const doSmallSum = () => {
  showMem.value = false; sumResult.value = '⏳ 生成小总结...'
  let p = '请简要总结最近对话（200字以内）:\n'
  mem.history.slice(-5).forEach(h => p += h + '\n')
  const gen = (window as any).generate
  if (typeof gen === 'function') { gen({user_input:p}).then((r:any) => { sumResult.value = typeof r==='string'?r:(r?.message||'') }) }
}

// ---- 地图操作 ----
const toggleMap = () => { mapOpen.value = !mapOpen.value; mapView.value = 'main'; mapSel.value = '' }
const zoomMap = (d:number) => { mapScale.value = Math.max(.5, Math.min(3, mapScale.value + d*.2)) }
const openRegion = (k:string) => { mapSel.value = k; mapView.value = 'sub' }
const openSpot = (sid:string) => { mapSub.value = sid }
const travelTo = (rid:string, sid?:string, spotId?:string) => {
  const m = mapData[rid]; let loc = '东京·' + m.label
  if (sid) { const sub = m.subs.find((s:any) => s.id === sid); if (sub) { loc += '·' + sub.label; if (spotId) { const sp = sub.spots.find((s:any) => s.id === spotId); if (sp) loc += '·' + sp.label } } }
  if (!state.时间系统) state.时间系统 = {}; state.时间系统.当前地点 = loc; saveState()
  toast('前往: ' + loc)
}

// ---- watch ----
watch(fullscreen, v => {
  const el = document.getElementById('app')
  if (el) { if (v) { el.style.position='fixed'; el.style.top='0'; el.style.left='0'; el.style.right='0'; el.style.bottom='0'; el.style.zIndex='9990'; el.style.height='100vh' } else { el.style.cssText = 'width:100%;height:600px' } }
})

// ---- init ----
loadMem(); loadState()
if (state?.主角信息?.姓名) { view.value = 'game'; startPoll() }
window.addEventListener('pagehide', () => { if (pollTimer.value) clearInterval(pollTimer.value) })

// Expose for debugging
;(window as any).P5R = { state, pages, mem, doAction, startGame, loadGame }
</script>

<template>
  <!-- 开局页 -->
  <div v-if="view==='start'" class="start-page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;padding:2rem;background:linear-gradient(135deg,#0a0a0a,#1a0000,#0a0a0a)">
    <div style="text-align:center;margin-bottom:2rem">
      <div style="width:100px;height:100px;margin:0 auto 1rem;background:#E60012;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);display:flex;align-items:center;justify-content:center;animation:pulse 2s infinite;box-shadow:0 0 40px rgba(230,0,18,.5)"><span style="font-size:40px;font-weight:900;color:#fff">♠</span></div>
      <div style="font-size:2rem;font-weight:900;letter-spacing:.3em;background:linear-gradient(180deg,#fff 0%,#E60012 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent">PERSONA 5 ROYAL</div>
      <div style="font-size:.9rem;color:#888">心 之 怪 盗 团</div>
    </div>
    <div style="background:#141414;border:2px solid #333;padding:2rem;max-width:460px;width:100%">
      <h2 style="color:#E60012;text-align:center;margin-bottom:1.5rem">▸ 角色创建</h2>
      <div style="display:flex;gap:1rem;margin-bottom:1.2rem">
        <button :class="{active:mode==='Joker'}" class="mode-btn" @click="mode='Joker'" style="flex:1;padding:.8rem;background:#111;border:2px solid #333;color:#aaa;font-size:.85rem;cursor:pointer;text-align:center">🃏 Joker</button>
        <button :class="{active:mode==='custom'}" class="mode-btn" @click="mode='custom'" style="flex:1;padding:.8rem;background:#111;border:2px solid #333;color:#aaa;font-size:.85rem;cursor:pointer;text-align:center">🎭 自定义</button>
      </div>
      <div v-if="mode==='Joker'"><div class="fg"><label>姓名</label><input v-model="jokerName" maxlength="20" style="width:100%;padding:.7rem;background:#111;border:1px solid #333;color:#fff;font-size:.9rem"></div></div>
      <div v-else><div class="fg"><label>姓名</label><input v-model="customName" placeholder="输入姓名..." maxlength="20" style="width:100%;padding:.7rem;background:#111;border:1px solid #333;color:#fff;font-size:.9rem"></div><div class="fg"><label>性别</label><select v-model="customGender" style="width:100%;padding:.7rem;background:#111;border:1px solid #333;color:#fff;font-size:.9rem"><option>男</option><option>女</option></select></div></div>
      <div class="fg"><label>起始阶段</label><select v-model="startPhase" style="width:100%;padding:.7rem;background:#111;border:1px solid #333;color:#fff;font-size:.9rem"><option>序章</option><option>鸭志田宫殿</option><option>鸭志田后·日常</option></select></div>
      <button @click="startGame()" style="width:100%;padding:1rem;background:#E60012;border:none;color:#fff;font-size:1.1rem;font-weight:700;cursor:pointer;margin-top:.5rem">▶ TAKE YOUR HEART</button>
      <div v-if="msg" style="color:#888;font-size:.75rem;text-align:center;margin-top:.5rem">{{msg}}</div>
    </div>
    <div v-if="hasMemory" style="background:#141414;border:2px solid #333;padding:2rem;max-width:460px;width:100%;margin-top:1.5rem">
      <h2 style="color:#E60012;text-align:center;margin-bottom:1rem">📂 继续游戏</h2>
      <div style="font-size:.8rem;color:#aaa;line-height:1.8;margin-bottom:1rem" v-html="loadInfo"></div>
      <button @click="loadGame()" style="width:100%;padding:1rem;background:#E60012;border:none;color:#fff;font-size:1.1rem;font-weight:700;cursor:pointer">▶ 继续</button>
    </div>
    <div style="color:#666;font-size:.65rem;text-align:center;margin-top:1rem">♠ P5R | {{hasST?'ST':'Mock'}} | {{hasMemory?'有存档':'新游戏'}}</div>
  </div>

  <!-- 游戏页 -->
  <div v-else style="display:flex;flex-direction:column;height:100%">
    <div style="background:#000;border-bottom:2px solid #E60012;padding:.5rem 1rem;display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
      <div style="font-size:1rem;font-weight:900;color:#E60012">♠ PERSONA 5 ROYAL</div>
      <div style="font-size:.8rem;color:#aaa;display:flex;gap:.8rem;align-items:center">
        <span>{{ts.日期||'-'}}</span><span style="color:#FFD700">{{ts.天气||'-'}}</span><span style="color:#666">{{ts.时段||'-'}}</span>
        <button @click="fullscreen=!fullscreen" style="background:none;border:1px solid #333;color:#888;cursor:pointer;padding:.15rem .4rem;font-size:.7rem">{{fullscreen?'✕':'⛶'}}</button>
      </div>
    </div>
    <div style="display:flex;flex:1;min-height:0;overflow:hidden">
      <!-- 左面板 -->
      <div style="width:200px;flex-shrink:0;background:#141414;border-right:1px solid #2a2a2a;padding:.5rem;overflow-y:auto">
        <div style="background:#1a1a1a;border:1px solid #2a2a2a;padding:.4rem;text-align:center;margin-bottom:.5rem">
          <div style="width:34px;height:34px;background:#222;border-radius:50%;margin:0 auto .2rem;border:2px solid #E60012;display:flex;align-items:center;justify-content:center;font-size:.9rem">🃏</div>
          <div style="font-size:.8rem;font-weight:700">{{mc.姓名||'-'}}</div><div style="font-size:.6rem;color:#888">{{mc.身份||'-'}} · 秀尽学园</div>
        </div>
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding-bottom:.2rem;border-bottom:1px solid #2a2a2a;margin:.5rem 0 .3rem">◆ 五维</div>
        <div v-for="sk in ['知识','勇气','灵巧','温柔','魅力']" :key="sk" style="display:flex;align-items:center;justify-content:space-between;padding:.1rem 0;font-size:.62rem">
          <span style="color:#aaa;min-width:26px">{{sk}}</span><div style="flex:1;height:3px;background:#222;margin:0 .2rem"><div :style="{width:(mc.五维[sk]||1)*20+'%',height:'100%',background:'#E60012'}"></div></div><span style="color:#FFD700;font-weight:700;font-size:.6rem">{{mc.五维[sk]||1}}</span>
        </div>
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding-bottom:.2rem;border-bottom:1px solid #2a2a2a;margin:.5rem 0 .3rem">◆ 时间</div>
        <div style="font-size:.62rem;color:#aaa;line-height:1.5">{{ts.日期||'-'}}<br>{{ts.时段||'-'}}</div>
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding-bottom:.2rem;border-bottom:1px solid #2a2a2a;margin:.5rem 0 .3rem">◆ 位置</div>
        <div style="font-size:.62rem;color:#aaa">{{ts.当前地点||'-'}}</div>
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding-bottom:.2rem;border-bottom:1px solid #2a2a2a;margin:.5rem 0 .3rem">◆ 资源</div>
        <div>💰 <span style="font-size:.8rem;color:#FFD700;font-weight:700">¥{{res.金钱||0}}</span></div>
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding-bottom:.2rem;border-bottom:1px solid #2a2a2a;margin:.5rem 0 .3rem">◆ 进度</div>
        <div style="font-size:.6rem;color:#aaa;line-height:1.4">📋 {{pp.当前阶段||'-'}}</div>
        <div v-if="pp.当前宫殿" style="font-size:.6rem;color:#ff6b6b">🏰 {{pp.当前宫殿}} [{{pp.攻略状态}}]</div>
        <div v-if="pp.截止日" style="font-size:.6rem;color:#ff6b6b">⏰ {{pp.截止日}}</div>
        <button @click="view='start';clearPoll()" style="margin-top:auto;padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.65rem;cursor:pointer;width:100%">🏠 返回</button>
      </div>
      <!-- 中间 -->
      <div style="flex:1;display:flex;flex-direction:column;min-width:0;background:#0a0a0a;overflow:hidden">
        <div style="flex:1;overflow-y:auto;padding:.6rem" ref="narrRef">
          <div v-if="pages.length===0" style="text-align:center;color:#666;font-size:.68rem">♠ 心之怪盗团，欢迎回来。<br>使用下方按钮或点击地图来推进故事。</div>
          <template v-for="(p,i) in pages" :key="i">
            <div v-if="curPage===-1||curPage===i">
              <div style="display:flex;flex-direction:column;align-items:flex-end;margin-bottom:.5rem">
                <div style="font-size:.55rem;color:#E60012;margin-bottom:.1rem">▲ 玩家</div>
                <div style="padding:.4rem .6rem;border-radius:3px;line-height:1.6;font-size:.75rem;background:rgba(230,0,18,.15);border:1px solid rgba(230,0,18,.3);color:#fcc;max-width:90%">▸ {{p.userAction}}</div>
              </div>
              <div v-if="p.aiResponse" style="display:flex;flex-direction:column;align-items:flex-start;margin-bottom:.5rem">
                <div style="font-size:.55rem;color:#888;margin-bottom:.1rem">▼ AI</div>
                <div style="padding:.4rem .6rem;border-radius:3px;line-height:1.6;font-size:.75rem;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#ddd;max-width:92%;word-break:break-word" v-html="p.aiResponse.replace(/\n/g,'<br>')"></div>
              </div>
              <div v-else style="color:#666;font-size:.7rem;font-style:italic;padding:.3rem">AI 思考中...</div>
              <div v-if="(curPage===-1||curPage===pages.length-1)&&p.aiResponse" style="text-align:center;margin-top:.3rem"><button @click="reroll()" style="padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.62rem;cursor:pointer">🔄 重roll</button></div>
            </div>
          </template>
        </div>
        <div v-if="pages.length>1" style="display:flex;align-items:center;justify-content:center;gap:.5rem;padding:.2rem;background:#141414;border-top:1px solid #2a2a2a;font-size:.62rem;color:#888;flex-shrink:0">
          <button @click="curPage=Math.max(0,curPage-1)" :disabled="curPage<=0" style="background:#1a1a1a;border:1px solid #333;color:#aaa;padding:.15rem .5rem;cursor:pointer;font-size:.62rem">◀</button>
          <span style="color:#E60012;font-weight:700">{{(curPage===-1?pages.length:curPage+1)}}/{{pages.length}}</span>
          <button @click="curPage=Math.min(pages.length-1,curPage+1)" :disabled="curPage>=pages.length-1" style="background:#1a1a1a;border:1px solid #333;color:#aaa;padding:.15rem .5rem;cursor:pointer;font-size:.62rem">▶</button>
        </div>
        <div style="background:#141414;border-top:1px solid #2a2a2a;padding:.4rem .6rem;display:flex;gap:.2rem;flex-wrap:wrap;align-items:center;flex-shrink:0">
          <button @click="doAction('推进剧情')" style="padding:.25rem .5rem;background:#E60012;border:1px solid #E60012;color:#fff;font-weight:700;font-size:.65rem;cursor:pointer">▶ 推进</button>
          <button @click="doAction('探索当前地点')" style="padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.65rem;cursor:pointer">🔍 探索</button>
          <button @click="doAction('与在场角色互动')" style="padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.65rem;cursor:pointer">💬 互动</button>
          <button @click="doAction('进入认知世界')" style="padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.65rem;cursor:pointer">🏰 异世界</button>
          <button @click="showSum=!showSum" style="padding:.25rem .5rem;background:#1a1a1a;border:1px solid #333;color:#ccc;font-size:.65rem;cursor:pointer">📝 总结</button>
          <span style="flex:1"></span>
          <div style="flex:1;min-width:100px;display:flex;gap:.15rem"><input v-model="ci" @keydown.enter="sendCustom()" placeholder="输入行动..." style="flex:1;padding:.25rem .4rem;background:#111;border:1px solid #333;color:#fff;font-size:.65rem"><button @click="sendCustom()" style="padding:.25rem .5rem;background:#E60012;border:none;color:#fff;cursor:pointer;font-size:.65rem;font-weight:700">发送</button></div>
        </div>
      </div>
      <!-- 右面板：地图+角色 -->
      <div style="width:260px;flex-shrink:0;background:#141414;border-left:1px solid #2a2a2a;overflow-y:auto;display:flex;flex-direction:column">
        <div @click="toggleMap()" style="background:#E60012;padding:6px 10px;cursor:pointer;text-align:center;flex-shrink:0">
          <div style="font-size:.7rem;font-weight:700">{{(ts.日期||'2015/04/09').replace(/-/g,'/')}}</div>
          <div style="font-size:.65rem;opacity:.9">📍 {{ts.当前地点||'东京·四轩茶屋'}}</div>
          <div style="font-size:.55rem;opacity:.6">{{mapOpen?'▲ 收起地图':'▼ 展开地图'}}</div>
        </div>
        <div :style="{height:mapOpen?'200px':'0',overflow:'hidden',transition:'height .3s',background:'#1a0000',position:'relative',flexShrink:'0'}">
          <div :style="{transform:'scale('+mapScale+')',transformOrigin:'center',width:'100%',height:'100%',position:'absolute'}">
            <svg style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:1" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path v-for="(l,i) in mapLines" :key="i" :d="l.d" :stroke="l.c" stroke-width="1.5" fill="none" opacity=".6"/>
            </svg>
            <div v-for="(m,k) in mapData" :key="k" :style="{left:m.x+'%',top:m.y+'%'}" style="position:absolute;transform:translate(-50%,-50%);z-index:2;cursor:pointer;display:flex;flex-direction:column;align-items:center" @click.stop="openRegion(k)">
              <div :style="{width:'10px',height:'10px',background:k===activeRegion?'#FFD700':'#fff',border:'2px solid #000',borderRadius:'50%',transform:k===activeRegion?'scale(1.4)':'scale(1)'}"></div>
              <div style="font-size:.5rem;font-weight:700;color:#fff;background:#000;padding:1px 3px;margin-top:1px;white-space:nowrap">{{m.label}}</div>
            </div>
          </div>
          <div style="position:absolute;bottom:4px;right:4px;display:flex;flex-direction:column;gap:2px;z-index:10">
            <button @click.stop="zoomMap(1)" style="width:18px;height:18px;background:rgba(0,0,0,.8);color:#fff;border:1px solid #E60012;font-size:.6rem;cursor:pointer">+</button>
            <button @click.stop="zoomMap(-1)" style="width:18px;height:18px;background:rgba(0,0,0,.8);color:#fff;border:1px solid #E60012;font-size:.6rem;cursor:pointer">-</button>
          </div>
        </div>
        <!-- 子区域 -->
        <div v-if="mapSel" style="background:#000;padding:6px;flex-shrink:0">
          <button @click="mapSel='';mapView='main'" style="background:#E60012;border:none;color:#fff;padding:3px 6px;cursor:pointer;font-size:.55rem;margin-bottom:4px">◀ 返回地图</button>
          <h3 style="font-size:.65rem;color:#E60012;margin-bottom:4px">{{mapData[mapSel]?.label}}</h3>
          <div v-for="sub in mapData[mapSel]?.subs||[]" :key="sub.id" @click="openSpot(sub.id)" style="padding:5px 6px;background:#1a1a1a;cursor:pointer;font-size:.6rem;display:flex;justify-content:space-between;margin-bottom:3px">
            {{sub.label}}<span style="color:#666">▶</span>
          </div>
          <!-- 子区域的具体设施 -->
          <div v-if="mapSub" style="margin-top:4px;padding:4px;background:#111">
            <button @click="mapSub=''" style="background:#333;border:none;color:#aaa;padding:2px 4px;cursor:pointer;font-size:.5rem;margin-bottom:3px">◀ 返回</button>
            <div v-for="spot in mapData[mapSel]?.subs?.find((s:any)=>s.id===mapSub)?.spots||[]" :key="spot.id" @click="travelTo(mapSel,mapSub,spot.id)" style="padding:3px 4px;cursor:pointer;font-size:.58rem;color:#aaa;margin-bottom:2px">{{spot.label}}</div>
          </div>
          <button @click="travelTo(mapSel,mapSub||undefined)" style="background:#E60012;border:none;color:#fff;padding:5px 8px;cursor:pointer;font-size:.65rem;width:100%;margin-top:4px;font-weight:700">🚇 前往</button>
        </div>
        <!-- 角色列表 -->
        <div style="font-size:.6rem;font-weight:700;color:#E60012;padding:.3rem .5rem .2rem;border-bottom:1px solid #2a2a2a">◆ 怪盗团</div>
        <div style="display:flex;flex-direction:column;gap:.1rem;padding:.4rem">
          <div v-for="c in partyList" :key="c.name" :style="{background:c.present?'#1a0000':'#1a1a1a',borderColor:c.present?'#E60012':'#2a2a2a',border:'1px solid',padding:'.2rem .3rem',fontSize:'.58rem'}">
            <div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:700;font-size:.62rem">{{c.name}}</span><span :style="{fontSize:'.5rem',padding:'.04rem .15rem',borderRadius:'2px',background:c.present?'#1a3a1a':'#222',color:c.present?'#4f4':'#666'}">{{c.present?'在场':'不在场'}}</span></div>
            <div style="margin-top:.08rem;color:#999;font-size:.55rem">COOP:<span style="color:#FFD700;font-size:.5rem">{{'★'.repeat(c.coop)+'☆'.repeat(Math.max(0,10-c.coop))}}</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 总结面板 -->
    <div v-if="showSum" style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.95);z-index:100;display:flex;flex-direction:column;padding:1.5rem;overflow-y:auto">
      <button @click="showSum=false" style="position:absolute;top:.5rem;right:.5rem;background:none;border:none;color:#888;font-size:1.2rem;cursor:pointer">✕</button>
      <h2 style="color:#E60012;text-align:center;margin-bottom:.8rem">📝 总结与记忆</h2>
      <div style="display:flex;align-items:center;justify-content:center;gap:1rem;margin-bottom:.8rem;font-size:.7rem;color:#aaa;flex-wrap:wrap">
        <label><input type="checkbox" v-model="mem.autoSummary" @change="saveMem()"> 自动小总结</label>
        <label>每 <input type="number" v-model="mem.interval" @change="mem.count=0;saveMem()" min="5" max="50" style="width:45px;background:#111;border:1px solid #333;color:#fff;padding:.15rem;text-align:center"> 轮</label>
        <span style="color:#666">({{mem.count}}/{{mem.interval}})</span>
      </div>
      <div style="display:flex;gap:.8rem;justify-content:center;margin-bottom:.8rem">
        <button @click="doBigSum()" style="padding:.6rem 1rem;border:2px solid #E60012;background:#1a0000;color:#E60012;cursor:pointer;font-size:.75rem;font-weight:700">📚 大总结</button>
        <button @click="doSmallSum()" style="padding:.6rem 1rem;border:2px solid #333;background:#111;color:#ccc;cursor:pointer;font-size:.75rem">📋 小总结</button>
        <button @click="showMem=!showMem" style="padding:.6rem 1rem;border:2px solid #333;background:#111;color:#ccc;cursor:pointer;font-size:.75rem">🗄 记忆库</button>
      </div>
      <div v-if="showMem" style="display:grid;grid-template-columns:1fr 1fr;gap:.4rem;margin-bottom:.8rem">
        <div style="background:#111;border:1px solid #333;padding:.4rem"><h3 style="font-size:.6rem;color:#E60012;margin-bottom:.2rem">📌 事实</h3><div v-for="f in mem.facts" :key="f" style="font-size:.58rem;color:#aaa;padding:.08rem 0;border-bottom:1px solid #1a1a1a">{{f}}</div></div>
        <div style="background:#111;border:1px solid #333;padding:.4rem"><h3 style="font-size:.6rem;color:#E60012;margin-bottom:.2rem">📅 事件</h3><div v-for="e in mem.events" :key="e" style="font-size:.58rem;color:#aaa;padding:.08rem 0;border-bottom:1px solid #1a1a1a">{{e}}</div></div>
        <div style="background:#111;border:1px solid #333;padding:.4rem"><h3 style="font-size:.6rem;color:#E60012;margin-bottom:.2rem">💬 对话</h3><div v-for="h in mem.history" :key="h" style="font-size:.58rem;color:#aaa;padding:.08rem 0;border-bottom:1px solid #1a1a1a">{{h.substring(0,80)}}</div></div>
        <div style="background:#111;border:1px solid #333;padding:.4rem"><h3 style="font-size:.6rem;color:#E60012;margin-bottom:.2rem">📊 状态</h3><div style="font-size:.58rem;color:#aaa">🃏 {{mc.姓名}}<br>📅 {{ts.日期}}<br>📍 {{ts.当前地点}}<br>📝 {{mem.summaries.length}}条摘要</div></div>
      </div>
      <div style="flex:1;overflow-y:auto;background:#111;border:1px solid #333;padding:.8rem;line-height:1.7;font-size:.72rem;color:#ccc;white-space:pre-wrap">{{sumResult}}</div>
    </div>
  </div>
</template>

<style scoped>
.mode-btn.active {
  border-color: #E60012 !important;
  color: #E60012 !important;
  background: #1a0000 !important;
}
.fg {
  margin-bottom: 1rem;
}
.fg label {
  display: block;
  font-size: 0.75rem;
  color: #aaa;
  margin-bottom: 0.3rem;
}
@keyframes pulse {
  0%, 100% { box-shadow: 0 0 40px rgba(230,0,18,0.5); }
  50% { box-shadow: 0 0 80px rgba(230,0,18,0.8); }
}
::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: #0a0a0a; }
::-webkit-scrollbar-thumb { background: #333; }
</style>
