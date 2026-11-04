# Doctor Tracker – Frontend

Frontend application for Doctor Tracker built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Component System:** shadcn/ui
- **Icons:** Lucide React
- **API Communication:** Axios
- **Server Data Management:** @tanstack/react-query
- **Global State Management:** @reduxjs/toolkit & react-redux
- **Form Handling & Validation:** react-hook-form, zod, @hookform/resolvers
- **Table Management:** @tanstack/react-table
- **Data Visualization:** Recharts
- **Package Manager:** pnpm

## Getting Started

First, install dependencies:

```bash
pnpm install
```

Copy the environment variables:

```bash
cp .env.example .env.local
```

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```text
web/
├── public/
│   ├── images/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   │       └── page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── doctors/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [doctorId]/
│   │   │   │       └── page.tsx
│   │   │   └── patients/
│   │   │       └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   ├── dashboard/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── types/
│   │   ├── doctors/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── schemas/
│   │   │   └── types/
│   │   └── patients/
│   │       ├── components/
│   │       ├── hooks/
│   │       ├── services/
│   │       ├── schemas/
│   │       └── types/
│   ├── hooks/
│   ├── lib/
│   ├── providers/
│   ├── store/
│   │   └── slices/
│   ├── types/
│   └── config/
├── .env.example
├── components.json
├── package.json
├── tsconfig.json
└── README.md
```

## Available Scripts

- `pnpm dev`: Runs the development server
- `pnpm build`: Builds the production bundle
- `pnpm start`: Starts the production server
- `pnpm lint`: Runs ESLint
