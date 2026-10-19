"""Servidor local para revisar la web como la sirve Netlify.

- Rutas limpias: /sobre-mi sirve sobre-mi.html (como Netlify).
- Lo que no existe devuelve 404.html con estado 404.
- No aplica los 301 de netlify.toml ni sus cabeceras: eso solo se ve en Netlify.

Uso (desde la raíz del repo):  python ismaelnlai-web/tests/serve.py [puerto]
"""
import http.server
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        path = self.path.split('?', 1)[0].split('#', 1)[0]
        local = self.translate_path(path)
        if not os.path.exists(local) and not os.path.splitext(local)[1] and os.path.exists(local + '.html'):
            self.path = path + '.html'
            return super().send_head()
        if not os.path.exists(local):
            self.send_response(404)
            body = open(os.path.join(ROOT, '404.html'), 'rb').read()
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return None
        return super().send_head()

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    http.server.ThreadingHTTPServer(('127.0.0.1', port), Handler).serve_forever()
