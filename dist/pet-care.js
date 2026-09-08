// Gentle pet care: local time, historical task snapshot, offline cap.
(() => {
const HOUR=3600000,KEY='baidangCareClock';
const rates={calm:[1,.6],pending:[1.2,.8],overdue:[1.5,1]};
function snapshot(){return tasks.filter(t=>!t.done).map(t=>({deadline:t.deadline||today(),time:t.time||'',warn:!!t.warn}))}
function boundaries(t){const start=new Date(t.deadline+'T00:00:00').getTime();const due=t.time?new Date(t.deadline+'T'+t.time).getTime():new Date(new Date(start).setDate(new Date(start).getDate()+1)).getTime();return {start,due}}
function tier(list,at){if(list.some(t=>t.warn||at>=boundaries(t).due))return 'overdue';if(list.some(t=>at>=boundaries(t).start))return 'pending';return 'calm'}
function timeMultiplier(at){const hour=new Date(at).getHours();return hour>=9&&hour<18?2:1}
function losses(list,start,end){const cuts=[start,end];const day=new Date(start);day.setHours(0,0,0,0);while(day.getTime()<end){for(const hour of [9,18]){const point=new Date(day);point.setHours(hour,0,0,0);const at=point.getTime();if(at>start&&at<end)cuts.push(at)}day.setDate(day.getDate()+1)}for(const t of list){for(const x of Object.values(boundaries(t)))if(x>start&&x<end)cuts.push(x)}cuts.sort((a,b)=>a-b);let hunger=0,feeling=0;for(let i=1;i<cuts.length;i++){const hours=(cuts[i]-cuts[i-1])/HOUR*timeMultiplier((cuts[i]+cuts[i-1])/2);const r=rates[tier(list,(cuts[i]+cuts[i-1])/2)];hunger+=hours*r[0];feeling+=hours*r[1]}return [hunger,feeling]}
let clock;try{clock=JSON.parse(localStorage.getItem(KEY))}catch{}
if(!clock||!Number.isFinite(clock.at)||!Array.isArray(clock.tasks))clock={at:Date.now(),tasks:snapshot()};
function record(){clock={at:Date.now(),tasks:snapshot()};localStorage.setItem(KEY,JSON.stringify(clock))}
function draw(){q('#moodValue').textContent=Math.round(mood)+'%';q('#moodBar').style.width=mood+'%';const tags=q('#pet .petcard .meta + div');const feeling=mood>=75?'🥰 心情很好':mood>=50?'🙂 想和你待一会儿':'😭 心情很糟糕';const hungry=window.petFullness.get()<50?'🍽️ 好饿好饿！':'陪着你就很安心';tags.innerHTML='<span class="tag">'+feeling+'</span><span class="tag">'+hungry+'</span>';const label={calm:'悠闲陪伴',pending:'陪你努力中',overdue:'有点惦记你的任务'}[tier(snapshot(),Date.now())];q('#careStatus').textContent=label}
function tick(){const now=Date.now();const end=Math.max(clock.at,Math.min(now,clock.at+24*HOUR));const [h,m]=losses(clock.tasks,clock.at,end);const value=window.petFullness.get();window.petFullness.set(Math.max(Math.min(20,value),value-h));mood=Math.max(Math.min(25,mood),mood-m);localStorage.setItem('baidangMood',String(mood));record();draw()}
const help=document.createElement('details');help.className='story';help.innerHTML='<summary>照顾黄啾啾 · <span id="careStatus"></span></summary><p>本地时间 18:00 至次日 09:00，每小时自然消耗：悠闲时饱食度 −1、心情 −0.6；有今日待办时 −1.2、−0.8；有逾期任务时 −1.5、−1。09:00 至 18:00 按上述速度的两倍消耗。跨时间段分段计算，三档不叠加，未来任务提前不会加速。</p><p>离线最多计算 24 小时；自然消耗最低保留饱食度 20、心情 25。喂食和玩具能帮黄啾啾恢复状态。</p>';q('#pet').append(help);
document.addEventListener('click',()=>{tick();queueMicrotask(()=>{record();draw()})},true);
document.addEventListener('submit',()=>{tick();queueMicrotask(()=>{record();draw()})},true);
document.addEventListener('visibilitychange',()=>tick());window.addEventListener('focus',tick);
setInterval(tick,60000);tick();
window.petCare={tick,losses,tier,timeMultiplier};
})();
