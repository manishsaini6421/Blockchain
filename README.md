# Blockchain
file location :- /var/www/blockchain/


run blockchain server :- npm run dev

run node server (inside public):- node server.js

run ipfs node


nginx server conf :- /etc/nginx/conf.d


upstream upload_file{
        server localhost:3001;
}

upstream backend{

        server localhost:3000;
}

server{

        listen 80 default_server;
        listen [::]:80 default_server;
        root /var/www/blockchain;


        server_name blockchain.jado2aouhmqesawldhoksp63xogvram673ivafadellxnvp4wcdrlxqd.onion;


        index index.html index.htm;
location /{
                try_files $uri $uri/ =400;
        }


        location /upload{
              proxy_pass http://upload_file;
        }

        location /api/blocks{
                proxy_pass http://backend;
        }
}



