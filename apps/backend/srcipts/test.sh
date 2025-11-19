#!/usr/bin/env bash
curl -X POST http://localhost:3000/api/user/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json"

# curl -X POST http://localhost:3000/api/user/login -d '{"email": "lisi@example.com", "password": "123456"}' -H "Content-Type: application/json"