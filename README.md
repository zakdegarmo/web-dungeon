# MOOSE - My Ontological Operating System Environment

This project is an immersive 3D scene that displays web pages on virtual screens, featuring an AI assistant, MOOSE-BOT.

## Local Development Setup

Because this project uses Vercel Serverless Functions (located in the `/api` directory), you cannot run it with a standard development server. You must use the Vercel CLI to properly emulate the production environment locally.

### Prerequisites

1.  **Node.js:** Ensure you have Node.js installed.
2.  **Vercel Account:** You need a free Vercel account.

### Step 1: Install the Vercel CLI

If you don't have it installed, open your terminal and run:

```bash
npm install -g vercel
```

### Step 2: Log In to Vercel

Connect the CLI to your Vercel account:

```bash
vercel login
```

### Step 3: Link the Project

Navigate to your project's root directory in the terminal and link it to your Vercel project. The CLI will guide you.

```bash
vercel link
```

### Step 4: Set Up Environment Variables

The AI chat bot requires a Gemini API key. Create a file named `.env.local` in the root of your project. **This file should not be committed to version control.**

Inside `.env.local`, add your API key:

```
API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

The Vercel CLI will automatically load this variable when you run the dev server. The frontend will ask for this key in the UI, which is then sent to the backend function.

### Step 5: Run the Development Server

Start the local server with the following command:

```bash
vercel dev
```

This will start a server (usually on `http://localhost:3000`) that serves your React application and also runs your serverless functions from the `/api` directory. Your `fetch('/api/chat-with-bot')` calls will now work correctly.

## Deployment

To deploy your project to Vercel, simply run:

```bash
vercel --prod
```

Make sure to set your `API_KEY` as an environment variable in your Vercel project settings on their website.
