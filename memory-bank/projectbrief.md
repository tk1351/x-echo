# Project Brief

## Project Name
X-Echo

## Overview
X-Echo is a clone of Twitter (now X). Users can create accounts, log in, and post tweets. They can also follow other users, and tweets from followed users will appear in their timeline. Users can favorite and retweet other users' tweets.

## Key Features
- User registration and login
- User profile management
- Tweet posting
- User following
- Favorites (likes)
- Retweets
- Timeline display

## Technology Stack
- **Backend** (api directory)
  - Hono (Web framework)
  - TypeScript
  - Prisma (ORM)
  - Zod (Validation)
  - PostgreSQL (Database)
  - Docker (Containerization)
- **Frontend** (client directory)
  - Next.js (React framework with SSR)
  - TypeScript
  - Tailwind CSS
  - SWR (Data fetching)
  - Zustand (State management)
  - Vitest (Testing)

## Architecture
- PostgreSQL container as the database
- Prisma for database connection
- Backend API built with Hono
- Frontend built with Next.js App Router
- Server Components for data fetching and rendering
- Client Components for interactive elements

## Development Approach
- Functional approach prioritized
- Test-Driven Development (TDD)
- Domain-Driven Design (DDD) principles
- Adherence to standard rules of Biome
- Accessibility-first design

## Project Goals
1. Reproduce the main features of Twitter
2. Build a scalable and maintainable codebase
3. Implement a secure authentication system
4. Optimize performance
5. Design for future feature extensions
6. Ensure accessibility compliance

## How to Launch
1. Run `npm run dev` in the api directory
2. Access the API at http://localhost:8080
3. Run `npm run dev` in the client directory
4. Access the frontend at http://localhost:3000
