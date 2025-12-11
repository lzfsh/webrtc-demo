#!/usr/bin/env bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json" | jq '.data.token' --raw-output)

curl -s -X GET http://localhost:3000/api/user/profile -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq '.'

curl -s -X POST http://localhost:3000/api/user/list -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"username": "wangwu"}' | jq '.'

curl -s -X POST http://localhost:3000/api/user/list -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" | jq '.'

curl -s -X POST http://localhost:3000/api/user/list -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"id": 3}' | jq '.'

curl -s -X POST http://localhost:3000/api/user/list -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"email": "lisi@example.com"}' | jq '.'