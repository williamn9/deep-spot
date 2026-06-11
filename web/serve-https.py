#!/usr/bin/env python3
"""Serve Deep Spot over HTTPS (required for iPhone gyro)."""
import http.server
import os
import socket
import ssl
import subprocess
import sys

PORT = int(os.environ.get('PORT', '8766'))
DIR = os.path.dirname(os.path.abspath(__file__))
CERT = os.path.join(DIR, '.cert.pem')
KEY = os.path.join(DIR, '.key.pem')


def ensure_cert():
    if os.path.exists(CERT) and os.path.exists(KEY):
        return
    print('Generating self-signed certificate (one-time)...')
    subprocess.run(
        [
            'openssl', 'req', '-x509', '-newkey', 'rsa:2048',
            '-keyout', KEY, '-out', CERT,
            '-days', '365', '-nodes',
            '-subj', '/CN=localhost',
        ],
        check=True,
    )


def local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except OSError:
        return '127.0.0.1'


def main():
    ensure_cert()
    os.chdir(DIR)

    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(('0.0.0.0', PORT), handler)

    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)

    ip = local_ip()
    print()
    print('Deep Spot — HTTPS server running')
    print(f'  On this Mac:  https://localhost:{PORT}')
    print(f'  On your phone: https://{ip}:{PORT}')
    print()
    print('On iPhone: accept the certificate warning, then tap Start Dive')
    print('           and allow Motion & Orientation when prompted.')
    print()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\nStopped.')
        sys.exit(0)


if __name__ == '__main__':
    main()
