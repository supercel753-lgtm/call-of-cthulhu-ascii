import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
test('servidor local entrega HTML, módulos, PNG e WAV com MIME correto',async()=>{
 const port=19000+Math.floor(Math.random()*3000),base=`http://127.0.0.1:${port}`;
 const child=spawn(process.execPath,['scripts/serve.js'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:'ignore'});
 try{
  let connected=false;
  for(let i=0;i<25;i++){
   try{const r=await fetch(base,{signal:AbortSignal.timeout(500)});if(r.status===200){connected=true;break;}}catch{}
   await new Promise(r=>setTimeout(r,75));
  }
  assert.ok(connected,'HTTP inicializa');
  const checks=[['/','text/html','<!doctype html>'],['/src/main.js','text/javascript','initRenderer'],['/src/renderer.js','text/javascript','buildScene'],['/assets/tiles/porto.png','image/png',null],['/assets/sprites/props.png','image/png',null],['/assets/audio/porto.wav','audio/wav',null]];
  for(const [url,mime,snippet]of checks){const r=await fetch(base+url);assert.equal(r.status,200,url);assert.ok(r.headers.get('content-type')?.includes(mime),url);const buffer=await r.arrayBuffer();assert.ok(buffer.byteLength>500,url);if(snippet)assert.ok(new TextDecoder().decode(buffer).includes(snippet));}
  const page=await(await fetch(base)).text();assert.ok(!page.startsWith('---'),'servidor remove front matter de Jekyll');
  const traversal=await fetch(base+'/../../etc/passwd');assert.notEqual(traversal.status,200);
 }finally{child.kill('SIGTERM');}
});
