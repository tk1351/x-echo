# Next.js Server Components

## Overview
React Server Components allow you to create UI that can be rendered and optionally cached on the server. In Next.js, rendering work is further divided by route segments to enable streaming and partial rendering.

## Three Server Rendering Strategies
1. **Static Rendering** (Default)
2. **Dynamic Rendering**
3. **Streaming**

## Benefits of Server Rendering

### Data Fetching
- Server Components allow you to move data fetching to the server, closer to your data source
- Improves performance by reducing the time needed to fetch data for rendering and the number of requests the client needs to make

### Security
- Allows you to keep sensitive data and logic like tokens and API keys on the server, eliminating the risk of exposing them to the client

### Caching
- By rendering on the server, results can be cached and reused across subsequent requests and between users
- Contributes to performance improvement and cost reduction by decreasing the amount of rendering and data fetching per request

### Performance
- Moving non-interactive UI parts to Server Components reduces the amount of client-side JavaScript
- Beneficial for users with slower internet connections or less powerful devices

### Initial Page Load and First Contentful Paint (FCP)
- Generating HTML on the server allows users to view the page immediately, without waiting for the client to download, parse, and execute JavaScript

### SEO and Social Sharing Improvements
- Rendered HTML can be used by search engine bots to index pages and by social network bots to generate social card previews

### Streaming
- Allows rendering work to be split into chunks and streamed to the client as they become ready
- Users can see parts of the page earlier without waiting for the entire page to be rendered on the server

## Using Server Components in Next.js

Next.js uses Server Components by default. This allows you to automatically implement server rendering without additional configuration, while still being able to use Client Components when needed.

## How Server Components are Rendered

### Server-side Processing:
1. React renders Server Components into a special data format called React Server Component Payload (RSC Payload)
2. Next.js uses the RSC Payload and Client Component JavaScript instructions to render HTML on the server

### Client-side Processing:
1. HTML is used to immediately show a fast non-interactive preview of the route - this is for the initial page load only
2. The RSC Payload is used to reconcile Client and Server Component trees and update the DOM
3. JavaScript instructions are used to hydrate Client Components and make the application interactive

## What is the React Server Component Payload (RSC)?

The RSC Payload is a compact binary representation of the rendered React Server Components tree. It's used by React on the client to update the browser's DOM. The RSC Payload contains:

- The rendered result of Server Components
- Placeholders for where Client Components should be rendered and references to their JavaScript files
- Any props passed from Server Components to Client Components

## Details of Server Rendering Strategies

### Static Rendering (Default)
- Routes are rendered at build time or in the background after revalidation
- Results are cached and can be pushed to a CDN
- An optimization that allows sharing rendering work results between users and server requests
- Useful for routes with data that isn't personalized to users (such as static blog posts or product pages)

### Dynamic Rendering
- Routes are rendered for each user at request time
- Useful for routes with personalized data or information that can only be known at request time, such as cookies or URL search parameters

### Dynamic Routes with Cached Data
- In Next.js, you can have dynamically rendered routes that contain both cached and uncached data
- Since RSC Payload and data are cached separately, you can utilize dynamic rendering without worrying about performance impacts from fetching all data at request time

### Switching to Dynamic Rendering
During rendering, if a Dynamic API or a fetch option of `{ cache: 'no-store' }` is detected, Next.js will switch to dynamically rendering the entire route:

| Dynamic API | Data | Route |
|-------------|------|-------|
| No | Cached | Statically Rendered |
| Yes | Cached | Dynamically Rendered |
| No | Not Cached | Dynamically Rendered |
| Yes | Not Cached | Dynamically Rendered |

For a route to be fully static, all data must be cached. However, you can have a dynamically rendered route that uses both cached and uncached data fetches.

As a developer, you don't need to choose between static and dynamic rendering. Next.js automatically selects the optimal rendering strategy for each route based on the features and APIs used. Instead, you choose when to cache or revalidate specific data and when to stream parts of your UI.

### Dynamic APIs
Dynamic APIs rely on information that can only be known at request time (not during pre-rendering). Using any of these APIs signals the developer's intention and will opt the entire route into dynamic rendering at request time. These APIs include:

- `cookies`
- `headers`
- `connection`
- `draftMode`
- `searchParams` prop
- `unstable_noStore`

## Streaming

Streaming enables progressive UI rendering from the server. Work is divided into chunks and streamed to the client as it becomes ready. This allows users to see parts of the page immediately, before the entire content has finished rendering.

Streaming is built into the Next.js App Router by default. This improves both initial page loading performance and UI that depends on slower data fetches that might block rendering of the entire route (such as reviews on a product page).

You can start streaming route segments using `loading.js` and UI components with React Suspense. For more information, refer to the Loading UI and Streaming section.
