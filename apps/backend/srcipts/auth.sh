#!/usr/bin/env bash
curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "zhangsan@example.com", "password": "123456"}' -H "Content-Type: application/json" | jq '.'

curl -s -X POST http://localhost:3000/api/auth/login -d '{"email": "lisi@example.com", "password": "123456"}' -H "Content-Type: application/json" | jq '.'

curl -s -X POST http://localhost:3000/api/auth/register -d '{"email": "wangwu@example.com", "username": "wangwu", "password": "123456"}' -H "Content-Type: application/json" | jq '.'

curl -s -X POST http://localhost:3000/api/auth/register -d '{"email": "qianliu@example.com", "username": "qianliu", "password": "123456"}' -H "Content-Type: application/json" | jq '.'

