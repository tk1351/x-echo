# Prisma ORM Cheatsheet

## Table of Contents
- [Overview](#overview)
- [Installation and Setup](#installation-and-setup)
- [Schema Definition](#schema-definition)
- [Migrations](#migrations)
- [Basic CRUD Operations](#basic-crud-operations)
- [Relationships](#relationships)
- [Filtering and Sorting](#filtering-and-sorting)
- [Transactions](#transactions)
- [Middleware](#middleware)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

Prisma is a modern database ORM for Node.js and TypeScript. It provides type-safe database access, auto-generated migrations, intuitive data modeling, and more.

**Key Features:**
- Type-safe query builder
- Schema-first development approach
- Support for multiple databases (PostgreSQL, MySQL, SQLite, SQL Server, MongoDB)
- Automatic migration generation
- Rich relationship support
- Integration with VSCode

## Installation and Setup

### Setting Up a New Project

```bash
# Initialize project
mkdir my-prisma-project && cd my-prisma-project
npm init -y

# Install Prisma
npm install prisma --save-dev
npm install @prisma/client

# Initialize Prisma
npx prisma init
```

### Adding to an Existing Project

```bash
npm install prisma --save-dev
npm install @prisma/client
npx prisma init
```

After initialization, a `.env` file and a default schema file (`prisma/schema.prisma`) will be created.

### Setting Environment Variables

Set the database connection URL in the `.env` file:

```
DATABASE_URL="postgresql://username:password@localhost:5432/mydb?schema=public"
```

## Schema Definition

Prisma schema is defined in the `schema.prisma` file.

### Basic Schema Example

```prisma
// Data source configuration
datasource db {
  provider = "postgresql" // "mysql", "sqlite", "sqlserver", "mongodb"
  url      = env("DATABASE_URL")
}

// Prisma Client configuration
generator client {
  provider = "prisma-client-js"
}

// Data model definition
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  password  String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  posts     Post[]

  @@map("users")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int      @map("author_id")
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("posts")
}
```

### Data Types

Main data types supported by Prisma:

- `String`: String
- `Int`: Integer
- `Float`: Floating-point number
- `Boolean`: Boolean value
- `DateTime`: Date and time
- `Json`: JSON data
- `Bytes`: Binary data
- `Decimal`: High-precision numeric values

### Attributes

- `@id`: Primary key
- `@default`: Default value
- `@unique`: Unique constraint
- `@relation`: Relationship definition
- `@map`: Maps database column name
- `@@map`: Maps database table name
- `@updatedAt`: Automatically updates on changes
- `@db.VarChar(255)`: Database-specific type

## Migrations

### Creating Migrations

```bash
# Create a migration
npx prisma migrate dev --name init

# Apply migrations (for production)
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset
```

### Launch Prisma Studio

Prisma Studio is a GUI tool for visually managing your database:

```bash
npx prisma studio
```

## Basic CRUD Operations

### Initializing Prisma Client

```typescript
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
```

### Create

```typescript
// Create a single record
async function createUser() {
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
    },
  })
  return user
}

// Create a record with relationships
async function createUserWithPosts() {
  const user = await prisma.user.create({
    data: {
      email: 'user@example.com',
      name: 'John Doe',
      password: 'password123',
      posts: {
        create: [
          { title: 'Hello World', content: 'This is my first post!' },
          { title: 'Second Post', content: 'More content here' },
        ],
      },
    },
    include: {
      posts: true, // Include posts in the response
    },
  })
  return user
}

// Create multiple records at once
async function createManyUsers() {
  const users = await prisma.user.createMany({
    data: [
      { email: 'user1@example.com', name: 'User 1', password: 'pass1' },
      { email: 'user2@example.com', name: 'User 2', password: 'pass2' },
    ],
    skipDuplicates: true, // Skip duplicates
  })
  return users
}
```

### Read

```typescript
// Get all records
async function getAllUsers() {
  const users = await prisma.user.findMany()
  return users
}

// Get a specific record
async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  })
  return user
}

// Get the first record matching a condition
async function findUserByEmail(email: string) {
  const user = await prisma.user.findFirst({
    where: {
      email: email,
    },
  })
  return user
}

// Get data with relationships
async function getUserWithPosts(userId: number) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      posts: true,
    },
  })
  return user
}

// Select only specific fields
async function getUsersNameAndEmail() {
  const users = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
    },
  })
  return users
}

// Pagination
async function getUsersWithPagination(page: number, perPage: number) {
  const skip = (page - 1) * perPage
  const users = await prisma.user.findMany({
    skip: skip,
    take: perPage,
  })
  return users
}
```

### Update

```typescript
// Update a single record
async function updateUser(id: number, data: any) {
  const user = await prisma.user.update({
    where: {
      id: id,
    },
    data: data,
  })
  return user
}

// Update multiple records at once
async function updateManyUsers(ids: number[], data: any) {
  const users = await prisma.user.updateMany({
    where: {
      id: {
        in: ids,
      },
    },
    data: data,
  })
  return users
}

// Create if not exists, update if exists (upsert)
async function upsertUser(email: string, userData: any) {
  const user = await prisma.user.upsert({
    where: {
      email: email,
    },
    update: userData,
    create: {
      email: email,
      ...userData,
    },
  })
  return user
}
```

### Delete

```typescript
// Delete a single record
async function deleteUser(id: number) {
  const user = await prisma.user.delete({
    where: {
      id: id,
    },
  })
  return user
}

// Delete multiple records at once
async function deleteManyUsers(ids: number[]) {
  const users = await prisma.user.deleteMany({
    where: {
      id: {
        in: ids,
      },
    },
  })
  return users
}

// Cascade delete (also deletes related records)
// Set onDelete: Cascade in schema.prisma for the relation
```

## Relationships

### Types of Relationships

- **One-to-one (1:1)**
- **One-to-many (1:n)**
- **Many-to-many (m:n)**

### Defining Relationships

```prisma
// One-to-many example
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  title    String
  authorId Int  @map("author_id")
  author   User @relation(fields: [authorId], references: [id])
}

// Many-to-many example
model Post {
  id       Int        @id @default(autoincrement())
  title    String
  tags     TagOnPost[]
}

model Tag {
  id    Int        @id @default(autoincrement())
  name  String     @unique
  posts TagOnPost[]
}

// Junction table
model TagOnPost {
  postId  Int  @map("post_id")
  tagId   Int  @map("tag_id")
  post    Post @relation(fields: [postId], references: [id])
  tag     Tag  @relation(fields: [tagId], references: [id])

  @@id([postId, tagId])
  @@map("tag_on_post")
}
```

### Working with Nested Relationships

```typescript
// Create with relationships
async function createPostWithTags() {
  const post = await prisma.post.create({
    data: {
      title: 'New Post',
      author: {
        connect: { id: 1 }, // Connect to existing user
      },
      tags: {
        create: [
          { tag: { connect: { id: 1 } } },
          { tag: { connect: { id: 2 } } },
        ],
      },
    },
    include: {
      author: true,
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
  return post
}

// Update relationships
async function updatePostRelations(postId: number) {
  const post = await prisma.post.update({
    where: { id: postId },
    data: {
      tags: {
        deleteMany: {}, // Delete all existing relations
        create: [
          { tag: { connect: { id: 3 } } },
          { tag: { connect: { id: 4 } } },
        ],
      },
    },
    include: {
      tags: {
        include: {
          tag: true,
        },
      },
    },
  })
  return post
}
```

## Filtering and Sorting

### Basic Filtering

```typescript
// Equality
const users = await prisma.user.findMany({
  where: {
    email: 'user@example.com',
  },
})

// Contains
const users = await prisma.user.findMany({
  where: {
    email: {
      contains: 'example.com',
    },
  },
})

// Multiple conditions (AND)
const users = await prisma.user.findMany({
  where: {
    AND: [
      { email: { contains: 'example.com' } },
      { name: { startsWith: 'J' } },
    ],
  },
})

// Multiple conditions (OR)
const users = await prisma.user.findMany({
  where: {
    OR: [
      { email: { contains: 'example.com' } },
      { name: { startsWith: 'J' } },
    ],
  },
})

// Negation (NOT)
const users = await prisma.user.findMany({
  where: {
    NOT: {
      email: { contains: 'test' },
    },
  },
})
```

### Comparison Operators

```typescript
const posts = await prisma.post.findMany({
  where: {
    createdAt: {
      gt: new Date('2023-01-01'), // greater than
      // lt: value,  // less than
      // gte: value, // greater than or equal
      // lte: value, // less than or equal
    },
  },
})
```

### Filtering by Relationships

```typescript
// Get posts by a specific user
const posts = await prisma.post.findMany({
  where: {
    author: {
      email: 'user@example.com',
    },
  },
})

// Get users with at least one published post
const users = await prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
})

// Get users where all posts are published
const users = await prisma.user.findMany({
  where: {
    posts: {
      every: {
        published: true,
      },
    },
  },
})

// Get users with no posts
const users = await prisma.user.findMany({
  where: {
    posts: {
      none: {},
    },
  },
})
```

### Sorting

```typescript
// Sort by a single field
const users = await prisma.user.findMany({
  orderBy: {
    email: 'asc', // 'asc' or 'desc'
  },
})

// Sort by multiple fields
const users = await prisma.user.findMany({
  orderBy: [
    {
      email: 'asc',
    },
    {
      name: 'desc',
    },
  ],
})

// Sort by relationship
const users = await prisma.user.findMany({
  orderBy: {
    posts: {
      _count: 'desc', // Sort by post count
    },
  },
})
```

## Transactions

### Interactive Transactions

```typescript
async function transferPoints(fromUserId: number, toUserId: number, amount: number) {
  return await prisma.$transaction(async (tx) => {
    // Check user balance
    const fromUser = await tx.user.findUnique({
      where: { id: fromUserId },
      select: { points: true },
    })

    if (!fromUser || fromUser.points < amount) {
      throw new Error('Insufficient balance')
    }

    // Deduct from sender
    await tx.user.update({
      where: { id: fromUserId },
      data: { points: { decrement: amount } },
    })

    // Add to recipient
    await tx.user.update({
      where: { id: toUserId },
      data: { points: { increment: amount } },
    })

    // Log the transaction
    await tx.transferLog.create({
      data: {
        fromUserId,
        toUserId,
        amount,
      },
    })

    return { success: true }
  })
}
```

### Nested Transactions

Nested transactions participate in the same transaction as their parent.

```typescript
async function complexOperation() {
  return await prisma.$transaction(async (tx) => {
    // Operation 1
    await tx.user.update({ ... })

    // Nested transaction
    await nestedOperation(tx)

    // Operation 2
    await tx.post.create({ ... })
  })
}

async function nestedOperation(tx) {
  await tx.comment.createMany({ ... })
}
```

## Middleware

Prisma middleware allows you to execute custom logic before and after queries.

```typescript
// Middleware example: Logging
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()

  console.log(`${params.model}.${params.action} took ${after - before}ms`)
  return result
})

// Soft delete middleware
prisma.$use(async (params, next) => {
  // Intercept delete operations
  if (params.action === 'delete') {
    // Change delete to update
    params.action = 'update'
    params.args.data = { deletedAt: new Date() }
  }

  // Do the same for 'deleteMany'
  if (params.action === 'deleteMany') {
    params.action = 'updateMany'
    if (params.args.data !== undefined) {
      params.args.data.deletedAt = new Date()
    } else {
      params.args.data = { deletedAt: new Date() }
    }
  }

  // Exclude deleted records from read operations
  if (params.action === 'findUnique' || params.action === 'findFirst') {
    // Convert findUnique to findFirst
    params.action = 'findFirst'
    // Add filter to only get non-deleted records
    params.args.where.deletedAt = null
  }

  if (params.action === 'findMany') {
    // If there's a where filter already, maintain it
    if (params.args.where) {
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null
      }
    } else {
      params.args.where = { deletedAt: null }
    }
  }

  return next(params)
})
```

## Best Practices

### Optimizing PrismaClient with Singleton Pattern

```typescript
// prisma.ts
import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = global.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma
}
```

### Separating Database Access Layer

```typescript
// repositories/user.repository.ts
import { prisma } from '../prisma'

export class UserRepository {
  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
    })
  }

  async create(data: any) {
    return prisma.user.create({
      data,
    })
  }

  // Other methods
}
```

### Batch Processing Optimization

```typescript
// When dealing with large datasets, process in batches
async function processLargeDataset(items: any[]) {
  const batchSize = 1000

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    await prisma.item.createMany({
      data: batch,
    })
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### Prisma Client Generation Errors

```bash
# Regenerate Prisma Client
npx prisma generate
```

#### Migration Errors

```bash
# Reset migrations (development only)
npx prisma migrate reset

# Resolve conflicts
npx prisma migrate resolve --applied "migration_name"
```

#### Performance Issues

- Add indexes
- Solve N+1 problems: Use `include` appropriately
- Configure database connection pooling

```typescript
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  log: ['query', 'info', 'warn', 'error'],
})
```

#### Debugging

```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// More detailed logging
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
  ],
})

prisma.$on('query', (e) => {
  console.log('Query: ' + e.query)
  console.log('Params: ' + e.params)
  console.log('Duration: ' + e.duration + 'ms')
})
```
