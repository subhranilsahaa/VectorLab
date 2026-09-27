/* ---- null space explorer (reuses the Row reduction lab's matrix, R3) ---- */
function nsCompute(){
  if(!R3.full)return;
  const {full,n,F,disp}=R3,pivots=full.pivots,rr=full.rref,pcset=new Set(pivots.map(p=>p[1]));
  const free=[];for(let j=0;j<n;j++)if(!pcset.has(j))free.push(j);
  const basis=free.map(fj=>{
    const vec=Array.from({length:n},()=>F.zero);vec[fj]=F.one;
    pivots.forEach(([r,c])=>{vec[c]=F.neg(rr[r][fj]);});
    return vec;
  });
  R3.ns={free,pivotCols:[...pcset],basis,nullity:free.length,rank:pivots.length,cols:n,F,disp};
  nsRenderText();
  if(tab===4)nsDraw();
}
function nsRenderText(){
  const ns=R3.ns,box=$('#nsbody');if(!ns||!box)return;
  const {free,pivotCols,basis,nullity,rank,cols,F,disp}=ns,varName=j=>'x'+SUB[j];
  let html=`<dl class="facts">
    <dt>Rank</dt><dd>${rank}</dd>
    <dt>Nullity</dt><dd>${nullity}</dd>
    <dt>Free variables</dt><dd>${free.length?free.map(varName).join(', '):'none'}</dd>
    <dt>Pivot variables</dt><dd>${pivotCols.length?pivotCols.map(varName).join(', '):'none'}</dd>
  </dl><h3 class="eh" style="margin:14px 0 6px">Solutions to Ax = 0</h3>`;
  if(!nullity)html+='<p class="hint">Only the trivial solution x = 0. The null space is {0}.</p>';
  else{
    html+=basis.map((vec,k)=>`<div class="nsrow"><span class="nstag">basis</span><b>n${SUB[k]||k+1} =</b> (${vec.map(v=>showVal(F,v,disp)).join(', ')})</div>`).join('');
    html+=`<p class="hint" style="margin-top:8px">Every solution to Ax = 0 is a linear combination of ${nullity>1?'these basis vectors':'this basis vector'}.</p>`;
  }
  html+=`<div class="rntheorem">rank(A) + nullity(A) = columns(A) &nbsp;→&nbsp; ${rank} + ${nullity} = ${cols} <span class="ok">✓</span></div>`;
  box.innerHTML=html;
}
function nsDraw(){
  const ns=R3.ns;if(!ns)return;
  const tooHigh=ns.cols>3,wrap=$('#nscwrap'),th=$('#nstoohigh'),cc=$('#nscamctrl'),lg=$('#nslegend');
  if(th)th.hidden=!tooHigh;if(wrap)wrap.hidden=tooHigh;if(cc)cc.hidden=tooHigh;if(lg)lg.hidden=tooHigh;
  if(tooHigh||!H3N||!H3N.resize())return;
  H3N.clearContent();
  const toN=x=>typeof x==='number'?x:ns.F.toNum(x);
  const vecs3=ns.basis.map(v=>[toN(v[0]),v.length>1?toN(v[1]):0,v.length>2?toN(v[2]):0]);
  const amber=0xffc857;
  if(ns.nullity===0)addPointMarker(H3N,amber);
  else if(ns.nullity===1)addLineSpan(H3N,vecs3[0],amber);
  else if(ns.nullity===2)addPlaneSpan(H3N,vecs3[0],vecs3[1],amber);
  else addParallelepiped(H3N,vecs3[0],vecs3[1],vecs3[2],amber);
  const maxMag=Math.max(1,...vecs3.map(v=>Math.hypot(v[0],v[1],v[2])));
  H3N.setFit(maxMag);
  if(!H3N._framed){H3N.frame();H3N._framed=true;}
  H3N.render();
}

/* ---- init 3D engine (guarded so Phases 1-3 keep working even if it fails) ---- */
var H3V=null,H3M=null,H3N=null;
if(typeof THREE!=='undefined'){
  try{
    document.querySelectorAll('.c3load').forEach(el=>el.hidden=true);
    H3V=make3D($('#c3v'));H3M=make3D($('#c3m'));H3N=make3D($('#c3n'));
    v3RenderList();v3RenderFacts();
    m3RenderInputs();m3Draw();
  }catch(e){console.error('3D init error',e);}
}else{
  document.querySelectorAll('.c3load').forEach(el=>{el.hidden=false;el.textContent='3D engine failed to load — check your connection and reload.';});
  ['#v3resetcam','#m3resetcam','#nsresetcam'].forEach(s=>{const b=$(s);if(b)b.disabled=true;});
}

