yarn install
yarn build
pm2 stop armada-battleship
pm2 start armada-battleship
pm2 save
sudo service nginx restart
