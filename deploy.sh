#!/usr/bin/env bash

if [ "${1}" == "dev" ]; then
  server=ubuntu@35.158.213.131
elif [ "${1}" == "prod" ]; then
  server=ubuntu@35.158.213.131
else
  echo "Expected dev or prod as argument"
  exit 0
fi

npm run build

if [ "${1}" == "dev" ]; then
  rsync -avz --delete -e 'ssh' "dist/" "${server}:tsmeanampdev/dist"
elif [ "${1}" == "prod" ]; then
  rsync -avz --delete -e 'ssh' "dist/" "${server}:tsmeanamp/dist"
fi

echo "Done!"
