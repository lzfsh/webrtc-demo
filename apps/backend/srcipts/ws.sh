#!/usr/bin/env bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json" | jq '.data.token' --raw-output)

websocat -E -vvvv  ws://localhost:3000/api/ws/connect?token=$TOKEN
