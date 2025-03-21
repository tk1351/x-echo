# Technical Context

## Technology Stack

### Backend (api directory)
- **Framework**: Hono - A lightweight, fast web framework for the edge
- **Language**: TypeScript - Strongly typed JavaScript
- **ORM**: Prisma - Next-generation ORM for Node.js and TypeScript
- **Validation**: Zod - TypeScript-first schema validation
- **Testing**: Vitest - Fast testing framework compatible with Vite
- **Linting/Formatting**: Biome - Fast linter and formatter for JavaScript/TypeScript
- **Password Hashing**: bcrypt - Secure password hashing

### Database
- **DBMS**: PostgreSQL - Advanced open-source relational database
- **Containerization**: Docker - For consistent database environment

### Frontend (client directory)
- **Framework**: Next.js - React framework with built-in SSR capabilities
- **Language**: TypeScript - Same as backend for consistency
- **Styling**: Tailwind CSS + CSS Modules - For SSR-compatible styling
- **State Management**: SWR for server state, Zustand for client state
- **Testing**: Vitest + React Testing Library - Consistent with backend
- **Linting/Formatting**: Biome - Same as backend for consistency

## Development Environment

### Prerequisites
- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Docker and Docker Compose
- Git

### Local Setup
1. Clone the repository
2. Run PostgreSQL container using Docker Compose:
   ```bash
   docker-compose up -d
   ```
3. Install dependencies in the api directory:
   ```bash
   cd api
   npm install
   ```
4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the backend development server:
   ```bash
   npm run dev
   ```
6. Access the API at http://localhost:8080

7. For frontend development (once implemented):
   ```bash
   cd client
   npm install
   npm run dev
   ```
8. Access the frontend at http://localhost:3000

## Project Structure

```
/
├── api/                  # Backend API
│   ├── prisma/           # Prisma ORM configuration and migrations
│   │   ├── schema.prisma # Database schema definition
│   │   └── migrations/   # Database migrations
│   ├── src/              # Source code
│   │   ├── index.ts      # Entry point
│   │   ├── lib/          # Shared libraries
│   │   ├── routes/       # API routes
│   │   ├── controllers/  # Request handlers
│   │   ├── services/     # Business logic
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   ├── package.json      # Dependencies and scripts
│   └── tsconfig.json     # TypeScript configuration
├── client/               # Frontend (Next.js)
│   ├── app/              # Next.js App Router
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Home page
│   │   ├── auth/         # Authentication pages
│   │   ├── users/        # User profile pages
│   │   └── tweets/       # Tweet-related pages
│   ├── components/       # Shared components
│   │   ├── ui/           # UI components
│   │   └── layout/       # Layout components
│   ├── lib/              # Utility functions
│   ├── hooks/            # Custom hooks
│   ├── store/            # State management
│   └── types/            # TypeScript types
├── docs/                 # Documentation
│   ├── applications/     # Application-specific documentation
│   ├── libraries/        # Library-specific documentation
│   └── cline/            # Cline-specific documentation
└── compose.yaml          # Docker Compose configuration
```

## Database Schema

The database schema is defined using Prisma and includes the following models:

### User Model
```prisma
model User {
  id              Int       @id @default(autoincrement())
  username        String    @unique
  displayName     String
  email           String    @unique
  passwordHash    String
  bio             String?
  profileImageUrl String?
  headerImageUrl  String?
  followersCount  Int       @default(0)
  followingCount  Int       @default(0)
  isVerified      Boolean   @default(false)
  isActive        Boolean   @default(true)
  role            Role      @default(USER)
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")

  @@map("users")
}

enum Role {
  USER
  ADMIN
}
```

Additional models for Follow, Tweet, Favorite, and Retweet will be implemented as the project progresses.

## API Endpoints

### Authentication
- ✅ `POST /api/users/register` - Register a new user
- ✅ `POST /api/auth/login` - Authenticate a user
- ✅ `POST /api/auth/logout` - Log out a user
- ✅ `GET /api/auth/me` - Get current user information

### Users
- ✅ `GET /api/users/:username` - Get user profile
- ✅ `PUT /api/users/profile` - Update user profile (authenticated user)
- `GET /api/users/:username/followers` - Get user followers
- `GET /api/users/:username/following` - Get users being followed

### Tweets
- ✅ `POST /api/tweets` - Create a new tweet
- `GET /api/tweets/:id` - Get a specific tweet
- `DELETE /api/tweets/:id` - Delete a tweet
- `GET /api/users/:username/tweets` - Get tweets by a user

### Interactions
- `POST /api/tweets/:id/favorite` - Favorite a tweet
- `DELETE /api/tweets/:id/favorite` - Remove favorite from a tweet
- `POST /api/tweets/:id/retweet` - Retweet a tweet
- `DELETE /api/tweets/:id/retweet` - Remove a retweet
- `POST /api/users/:username/follow` - Follow a user
- `DELETE /api/users/:username/follow` - Unfollow a user

## Technical Constraints

### Performance
- API response time should be under 200ms for most operations
- Database queries should be optimized for common access patterns
- Pagination should be implemented for list endpoints

### Security
- All passwords must be hashed using bcrypt
- Input validation using Zod for all API endpoints
- Role-based access control for protected resources
- CSRF protection for production deployment

### Scalability
- Stateless API design to allow horizontal scaling
- Database connection pooling for efficient resource usage
- Counter caching to reduce expensive COUNT queries

## Development Workflow

### Code Quality
- Linting and formatting using Biome
- Type checking with TypeScript
  - Avoid using TypeScript enums, prefer const object pattern instead:
    ```typescript
    // Instead of enum:
    // enum Status { Active = "ACTIVE", Inactive = "INACTIVE" }

    // Use const object pattern:
    const Status = {
      Active: "ACTIVE",
      Inactive: "INACTIVE"
    } as const satisfies Record<string, string>;

    type Status = (typeof Status)[keyof typeof Status];
    ```
- Unit and integration testing with Vitest
- Test-driven development approach

### Git Workflow
- Feature branches for new development
- Pull requests for code review
- Main branch should always be in a deployable state

### Testing Strategy

#### Backend Testing
- Unit tests for business logic
- Integration tests for API endpoints
- Mock external dependencies for testing
- Test coverage targets for critical code paths

#### Frontend Testing
- Unit tests for pure functions and custom hooks
- Component tests using React Testing Library
- Integration tests for page-level functionality
- E2E tests for critical user flows using Playwright
- Test coverage targets: 90%+ for business logic, 80%+ for UI components
- TDD approach consistent with backend development

## Deployment Considerations (Future)

### Environments
- Development: Local development environment
- Staging: For testing before production
- Production: Live environment

### Infrastructure (Planned)
- Containerized deployment with Docker
- CI/CD pipeline for automated testing and deployment
- Database backups and disaster recovery plan
- Monitoring and logging infrastructure
