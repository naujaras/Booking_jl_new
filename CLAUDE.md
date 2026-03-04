# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Naujaras Booking is a React SPA for a romantic accommodation booking service in Seville. It features a multi-step wizard for reservations with room selection, time slot configuration, extras, and client data collection.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server on http://localhost:8080
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

## Architecture

### Tech Stack
- **Framework**: React 18 + Vite + TypeScript
- **UI Components**: shadcn/ui (Radix primitives) + Tailwind CSS
- **State**: React useState + React Query for server state
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router v6

### Key Files

- `src/lib/bookingConfig.ts` - Central business logic: room configurations, pricing, time slots, availability checks via n8n webhook, validation functions
- `src/components/booking/BookingWizard.tsx` - Main wizard orchestrator managing all booking state
- `src/App.tsx` - Root component with providers (QueryClient, Tooltip, Toast)

### Booking Wizard Flow

1. **StepSearch** - Room and date selection
2. **StepJornada** - Time slot selection (día/noche/día entero)
3. **StepExtras** - Decorations, packs, extra guests
4. **StepClientData** - Client information form
5. **StepConfirmation** - Review and submit

### Business Logic

- **Rooms**: Ático, Estudio, Habitación - each with different prices and time slots
- **Jornadas**: día, noche, dia_entero_manana, dia_entero_noche
- **Extras**: Decorations (romántica/cumpleaños/aniversario), Packs (cava/lambrusco), Extra guests (only for Ático día)
- **Availability**: Checked via n8n webhook (`N8N_WEBHOOK_URL` in bookingConfig.ts)

### Path Alias

`@/*` maps to `./src/*` - use `@/components/...`, `@/lib/...`, etc.

## Important Notes

- The `createBooking()` function in bookingConfig.ts has the real implementation commented out (uses mock simulation)
- TypeScript is configured with relaxed settings (`noImplicitAny: false`, `strictNullChecks: false`)
- n8n webhook URL is hardcoded in bookingConfig.ts
- Spanish validations for DNI/NIE, phone (starts with 6/7/9), and email are in bookingConfig.ts
