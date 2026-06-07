# Atlas Network

Web application for managing ATLAS data center network services.

## Tech Stack

- **Framework**: Next.js 16 (Pages Router)
- **UI**: HeroUI, Tailwind CSS 4
- **Icons**: Heroicons
- **Data Grid**: AG Grid
- **Forms**: React Hook Form
- **Charts**: Nivo
- **Flow Diagrams**: React Flow

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
  components/       # Reusable UI components
  lib/              # Configuration and utilities
  pages/            # Next.js pages
    cases/            # Change request cases
    co-location/      # Co-location rack requests
    configs/          # System configurations
    cross-connects/   # Rack-to-rack connections
    racks/            # Rack management
    terms/            # Terms and conditions
  types/            # TypeScript type definitions
```

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
