#!/bin/bash

echo "📊 启动A股短线宝..."

# 启动后端服务
echo "🔧 启动后端服务 (端口 3001)..."
cd backend && npm start &
BACKEND_PID=$!

# 等待后端启动
sleep 2

# 启动前端服务
echo "🎨 启动前端服务 (端口 5173)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ 服务已启动:"
echo "   前端: http://localhost:5173"
echo "   后端: http://localhost:3001"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待信号
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
