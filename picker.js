(function(){
const CSS=`
.w{direction:rtl;font-size:14px}
.row{margin-bottom:14px}
.day{font-size:13px;font-weight:500;color:var(--text-secondary);margin:0 0 6px}
.tri{display:grid;grid-template-columns:minmax(0,1fr) 14px minmax(0,1.25fr) 14px minmax(0,1fr);align-items:stretch;direction:ltr}
.side{border-radius:var(--radius);background:var(--bg-neutral);padding:8px 10px;display:flex;flex-direction:column;justify-content:center;min-height:58px}
.side .nm{font-size:13px;color:var(--text-primary);unicode-bidi:plaintext;line-height:1.35;overflow-wrap:anywhere}
.side .tm{font-size:12px;color:var(--text-secondary);margin-top:3px}
.side.none{background:transparent;border:1px dashed var(--border-strong);align-items:center}
.side.none .nm{color:var(--text-muted);font-size:12px}
.side .wait{font-size:11px;color:var(--text-warning);margin-top:2px;direction:rtl;text-align:right}
.link{align-self:center;height:1px;background:var(--border-strong)}
.w .mid{border:1.5px solid var(--border-strong);border-radius:12px;background:var(--surface-2);cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px;position:relative;min-height:58px;color:var(--text-primary)}
.w .mid:hover{border-color:var(--border-stronger)}
.mid .big{font-size:17px;font-weight:500}
.mid .dur{font-size:12px;color:var(--text-secondary);direction:rtl}
.mid .ck{position:absolute;top:6px;right:8px;width:18px;height:18px;border-radius:50%;border:1.5px solid var(--border-stronger);font-size:11px;display:flex;align-items:center;justify-content:center;color:transparent}
.w .mid.on{background:#185FA5 !important;border-color:#0C447C !important;color:#FFFFFF !important}
.w .mid.on .dur{color:#E6F1FB !important}
.w .mid.on .ck{background:#FFFFFF;border-color:#FFFFFF;color:#185FA5}
.legend{display:grid;grid-template-columns:minmax(0,1fr) 14px minmax(0,1.25fr) 14px minmax(0,1fr);direction:ltr;font-size:12px;color:var(--text-muted);text-align:center;margin-bottom:8px}
`;
const HTML=`
<div class="w" style="padding:0.5rem 0">
<div class="legend"><span>הפגישה הקודמת</span><span></span><span>הזמן הפנוי (לחץ לבחירה)</span><span></span><span>הפגישה הבאה</span></div>
<div id="list"></div>
<div style="margin-top:1rem;border-top:0.5px solid var(--border);padding-top:1rem">
  <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;flex-wrap:wrap">
    <span style="font-size:14px;font-weight:500" id="count">לא נבחרו סלוטים</span>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button id="lang">עברית</button>
      <button id="clear"><i class="ti ti-x" aria-hidden="true"></i> נקה</button>
      <button id="copy"><i class="ti ti-copy" aria-hidden="true"></i> העתק רשימה</button>
    </div>
  </div>
  <textarea id="out" readonly rows="7" style="width:100%;box-sizing:border-box;font-family:var(--font-sans);font-size:14px;line-height:1.6;padding:10px 12px;border-radius:var(--radius);border:0.5px solid var(--border);background:var(--surface-1);color:var(--text-primary);resize:vertical;direction:ltr" placeholder="Select slots above to build your list"></textarea>
  <p id="msg" style="font-size:13px;color:var(--text-secondary);margin:6px 0 0;min-height:18px"></p>
</div>
</div>
`;
window.renderPicker=function(root,S){
root.innerHTML='<style>'+CSS+'</style>'+HTML;
const mins=t=>{const[h,m]=t.split(':').map(Number);return h*60+m};
const durTxt=(s,e)=>{const d=mins(e)-mins(s),h=Math.floor(d/60),m=d%60;return h&&m===30?(h===1?'שעה':h+' שעות')+' וחצי':h&&m?d+' דקות':h?(h===1?'שעה':h===2?'שעתיים':h+' שעות'):m+' דקות'};
const esc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function side(m,none){
  if(!m||!m.length)return `<div class="side none"><span class="nm">${none}</span></div>`;
  return `<div class="side">${m.map(x=>`<div><div class="nm">${esc(x[0])}</div><div class="tm">${x[1]}–${x[2]}</div>${x[3]?`<div class="wait">${esc(x[3])}</div>`:''}</div>`).join('<div style="height:6px"></div>')}</div>`;
}
const sel=new Set();let en=true;
const list=document.getElementById('list');
S.forEach((s,i)=>{
  const r=document.createElement('div');r.className='row';
  r.innerHTML=`<p class="day">${s.he}</p><div class="tri">${side(s.b,'אין פגישה לפני')}<div class="link"></div><div class="mid" role="checkbox" aria-checked="false" tabindex="0"><span class="ck">✓</span><span class="big">${s.s}–${s.e}</span><span class="dur">${durTxt(s.s,s.e)} פנויות</span></div><div class="link"></div>${side(s.a?[s.a]:null,'אין פגישה אחרי')}</div>`;
  const mid=r.querySelector('.mid');
  const tog=()=>{sel.has(i)?sel.delete(i):sel.add(i);const on=sel.has(i);mid.classList.toggle('on',on);mid.setAttribute('aria-checked',on);render()};
  mid.addEventListener('click',tog);mid.addEventListener('keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();tog()}});
  list.appendChild(r);
});
const out=document.getElementById('out'),msg=document.getElementById('msg'),cnt=document.getElementById('count'),lang=document.getElementById('lang');
function render(){
  const ch=[...sel].sort((a,b)=>a-b).map(i=>S[i]);
  cnt.textContent=ch.length?('נבחרו '+ch.length+' סלוטים'):'לא נבחרו סלוטים';
  out.style.direction=en?'ltr':'rtl';
  out.placeholder=en?'Select slots above to build your list':'בחר סלוטים למעלה כדי לבנות את הרשימה';
  out.value=!ch.length?'':en?("Here are a few times that work for me (Israel time):\n"+ch.map(s=>"• "+s.en+", "+s.et).join("\n")):("הנה כמה זמנים שמתאימים לי:\n"+ch.map(s=>"• "+s.he+", "+s.s+"–"+s.e).join("\n"));
  msg.textContent='';
}
lang.onclick=()=>{en=!en;lang.textContent=en?'עברית':'English';render()};
document.getElementById('clear').onclick=()=>{sel.clear();document.querySelectorAll('.mid').forEach(e=>{e.classList.remove('on');e.setAttribute('aria-checked','false')});render()};
document.getElementById('copy').onclick=async()=>{
  if(!out.value){msg.style.color='var(--text-danger)';msg.textContent='בחר לפחות סלוט אחד.';return}
  msg.style.color='var(--text-secondary)';
  try{await navigator.clipboard.writeText(out.value);msg.textContent='הועתק'}catch(e){out.focus();out.select();try{document.execCommand('copy');msg.textContent='הועתק'}catch(_){msg.textContent='הטקסט מסומן. לחץ Ctrl+C (או Cmd+C במק) כדי להעתיק.'}}
};
render();
};
})();
