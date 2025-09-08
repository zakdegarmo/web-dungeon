
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

### Step 4: Run the Development Server

Start the local server with the following command:

```bash
vercel dev
```

This will start a server (usually on `http://localhost:3000`) that serves your React application and also runs your serverless functions from the `/api` directory.

## Using AI Features (MOOSE-BOT & Universe Generation)

To enable the AI-powered features, you need to provide your own Google Gemini API key.

1.  **Get a Gemini API Key:** Visit [Google AI Studio](https://aistudio.google.com/app/apikey) to create your API key.
2.  **Enter the Key in the App:** Once you have your key, paste it into the "Enter Gemini API Key..." input field at the bottom of the MOOSE application screen. The key is stored locally in your browser and is required for all AI interactions.

## Deployment

To deploy your project to Vercel, simply run:

```bash
vercel --prod
```
