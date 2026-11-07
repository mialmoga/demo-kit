const fs=require('fs'),vm=require('vm');
const src=['demo_kit.js','engine.js'].map(f=>fs.readFileSync(f,'utf8')).join('\n')+`
;(async()=>{
 for(const f of ['cotton_sugar.js','the_void.js']){
  const s=require('fs').readFileSync(f,'utf8'); let t=Date.now();
  const {project:P,stats}=await recordDemo(s); const tConv=Date.now()-t;
  console.log(f,JSON.stringify(stats),'bpm',P.bpm,'bars',P.bars,'sc',P.sc.mode,P.sc.depth,'tConv',tConv+'ms');
  console.log(P.tracks.map(t=>t.name+':'+t.inst+'('+t.notes.length+(t.notes.some(n=>n.o)?'*':'')+')').join(' | '));
  t=Date.now(); const out=await renderProject(P); console.log('render converted',(Date.now()-t)+'ms','errors',JSON.stringify(out.errors));
  const fn=new Function('demoKit','sleep',s+'\\nreturn '+(/async\\s+function\\s+(render\\w*)/.exec(s)[1])+';')(demoKit,sleep);
  t=Date.now(); const orig=await fn(SR,null); console.log('render original',(Date.now()-t)+'ms');
  const rms=a=>{let s=0;for(let i=0;i<a.length;i++)s+=a[i]*a[i];return Math.sqrt(s/a.length);};
  const n=Math.min(out.L.length,orig.L.length); let dot=0,e1=0,e2=0; 
  // compare energy in 1s windows (phases random → compare envelopes, not waveforms)
  const W=SR; let maxRatio=0,sumAbs=0,cnt=0;
  for(let i=0;i+W<=n;i+=W){let a=0,b=0;for(let j=i;j<i+W;j++){a+=out.L[j]**2;b+=orig.L[j]**2;} a=Math.sqrt(a/W);b=Math.sqrt(b/W); if(b>1e-4){const r=a/b; sumAbs+=Math.abs(Math.log(r)); cnt++; maxRatio=Math.max(maxRatio,Math.abs(Math.log(r)));}}
  console.log('len conv/orig',out.L.length,orig.L.length,'rms',rms(out.L).toFixed(4),rms(orig.L).toFixed(4),'mean|ln ratio| per-second',(sumAbs/cnt).toFixed(3),'max',maxRatio.toFixed(3),'nan?',out.L.some(Number.isNaN));
 }
 // proyecto de ejemplo + serialización
 const E=starterProject(); const o=await renderProject(E); console.log('starter ok',o.L.length,JSON.stringify(o.errors));
 const j=JSON.stringify(projectToJSON(E)); const E2=projectFromJSON(JSON.parse(j)); console.log('roundtrip tracks',E2.tracks.length,'json KB',(j.length/1024).toFixed(0));
})().catch(e=>{console.error('FALLO',e);process.exit(1)});
`;
global.require=require; global.performance=performance;
vm.runInThisContext(src,{filename:'test'});
