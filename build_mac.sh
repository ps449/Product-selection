#!/bin/bash
# 台灣蝦皮選品自動化流程 - Mac 打包腳本

echo "1. 建置前端 React 專案..."
cd frontend
npm install
npm run build
cd ..

echo "2. 安裝後端打包套件..."
cd backend
source venv/bin/activate
pip install pyinstaller

echo "3. 執行 PyInstaller 進行打包..."
# 將前端 dist 目錄複製進來，或者打包時加入 (利用 --add-data)
pyinstaller --name "ShopeeAutoSelect_Mac" \
            --add-data "../frontend/dist:frontend/dist" \
            --noconfirm \
            --clean \
            run.py

echo "打包完成！執行檔位於 backend/dist/ShopeeAutoSelect_Mac"
