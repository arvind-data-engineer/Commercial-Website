from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class MockHandler(BaseHTTPRequestHandler):
    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def do_POST(self):
        if self.path == '/mock-form':
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length) if length else b''
            # Try parse JSON, fall back to form-encoded
            try:
                data = json.loads(body) if body else {}
            except Exception:
                import urllib.parse
                parsed = urllib.parse.parse_qs(body.decode())
                data = {k: v[0] if isinstance(v, list) and len(v)>0 else v for k,v in parsed.items()}
            print('Received mock submission:', data)
            self._set_headers(200)
            resp = {'status': 'ok', 'received': data}
            self.wfile.write(json.dumps(resp).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'not found'}).encode())

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 9000), MockHandler)
    print('Mock form server listening on http://localhost:9000')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nShutting down')
        server.server_close()
