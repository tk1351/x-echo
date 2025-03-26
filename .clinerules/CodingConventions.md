# Coding Conventions

## Coding Standards

- Functional Approach
  - Prioritize pure functions
  - Use immutable data structures
  - Isolate side effects
  - Ensure type safety
- Typescript
  - Use specific types
    - Avoid using any
    - Use unknown and then narrow down types
    - Utilize Utility Types
  - Use meaningful names
  - Clarify the meaning of types
- Adhere to standard rules of Biome, ESLint, Prettier
  - Run `npm run check` in the api directory
- Domain-Driven Design (DDD)
  - Distinguish between Value Objects and Entities
  - Ensure consistency through Aggregates
  - Abstract data access with Repositories
  - Be conscious of Bounded Contexts

## Implementation Patterns

### Result Type

```typescript
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };
```

- Explicitly indicate success/failure
- Use early return pattern
- Define error types

### Type Definitions

```typescript
type Branded<T, B> = T & { _brand: B };
type Money = Branded<number, "Money">;
type Email = Branded<string, "Email">;
```

- Ensure type safety with branded types

### Entity

- Identity based on ID
- Controlled updates
- Has consistency rules

### Repository

- Handles only domain models
- Hides persistence details
- Provides in-memory implementation for testing

### Adapter Pattern

- Abstracts external dependencies
- Interface defined by the caller
- Easily replaceable during testing

## Code Style

- Function-first (classes only when necessary)
- Utilize immutable update patterns
- Flatten conditional branches with early returns
- Define enums for errors and use cases
