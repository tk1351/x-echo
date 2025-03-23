# Responsive Design in Tailwind CSS

## Overview
In Tailwind CSS, every utility class can be applied conditionally at different breakpoints, making it easy to build complex responsive interfaces without ever leaving your HTML.

## Basic Setup
First, make sure to add the viewport meta tag to the `<head>` section of your HTML:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

## Usage
To add a utility that only takes effect at a certain breakpoint, prefix the utility with the breakpoint name followed by the `:` character:

```html
<!-- Width of 16 by default, 32 on medium screens, and 48 on large screens -->
<img class="w-16 md:w-32 lg:w-48" src="..." />
```

## Default Breakpoints
Tailwind CSS comes with five default breakpoints inspired by common device resolutions:

| Breakpoint prefix | Minimum width | CSS |
|-------------------|-------------|-----|
| sm | 40rem (640px) | @media (width >= 40rem) { ... } |
| md | 48rem (768px) | @media (width >= 48rem) { ... } |
| lg | 64rem (1024px) | @media (width >= 64rem) { ... } |
| xl | 80rem (1280px) | @media (width >= 80rem) { ... } |
| 2xl | 96rem (1536px) | @media (width >= 96rem) { ... } |

This works for every utility class in the framework, meaning you can change literally anything at a given breakpoint — even things like letter spacing or cursor styles.

## Mobile-First Approach
Tailwind CSS uses a mobile-first breakpoint system. This means:

- Unprefixed utilities (like `uppercase`) take effect on all screen sizes
- Prefixed utilities (like `md:uppercase`) only take effect at the specified breakpoint and above

### Targeting Mobile Screens
To style something for mobile, you need to use the unprefixed version of a utility, not the `sm:` prefixed version. Think of `sm:` not as "on small screens" but as "at the small breakpoint and above."

```html
<!-- This will only center text on screens 640px and wider, not on small screens -->
<div class="sm:text-center"></div>

<!-- This will center text on mobile, and left align it on screens 640px and wider -->
<div class="text-center sm:text-left"></div>
```

For this reason, it's often a good idea to implement the mobile layout first, then layer on any changes for larger screens like sm, md, etc.

## Targeting a Breakpoint Range
By default, styles applied by rules like `md:flex` will apply at that breakpoint and stay applied at larger breakpoints.

If you'd like to apply a utility only when a specific breakpoint range is active, stack a responsive variant like `md` with a `max-*` variant:

```html
<div class="md:max-xl:flex">
  <!-- ... -->
</div>
```

Tailwind generates a corresponding `max-*` variant for each breakpoint:

| Variant | Media query |
|----------|------------|
| max-sm | @media (width < 40rem) { ... } |
| max-md | @media (width < 48rem) { ... } |
| max-lg | @media (width < 64rem) { ... } |
| max-xl | @media (width < 80rem) { ... } |
| max-2xl | @media (width < 96rem) { ... } |

## Targeting a Single Breakpoint
To target a single breakpoint, target the range for that breakpoint by stacking a responsive variant like `md` with the `max-*` variant for the next breakpoint:

```html
<div class="md:max-lg:flex">
  <!-- ... -->
</div>
```

## Using Custom Breakpoints
You can customize your theme using the `--breakpoint-*` theme variables:

```css
@import "tailwindcss";
@theme {
  --breakpoint-xs: 30rem;
  --breakpoint-2xl: 100rem;
  --breakpoint-3xl: 120rem;
}
```

This updates the 2xl breakpoint to use 100rem instead of the default 96rem, and creates new xs and 3xl breakpoints:

```html
<div class="grid xs:grid-cols-2 3xl:grid-cols-6">
  <!-- ... -->
</div>
```

It's important to always use the same unit for defining your breakpoints. Tailwind CSS uses `rem` for default breakpoints, so if you're adding additional breakpoints, make sure to use `rem` as well.

### Removing Default Breakpoints
To remove a default breakpoint, reset its value to the `initial` keyword:

```css
@import "tailwindcss";
@theme {
  --breakpoint-2xl: initial;
}
```

You can also reset all default breakpoints using `--breakpoint-*: initial`, then define all your breakpoints from scratch:

```css
@import "tailwindcss";
@theme {
  --breakpoint-*: initial;
  --breakpoint-tablet: 40rem;
  --breakpoint-laptop: 64rem;
  --breakpoint-desktop: 80rem;
}
```

## Using Arbitrary Values
If you need a one-off breakpoint that doesn't make sense to include in your theme, use the `min` or `max` variants to generate a custom breakpoint with any arbitrary value:

```html
<div class="max-[600px]:bg-sky-300 min-[320px]:text-center">
  <!-- ... -->
</div>
```

## Container Queries

### What are container queries?

Container queries are a modern CSS feature that let you style elements based on the size of a parent element instead of the size of the entire viewport. This allows you to build components that are more portable and reusable because they can adapt based on the actual space available for that component.

### Basic example

Use the `@container` class to mark an element as a container, then use variants like `@sm` and `@md` to style child elements based on the size of the container:

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row">
    <!-- ... -->
  </div>
</div>
```

Just like breakpoint variants, container queries in Tailwind CSS are mobile-first and apply at the target container size and up.

### Max-width container queries

Use variants like `@max-sm` and `@max-md` to apply a style below a specific container size:

```html
<div class="@container">
  <div class="flex flex-row @max-md:flex-col">
    <!-- ... -->
  </div>
</div>
```

### Container query ranges

Stack a regular container query variant with a max-width container query variant to target a specific range:

```html
<div class="@container">
  <div class="flex flex-row @sm:@max-md:flex-col">
    <!-- ... -->
  </div>
</div>
```

### Named containers

For complex designs that use multiple nested containers, you can name containers using `@container/{name}` and target specific containers with variants like `@sm/{name}` and `@md/{name}`:

```html
<div class="@container/main">
  <!-- ... -->
  <div class="flex flex-row @sm/main:flex-col">
    <!-- ... -->
  </div>
</div>
```

This makes it possible to style elements based on the size of a distant container, rather than just the nearest container.

### Using custom container sizes

Use the `--container-*` theme variables to customize your container sizes:

```css
/* app.css */
@import "tailwindcss";
@theme {
  --container-8xl: 96rem;
}
```

This adds a new 8xl container query variant that can be used in your markup:

```html
<div class="@container">
  <div class="flex flex-col @8xl:flex-row">
    <!-- ... -->
  </div>
</div>
```

Learn more about customizing your theme in the theme documentation.

### Using arbitrary values

Use variants like `@min-[475px]` and `@max-[960px]` for one-off container query sizes you don't want to add to your theme:

```html
<div class="@container">
  <div class="flex flex-col @min-[475px]:flex-row">
    <!-- ... -->
  </div>
</div>
```

### Using container query units

Use container query length units like `cqw` as arbitrary values in other utility classes to reference the container size:

```html
<div class="@container">
  <div class="w-[50cqw]">
    <!-- ... -->
  </div>
</div>
```

### Container size reference

By default, Tailwind includes container sizes ranging from 16rem (256px) to 80rem (1280px):

| Variant | Minimum width | CSS |
|---------|---------------|-----|
| @3xs | 16rem (256px) | @container (width >= 16rem) { … } |
| @2xs | 18rem (288px) | @container (width >= 18rem) { … } |
| @xs | 20rem (320px) | @container (width >= 20rem) { … } |
| @sm | 24rem (384px) | @container (width >= 24rem) { … } |
| @md | 28rem (448px) | @container (width >= 28rem) { … } |
| @lg | 32rem (512px) | @container (width >= 32rem) { … } |
| @xl | 36rem (576px) | @container (width >= 36rem) { … } |
| @2xl | 42rem (672px) | @container (width >= 42rem) { … } |
| @3xl | 48rem (768px) | @container (width >= 48rem) { … } |
| @4xl | 56rem (896px) | @container (width >= 56rem) { … } |
| @5xl | 64rem (1024px) | @container (width >= 64rem) { … } |
| @6xl | 72rem (1152px) | @container (width >= 72rem) { … } |
| @7xl | 80rem (1280px) | @container (width >= 80rem) { … } |
