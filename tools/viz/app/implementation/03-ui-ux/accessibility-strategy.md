# Accessibility Strategy

## Executive Summary

This document details the accessibility strategy for the DIGIT Viz application. The core of this strategy is to ensure the application is usable by the widest possible audience, including individuals who rely on assistive technologies. This is achieved by building upon a foundation of inherently accessible technologies—**Radix UI** and **shadcn/ui**—and adhering to **Web Content Accessibility Guidelines (WCAG) 2.1** standards.

---

## 1. Foundational Technologies: Accessibility by Default

A significant portion of our accessibility compliance is achieved by the deliberate choice of our foundational UI technologies.

### Radix UI Primitives

- **Headless and Unstyled**: Radix provides a set of low-level UI primitives (e.g., for dialogs, dropdowns, checkboxes) that are unstyled but come with full accessibility baked in.
- **WAI-ARIA Compliance**: Radix components correctly implement all necessary WAI-ARIA roles, states, and properties. For example, a `Dialog` component automatically manages focus trapping, connects the dialog's title and description to the main element, and handles `aria-modal` and `aria-hidden` attributes.
- **Keyboard Navigation**: All interactive components are fully navigable and operable via the keyboard, following established conventions (e.g., using arrow keys in dropdowns, `Enter`/`Space` to activate buttons, `Escape` to close dialogs).

### shadcn/ui

- **Built on Radix**: As documented in the [UI Component Library](mdc:tools/viz/app/implementation/03-ui-ux/ui-component-library.md) guide, shadcn/ui components are built directly on top of these accessible Radix primitives.
- **Architectural Advantage**: By using shadcn/ui, we inherit all the accessibility benefits of Radix automatically. This means our `Button`, `Dialog`, `Select`, and other UI components are accessible from the moment we add them to our project, freeing up developers to focus on application logic rather than low-level accessibility implementation.

---

## 2. Key Areas of WCAG Compliance

Our strategy focuses on meeting the four main principles of WCAG: Perceivable, Operable, Understandable, and Robust.

### Perceivable

- **Color Contrast**: The default `light` and `dark` themes are designed to meet WCAG AA contrast ratios for text and UI elements. The CSS variable-based color system in our [Theming Architecture](mdc:tools/viz/app/implementation/03-ui-ux/theming-and-styling.md) ensures that foreground and background colors have sufficient contrast.
- **Semantic HTML**: We prioritize using correct, semantic HTML elements (`<main>`, `<nav>`, `<header>`, `<button>`, etc.). This provides a clear structure for screen readers and other assistive technologies.
- **Labels and Alt Text**: All form inputs are associated with a `<label>` element. All meaningful images (if any were used) would include descriptive `alt` text. Decorative images would have an empty `alt=""` attribute.

### Operable

- **Full Keyboard Access**: As mentioned, all interactive elements are keyboard-accessible. This is a primary feature of the underlying Radix components.
- **Focus Management**:
  - **Focus Indicators**: The default browser focus outline is preserved and enhanced with Tailwind's `focus-visible` utility. This ensures that keyboard users can always see which element currently has focus.
  - **Logical Focus Order**: The logical structure of the DOM ensures a predictable focus order when tabbing through the application.
  - **Focus Trapping**: Modal components like `Dialog` automatically trap focus within the modal, preventing users from accidentally interacting with the underlying page.

### Understandable

- **Consistent Navigation**: The main application `Layout` provides a consistent header and navigation structure across all pages.
- **Clear Language**: UI text and labels are written to be clear and concise.
- **Predictable UI**: Components behave in predictable ways, following established web conventions.

### Robust

- **WAI-ARIA Roles and Attributes**: Radix and shadcn/ui handle the heavy lifting of applying the correct ARIA attributes (`role`, `aria-checked`, `aria-expanded`, etc.) to components, ensuring they are correctly interpreted by screen readers.
- **Cross-Browser Compatibility**: The application is tested on modern, evergreen browsers to ensure a consistent experience.

---

## 3. Developer Responsibility and Best Practices

While the framework provides a strong foundation, developers still have a role to play in maintaining accessibility.

- **Use the Right Component**: Always use the provided `ui` components (`Button`, `Input`, etc.) for interactive elements rather than building them from `div`s.
- **Properly Label Forms**: Ensure every `Input` has a corresponding `Label`. For complex forms, use `aria-labelledby` or `aria-describedby` where necessary.
- **Maintain Semantic Structure**: Use appropriate heading levels (`<h1>`, `<h2>`, etc.) to structure page content logically.
- **Manual Testing**: Periodically perform manual accessibility checks:
  1.  **Keyboard-Only Navigation**: Tab through the entire application to ensure all interactive elements are reachable and usable.
  2.  **Color Contrast Checks**: Use browser dev tools or other utilities to spot-check for any custom color combinations that might fail contrast requirements.
  3.  **Screen Reader Testing**: Use a screen reader (e.g., VoiceOver on macOS, NVDA on Windows) to navigate key user flows.

## Conclusion

The DIGIT Viz application's accessibility strategy is proactive rather than reactive. By choosing a technology stack with accessibility at its core, we significantly reduce the burden on developers and ensure a high standard of usability for all users from the outset. This foundation, combined with ongoing developer awareness and best practices, allows us to build an application that is not only powerful but also inclusive.
