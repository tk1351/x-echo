# Zustand Usage Guide

## Overview

Zustand is a simple, fast, and scalable state management library for React. It provides a hook-based API, enabling state sharing between components with minimal boilerplate.

## Installation

```bash
npm install zustand
```

## Basic Usage

### Creating a Store

```javascript
import { create } from 'zustand'

// Create a basic store
const useStore = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

### Using in Components

```jsx
function BearCounter() {
  const bears = useStore((state) => state.bears)
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  const increasePopulation = useStore((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}
```

## State Update Methods

### The set Function

```javascript
// Replace part of the state
set({ bears: 0 })

// Use a function to update based on the previous state
set((state) => ({ bears: state.bears + 1 }))

// Partial updates (merged by default)
set({ bears: 0 }, true) // Setting the second argument to true replaces the state
```

### The get Function

To get the current state:

```javascript
const useStore = create((set, get) => ({
  bears: 0,
  doubleCount: () => get().bears * 2,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}))
```

## Using the Store Outside Components

```javascript
const { getState, setState, subscribe } = useStore

// Get the store state
const bears = getState().bears

// Update the store state
setState({ bears: 10 })

// Subscribe to the store and receive notifications when events occur
const unsub = subscribe((state, prevState) => console.log(state.bears, prevState.bears))
// Unsubscribe
unsub()
```

## Middleware and Extensions

### Redux DevTools Integration

```javascript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(devtools((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
})))
```

### Persistence

```javascript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

const useBearStore = create(
  persist(
    (set, get) => ({
      bears: 0,
      addABear: () => set({ bears: get().bears + 1 }),
    }),
    {
      name: 'bear-storage', // Unique name for storage
      storage: createJSONStorage(() => localStorage), // Using localStorage
    }
  )
)
```

### Immer Integration

Update immutable state in a mutable way:

```javascript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useStore = create(immer((set) => ({
  bears: 0,
  forest: { bears: 0 },
  increasePopulation: () => set((state) => {
    state.bears++
    state.forest.bears++
  }),
})))
```

## Asynchronous Actions

```javascript
const useStore = create((set) => ({
  fishies: 0,
  fetch: async (pond) => {
    const response = await fetch(pond)
    const fish = await response.json()
    set({ fishies: fish.length })
  }
}))
```

## Combining Multiple Stores

```javascript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useNumberStore = create(
  combine({ number: 0 }, (set) => ({
    increment: () => set((state) => ({ number: state.number + 1 })),
  }))
)

const usePersonStore = create(
  combine({ firstName: '', lastName: '' }, (set) => ({
    setFirstName: (firstName) => set({ firstName }),
    setLastName: (lastName) => set({ lastName }),
  }))
)
```

## Slice Pattern (for Large Applications)

```javascript
import { create } from 'zustand'
import { createBearSlice } from './bearSlice'
import { createFishSlice } from './fishSlice'

export const useBoundStore = create((...a) => ({
  ...createBearSlice(...a),
  ...createFishSlice(...a),
}))
```

Example of a slice file (`bearSlice.js`):

```javascript
export const createBearSlice = (set) => ({
  bears: 0,
  addBear: () => set((state) => ({ bears: state.bears + 1 })),
  eatFish: () => set((state) => ({ fishes: state.fishes - 1 })),
})
```

## TypeScript Support

```typescript
interface BearState {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
}

const useBearStore = create<BearState>()((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

## Common Patterns

### Resetting the Store

```javascript
const useStore = create((set) => ({
  // Initial state
  bears: 0,
  // Reset function
  reset: () => set({ bears: 0 }),
}))
```

### Extending Functionality by Combining Stores

```javascript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

const useStore = create(
  devtools(
    persist(
      (set) => ({
        bears: 0,
        increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
      }),
      { name: 'bear-storage' }
    )
  )
)
```

## Performance Optimization

### Reducing Component Re-renders

```jsx
// Re-renders on all state changes
const state = useStore()

// Re-renders only when the bears property changes
const bears = useStore((state) => state.bears)

// When using object selectors, memoization is necessary
const { bears, increasePopulation } = useStore(
  (state) => ({ bears: state.bears, increasePopulation: state.increasePopulation }),
  shallow
)
```

## Summary

Zustand provides a lightweight and simple state management solution for React applications. By using its hook-based API, you can manage global state without the complex setup required by Redux. It's highly extensible through middleware and can accommodate large applications as well.
