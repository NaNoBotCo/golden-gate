"""Serve docs/ at /golden-gate/ locally: python3 tools/serve.py [port]"""
import functools, http.server, os, sys
DOCS = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs")
port = int(sys.argv[1]) if len(sys.argv) > 1 else 8887
http.server.ThreadingHTTPServer(("127.0.0.1", port), functools.partial(http.server.SimpleHTTPRequestHandler, directory=DOCS)).serve_forever()
