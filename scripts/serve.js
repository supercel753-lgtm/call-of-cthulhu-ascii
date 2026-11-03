// Servidor de desenvolvimento sem dependências. Remove apenas o front matter.
// Para compilar com Jekyll de verdade: bundle exec jekyll serve.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8080);
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.wav':'audio/wav','.ico':'image/x-icon'};
http.createServer(async (req,res) => {
  try {
    let pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const file = path.resolve(root,'.'+pathname);
    const relative = path.relative(root,file);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
      res.writeHead(403); res.end('Acesso negado'); return;
    }
    let bytes = await fs.readFile(file);
    if (path.extname(file)==='.html') bytes=Buffer.from(bytes.toString().replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,''));
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain; charset=utf-8','Cache-Control':'no-store'});
    res.end(bytes);
  } catch {res.writeHead(404);res.end('Arquivo não encontrado');}
}).listen(port,'127.0.0.1',()=>console.log(`Ecos do Abismo: http://127.0.0.1:${port}`));
