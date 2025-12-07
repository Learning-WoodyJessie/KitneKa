# Deployment Guide for KitneKa

Your code is now on GitHub: **https://github.com/Learning-WoodyJessie/KitneKa**

You can deploy this application for free using **Vercel** (Frontend) and **Render** (Backend).

## 1. Backend Deployment (Render.com)

1.  **Push your code to GitHub.**
2.  **Sign up/Login to Render.com**.
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Settings:**
    *   **Root Directory**: `BharatPricing/backend`
    *   **Runtime**: Python 3
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port 10000`
6.  **Environment Variables** (Add these in the "Environment" tab):
    *   `OPENAI_API_KEY`: (Your OpenAI Key)
    *   `SERPAPI_API_KEY`: (Your SerpApi Key)
    *   `PYTHON_VERSION`: `3.11.0` (Optional, recommended)
7.  Click **Deploy**.
8.  **Copy the URL** provided by Render (e.g., `https://bharatpricing-api.onrender.com`).

## 2. Frontend Deployment (Vercel)

1.  **Sign up/Login to Vercel.com**.
2.  Click **Add New...** -> **Project**.
3.  Import the same GitHub repository.
4.  **Framework Preset**: Vite
5.  **Root Directory**: Edit and select `BharatPricing/frontend`.
6.  **Environment Variables**:
    *   Name: `VITE_API_URL`
    *   Value: (Paste the Backend URL from Render, e.g., `https://bharatpricing-api.onrender.com`)
        *   *Note: Do not add a trailing slash.*
7.  Click **Deploy**.

## 3. Verify
*   Open your fresh Vercel URL.
*   Try a search. the Frontend will call the Backend on Render.

## Docker (Alternative)
A `Dockerfile` is included in `BharatPricing/backend` if you prefer to deploy using Docker (e.g., on Railway, Fly.io, or AWS).
