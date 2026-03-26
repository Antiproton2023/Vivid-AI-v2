# VividAI

VividAI is a full-stack production-ready web application that transforms a user's raw idea into a structured, multi-perspective, execution-ready system using AI.

## Features
- **Idea Input Chatbot**: Iterative chat to refine your startup idea using the Groq high-speed API.
- **Auto-System Architecture Generation**: Generates full features, risk analysis, and comprehensive business models.
- **Architect/Critic Analysis**: View Mermaid.js flowcharts to map your product strategy.
- **Persistency**: Fully integrated Supabase Auth & PostgreSQL storage to track all versions forever across the system.
- **Modern UI**: Dark-mode primary colors (vibrant blue & whites) to ensure dynamic responsiveness.

## Tech Stack
- Next.js 15 (App Router)
- React 19
- Tailwind CSS
- Zustand for Global Context
- Groq Cloud API
- Supabase Auth & Database
- Mermaid.js integration

## Setup
### 1. Requirements
Ensure you have `npm` or `pnpm` installed. Run standard installations:

```bash
npm install
```

### 2. Prepare Databases and Connections
Set up a Supabase Project and fetch your keys. Do the same for Groq API.
1. Create a `.env.local` using the `.env.example` as a template and follow `SUPABASE_SETUP.md` & `GROQ_SETUP.md`.

```bash
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON
GROQ_API_KEY=YOUR_GROQ_KEY
```

3. Run migrations locally in the `SUPABASE_SETUP.md` SQL block within your cloud dashboard.

### 3. Run Application
Run the web application locally.
```bash
npm run dev
```

Visit the platform on `http://localhost:3000`.

## 🚀 Deployment (Vercel + GitHub)

Follow these exact steps to deploy Vivid AI to production using the GitHub commit method.

### 1. Push to GitHub
1. Create a new **Private** or **Public** repository on [GitHub](https://github.com/new).
2. Initialize and push your local code:
   ```bash
   git init
   git add .
   git commit -m "Deploy: First launch"
   git remote add origin https://github.com/your-username/your-repo-name.git
   git branch -M main
   git push -u origin main
   ```

### 2. Connect to Vercel
1. Log in to the [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository from the list and click **Import**.

### 3. Configure Environment Variables
In the **Configure Project** screen, expand the **Environment Variables** section and add the following keys exactly as shown:

| Key | Value | Note |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xyz.supabase.co` | From Supabase Project Settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` | From Supabase Project Settings |
| `GROQ_API_KEY` | `gsk_your-groq-key` | From Groq Cloud Console |

### 4. Deploy & Verify
1. Click **Deploy**. Vercel will automatically detect Next.js 15 and begin the build.
2. Once complete, click the **Visit** button.
3. **Important**: Ensure you have executed the SQL blocks in `SUPABASE_SETUP.md` on your production Supabase database before trying to log in.

### 5. Continuous Deployment
Any future `git push` to your `main` branch will automatically trigger a new production build on Vercel.

