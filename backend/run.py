import uvicorn
import os
import sys
from main import app

def main():
    # If running in a PyInstaller bundle, we might need to adjust paths.
    # For MVP, we just start uvicorn programmatically.
    uvicorn.run(app, host="127.0.0.1", port=8000)

if __name__ == "__main__":
    main()
