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


// back eng connection in nginx
sudo nano /etc/nginx/sites-available/Unlim-Mind-AI

location /api/ {
    proxy_pass http://localhost:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}

//restart nginx
sudo nginx -t
sudo systemctl restart nginx


// SSL Certificat
sudo certbot --nginx -d unlimcode.com -d www.unlimcode.com
