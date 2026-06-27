#!/bin/bash
echo "=== 登录超管账号 ==="
LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account":"17683255002","password":"123456"}')
TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | head -1 | sed 's/"token":"//;s/"//')
echo "Token: ${TOKEN:0:30}..."

echo ""
echo "=== stats/overview ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  http://localhost:3000/api/admin/stats/overview \
  -H "Authorization: Bearer $TOKEN"

curl -s http://localhost:3000/api/admin/stats/overview \
  -H "Authorization: Bearer $TOKEN" | head -c 500
echo ""

echo ""
echo "=== admin/keys ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  http://localhost:3000/api/admin/keys \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== admin/users ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== admin/action-logs ==="
curl -s -o /dev/null -w "HTTP %{http_code}\n" \
  http://localhost:3000/api/admin/action-logs \
  -H "Authorization: Bearer $TOKEN"

echo ""
echo "=== 最新容器日志（最后10行）==="
docker logs randu-app --tail 10 2>&1
