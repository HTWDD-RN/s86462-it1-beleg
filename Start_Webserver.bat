REM npm install -g http-server
REM python -m http.server 8000
http-server . -S -C 192.168.178.76.pem -K 192.168.178.76-key.pem -a 192.168.178.76 -p 8000
pause

openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout 192.168.178.76-key.pem -out 192.168.178.76.pem -subj "/C=DE/ST=Local/L=Local/O=Local/CN=192.168.178.76" -addext "subjectAltName = IP:192.168.178.76" -addext "basicConstraints = critical,CA:TRUE"
