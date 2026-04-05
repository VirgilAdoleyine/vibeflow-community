# VibeFlow 🌊

> **"If I’m 17 and I enjoy building with this, you’re going to love it for its simplicity."**

VibeFlow is an open-source, natural-language-first automation engine. It replaces the complex "spaghetti" of nodes and wires with a simple command bar. You talk to your apps, and VibeFlow handles the logic.

---

## 👨‍💻 My Story
Hi, I'm **Virgil Junior Adoleyine**, a 17-year-old student from **Ghana**. 

As I started getting into automation, I tried tools like **n8n** and **Zapier**. Honestly? I found them frustrating. They felt clunky, overwhelmed with buttons, and required a steep learning curve just to connect two apps. 

I wanted something that felt like a conversation, not a puzzle. So, I built **VibeFlow**. I designed it to be so simple that anyone can use it, but powerful enough that technical guys can still dive into the canvas and tweak things exactly like they would in n8n.

**This project is 100% free and I would love your contributions to make it the world's most intuitive automation platform.**

---

## 🧐 Brutally Honest Capabilities

### What VibeFlow IS:
*   **A Natural Language Powerhouse**: It uses Claude 3.5 Sonnet to translate your thoughts into working Python code instantly.
*   **Self-Healing**: If a script fails, the "Reflector" node diagnoses the error, patches the code, and retries automatically.
*   **Canvas-Ready**: For the "Technical Guys"—you can see and edit your automation logic on a visual canvas (powered by React Flow).
*   **Integrated**: 400+ OAuth integrations available out-of-the-box via Nango.
*   **Secure**: Every script runs in a isolated, ephemeral E2B sandbox.

### What VibeFlow IS NOT (Yet):
*   **Not an n8n Replacement (Yet)**: We don't have thousands of pre-built "nodes"—we rely on AI to write the logic for you.
*   **Alpha Software**: There will be bugs. The AI might sometimes hallucinate an API endpoint it doesn't know yet.
*   **Heavyweight**: This is built for speed and simplicity, not for massive enterprise-grade data pipelines (though we're working on it!).

---

## 🛠️ Step-by-Step Self-Hosting Guide

VibeFlow is designed to be hosted cheaply (or for free) using serverless tools.

### 1. Prerequisites
You will need accounts at the following (all have generous free tiers):
*   **Vercel** (Hosting)
*   **Neon.tech** (Postgres Database)
*   **Upstash** (Redis for Rate Limiting)
*   **E2B.dev** (Python Sandbox)
*   **Anthropic** (LLM Intelligence)
*   **Nango.dev** (OAuth Integrations)

### 2. Fork & Clone
```bash
git clone https://github.com/VirgilAdoleyine/vibeflow-community.git
cd vibeflow-community/vibeflow
npm install
```

### 3. Environment Setup
Create a `.env.local` file (copy from `.env.example`):
```bash
cp .env.example .env.local
```
Fill in your API keys. **Minimum required:** `ANTHROPIC_API_KEY`, `E2B_API_KEY`, and `DATABASE_URL`.

### 4. Database Setup
```bash
npm run db:migrate
```

### 5. Launch
```bash
npm run dev
```

---

## 🎨 Technical Canvas
Found the AI-generated logic isn't *quite* right? Swap to the **Canvas View**. You can visually see the flow of your automation and modify the prompts or logic directly, giving you total control over the state machine.

---

## 🤝 Contributing
I’m a 17-year-old student, and I can't build this alone! Whether it's adding new providers, fixing bugs, or improving the UI, I welcome all Pull Requests.

---

## 📜 License
This project is licensed under the **MIT License** — it's free to use, free to change, and free to share.

---
*Built with ❤️ in Ghana by Virgil Junior Adoleyine.*
