# Database Architecture for X-Echo

## Introduction

X-Echo is a Twitter clone application that allows users to register, log in, post tweets, follow other users, and interact with content through favorites and retweets. This document outlines the database architecture decisions and provides a reference for future development.

### Technology Stack

- **Database**: PostgreSQL
- **ORM**: Prisma
- **API Framework**: Hono
- **Deployment**: Docker

## Database Design Principles

### Normalization vs. Denormalization

We employ a hybrid approach to database normalization:

- **Normalized Structure**: We maintain proper relationships between entities to ensure data integrity and minimize redundancy.
- **Strategic Denormalization**: We denormalize specific data points (like follower counts) to optimize read performance for frequently accessed information.

### Performance Considerations

- **Indexing Strategy**: Primary keys, foreign keys, and frequently queried fields are indexed.
- **Counter Caching**: Frequently accessed counts are stored directly in parent tables to reduce join operations.
- **Query Optimization**: Schema is designed to support efficient queries for common operations.

### Security Considerations

- **ID Exposure**: Internal numeric IDs are not exposed in URLs; usernames are used instead.
- **Password Storage**: Passwords are never stored in plain text, only as secure hashes.
- **Data Access**: Role-based access control is implemented at the application level.

### Naming Conventions

- **Tables**: Plural form, lowercase with underscores (snake_case)
- **Columns**: Singular form, lowercase with underscores
- **Primary Keys**: `id`
- **Foreign Keys**: Entity name followed by `_id` (e.g., `user_id`)
- **Timestamps**: `created_at`, `updated_at`

## Core Tables

### User Table

The User table is the foundation of our authentication system and social network functionality.

#### Design Decisions

- **ID Strategy**: We use auto-incrementing integers as primary keys for optimal performance in joins and indexing, while exposing only usernames in URLs for security.
- **Counter Caching**: We store follower and following counts directly in the User table to improve read performance, accepting the trade-off of additional write complexity.
- **Authentication**: Passwords are stored as hashes only, never in plain text.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto-increment | Internal identifier |
| username | String | Unique, Not null | Public identifier used in URLs |
| display_name | String | Not null | User's display name |
| email | String | Unique, Not null | User's email for authentication |
| password_hash | String | Not null | Bcrypt hashed password |
| bio | String | Nullable | User's profile description |
| profile_image_url | String | Nullable | URL to profile image |
| header_image_url | String | Nullable | URL to header image |
| followers_count | Integer | Default 0 | Cached count of followers |
| following_count | Integer | Default 0 | Cached count of users being followed |
| is_verified | Boolean | Default false | Verification status |
| is_active | Boolean | Default true | Account status |
| role | Enum | Default USER | User role (USER/ADMIN) |
| created_at | DateTime | Default now() | Account creation timestamp |
| updated_at | DateTime | Auto-update | Last update timestamp |

### Follow Table

The Follow table manages the social graph connections between users.

#### Design Decisions

- **Separate Table**: We use a dedicated table to track follow relationships rather than a self-referential approach.
- **Composite Uniqueness**: We enforce uniqueness on the combination of follower and following IDs to prevent duplicate relationships.
- **Bidirectional Access**: The schema supports efficient queries for both followers and following lists.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto-increment | Relationship identifier |
| follower_id | Integer | FK to User.id, Not null | ID of the user who is following |
| following_id | Integer | FK to User.id, Not null | ID of the user being followed |
| created_at | DateTime | Default now() | When the follow relationship was created |

#### Relationships

- `follower`: Many-to-one relationship with User (the user who is following)
- `following`: Many-to-one relationship with User (the user being followed)

### Tweet Table (Planned)

The Tweet table stores user posts and their metadata.

#### Design Decisions

- **Content Storage**: Tweet content is stored directly in the table with a reasonable character limit.
- **Soft Deletion**: Tweets are soft-deleted to maintain reference integrity for replies and interactions.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto-increment | Tweet identifier |
| user_id | Integer | FK to User.id, Not null | Author of the tweet |
| content | String | Not null, Max 280 chars | Tweet text content |
| reply_to_id | Integer | FK to Tweet.id, Nullable | ID of tweet this is replying to |
| retweet_of_id | Integer | FK to Tweet.id, Nullable | ID of original tweet if this is a retweet |
| favorites_count | Integer | Default 0 | Cached count of favorites |
| retweets_count | Integer | Default 0 | Cached count of retweets |
| replies_count | Integer | Default 0 | Cached count of replies |
| is_deleted | Boolean | Default false | Soft deletion flag |
| created_at | DateTime | Default now() | When the tweet was created |
| updated_at | DateTime | Auto-update | Last update timestamp |

### Favorite Table (Planned)

The Favorite table tracks which users have favorited which tweets.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto-increment | Favorite identifier |
| user_id | Integer | FK to User.id, Not null | User who favorited |
| tweet_id | Integer | FK to Tweet.id, Not null | Tweet that was favorited |
| created_at | DateTime | Default now() | When the favorite was created |

#### Constraints

- Unique constraint on combination of `user_id` and `tweet_id` to prevent duplicate favorites

### Retweet Table (Planned)

The Retweet table tracks retweet relationships separate from the tweets themselves.

#### Schema

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | Integer | PK, Auto-increment | Retweet identifier |
| user_id | Integer | FK to User.id, Not null | User who retweeted |
| tweet_id | Integer | FK to Tweet.id, Not null | Original tweet that was retweeted |
| created_at | DateTime | Default now() | When the retweet was created |

#### Constraints

- Unique constraint on combination of `user_id` and `tweet_id` to prevent duplicate retweets

## Table Relationships

### Entity-Relationship Diagram

```
User 1--N Tweet
User 1--N Favorite
User 1--N Retweet
User 1--N Follow (as follower)
User 1--N Follow (as following)
Tweet 1--N Favorite
Tweet 1--N Retweet
Tweet 1--N Tweet (as reply_to)
Tweet 1--N Tweet (as retweet_of)
```

### Relationship Types

- **One-to-Many**: User to Tweets, User to Favorites, User to Retweets, Tweet to Favorites, Tweet to Retweets
- **Many-to-Many**: User to User (through Follow table)
- **Self-Referential**: Tweet to Tweet (for replies and retweets)

## Design Decisions

### ID Strategy

We chose auto-incrementing integers as primary keys for several reasons:

1. **Performance**: Integer primary keys are more efficient for indexing and joining than UUIDs.
2. **Storage**: Integers require less storage space than UUIDs.
3. **Security**: We avoid exposing sequential IDs in URLs by using usernames instead.

### Counter Caching

We implement counter caching (denormalization) for frequently accessed counts:

1. **Follower/Following Counts**: Stored directly in the User table.
2. **Favorites/Retweets/Replies Counts**: Stored directly in the Tweet table.

This approach:
- **Improves Read Performance**: Eliminates the need for expensive COUNT queries.
- **Increases Write Complexity**: Requires updating counters when relationships change.
- **Requires Consistency Maintenance**: Periodic reconciliation jobs may be needed to correct discrepancies.

### URL Exposure Strategy

We use usernames in URLs instead of internal IDs:

```
/users/{username}
/users/{username}/tweets
```

This approach:
- **Enhances Security**: Prevents enumeration attacks based on sequential IDs.
- **Improves UX**: Creates more readable and memorable URLs.
- **Maintains Performance**: Internal operations still use integer IDs.

### Authentication Approach

Our authentication system:
- Uses email and password for authentication
- Stores only password hashes using a secure algorithm
- Implements role-based access control (USER/ADMIN)
- Tracks account status for disabling accounts without deletion

## Future Considerations

### Scalability

As the application grows, we may need to consider:

1. **Sharding**: Partitioning data across multiple database instances.
2. **Read Replicas**: Distributing read operations to improve performance.
3. **Caching Layer**: Implementing Redis or similar for frequently accessed data.

### Schema Evolution

Potential future enhancements:

1. **Media Attachments**: Adding support for images and videos in tweets.
2. **Hashtags and Mentions**: Implementing tables to track and index these entities.
3. **Direct Messages**: Adding private messaging functionality.
4. **Lists**: Allowing users to organize followed accounts into lists.

### Performance Optimization

Future optimization strategies:

1. **Materialized Views**: For complex aggregations and timelines.
2. **Partial Indexes**: For more efficient filtering of active records.
3. **Query Optimization**: Regular review and tuning of slow queries.
4. **Connection Pooling**: Optimizing database connection management.

## Implementation in Prisma

The database schema is implemented using Prisma ORM. Here's the Prisma schema representation for the core tables:

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

  // Relationships
  followers       Follow[]  @relation("following")
  following       Follow[]  @relation("follower")
  tweets          Tweet[]
  favorites       Favorite[]
  retweets        Retweet[]

  @@map("users")
}

model Follow {
  id          Int      @id @default(autoincrement())
  followerId  Int
  followingId Int
  createdAt   DateTime @default(now()) @map("created_at")

  follower    User     @relation("follower", fields: [followerId], references: [id])
  following   User     @relation("following", fields: [followingId], references: [id])

  @@unique([followerId, followingId])
  @@map("follows")
}

enum Role {
  USER
  ADMIN
}
```

This schema will be expanded as we implement additional features like tweets, favorites, and retweets.
