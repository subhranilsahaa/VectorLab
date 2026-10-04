/* VectorLab Calculus UI — DOM only. Math: js/calculus/calculus-engine.js (Nerdamer).
   Graphs: function-plot. Both libraries load lazily the first time the Calculus tab opens. */
(function(){
const q=s=>document.querySelector(s),C=()=>window.CalcLab;
const LIBS=['js/vendor/nerdamer.bundle.min.js','js/calculus/calculus-engine.js','js/vendor/function-plot.min.js'];
let libs=null;
function load(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=()=>no(new Error('Could not load '+src));document.head.appendChild(s);});}
function ensureLibs(){return libs||(libs=LIBS.reduce((p,s)=>p.then(()=>load(s)),Promise.resolve()).catch(e=>{libs=null;throw e;}));}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
function m(t,block){if(!window.katex)return '<span class="sm-term">'+esc(t)+'</span>';
  try{return '<span class="sm-term'+(block?' cl-blk':'')+'">'+katex.renderToString(t,{output:'mathml',displayMode:!!block,throwOnError:false})+'</span>';}catch(e){return esc(t);}}
function steps(list){return list.map((s,i)=>'<div class="sm-step"><h3>'+(i+1)+'. '+esc(s.t)+'</h3>'+s.l.map(l=>'<div class="cl-line">'+m(l)+'</div>').join('')+(s.n?'<p class="hint">'+esc(s.n)+'</p>':'')+'</div>').join('');}
function say(el,msg,cls){el.textContent=msg||'';el.className='sm-status'+(cls?' '+cls:'');}
function yRange(fns,d){const v=[];for(const f of fns)for(let i=0;i<=120;i++){const y=f.f(d[0]+(d[1]-d[0])*i/120);if(isFinite(y))v.push(y);}
  if(v.length<2)return null;v.sort((a,b)=>a-b);let lo=v[Math.floor(v.length*.04)],hi=v[Math.ceil(v.length*.96)-1];if(hi-lo<1e-6){lo-=1;hi+=1;}const pad=(hi-lo)*.12;return[lo-pad,hi+pad];}
function noGraph(target,msg){const el=q(target);el.innerHTML='<p class="hint cl-nograph">'+esc(msg||'No graph is available for this expression.')+'</p>';}
function plot(target,fns,domain,marks){
  const el=q(target);el.innerHTML='';if(!window.functionPlot)return;
  /* a function with no real value anywhere on the range (other symbols, undefined, non-numeric) cannot be drawn */
  const yr=yRange(fns,domain);
  if(!yr||fns.some(f=>{for(let i=0;i<=40;i++){if(isFinite(f.f(domain[0]+(domain[1]-domain[0])*i/40)))return false;}return true;}))
    return noGraph(target,'No graph: this expression has no real values to plot on this range (it may use symbols other than x, or be undefined here).');
  try{functionPlot({target:el,width:Math.max(260,el.clientWidth||320),height:Math.min(300,Math.max(220,(el.clientWidth||320)*.62)),grid:true,xAxis:{domain},yAxis:{domain:yr},disableZoom:false,
    data:fns.map(f=>({graphType:'polyline',fn:s=>f.f(s.x),color:f.color})),annotations:marks||[]});}catch(e){noGraph(target,'Graph unavailable for this expression.');}}
function legend(el,items){el.innerHTML=items.map(i=>'<span style="--c:'+i[0]+'">'+i[1]+'</span>').join('');}

/* ---- tabs inside Calculus ---- */
function showCl(k){document.querySelectorAll('.cl-panel').forEach(p=>p.hidden=p.id!=='cl-'+k);
  document.querySelectorAll('#cl-tabs button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.cl===k));}
document.querySelectorAll('#cl-tabs button,[data-cl-go]').forEach(b=>b.addEventListener('click',()=>showCl(b.dataset.cl||b.dataset.clGo)));
document.querySelectorAll('#cats button').forEach(b=>{if(b.dataset.cat==='calculus')b.addEventListener('click',()=>{ensureLibs().catch(()=>{});});});

/* ---- limits ---- */
let lastL=null,lastD=null;
async function runLimit(){const st=q('#cl-l-status'),out=q('#cl-l-out');say(st,'Calculating\u2026');
  try{await ensureLibs();const dir=q('#cl-l-dir [aria-pressed=true]').dataset.v,r=C().limit(q('#cl-l-f').value,'x',q('#cl-l-a').value,dir);lastL=r;
    q('#cl-l-res').innerHTML='<span class="sm-rlabel">Input</span><span class="sm-rgroup">'+m(r.tex.input)+'</span><span class="sm-rlabel">Result</span><span class="sm-rgroup">'+m(r.tex.result)+'</span>'+(r.est?'<span class="hint" style="flex-basis:100%">Numerical estimate \u2014 the symbolic engine could not settle this exactly.</span>':'');
    q('#cl-l-res').hidden=false;out.innerHTML=steps(r.steps);say(st,'');drawL();}
  catch(e){lastL=null;q('#cl-l-res').hidden=true;out.innerHTML='';q('#cl-l-gwrap').hidden=true;say(st,e.message,'err');}}
function drawL(){if(!lastL)return;const r=lastL,inf=/Infinity/.test(r.a);let c=0;try{c=inf?0:parseFloat(nerdamer(r.a).evaluate().text('decimals'));}catch(e){}
  q('#cl-l-gwrap').hidden=false;let f;
  try{f=C().compile(r.input,'x');}catch(e){noGraph('#cl-l-graph','Graph unavailable for this expression.');q('#cl-l-legend').innerHTML='';return;}
  const w=inf?10:4,d=inf?[(r.a[0]==='-'?-30:0),(r.a[0]==='-'?0:30)]:[c-w,c+w];
  plot('#cl-l-graph',[{f,color:'#5cf2b0'}],d,inf?[]:[{x:c,text:'x = '+(+c.toFixed(3))}]);
  legend(q('#cl-l-legend'),[['#5cf2b0','f(x)'],['#8b95b5','x = approach value']]);}
/* ---- differentiation ---- */
async function runDiff(){const st=q('#cl-d-status'),out=q('#cl-d-out');say(st,'Calculating\u2026');
  try{await ensureLibs();const n=+q('#cl-d-n').value,r=C().differentiate(q('#cl-d-f').value,'x',n);lastD=r;const dx=n>1?'\\frac{d^{'+n+'}}{dx^{'+n+'}}':'\\frac{d}{dx}';
    q('#cl-d-res').innerHTML='<span class="sm-rlabel">Input</span><span class="sm-rgroup">'+m(r.tex.input)+'</span><span class="sm-rlabel">Result</span><span class="sm-rgroup">'+m(dx+'\\left['+r.tex.input+'\\right]='+r.tex.result)+'</span>';
    q('#cl-d-res').hidden=false;
    let h='<div class="cl-rule"><b>'+esc(r.rule)+'</b></div>'+steps(r.steps);
    if(n>1)h+='<div class="sm-step"><h3>Higher derivatives</h3>'+r.chain.map((c,i)=>'<div class="cl-line">'+m('f'+"'".repeat(i+1)+'(x)='+C().tex(c))+'</div>').join('')+'<p class="hint">The rule breakdown above explains the first derivative; each further derivative repeats the process.</p></div>';
    out.innerHTML=h;say(st,'');drawD();}
  catch(e){lastD=null;q('#cl-d-res').hidden=true;out.innerHTML='';q('#cl-d-gwrap').hidden=true;say(st,e.message,'err');}}
function drawD(){if(!lastD)return;const r=lastD;q('#cl-d-gwrap').hidden=false;let f,g;
  try{f=C().compile(r.input,'x');g=C().compile(r.chain[r.order-1],'x');}catch(e){noGraph('#cl-d-graph','Graph unavailable for this expression (it could not be turned into a plottable function).');q('#cl-d-legend').innerHTML='';return;}
  plot('#cl-d-graph',[{f,color:'#5cf2b0'},{f:g,color:'#ffc857'}],[-6,6]);
  legend(q('#cl-d-legend'),[['#5cf2b0','f(x)'],['#ffc857',r.order>1?'f'+"'".repeat(Math.min(r.order,3))+'(x)':'f\u2032(x)']]);}
/* ---- integration ---- */
async function runInt(){const st=q('#cl-i-status');say(st,'Calculating\u2026');
  try{await ensureLibs();const r=C().integrate(q('#cl-i-f').value);
    q('#cl-i-res').innerHTML='<span class="sm-rgroup">'+m(r.tex.input)+'</span>';
    q('#cl-i-out').innerHTML='<div class="cl-rule"><b>'+esc(r.rule)+'</b></div>'+steps(r.steps);
    q('#cl-i-final').innerHTML=m(r.tex.input+'='+r.tex.result+'+C',true);
    q('#cl-i-body').hidden=false;say(st,'');}
  catch(e){q('#cl-i-body').hidden=true;q('#cl-i-out').innerHTML='';say(st,e.message||'Something went wrong evaluating that expression.','err');}}
/* ---- wiring ---- */
const LEX=[['sin(x)/x','0'],['(x^2-1)/(x-1)','1'],['(1-cos(x))/x^2','0'],['(3x^2+1)/(2x^2-5)','inf'],['(1+1/x)^x','inf'],['(e^x-1)/x','0'],['abs(x)/x','0'],['1/x','0']];
const IEX=['x^3+2x','sqrt(x)','1/x','3sin(x)-2cos(x)','e^(2x)','ln(x)','x*e^x','x*sin(x)','2x*cos(x^2)','1/(2x+1)','sin(x)^2','1/(1+x^2)'];
const DEX=['x^3+2x','sin(x^2)','x*sin(x)','sin(x)/x','ln(x^2+1)','e^(3x)','(x^2+1)/(x-1)','cos(3x+1)^2'];
q('#cl-l-ex').innerHTML=LEX.map((e,i)=>'<button class="chip" type="button" data-i="'+i+'">'+esc(e[0])+(e[1]!=='0'?' \u2192 '+e[1]:'')+'</button>').join('');
q('#cl-d-ex').innerHTML=DEX.map(e=>'<button class="chip" type="button">'+esc(e)+'</button>').join('');
q('#cl-i-ex').innerHTML=IEX.map(e=>'<button class="chip" type="button">'+esc(e)+'</button>').join('');
q('#cl-i-ex').onclick=e=>{const b=e.target.closest('button');if(!b)return;q('#cl-i-f').value=b.textContent;runInt();};
q('#cl-l-ex').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=LEX[+b.dataset.i];q('#cl-l-f').value=x[0];q('#cl-l-a').value=x[1];setDir('both');runLimit();};
q('#cl-d-ex').onclick=e=>{const b=e.target.closest('button');if(!b)return;q('#cl-d-f').value=b.textContent;runDiff();};
function setDir(v){document.querySelectorAll('#cl-l-dir button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v));}
q('#cl-l-dir').onclick=e=>{const b=e.target.closest('button');if(b){setDir(b.dataset.v);}};
q('#cl-i-run').onclick=runInt;q('#cl-i-f').addEventListener('keydown',e=>{if(e.key==='Enter')runInt();});
q('#cl-l-run').onclick=runLimit;q('#cl-d-run').onclick=runDiff;
['#cl-l-f','#cl-l-a'].forEach(s=>q(s).addEventListener('keydown',e=>{if(e.key==='Enter')runLimit();}));
q('#cl-d-f').addEventListener('keydown',e=>{if(e.key==='Enter')runDiff();});
/* ---- definite integration ---- */
function dsteps(list){return list.map((s,i)=>'<div class="sm-step"><h3>'+(i+1)+'. '+esc(s.t)+'</h3>'+s.l.map(l=>'<div class="cl-line">'+m(l)+'</div>').join('')+(s.n?'<p class="hint">'+esc(s.n)+'</p>':'')+(s.sub?'<details class="cl-more"><summary>Show how the antiderivative was found</summary>'+steps(s.sub)+'</details>':'')+'</div>').join('');}
async function runDef(){const st=q('#cl-di-status');say(st,'Calculating\u2026');
  try{await ensureLibs();const r=C().definite(q('#cl-di-f').value,q('#cl-di-a').value,q('#cl-di-b').value);
    q('#cl-di-res').innerHTML='<span class="sm-rgroup">'+m(r.tex.input,true)+'</span>'+(r.zeroWidth?'<span class="hint" style="flex-basis:100%">Both bounds are equal, so the interval has no width and the integral is 0.</span>':'');
    q('#cl-di-out').innerHTML=dsteps(r.steps);
    q('#cl-di-final').innerHTML=m(r.tex.input+'='+r.tex.exact+(r.tex.approx?'\\approx '+r.tex.approx:''),true);
    q('#cl-di-body').hidden=false;say(st,'');}
  catch(e){q('#cl-di-body').hidden=true;q('#cl-di-out').innerHTML='';say(st,e.message||'Something went wrong evaluating that expression.','err');}}
const DIEX=[['x^2','0','3'],['sin(x)','0','pi'],['e^x','0','1'],['1/x','1','e'],['1/(1+x^2)','0','1'],['x*e^x','0','1'],['sqrt(x)','0','4'],['2x*cos(x^2)','0','sqrt(pi)'],['x^3','3','0'],['cos(x)^2','0','pi/2']];
q('#cl-di-ex').innerHTML=DIEX.map((e,i)=>'<button class="chip" type="button" data-i="'+i+'">'+esc(e[0])+' on ['+esc(e[1])+', '+esc(e[2])+']</button>').join('');
q('#cl-di-ex').onclick=e=>{const b=e.target.closest('button');if(!b)return;const x=DIEX[+b.dataset.i];q('#cl-di-f').value=x[0];q('#cl-di-a').value=x[1];q('#cl-di-b').value=x[2];runDef();};
q('#cl-di-run').onclick=runDef;['#cl-di-f','#cl-di-a','#cl-di-b'].forEach(s=>q(s).addEventListener('keydown',e=>{if(e.key==='Enter')runDef();}));
let t;new ResizeObserver(()=>{clearTimeout(t);t=setTimeout(()=>{if(!q('#cl-limits').hidden)drawL();if(!q('#cl-diff').hidden)drawD();},200);}).observe(q('#secCalculus'));
})();
