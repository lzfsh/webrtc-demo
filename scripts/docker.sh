#!/usr/bin/env bash

# 在项目根目录下执行该脚本

# 启动数据库容器
docker compose up -d
# 将 sql 文件复制到数据库容器中
# docker compose cp ./db.sql db:/db.sql
# 读取 sql 文件内容，并在数据库容器内执行
docker compose exec -d db mysql -uroot -p123456 -e "$(cat ./scripts/db.sql)" demo
