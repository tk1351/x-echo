# Next.js Client Components

## Overview
Client Components allow you to write interactive UI that is prerendered on the server and can use client JavaScript to run in the browser.

## Benefits of Client Rendering

- **Interactivity**: Client Components can use state, effects, and event listeners, meaning they can provide immediate feedback to the user and update the UI
- **Browser APIs**: Client Components have access to browser APIs, like geolocation or localStorage

## Using Client Components in Next.js

To use Client Components, you can add the React `"use client"` directive at the top of a file, above your imports.

```tsx
'use client'

import { useState } from 'react'

export default function Counter() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}
```

`"use client"` is used to declare a boundary between Server and Client Component modules. This means that by defining a `"use client"` in a file, all other modules imported into it, including child components, are considered part of the client bundle.

### Key Points

- By default, all components in the App Router are Server Components where client APIs like useState or onClick are not available
- By defining the `"use client"` directive, you tell React to enter the client boundary where these APIs are available
- You can define multiple `"use client"` entry points to split your application into multiple client bundles
- `"use client"` doesn't need to be defined in every component that needs to be rendered on the client - once you define the boundary, all child components and modules imported into it are considered part of the client bundle

## How Client Components Are Rendered

In Next.js, Client Components are rendered differently depending on whether the request is part of a full page load (an initial visit or a page reload) or a subsequent navigation.

### Full Page Load

To optimize the initial page load, Next.js uses React's APIs to render a static HTML preview on the server for both Client and Server Components.

**On the server**:
1. React renders Server Components into a special data format called the React Server Component Payload (RSC Payload), which includes references to Client Components
2. Next.js uses the RSC Payload and Client Component JavaScript instructions to render HTML for the route on the server

**On the client**:
1. The HTML is used to immediately show a fast non-interactive initial preview of the route
2. The React Server Components Payload is used to reconcile the Client and Server Component trees, and update the DOM
3. The JavaScript instructions are used to hydrate Client Components and make their UI interactive

> **What is hydration?**
> Hydration is the process of attaching event listeners to the DOM, to make the static HTML interactive. Behind the scenes, hydration is done with the hydrateRoot React API.

### Subsequent Navigations

On subsequent navigations, Client Components are rendered entirely on the client, without the server-rendered HTML.

The Client Component JavaScript bundle is downloaded and parsed. Once the bundle is ready, React will use the RSC Payload to reconcile the Client and Server Component trees, and update the DOM.

## Going Back to the Server Environment

Sometimes, after you've declared the `"use client"` boundary, you may want to go back to the server environment. For example:
- To reduce the client bundle size
- To fetch data on the server
- To use an API that is only available on the server

You can keep code on the server even though it's theoretically nested inside Client Components by interleaving Client and Server Components and Server Actions.
