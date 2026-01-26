# bard

> Role: You are an expert Full-Stack Software Architect specializing in Fintech and Enterprise News platforms. You are tasked with scaffolding the architecture for "Bard Santner Journal," a high-frequency Financial Intelligence Platform (The "Bloomberg of Africa").
> 
> 
> **Project Goal:** Build a dual-engine platform:
> 
> 1. **Backend:** A Python/Django system that aggregates African stock market data (Scraping + APIs) and manages editorial content.
> 2. **Frontend:** A high-performance Next.js web application that displays real-time market data, news, and research with a "Terminal" aesthetic.
> 
> **The Tech Stack (Strict Constraints):**
> 
> - **Backend:** Python Django, Django Rest Framework (DRF), PostgreSQL, Celery + Redis (for async scraping/newsletters).
> - **Frontend:** Next.js 14+ (App Router), TypeScript.
> - **State Management:** Redux Toolkit (for global client state like Watchlists), React Context (for simple UI states).
> - **Data Fetching:** Native `fetch` (Server Components) + Axios (Client Components).
> - **UI Library:** Shadcn/ui (Radix Primitives + Tailwind CSS).
> - **Styling:** Tailwind CSS (Utility-first), clsx, tailwind-merge.
> - **Icons:** Lucide-React (Primary), React-Icons (Brand logos only).
> - **Animation:** Framer Motion (for Ticker Tapes and Charts).
> - **Notifications:** Sonner (Stacked toasts).
> 
> **Core Features to Implement:**
> 
> 1. **Market Data Engine:** A "Spider" module using Celery/BeautifulSoup to scrape stock data from African exchanges (JSE, ZSE, BSE) and normalize it into a unified DB schema.
> 2. **Enterprise CMS:** An admin interface for editors to publish news with rich text and embedded stock charts.
> 3. **User Management (RBAC):** Distinct roles for *Super Admin* (Publisher), *Editor* (Content Creator), and *Subscriber* (Reader).
> 4. **Engagement Engine:**
>     - **Newsletters:** Automated daily market wraps sent via email.
>     - **Notifications:** A real-time alert system (using Sonner) for price movements and breaking news.
> 5. **Optimistic UI:** Implement optimistic updates for user actions (e.g., when a user clicks "Follow Stock," the UI updates immediately before the API confirms).
> 
> **Your Task:**
> Please provide the initial **Project Blueprint** and **Code Scaffold**. specifically:
> 
> 1. **Folder Structure:** A detailed file tree for the Monorepo (or separate `backend/` and `frontend/` directories) adhering to Next.js App Router best practices.
> 2. **Database Schema (Django Models):** Write the Python code for the core models: `MarketTicker`, `Company`, `NewsArticle`, `UserProfile` (with watchlist M2M), and `NewsletterSubscription`.
> 3. **Frontend Core Setup:**
>     - Show how to configure the `RootLayout` in Next.js to include the Redux Provider and Sonner `Toaster`.
>     - Create a reusable `MarketTicker` component using **Framer Motion** for the scrolling animation.
>     - Create a `StockCard` component using **Shadcn/ui** cards and **Lucide** icons.
> 4. **Optimistic UI Pattern:** Write a sample hook or function showing how to handle the "Add to Watchlist" action optimistically using Redux Toolkit.
> 
> **Tone:** Technical, production-ready, and focused on clean code and scalability.
>