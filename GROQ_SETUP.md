# Groq Setup for VividAI

## 1. Getting an API Key
1. Go to the [Groq Console](https://console.groq.com/).
2. Sign in or create an account.
3. Navigate to the API Keys section and create a new key.
4. Copy the generated API key.

## 2. Environment Setup
1. Open your `.env.local` file in the project.
2. Add your Groq key as `GROQ_API_KEY`:
   ```env
   GROQ_API_KEY=gsk_YourAPIKeyHere
   ```
3. Restart your Next.js development server to apply changes.

## 3. Integration Details
- The integration lives entirely in `src/services/groqService.ts`.
- It dynamically queries Groq's high-speed API (using Llama 3) via Next.js Server Actions to ensure the secret key never leaks.

**Models used:**
- `llama-3.1-8b-instant` for very fast, structured responses with zero configuration overhead. 

We utilize strict prompting guidelines (forcing JSON responses without Markdown) for the backend data handling and UI rendering.
