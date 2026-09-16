# Café Website — Client Setup & Management Guide

Welcome to your new café website! This document provides all the instructions you need to set up, run, update content, change images, and deploy your website.

---

## 🚀 Quick Setup (One-Command Installation)

### Prerequisites
- **Node.js**: Download and install [Node.js (v18 or higher)](https://nodejs.org/).

### 1-Step Setup Command
Open your terminal in the project directory and run:

```bash
npm run setup
```

This single command will:
1. Verify your Node.js & npm environment.
2. Prepare your `.env` configuration files automatically.
3. Validate your application setup.

---

## 💻 Running the Website Locally

To start the website on your local computer:

```bash
npm run dev
```

Open your browser and navigate to:
`http://localhost:5173`

If you also wish to run the contact API server locally:
```bash
npm run dev:server
```

---

## ✍️ Updating Café Content & Information

All text and menu data are organized clearly within the codebase so you can update them easily:

### 1. Menu Items & Prices
- **File Location**: [`src/data/menuData.ts`](file:///e:/projesct01/src/data/menuData.ts)
- Open this file to edit dish names, descriptions, categories (`breakfast`, `lunch`, `drinks`, `desserts`), and prices.

### 2. General Café Info, Address, and Hours
- **Home Page**: [`src/pages/HomePage.tsx`](file:///e:/projesct01/src/pages/HomePage.tsx)
- **About Page**: [`src/pages/AboutPage.tsx`](file:///e:/projesct01/src/pages/AboutPage.tsx)
- **Contact Page**: [`src/pages/ContactPage.tsx`](file:///e:/projesct01/src/pages/ContactPage.tsx)
- **Navigation & Footer**: [`src/components/navigation/Header.tsx`](file:///e:/projesct01/src/components/navigation/Header.tsx) and [`src/components/layout/Footer.tsx`](file:///e:/projesct01/src/components/layout/Footer.tsx)

---

## 🖼️ Replacing Café Photography & Images

Café images are stored in the `public/assets/` folder:

- **Hero Background Image**: Replace [`public/assets/hero.jpg`](file:///e:/projesct01/public/assets/hero.jpg)
- **About / Craft Story Image**: Replace [`public/assets/story.jpg`](file:///e:/projesct01/public/assets/story.jpg)

*Tip: Keep the same filenames (`hero.jpg` and `story.jpg`) when dropping in your new photos.*

---

## 📬 Contact Form & Email Delivery

The contact form allows visitors to send inquiries directly from the website:

- **Without Configuration**: Inquiries are logged cleanly to the server logs and confirm successful receipt to visitors.
- **With Email Delivery (Optional)**: If you'd like contact messages delivered to your email inbox:
  1. Sign up for a free account at [Resend.com](https://resend.com).
  2. Copy your API Key.
  3. Open `server/.env` and paste:
     ```ini
     RESEND_API_KEY=your_resend_api_key_here
     EMAIL_TO=your_cafe_email@domain.com
     ```

---

## 📦 Building & Production Deployment

### Building the Project
To create an optimized production build:

```bash
npm run build
```

### Hosting Options
- **Vercel / Netlify**: Connect your GitHub repository to Vercel or Netlify for instant zero-configuration deployment.
- **Render / Railway**: For hosting the optional Node.js contact server, connect the `server/` directory.

---

## 🛡️ Security Guidelines

- **Never commit `.env` files**: Secret keys and environment configurations are kept in `.env` and are automatically ignored by Git.
- **API Key Protection**: Never expose private API keys in client-side frontend code.

---

## ❓ System Health Check

You can verify your environment configuration at any time by running:

```bash
npm run check
```

For further technical details, developer references are located in the internal documentation directory.
