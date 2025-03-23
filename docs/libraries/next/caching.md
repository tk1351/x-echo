# Next.js Caching Overview

Next.js improves application performance and reduces costs by caching rendering work and data requests.

## Caching Mechanisms Overview

Next.js has four primary caching mechanisms:

| Mechanism | What | Where | Purpose | Duration |
|------|------|------|------|------|
| Request Memoization | Function return values | Server | Re-use data in a React component tree | Per-request lifecycle |
| Data Cache | Data | Server | Store data across user requests and deployments | Persistent (can be revalidated) |
| Full Route Cache | HTML and RSC payload | Server | Reduce rendering cost and improve performance | Persistent (can be revalidated) |
| Router Cache | RSC Payload | Client | Reduce server requests on navigation | User session or time-based |

By default, Next.js will cache as much as possible to improve performance and reduce cost. This means routes are statically rendered and data requests are cached unless you opt out.

## Request Memoization

Next.js extends the fetch API to automatically memoize requests that have the same URL and options.

### Deduplicated Fetch Requests

When you need to use the same data across multiple components, you can fetch data in each component without worrying about performance implications, as the actual network request will only be executed once.

```typescript
async function getItem() {
  // The `fetch` function is automatically memoized and the result
  // is cached
  const res = await fetch('https://.../item/1')
  return res.json()
}

// This function is called twice, but only executed the first time
const item = await getItem() // cache MISS

// The second call could be anywhere in your route
const item = await getItem() // cache HIT
```

### How Request Memoization Works

1. During route rendering, the first time a particular request is called, its result will not be in memory and it'll be a cache MISS
2. The function will be executed, data fetched from the external source, and the result stored in memory
3. Subsequent function calls of the request in the same render pass will be a cache HIT, and data will be returned from memory without executing the function
4. Once the route has been rendered and the rendering pass is complete, memory is reset and all request memoization entries are cleared

**Important notes**:
- Request memoization is a React feature, not a Next.js feature
- Memoization only applies to the GET method in fetch requests
- Memoization only applies to the React Component tree (generateMetadata, generateStaticParams, Layouts, Pages, etc.)
- It doesn't apply to fetch requests in Route Handlers
- For cases where fetch is not suitable (database clients, CMS clients, GraphQL clients), you can use the React cache function

### Duration
The cache lasts the lifetime of a server request until the React component tree has finished rendering.

### Revalidating
Since memoization is not shared across server requests and only applies during rendering, there is no need to revalidate it.

### Opting out
Memoization only applies to the GET method in fetch requests. This is a React optimization and opting out is not recommended.

## Data Cache

Next.js has a built-in Data Cache that persists the result of data fetches across incoming server requests and deployments.

You can use the `cache` and `next.revalidate` options of fetch to configure the caching behavior.

### How the Data Cache Works

1. The first time a fetch request with 'force-cache' option is called during rendering, Next.js checks the Data Cache for a cached response
2. If a cached response is found, it's returned immediately and memoized
3. If a cached response is not found, the request is made to the data source, the result is stored in the Data Cache, and memoized
4. For uncached data (no cache option defined or using `{ cache: 'no-store' }`), the result is always fetched from the data source and memoized

### Differences between Data Cache and Request Memoization

Both mechanisms improve performance by re-using cached data, but the Data Cache is persistent across incoming requests and deployments, whereas memoization only lasts the lifetime of a request.

### Duration
The Data Cache is persistent across incoming requests and deployments unless you revalidate or opt out.

### Revalidating

Cached data can be revalidated in two ways:

#### Time-based Revalidation

Revalidate data after a certain amount of time has passed and a new request is made. Useful for data that changes infrequently.

```javascript
// Revalidate at most every hour
fetch('https://...', { next: { revalidate: 3600 } })
```

#### How Time-based Revalidation Works

1. The first time a fetch request with revalidate is called, data is fetched from the external data source and stored in the Data Cache
2. Any requests within the specified timeframe return the cached data
3. After the timeframe, the next request will still return the cached (now stale) data
4. Next.js will trigger a revalidation of the data in the background
5. Once the data is fetched successfully, Next.js will update the Data Cache with the fresh data
6. If the background revalidation fails, the previous data remains unaltered

#### On-demand Revalidation

Data can be revalidated on-demand by path (revalidatePath) or by cache tag (revalidateTag).

#### How On-Demand Revalidation Works

1. The first time a fetch request is called, data is fetched from the external data source and stored in the Data Cache
2. When an on-demand revalidation is triggered, the appropriate cache entries are purged from the cache
3. This differs from time-based revalidation, which keeps the stale data in the cache until fresh data is fetched
4. The next time a request is made, it will be a cache MISS again, and data will be fetched from the external data source and stored in the Data Cache

### Opting out

If you don't want to cache the response from fetch, you can do the following:

```javascript
let data = await fetch('https://api.vercel.app/blog', { cache: 'no-store' })
```

## Full Route Cache (Server-side)

The Full Route Cache is a system that renders and caches routes on the server at build time or request time.

### How it works

**React Rendering on the Server**
- React renders Server Components into a special data format called "React Server Component Payload"
- Next.js uses this payload and Client Component JavaScript instructions to generate HTML on the server

**Caching on the Server**
- The rendering result (React Server Component Payload and HTML) is cached on the server
- Statically generated routes are cached at build time or during data revalidation

**Processing on the Client**
- HTML: Immediately shows a non-interactive initial preview
- React Server Component Payload: Reconciles client and server component trees
- JavaScript instructions: Hydrates client components and provides interactivity

### Duration
Persistent by default (cache is maintained between user requests)

### Invalidation Methods
- **Data Revalidation**: Revalidating the Data Cache will also invalidate the Router Cache
- **Redeployment**: The Full Route Cache is cleared with new deployments

### Opting Out
- Using a Dynamic API
- Using `dynamic = 'force-dynamic'` or `revalidate = 0` route segment config options
- Opting out of the Data Cache

## Client-side Router Cache

Next.js also provides a system that caches RSC payloads in memory on the client side.

### Features
- Visited route segments are cached when users navigate between routes
- Routes likely to be visited are prefetched
- Results in: Instant back/forward navigation, no full-page reload, preservation of React and browser state

### What Gets Cached
- **Layouts**: Cached and reused during navigation
- **Loading states**: Cached and reused for instant navigation
- **Pages**: Not cached by default but reused during browser back/forward navigation

### Duration
- **Session**: The cache persists across navigation but is cleared on page refresh
- **Automatic Invalidation Period**:
  - Default prefetching: No caching for dynamic pages, 5 minutes for static pages
  - Full prefetching: 5 minutes for both static and dynamic pages

### Invalidation Methods
- **In Server Actions**: Revalidate data using `revalidatePath` or `revalidateTag`
- **Cookie Operations**: Using `cookies.set` or `cookies.delete` invalidates the Router Cache
- **router.refresh**: Invalidates the Router Cache and sends a new request for the current route

### Opting Out
- Page segments are opted out by default in Next.js 15
- Set the `prefetch` property of the `<Link>` component to `false` to opt out of prefetching

## Cache Interactions

Understanding the relationships between these caching mechanisms is important:

- **Data Cache and Full Route Cache**:
  - Revalidating or opting out of the Data Cache will invalidate the Full Route Cache
  - Invalidating the Full Route Cache does not affect the Data Cache
  - You can dynamically render routes with both cached and uncached data

- **Data Cache and Client-side Router Cache**:
  - Using `revalidatePath` or `revalidateTag` in a Server Action will immediately invalidate both caches
  - Revalidating the Data Cache in a Route Handler will not immediately invalidate the Router Cache

## Key API Features

### `<Link>` Component
- Automatically prefetches routes from the Full Route Cache by default
- Adds React Server Component payload to Router Cache
- Set `prefetch={false}` to disable prefetching

### `router.prefetch`
- Manually prefetch a route
- Adds React Server Component payload to Router Cache

### `router.refresh`
- Clears Router Cache completely and makes a new request for the current route
- Does not affect Data Cache or Full Route Cache

### `fetch`
- Data is not cached by default (equivalent to `cache: 'no-store'`)
- Use `cache: 'force-cache'` to enable caching

### `fetch` Options
- `next.revalidate` - Set revalidation period (in seconds) for individual fetch requests
- `next.tags` - Tag cache entries for later revalidation with `revalidateTag`

### Revalidation APIs
- `revalidateTag` - Revalidate cache entries associated with a specific tag
- `revalidatePath` - Revalidate and re-render route segments below a specific path

## Dynamic APIs
The following APIs will opt out of the Full Route Cache, causing routes to be dynamically rendered:
- `cookies`
- `headers`
- `searchParams` prop in Pages

### `cookies.set` or `cookies.delete` in Server Actions
- Invalidates Router Cache to reflect changes (e.g., authentication changes)

## Segment Config Options
Configuration to override route segment defaults:

- `const dynamic = 'force-dynamic'` - Opts out of Full Route Cache
- `const fetchCache = 'default-no-store'` - Opts all fetches out of Data Cache

## `generateStaticParams`
Caches paths for dynamic segments (e.g., `app/blog/[slug]/page.js`) in the Full Route Cache:

- Cache all paths at build time - Return complete list of paths
- Cache subset of paths at build time - Return partial list of paths
- Cache only on first visit - Return empty array or use `force-static`
- Disable caching at request time - Set `dynamicParams = false`

## React `cache` Function
- Memoizes function return values so multiple calls execute only once
- Fetch requests are automatically memoized, so no need to wrap them in `cache`
- Useful for database clients, CMS clients, GraphQL clients, etc. where fetch API is not suitable
