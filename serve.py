"""無快取本機伺服器：避免瀏覽器 cache 舊的 ES module。
用法： python serve.py [port] [directory]
"""
import http.server
import socketserver
import functools
import sys

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
directory = sys.argv[2] if len(sys.argv) > 2 else "."


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


Handler = functools.partial(NoCacheHandler, directory=directory)
with socketserver.TCPServer(("", port), Handler) as httpd:
    print(f"serving '{directory}' at http://localhost:{port} (no-cache)")
    httpd.serve_forever()
