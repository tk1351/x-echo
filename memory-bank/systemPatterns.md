# System Patterns

## Architecture Overview

X-Echo follows a modern web application architecture with clear separation of concerns:

```mermaid
graph TD
    Client[Client - Future Implementation] --> |HTTP Requests| API[API Layer]
    API --> |Data Access| DB[PostgreSQL Database]
    API --> |Authentication| Auth[Auth Service]
    API --> |Validation| Validation[Validation Layer]
```

## Design Principles

### Functional Approach
- Prioritize pure functions
- Use immutable data structures
- Isolate side effects
- Ensure type safety

### Domain-Driven Design
- Distinguish between Value Objects and Entities
- Ensure consistency through Aggregates
- Abstract data access with Repositories
- Be conscious of Bounded Contexts

### Test-Driven Development
- Red-Green-Refactor cycle
- Treat tests as specifications
- Iterate in small units
- Continuous refactoring

## Key Design Patterns

### Result Type Pattern
Used to explicitly indicate success/failure in operations:

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

Benefits:
- Explicit error handling
- Type-safe error propagation
- Encourages early return pattern
- Clearly defined error types

### Branded Types Pattern
Used to ensure type safety with nominal typing:

```typescript
type Branded<T, B> = T & { _brand: B };
type Money = Branded<number, "Money">;
type Email = Branded<string, "Email">;
```

Benefits:
- Prevents type confusion
- Enhances code readability
- Enforces domain constraints
- Improves static analysis

### Repository Pattern
Used to abstract data access:

- Handles only domain models
- Hides persistence details
- Provides in-memory implementation for testing

### Adapter Pattern
Used to abstract external dependencies:

- Interface defined by the caller
- Easily replaceable during testing
- Decouples core logic from external services

## Component Relationships

### API Layer
- Built with Hono framework
- Handles HTTP requests and responses
- Routes requests to appropriate controllers
- Manages middleware for cross-cutting concerns

### Controllers
- Handle request validation
- Coordinate service calls
- Transform data for responses
- Manage error handling

### Services
- Implement business logic
- Orchestrate repository calls
- Ensure domain rules are enforced
- Handle complex operations

### Repositories
- Abstract database access
- Return domain entities
- Handle persistence concerns
- Implement query logic

### Domain Models
- Represent core business entities
- Enforce invariants
- Implement business rules
- Define relationships

## Database Design

### Entity-Relationship Model

```mermaid
erDiagram
    USER {
        int id PK
        string username
        string displayName
        string email
        string passwordHash
        string bio
        string profileImageUrl
        string headerImageUrl
        int followersCount
        int followingCount
        boolean isVerified
        boolean isActive
        enum role
        datetime createdAt
        datetime updatedAt
    }

    TOKEN_BLACKLIST {
        int id PK
        string token
        datetime expiresAt
        datetime createdAt
    }

    FOLLOW {
        int id PK
        int followerId FK
        int followingId FK
        datetime createdAt
    }

    TWEET {
        int id PK
        int userId FK
        string content
        int replyToId FK
        int retweetOfId FK
        int favoritesCount
        int retweetsCount
        int repliesCount
        boolean isDeleted
        datetime createdAt
        datetime updatedAt
    }

    FAVORITE {
        int id PK
        int userId FK
        int tweetId FK
        datetime createdAt
    }

    RETWEET {
        int id PK
        int userId FK
        int tweetId FK
        datetime createdAt
    }

    USER ||--o{ TWEET : "creates"
    USER ||--o{ FAVORITE : "creates"
    USER ||--o{ RETWEET : "creates"
    USER ||--o{ FOLLOW : "is follower"
    USER ||--o{ FOLLOW : "is following"
    TWEET ||--o{ FAVORITE : "receives"
    TWEET ||--o{ RETWEET : "receives"
    TWEET ||--o{ TWEET : "is replied to by"
    TWEET ||--o{ TWEET : "is retweeted as"
```

### Normalization Strategy
- Normalized structure for data integrity
- Strategic denormalization for performance (e.g., counter caching)

### Indexing Strategy
- Primary keys, foreign keys, and frequently queried fields are indexed
- Composite indexes for common query patterns

## Error Handling Strategy

### Error Types
- Validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Resource not found errors (404)
- Conflict errors (409)
- Internal server errors (500)

### Error Response Format
```json
{
  "error": {
    "type": "ERROR_TYPE",
    "message": "Human-readable error message"
  }
}
```

## Security Patterns

### Authentication
- Password hashing with bcrypt
- JWT-based authentication with Hono JWT helper
- Token blacklisting for logout and security
- Role-based access control

### Data Protection
- Input validation with Zod
- Parameterized queries via Prisma
- HTTPS for all communications (production)

## Development Workflow Patterns

### Git Workflow
```mermaid
flowchart TD
    Start[Start Task] --> Status[Check Git Status]
    Status --> Main[Switch to Main Branch]
    Main --> Pull[Pull Latest Changes]
    Pull --> Branch[Create Feature Branch]
    Branch --> Develop[Develop Feature]
    Develop --> Commit[Create Commit Message]
    Commit --> UserCommit[User Commits Changes]
    UserCommit --> Continue{Continue Development?}
    Continue -->|Yes| Develop
    Continue -->|No| PR[Create Pull Request Text]
    PR --> UserPR[User Creates Pull Request]
    UserPR --> Complete[Complete Task]
```

- Always check git status before starting work
- Always work on feature branches created from the latest main
- Create commit messages at appropriate times during development
- Create pull request text before completing work
- All git commands are executed manually by the user

## Performance Considerations

### Query Optimization
- Efficient indexing
- Pagination for large result sets
- Selective field retrieval

### Caching Strategy
- Counter caching in database
- Response caching (planned)
- Query result caching (planned)
