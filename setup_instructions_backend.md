// Install Phyton
brew install python

// Instal pip for Phyton
python3 -m ensurepip --upgrade

// without a virtual environment
pip3 install fastapi uvicorn openai --break-system-packages

// install OpenAI API, FastAPI (for API) и Uvicorn (start back server)
pip3 install fastapi uvicorn openai

// create .env for GPT key
touch .env

OPENAI_API_KEY=sk-...key...

// add lybrary to read the key
pip3 install python-dotenv --break-system-packages

//add code in api.py
from dotenv import load_dotenv
load_dotenv()
