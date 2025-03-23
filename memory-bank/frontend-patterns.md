# Frontend Development Patterns

## Next.js Component Model

Next.js App Router supports both React Server Components and Client Components. Combining these appropriately optimizes both performance and interactivity.

### Server Components vs Client Components

| What do you need to do? | Server Component | Client Component |
|-------------------------|-----------------|------------------|
| Fetch data | ✅ | ❌ |
| Access backend resources (directly) | ✅ | ❌ |
| Keep sensitive information on the server | ✅ | ❌ |
| Reduce client-side JavaScript | ✅ | ❌ |
| Add interactivity and event listeners | ❌ | ✅ |
| Use State and Lifecycle Effects | ❌ | ✅ |
| Use browser-only APIs | ❌ | ✅ |
| Use custom hooks that depend on state/effects | ❌ | ✅ |
| Use React Class components | ❌ | ✅ |

## Recommended Implementation Patterns

### 1. Moving Client Components Down the Tree

To optimize performance, place Client Components as low as possible in the component tree.

```tsx
// Good example: Only making interactive parts Client Components
// page.tsx (Server Component)
import SearchBar from './search-bar' // Client Component
import Results from './results'      // Server Component

export default function Page() {
  return (
    <div>
      <h1>Product Search</h1>
      <SearchBar /> {/* Only interactive part is Client Component */}
      <Results />  {/* Static display part is Server Component */}
    </div>
  )
}
```

### 2. Passing Server Components as Children to Client Components

```tsx
// client-component.tsx
'use client'
export default function ClientComponent({ children }) {
  const [count, setCount] = useState(0)
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      {children} {/* Server Component renders here */}
    </div>
  )
}

// page.tsx (Server Component)
import ClientComponent from './client-component'
import ServerComponent from './server-component'

export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

### 3. Proper Use of Third-Party Libraries

Many third-party components need to be used as Client Components. Wrap them appropriately:

```tsx
// ui/carousel.tsx
'use client'
import { Carousel } from 'third-party-carousel'
export default Carousel
```

### 4. Proper Context Provider Placement

```tsx
// providers.tsx
'use client'
import { ThemeProvider } from 'theme-context'

export function Providers({ children }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

// layout.tsx (Server Component)
import { Providers } from './providers'

export default function Layout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## X-Echo Project Specific Implementation Plan

### Authentication Flow
- Login form: Client Component (for form state management)
- Authentication state management: Client Component + Context Provider
- User information display: Server Component

### Timeline
- Timeline container: Server Component (for data fetching)
- Tweet list: Server Component
- Interaction features (likes, retweets): Client Components

### Tweet Posting
- Post form: Client Component
- Character counter: Client Component
- Submit button: Client Component

### User Profile
- Profile information display: Server Component
- Follow button: Client Component
- Profile edit form: Client Component

## Data Fetching Patterns

### Server Component Data Fetching

Server Components can fetch data directly:

```tsx
// app/users/[username]/page.tsx
export default async function UserProfile({ params }) {
  // This code runs on the server
  const userData = await fetch(`http://localhost:8080/api/users/${params.username}`)
  const user = await userData.json()

  return (
    <div>
      <h1>{user.displayName}</h1>
      <p>@{user.username}</p>
      <UserStats user={user} />
      <UserTweets username={user.username} />
    </div>
  )
}
```

### Client Component Data Fetching

Client Components should use SWR for data fetching:

```tsx
// components/tweet-actions.tsx
'use client'
import useSWR from 'swr'
import { useState } from 'react'

export default function TweetActions({ tweetId }) {
  const { data, mutate } = useSWR(`/api/tweets/${tweetId}`)
  const [isLiking, setIsLiking] = useState(false)

  async function handleLike() {
    setIsLiking(true)
    await fetch(`/api/tweets/${tweetId}/favorite`, { method: 'POST' })
    await mutate() // Revalidate the data
    setIsLiking(false)
  }

  return (
    <div className="tweet-actions">
      <button
        onClick={handleLike}
        disabled={isLiking}
      >
        {data?.isFavorited ? 'Unlike' : 'Like'} ({data?.favoritesCount})
      </button>
      {/* Other actions */}
    </div>
  )
}
```

## State Management Patterns

### Server-Side State

- Use Server Components for initial data fetching
- Pass data down to Client Components as props
- Use SWR for client-side data fetching and caching

### Client-Side State

- Use Zustand for global client-side state management
- Keep state as close as possible to where it's used
- Prefer local component state when possible

Example Zustand store:

```tsx
// store/auth-store.ts
import { create } from 'zustand'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,

  login: async (credentials) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    })

    if (response.ok) {
      const data = await response.json()
      set({ user: data.user, isAuthenticated: true })
    } else {
      throw new Error('Login failed')
    }
  },

  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, isAuthenticated: false })
  }
}))
```

## Component Organization

### Directory Structure

```
app/
├── layout.tsx              # Root layout (Server Component)
├── page.tsx                # Home page (Server Component)
├── auth/
│   ├── login/
│   │   └── page.tsx        # Login page (Server Component)
│   └── register/
│       └── page.tsx        # Registration page (Server Component)
├── users/
│   └── [username]/
│       ├── page.tsx        # User profile page (Server Component)
│       └── tweets/
│           └── page.tsx    # User tweets page (Server Component)
└── tweets/
    └── [id]/
        └── page.tsx        # Single tweet page (Server Component)

components/
├── ui/                     # Reusable UI components
│   ├── button.tsx          # Button component (Client Component)
│   ├── input.tsx           # Input component (Client Component)
│   └── card.tsx            # Card component (Server Component)
├── auth/                   # Authentication components
│   ├── login-form.tsx      # Login form (Client Component)
│   └── register-form.tsx   # Registration form (Client Component)
├── tweets/                 # Tweet-related components
│   ├── tweet-card.tsx      # Tweet display (Server Component)
│   ├── tweet-form.tsx      # Tweet creation form (Client Component)
│   └── tweet-actions.tsx   # Tweet interaction buttons (Client Component)
└── users/                  # User-related components
    ├── profile-header.tsx  # User profile header (Server Component)
    ├── follow-button.tsx   # Follow button (Client Component)
    └── user-stats.tsx      # User statistics (Server Component)
```

### Component Naming Conventions

- Use PascalCase for component names
- Use descriptive names that indicate the component's purpose
- Suffix Client Components with a meaningful descriptor (e.g., Form, Button, Actions)
- Group related components in directories

## Testing Patterns

### Server Component Testing

Test Server Components with Vitest and React Testing Library:

```tsx
// components/users/profile-header.test.tsx
import { render, screen } from '@testing-library/react'
import ProfileHeader from './profile-header'

describe('ProfileHeader', () => {
  it('displays user information correctly', () => {
    const user = {
      username: 'testuser',
      displayName: 'Test User',
      bio: 'This is a test bio',
      followersCount: 100,
      followingCount: 50
    }

    render(<ProfileHeader user={user} />)

    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('@testuser')).toBeInTheDocument()
    expect(screen.getByText('This is a test bio')).toBeInTheDocument()
    expect(screen.getByText('100')).toBeInTheDocument() // Followers
    expect(screen.getByText('50')).toBeInTheDocument() // Following
  })
})
```

### Client Component Testing

Test Client Components with additional interaction testing:

```tsx
// components/tweets/tweet-actions.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SWRConfig } from 'swr'
import TweetActions from './tweet-actions'

// Mock fetch
global.fetch = vi.fn()

describe('TweetActions', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('handles like action correctly', async () => {
    // Mock initial state
    const mockData = { id: '123', favoritesCount: 5, isFavorited: false }

    render(
      <SWRConfig value={{
        fetcher: () => Promise.resolve(mockData),
        provider: () => new Map()
      }}>
        <TweetActions tweetId="123" />
      </SWRConfig>
    )

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.getByText('Like (5)')).toBeInTheDocument()
    })

    // Mock the POST response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })

    // Mock the updated data after liking
    const updatedMockData = { ...mockData, favoritesCount: 6, isFavorited: true }

    // Click the like button
    fireEvent.click(screen.getByText('Like (5)'))

    // Verify fetch was called correctly
    expect(fetch).toHaveBeenCalledWith('/api/tweets/123/favorite', { method: 'POST' })

    // Update the mock data for the revalidation
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updatedMockData)
    })

    // Wait for the UI to update
    await waitFor(() => {
      expect(screen.getByText('Unlike (6)')).toBeInTheDocument()
    })
  })
})
```

## Performance Optimization Patterns

### Code Splitting

- Use dynamic imports for large components or libraries
- Lazy load components that aren't needed for initial render

```tsx
// app/page.tsx
import dynamic from 'next/dynamic'

// Lazy load the tweet form
const TweetForm = dynamic(() => import('@/components/tweets/tweet-form'), {
  loading: () => <p>Loading tweet form...</p>
})

export default function HomePage() {
  return (
    <div>
      <h1>Home</h1>
      <TweetForm />
      {/* Other components */}
    </div>
  )
}
```

### Image Optimization

- Use Next.js Image component for optimized images
- Specify appropriate sizes and loading strategies

```tsx
// components/users/profile-header.tsx
import Image from 'next/image'

export default function ProfileHeader({ user }) {
  return (
    <div className="profile-header">
      <Image
        src={user.profileImageUrl || '/default-avatar.png'}
        alt={`${user.displayName}'s profile picture`}
        width={100}
        height={100}
        priority={true} // Load this image early
        className="rounded-full"
      />
      {/* Other profile information */}
    </div>
  )
}
```

### Memoization

- Use React.memo for expensive Client Components
- Use useMemo and useCallback for expensive calculations and callbacks

```tsx
// components/tweets/tweet-list.tsx
'use client'
import { memo, useMemo } from 'react'
import TweetCard from './tweet-card'

const MemoizedTweetCard = memo(TweetCard)

export default function TweetList({ tweets }) {
  const sortedTweets = useMemo(() => {
    return [...tweets].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }, [tweets])

  return (
    <div className="tweet-list">
      {sortedTweets.map(tweet => (
        <MemoizedTweetCard key={tweet.id} tweet={tweet} />
      ))}
    </div>
  )
}
