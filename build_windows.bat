@echo off
echo 1. 建置前端 React 專案...
cd frontend
call npm install
call npm run build
cd ..

echo 2. 安裝後端打包套件...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate.bat
pip install -r requirements.txt
pip install pyinstaller

echo 3. 執行 PyInstaller 進行打包...
pyinstaller --name "ShopeeAutoSelect_Win" ^
            --add-data "../frontend/dist;frontend/dist" ^
            --noconfirm ^
            --clean ^
            run.py

echo 打包完成！執行檔位於 backend\dist\ShopeeAutoSelect_Win
pause
