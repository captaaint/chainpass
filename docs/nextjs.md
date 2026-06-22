# Next.js

Next.js is the React framework used for the ChainInvite frontend. The app uses the App Router, where folders under `app/` define routes.

## Why ChainInvite Uses It

- It gives a fast TypeScript React setup.
- File-based routing matches routes like `/admin`, `/invite/[eventId]`, and `/scanner/[eventId]`.
- It deploys easily to Vercel with HTTPS, which is required for camera access outside localhost.

## Role in ChainInvite

- Organizer admin pages.
- Guest invite pages.
- Scanner pages.
- Optional API routes for future cached reads.

## Key Terms

- App Router: route system based on the `app/` folder.
- Dynamic segment: a path part like `[eventId]`.
- Client component: React component that runs in the browser.

## Official Documentation

- https://nextjs.org/docs
