(function(){
const CSS=`
.w{direction:rtl;font-size:14px}
.cal{display:grid;grid-template-columns:78px repeat(7,minmax(0,1fr));gap:4px}
.dh{font-size:12px;color:var(--text-muted);text-align:center;padding:4px 0}
.w .day,.w .hr,.w .du{border:1px solid var(--border-strong);border-radius:var(--radius);background:var(--surface-2);color:var(--text-primary);cursor:pointer;padding:0;position:relative}
.w .day{height:46px;font-size:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1.15}
.w .day small{font-size:11px;color:var(--text-muted)}
.w .day.we{color:var(--text-secondary);background:var(--bg-neutral)}
.w .day.past{color:var(--text-muted);background:transparent;border-color:var(--border);cursor:default;opacity:0.5}
.w .day.today{border:1.5px dashed var(--text-secondary)}
.w .hr{height:40px;font-size:13px;direction:ltr;white-space:nowrap;overflow:hidden;display:flex;align-items:center;justify-content:center;padding:0 4px;line-height:1}
.w .du{height:40px;padding:0 16px;font-size:14px;display:inline-flex;align-items:center;gap:6px}
.w .on{background:#185FA5 !important;color:#FFFFFF !important;border:1px solid #0C447C !important}
.w .on small{color:#E6F1FB !important}
.w .day.on::after{content:"\\2713";position:absolute;top:2px;left:5px;font-size:11px;color:#FFFFFF}
.w .wk{height:46px;padding:0 4px;font-size:12px;white-space:nowrap;overflow:hidden;display:flex;align-items:center;justify-content:center;line-height:1}
.sec{font-size:15px;font-weight:500;margin:0 0 6px}
.sub{font-size:13px;color:var(--text-secondary);margin:0 0 10px;line-height:1.6}
.hrs{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
@media (max-width:560px){.hrs{grid-template-columns:repeat(4,minmax(0,1fr))}.cal{grid-template-columns:58px repeat(7,minmax(0,1fr))}.w .wk{font-size:11px}}
`;
const HTML=`
<div class="w" style="padding:0.5rem 0">
  <p class="sec">1. מה משך הפגישה?</p>
  <p class="sub">אציג רק סלוטים פנויים שארוכים לפחות כמו הפגישה.</p>
  <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
    <button class="du" data-m="30">חצי שעה</button>
    <button class="du" data-m="60">שעה</button>
    <button class="du" data-m="other">אחר</button>
    <span id="otherBox" style="display:none;align-items:center;gap:6px">
      <input id="otherIn" type="number" min="5" max="600" step="5" placeholder="45" style="width:90px;direction:ltr">
      <span style="font-size:13px;color:var(--text-secondary)">דקות</span>
    </span>
  </div>
  <div style="border-top:0.5px solid var(--border);margin:1.25rem 0;"></div>
  <p class="sec">2. בחר ימים</p>
  <p class="sub">לחיצה על יום צובעת אותו בכחול, וכך הוא נבחר. לחיצה נוספת מבטלת. אפשר לבחור כמה ימים שרוצים.</p>
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
    <button id="prev"><i class="ti ti-chevron-right" aria-hidden="true"></i> שבועיים אחורה</button>
    <span id="rlabel" style="font-weight:500;font-size:15px"></span>
    <button id="next">שבועיים קדימה <i class="ti ti-chevron-left" aria-hidden="true"></i></button>
  </div>
  <div class="cal" id="cal"></div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:center">
    <button id="qclr">נקה ימים</button>
  </div>
  <p id="dsum" class="sub" style="margin-top:8px"></p>
  <div style="border-top:0.5px solid var(--border);margin:1.25rem 0;"></div>
  <p class="sec">3. בחר שעות</p>
  <p class="sub">לחיצה על שעה צובעת אותה בכחול. לחיצה נוספת מבטלת.</p>
  <div class="hrs" id="hrs"></div>
  <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
    <button id="hclr">נקה שעות</button>
  </div>
  <p id="hsum" class="sub" style="margin-top:8px"></p>
  <div style="border-top:0.5px solid var(--border);margin:1.25rem 0 1rem;"></div>
  <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
    <button id="go" style="font-weight:500"><i class="ti ti-search" aria-hidden="true"></i> חפש זמנים פנויים ↗</button>
    <span id="err" style="font-size:13px;color:var(--text-danger)"></span>
  </div>
</div>
`;
window.renderSelector=function(root){
root.innerHTML='<style>'+CSS+'</style>'+HTML;
const HE_M=['ינו׳','פבר׳','מרץ','אפר׳','מאי','יוני','יולי','אוג׳','ספט׳','אוק׳','נוב׳','דצמ׳'];
const HE_D=['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];
const now=new Date();const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
const base=new Date(today);base.setDate(today.getDate()-today.getDay());
let off=0;const WEEKS=5;let dur=null;
const days=new Set(),hours=new Set();
const pad=n=>String(n).padStart(2,'0');
const iso=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const fromIso=s=>{const[a,b,c]=s.split('-').map(Number);return new Date(a,b-1,c)};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};
function paint(el,on){el.classList.toggle('on',on);el.setAttribute('aria-pressed',on?'true':'false')}
const otherBox=document.getElementById('otherBox'),otherIn=document.getElementById('otherIn');
document.querySelectorAll('.du').forEach(b=>b.onclick=()=>{
  dur=b.dataset.m;document.querySelectorAll('.du').forEach(x=>paint(x,x===b));
  otherBox.style.display=dur==='other'?'inline-flex':'none';if(dur==='other')otherIn.focus();
  document.getElementById('err').textContent='';
});
otherIn.oninput=()=>{document.getElementById('err').textContent=''};
function minutes(){if(dur==='other'){const v=parseInt(otherIn.value,10);return v>0?v:null}return dur?+dur:null}
function drawCal(){
  const s=addD(base,off*7),e=addD(s,WEEKS*7-1);
  document.getElementById('rlabel').textContent=s.getDate()+' '+HE_M[s.getMonth()]+' – '+e.getDate()+' '+HE_M[e.getMonth()]+' '+e.getFullYear();
  document.getElementById('prev').style.visibility=off<=0?'hidden':'visible';
  const c=document.getElementById('cal');c.innerHTML='';
  c.appendChild(document.createElement('div'));
  HE_D.forEach(h=>{const el=document.createElement('div');el.className='dh';el.textContent=h;c.appendChild(el)});
  for(let w=0;w<WEEKS;w++){
    const ks=[];for(let i=0;i<5;i++){const d=addD(s,w*7+i);if(d>=today)ks.push(iso(d))}
    const wb=document.createElement('button');wb.className='wk';wb.textContent='כל א׳–ה׳';
    if(!ks.length)wb.style.visibility='hidden';
    wb.onclick=()=>{const all=ks.every(k=>days.has(k));ks.forEach(k=>all?days.delete(k):days.add(k));drawCal();sum()};
    c.appendChild(wb);
    for(let i=0;i<7;i++){
      const dt=addD(s,w*7+i),k=iso(dt),b=document.createElement('button');
      b.className='day';
      b.innerHTML=dt.getDate()+((dt.getDate()===1||(w===0&&i===0))?'<small>'+HE_M[dt.getMonth()]+'</small>':'');
      if(i>=5)b.classList.add('we');
      if(dt<today){b.classList.add('past');b.disabled=true}
      if(dt.getTime()===today.getTime())b.classList.add('today');
      paint(b,days.has(k));
      b.onclick=()=>{if(days.has(k))days.delete(k);else days.add(k);paint(b,days.has(k));sum()};
      c.appendChild(b);
    }
  }
}
function drawHrs(){
  const h=document.getElementById('hrs');h.innerHTML='';
  for(let s=8;s<22;s++){
    const b=document.createElement('button');b.className='hr';b.textContent=pad(s)+':00–'+pad(s+1)+':00';
    paint(b,hours.has(s));
    b.onclick=()=>{if(hours.has(s))hours.delete(s);else hours.add(s);paint(b,hours.has(s));sum()};
    h.appendChild(b);
  }
}
function ranges(){const a=[...hours].sort((x,y)=>x-y),r=[];a.forEach(x=>{if(r.length&&r[r.length-1][1]===x)r[r.length-1][1]=x+1;else r.push([x,x+1])});return r.map(([s,e])=>pad(s)+':00–'+pad(e)+':00')}
function sortedDays(){return [...days].sort()}
function sum(){
  const d=sortedDays();
  document.getElementById('dsum').textContent=d.length?('נבחרו '+d.length+' ימים: '+d.map(k=>{const x=fromIso(k);return HE_D[x.getDay()]+' '+x.getDate()+'.'+(x.getMonth()+1)}).join(' · ')):'עוד לא נבחרו ימים';
  const r=ranges();
  document.getElementById('hsum').innerHTML=r.length?('שעות שנבחרו: <span style="direction:ltr;unicode-bidi:isolate">'+r.join(', ')+'</span>'):'עוד לא נבחרו שעות';
  document.getElementById('err').textContent='';
}
document.getElementById('prev').onclick=()=>{off=Math.max(0,off-2);drawCal()};
document.getElementById('next').onclick=()=>{off+=2;drawCal()};
document.getElementById('qclr').onclick=()=>{days.clear();drawCal();sum()};
document.getElementById('hclr').onclick=()=>{hours.clear();drawHrs();sum()};
document.getElementById('go').onclick=()=>{
  const e=document.getElementById('err');const m=minutes();
  if(!m){e.textContent=dur==='other'?'הכנס מספר דקות.':'בחר את משך הפגישה.';return}
  if(!days.size){e.textContent='בחר לפחות יום אחד.';return}
  if(!hours.size){e.textContent='בחר לפחות שעה אחת.';return}
  sendPrompt('חפש זמנים פנויים ביומן שלי.\nמשך הפגישה: '+m+' דקות\nימים: '+sortedDays().join(', ')+'\nשעות: '+ranges().join(', '));
};
drawCal();drawHrs();sum();
};
})();
