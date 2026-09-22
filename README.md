# Fanika

Fanika is a personal finance management app that helps users take control of their money — tracking income and expenses, managing budgets, and monitoring progress toward savings goals, all in one clean dashboard.

**Live app:** https://fanika.top

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running Locally](#running-locally)
  - [Building for Production](#building-for-production)
- [Project Structure](#project-structure)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

## Overview

Managing personal finances is often scattered across notebooks, spreadsheets, and bank apps that don't talk to each other. Fanika brings it into one place — a simple, structured tool for tracking money in and money out, setting budgets that actually stick, and building toward savings goals with visibility into progress over time.

Every user's data is private by design, isolated at the database level so no one else can see or touch it.

## Features

- **Income & Expense Tracking** — log transactions and organize them by category for a clear view of spending habits
- **Budgeting** — set spending limits per category and track them against real activity
- **Savings Goals** — define financial targets and monitor progress toward each one
- **Dashboard & Reports** — visual summaries of income, spending, and savings trends over time
- **Secure Authentication** — each user's account and financial data are private and isolated
- **Responsive Design** — works cleanly across desktop and mobile

## Tech Stack

- **Frontend:** React, TypeScript, Vite, shadcn/ui
- **Routing:** TanStack Router
- **Backend & Database:** Supabase (PostgreSQL, Authentication, Row-Level Security)
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A Supabase project (for your own local/dev instance)

### Installation

```bash
git clone https://github.com/bkidenda/fanika.git
cd fanika
npm install
```

### Environment Variables

Create a `.env` file in the project root with the following:

```
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

### Building for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
fanika/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/           # Application pages/routes
│   ├── hooks/            # Custom React hooks
│   ├── lib/               # Supabase client and utility functions
│   └── types/            # TypeScript type definitions
├── public/             # Static assets
├── .env                  # Environment variables (not committed)
└── package.json
```

## Security

- All user data is protected with Supabase Row-Level Security (RLS), ensuring users can only access their own records.
- Authentication is handled through Supabase Auth.
- Environment variables and credentials are never committed to the repository.

## Roadmap

- [ ] Multi-account and net worth tracking
- [ ] Bill reminders and notifications
- [ ] Mobile-optimized progressive web app (PWA) support

## Contributing

This is currently a solo project maintained by Brian Kidenda. Suggestions and feedback are welcome — feel free to open an issue to discuss a bug or feature idea.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

**Brian Kidenda**
Email: [bkidenda@gmail.com](mailto:bkidenda@gmail.com)
LinkedIn: [linkedin.com/in/bkidenda](https://linkedin.com/in/bkidenda)
