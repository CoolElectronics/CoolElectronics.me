rsync -a --progress --exclude 'node_modules' --exclude '.env' --exclude '.git' --exclude '/ftp' /home/ce/Documents/GitHub/CoolElectronics.me/ prod:/home/ubuntu/
ssh -t prod "pm2 restart index"