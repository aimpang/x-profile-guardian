

# Add Terms, Privacy Pages + Footer Links

## New Files

### `src/pages/Terms.tsx`
Static page with the provided Terms of Service content. Dark themed, max-w-2xl centered, with a back link to home. Wrapped in the same min-h-screen layout.

### `src/pages/Privacy.tsx`
Static page with the provided Privacy Policy content. Same layout as Terms.

## Modified Files

### `src/App.tsx`
- Import `Terms` and `Privacy` components
- Add routes: `<Route path="/terms" element={<Terms />} />` and `<Route path="/privacy" element={<Privacy />} />`

### `src/pages/Dashboard.tsx`
- Replace the existing bottom footer (email + logout) with a version that also includes `Terms of Service · Privacy Policy` links
- Keep the existing email display and logout button, just add the legal links as small muted text below

### `src/pages/Index.tsx`
- Add `Terms of Service · Privacy Policy` links to the existing `<footer>` section, next to or below the copyright line

## No other changes to the dashboard layout.

