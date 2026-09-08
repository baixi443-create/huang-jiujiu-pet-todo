(() => {
const icon=body=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">'+body+'</svg>');
const foods={
lollipop:{name:'棒棒糖',price:20,gain:10,img:icon('<path d="M49 50L29 87" stroke="#c8ad91" stroke-width="7" stroke-linecap="round"/><circle cx="55" cy="32" r="27" fill="#edb1ba" stroke="#c68190" stroke-width="3"/><path d="M55 32c-15-15-25 12-7 17s34-14 23-29S38 8 33 30" fill="none" stroke="#fff2d9" stroke-width="7" stroke-linecap="round"/>')},
pumpkin:{name:'熟贝贝南瓜（一瓣）',price:20,gain:10,img:icon('<path d="M13 30Q9 86 83 77L80 68Z" fill="#546c42" stroke="#405731" stroke-width="3"/><path d="M16 29L80 68Q29 82 16 29" fill="#eba544" stroke="#b97628" stroke-width="3"/><path d="M27 39L67 65Q37 67 27 39" fill="#ffce75"/><path d="M39 20q-6-7 0-14M55 25q-6-7 0-14" fill="none" stroke="#b9b4a8" stroke-width="3" stroke-linecap="round"/>')},
kibble:{name:'鸡肉冻干猫粮（一碗）',price:30,gain:15,img:icon('<ellipse cx="48" cy="45" rx="39" ry="18" fill="#745038" stroke="#75929c" stroke-width="3"/><g fill="#ac784e"><circle cx="21" cy="42" r="5"/><circle cx="37" cy="35" r="5"/><circle cx="56" cy="38" r="5"/><circle cx="72" cy="42" r="5"/><circle cx="42" cy="50" r="5"/></g><g fill="#f7dfac" stroke="#c5a16d" stroke-width="2"><rect x="23" y="29" width="13" height="11" rx="3"/><rect x="46" y="28" width="13" height="11" rx="3"/><rect x="60" y="41" width="13" height="11" rx="3"/></g><path d="M9 47Q13 83 48 84Q83 83 87 47Q48 67 9 47" fill="#a6c2c8" stroke="#75929c" stroke-width="3"/>')}
};
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
let stock=read('baidangFoodInventory',{});if(!stock||typeof stock!=='object')stock={};
for(const id in foods)stock[id]=Math.max(0,Math.floor(Number(stock[id])||0));
let fullness=Math.min(100,Math.max(0,Number(read('baidangFullness',50))||0));
let effect=read('baidangFoodEffect',null),timer;
function save(){localStorage.setItem('baidangFoodInventory',JSON.stringify(stock));localStorage.setItem('baidangFullness',String(fullness));localStorage.setItem('baidangFoodEffect',JSON.stringify(effect))}
const stat=q('#pet .stats .stat');stat.querySelector('b').id='fullnessValue';stat.querySelector('.bar i').id='fullnessBar';
const badge=document.createElement('div');badge.id='foodEffect';badge.setAttribute('aria-live','polite');q('#profilePet').insertAdjacentElement('afterend',badge);
function refresh(){q('#fullnessValue').textContent=Math.round(fullness)+'%';q('#fullnessBar').style.width=fullness+'%';clearTimeout(timer);
if(effect&&foods[effect.id]&&effect.until>Date.now()){const f=foods[effect.id];badge.innerHTML='<img alt="'+f.name+'" src="'+f.img+'"><span>黄啾啾正在享用<br>'+f.name+'</span>';badge.hidden=false;timer=setTimeout(refresh,effect.until-Date.now())}
else{effect=null;badge.hidden=true;badge.innerHTML=''}save()}
window.petFullness={get:()=>fullness,set:v=>{fullness=v;refresh()}};const oldBag=renderBag;
renderBag=function(){oldBag();const rows=Object.entries(foods).filter(([id])=>stock[id]>0).map(([id,f])=>'<div class="bagitem"><img src="'+f.img+'" alt="'+f.name+'"><div class="main"><div class="title">'+f.name+'</div><div class="taskmeta">库存 '+stock[id]+' · 饱食度 +'+f.gain+'</div></div><button class="use" data-food-use="'+id+'">使用</button></div>').join('');if(rows){if(ballInventory===0)q('#bagItems').innerHTML='';q('#bagItems').insertAdjacentHTML('beforeend',rows)}};
q('#shop .shop').insertAdjacentHTML('beforeend',Object.entries(foods).map(([id,f])=>'<article class="product"><img class="toyphoto" src="'+f.img+'" alt="'+f.name+'"><b>'+f.name+'</b><small>饱食度 +'+f.gain+'</small><button class="buy" data-food-buy="'+id+'">'+f.price+' <span class="catcoin" role="img" aria-label="黄啾啾币"></span> · 购买</button></article>').join(''));
q('#shop .shop').addEventListener('click',e=>{const b=e.target.closest('[data-food-buy]');if(!b)return;const id=b.dataset.foodBuy,f=foods[id];if(!f)return;if(coins<f.price)return toast('黄啾啾币不足，完成任务后再来吧');coins-=f.price;stock[id]++;save();render();toast('获得「'+f.name+'」！')});
q('#bagItems').addEventListener('click',e=>{const b=e.target.closest('[data-food-use]');if(!b)return;const id=b.dataset.foodUse,f=foods[id];if(!f||stock[id]<=0)return;stock[id]--;fullness=Math.min(100,fullness+f.gain);effect={id,until:Date.now()+20*60*1000};refresh();renderBag();q('#bagModal').classList.remove('open');qa('.nav,.panel').forEach(x=>x.classList.remove('active'));q('#pet').classList.add('active');q('.nav[data-go="pet"]').classList.add('active');toast('黄啾啾吃得好满足！饱食度 +'+f.gain)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh()});window.addEventListener('focus',refresh);refresh();
})();