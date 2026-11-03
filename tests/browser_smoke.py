#!/usr/bin/env python3
"""Teste opcional de interface real com Chromium CDP.
Precisa servidor HTTP local, Chromium com remote-debugging-port e websocket-client.
Executa criação, exploração, áudio/UI, persistência e responsividade.
Não é requerido para o jogo em produção.
"""
import os,sys,time,json,base64,urllib.request,urllib.parse
from pathlib import Path
import websocket
WEB=os.environ.get('ECOS_URL','http://127.0.0.1:8187')
CDP=os.environ.get('ECOS_CDP','http://127.0.0.1:9229')
ART=Path(os.environ.get('ECOS_QA','../qa'));ART.mkdir(parents=True,exist_ok=True)
req=urllib.request.Request(CDP+'/json/new?'+urllib.parse.quote(WEB,safe=':/'),method='PUT')
tab=json.load(urllib.request.urlopen(req,timeout=20))
ws=websocket.create_connection(tab['webSocketDebuggerUrl'],timeout=50,origin='http://localhost')
errors=[];network=[];i=0

def cmd(method,params=None):
 global i
 i+=1;myid=i
 ws.send(json.dumps({'id':myid,'method':method,'params':params or {}}))
 while True:
  raw=json.loads(ws.recv())
  meth=raw.get('method','')
  if meth=='Runtime.exceptionThrown':errors.append(raw['params'].get('exceptionDetails',{}).get('text','unknown'))
  if meth=='Log.entryAdded':
   entry=raw.get('params',{}).get('entry',{})
   if entry.get('level')=='error':errors.append(entry.get('text',''))
  if meth=='Network.loadingFailed':network.append(raw['params'].get('errorText',''))
  if raw.get('id')==myid:
   if 'error' in raw:raise RuntimeError(raw['error'])
   return raw.get('result',{})

def run(expression):
 result=cmd('Runtime.evaluate',{'expression':expression,'returnByValue':True,'awaitPromise':True})
 if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'].get('text'))
 return result.get('result',{}).get('value')

def shot(name):
 raw=cmd('Page.captureScreenshot',{'format':'png','fromSurface':True,'captureBeyondViewport':False})
 path=ART/name;path.write_bytes(base64.b64decode(raw['data']));print('PNG',path)

def click(selector,index=0):
 return run(f"(()=>{{let a=document.querySelectorAll({json.dumps(selector)});if(!a[{index}])throw Error('button missing: '+{json.dumps(selector)});a[{index}].click();return document.getElementById('modalTitle').textContent}})()")

def key(k):return run(f"document.dispatchEvent(new KeyboardEvent('keydown',{{key:{json.dumps(k)},bubbles:true}}));true")

def expect(cond,message):
 if not cond:raise AssertionError(message)
 print('PASS',message)

cmd('Page.enable');cmd('Runtime.enable');cmd('Log.enable');cmd('Network.enable')
cmd('Emulation.setDeviceMetricsOverride',{'width':1480,'height':1040,'deviceScaleFactor':1,'mobile':False})
time.sleep(3)
print('initial title',run("document.title"))
expect(run("document.querySelector('#modal').open"),'intro abre como diálogo')
print('resource report',run("import('./src/renderer.js').then(m=>m.getAssetReport())"))
expect(run("import('./src/renderer.js').then(m=>m.getAssetReport().loaded)"),'imagens concluíram carregamento')
shot('01_abertura_desktop.png')
click('#modalActions button',0) # intro -> start
click('#modalActions button',0) # select detective -> sheet
expect(run("document.querySelectorAll('.skill-row').length") == 7,'ficha preserva sete atributos')
for idx,count in [(0,4),(1,2),(2,2),(6,2)]:
 for _ in range(count):run(f"document.querySelectorAll('.skill-row')[{idx}].querySelector('.skill-controls button:last-child').click()")
expect(not run('document.querySelector("#modalActions button").disabled'),'dez pontos distribuídos')
click('#modalActions button',0) # start game
expect(not run("document.querySelector('#modal').open"),'exploração inicializa')
expect(run("document.querySelector('#location').textContent.includes('Porto')"),'porto visível')
expect(run("document.querySelector('#map').width===185"),'minimapa usa Canvas')
expect(run("import('./src/renderer.js').then(m=>m.getAssetReport().count)") == 20,'20 spritesheets e panoramas PNG carregados')
shot('02_exploracao_desktop.png')
for k in ['d','d','d','w'] :key(k)
expect(run("document.querySelector('#near').textContent.includes('Elias')"),'movimentação e detecção NPC')
key('e')
expect(run("document.querySelector('#modalTitle').textContent.includes('travessia')"),'diálogo do Elias acessível')
click('#modalActions button',0)
expect(not run("document.querySelector('#modal').open"),'consequência da escolha aplicada')
key('i')
expect(run("document.querySelectorAll('.inventory-card').length")>=3,'inventário visual funciona')
click('#modalActions button',0)
key('j')
expect(run("document.querySelector('#modalTitle').textContent.includes('Dossiê')"),'diário abre')
click('#modalActions button',0)
key('Escape')
expect(run("document.querySelector('#modalTitle').textContent.includes('pausada')"),'menu de pausa abre')
click('#modalActions button',0)
click('#save')
expect(run("localStorage.getItem('ecos-abismo-v1')!==null"),'salvamento local existe')
click('#modalActions button',0)
click('#load')
expect(run("document.querySelector('#modalTitle').textContent.includes('carregada')"),'carregamento restaura')
click('#modalActions button',0)
click('#settings')
expect(run("document.querySelectorAll('.settings-group input[type=range]').length") == 1,'volume disponível')
click('#modalActions button',0)
cmd('Emulation.setDeviceMetricsOverride',{'width':390,'height':844,'deviceScaleFactor':1,'mobile':True})
time.sleep(2)
expect(run('document.documentElement.scrollWidth<=window.innerWidth+3'),'layout móvel sem transbordamento horizontal')
shot('03_exploracao_mobile.png')
cmd('Emulation.setDeviceMetricsOverride',{'width':768,'height':960,'deviceScaleFactor':1,'mobile':True})
time.sleep(.7)
expect(run('document.documentElement.scrollWidth<=window.innerWidth+3'),'layout tablet sem transbordamento horizontal')
print('console errors:',errors)
print('network errors:',network)
expect(not errors,'console sem exceções ou erros')
expect(not network,'recursos do navegador sem falhas')
print('BROWSER QA COMPLETE')
ws.close()
