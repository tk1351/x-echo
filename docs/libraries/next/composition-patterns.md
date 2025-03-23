# Next.js Server and Client Composition Patterns

When building React applications with Next.js, you need to consider which parts should be rendered on the server or the client. This document covers recommended composition patterns when using Server and Client Components.

## When to Use Server and Client Components

Here's a summary of the different use cases for Server and Client Components:

| What do you need to do? | Server Component | Client Component |
|-------------------------|-----------------|------------------|
| Fetch data | ✅ | ❌ |
| Access backend resources (directly) | ✅ | ❌ |
| Keep sensitive information on the server (access tokens, API keys, etc.) | ✅ | ❌ |
| Keep large dependencies on the server / Reduce client-side JavaScript | ✅ | ❌ |
| Add interactivity and event listeners (onClick(), onChange(), etc.) | ❌ | ✅ |
| Use State and Lifecycle Effects (useState(), useReducer(), useEffect(), etc.) | ❌ | ✅ |
| Use browser-only APIs | ❌ | ✅ |
| Use custom hooks that depend on state, effects, or browser-only APIs | ❌ | ✅ |
| Use React Class components | ❌ | ✅ |

## Server Component Patterns

Before opting into client-side rendering, you may wish to perform server-side operations like fetching data or accessing your database or backend services.

Here are common patterns when working with Server Components:

### Sharing Data Between Components

When fetching data on the server, you may need to share data across different components. For example, a layout and a page might depend on the same data.

Instead of using React Context (which is not available on the server) or passing data as props, you can use `fetch` or React's `cache` function to fetch the same data in components that need it. You don't need to worry about duplicate requests for the same data because React extends `fetch` to automatically memoize data requests, and the `cache` function can be used when `fetch` is not available.

### Keeping Server-Only Code Out of the Client Environment

Since JavaScript modules can be shared between Server and Client Components, code intended only for the server might accidentally end up in the client.

Consider this data-fetching function:

```typescript
export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  })

  return res.json()
}
```

While this appears to work on both server and client, it contains an `API_KEY` intended for server use only.

Since the environment variable `API_KEY` isn't prefixed with `NEXT_PUBLIC`, it's a private variable accessible only on the server. To prevent leaking environment variables, Next.js replaces private environment variables with an empty string on the client.

To prevent unintended client usage of server code, use the `server-only` package to generate build-time errors if server modules are accidentally imported into Client Components:

```javascript
import 'server-only'

export async function getData() {
  const res = await fetch('https://external-service.com/data', {
    headers: {
      authorization: process.env.API_KEY,
    },
  })

  return res.json()
}
```

Now, any Client Component importing `getData()` will receive a build-time error explaining that this module can only be used on the server.

Similarly, the `client-only` package can mark modules containing client-only code, such as code accessing the `window` object.

### Using Third-Party Packages and Providers

Since Server Components are a new React feature, many third-party packages in the ecosystem are just beginning to add the "use client" directive to components that use client-only features like `useState`, `useEffect`, and `createContext`.

Currently, many npm package components that use client-only features don't yet have this directive. These components work as expected within Client Components but won't work in Server Components.

To solve this issue, wrap third-party components that rely on client-only features in your own Client Components:

```typescript
// app/carousel.tsx
'use client'

import { Carousel } from 'acme-carousel'

export default Carousel
```

This allows you to use `<Carousel />` directly within a Server Component.

### Using Context Providers

Context providers are typically rendered near the root of an application to share global concerns, like the current theme. Since React context isn't supported in Server Components, creating a context at the root of your application will cause an error.

To resolve this, create your context and render its provider in a Client Component:

```typescript
// app/theme-provider.tsx
'use client'

import { createContext } from 'react'

export const ThemeContext = createContext({})

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
}
```

Once marked as a Client Component, your Server Component can render this provider directly:

```typescript
// app/layout.tsx
import ThemeProvider from './theme-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
```

It's recommended to render providers as deep as possible in the tree. Notice how `ThemeProvider` only wraps `{children}` instead of the entire `<html>` document. This makes it easier for Next.js to optimize the static parts of your Server Components.

## Client Components

### Moving Client Components Down the Tree

To reduce the client-side JavaScript bundle size, move Client Components down your component tree.

For example, if you have a layout with static elements (logo, links, etc.) and an interactive search bar that uses state, instead of making the entire layout a Client Component, move the interactive logic to a Client Component (e.g., `<SearchBar />`) and keep your layout as a Server Component. This way, you don't send all of the layout's component JavaScript to the client.

### Passing Props from Server to Client Components (Serialization)

When fetching data in a Server Component, you may want to pass it as props to Client Components. Props passed from Server to Client Components need to be serializable by React.

If your Client Components depend on non-serializable data, you can fetch data on the client with a third-party library or on the server with a Route Handler.

### Interleaving Server and Client Components

When interleaving Client and Server Components, visualize your UI as a component tree. Starting with the root layout (a Server Component), you can render certain subtrees of components on the client by adding the "use client" directive.

Within client subtrees, you can still nest Server Components or call Server Actions, but keep these points in mind:

1. During a request-response lifecycle, your code moves from server to client. If you need to access server data while on the client, you're making a new request to the server—not switching back and forth.

2. When a new server request is made, all Server Components render first, including those nested inside Client Components. The rendered result (RSC Payload) contains references to Client Component locations. Then, on the client, React reconciles Server and Client Components into a single tree.

3. Since Client Components render after Server Components, you cannot import a Server Component into a Client Component module (as it would require a new server request). Instead, pass Server Components as props to Client Components.

#### Unsupported Pattern: Importing Server Components into Client Components

The following pattern is not supported. You cannot import a Server Component into a Client Component:

```typescript
'use client'

// You cannot import a Server Component into a Client Component
import ServerComponent from './Server-Component'

export default function ClientComponent({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>

      <ServerComponent />
    </>
  )
}
```

#### Supported Pattern: Passing Server Components to Client Components as Props

This pattern is supported. You can pass Server Components as props to Client Components.

A common approach is to use the React `children` prop to create a "slot" in your Client Component:

```typescript
// app/client-component.tsx
'use client'

import { useState } from 'react'

export default function ClientComponent({
  children,
}: {
  children: React.ReactNode
}) {
  const [count, setCount] = useState(0)

  return (
    <>
      <button onClick={() => setCount(count + 1)}>{count}</button>
      {children}
    </>
  )
}
```

In a parent Server Component, you can import both the `<ClientComponent>` and `<ServerComponent>` and pass `<ServerComponent>` as a child of `<ClientComponent>`:

```typescript
// app/page.tsx
// This pattern works:
// You can pass a Server Component as a child or prop of a Client Component
import ClientComponent from './client-component'
import ServerComponent from './server-component'

// Pages in Next.js are Server Components by default
export default function Page() {
  return (
    <ClientComponent>
      <ServerComponent />
    </ClientComponent>
  )
}
```

With this approach, `<ClientComponent>` and `<ServerComponent>` are decoupled and can be rendered independently. The child `<ServerComponent>` is rendered on the server before `<ClientComponent>` is rendered on the client.

This "lifting content up" pattern has been used to avoid re-rendering nested child components when a parent component re-renders. Note that you're not limited to the `children` prop—you can use any prop to pass JSX.
