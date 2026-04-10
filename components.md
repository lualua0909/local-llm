# Components

## UI Component Layers
- Shared reusable UI: `src/shared/components/*`.
- Feature/page UI: `src/app/(dashboard)/dashboard/**` and `src/app/landing/**`.

## Shared Components (Key)
- `Input({ label, type, value, onChange, ... })`: form input with label/error/hint.
- `Button({ variant, size, loading, icon, ... })`: standardized button states.
- `Select({ options, value, onChange, ... })`: dropdown for config forms.
- `Modal({ isOpen, onClose, title, children, ... })`: modal shell (`ConfirmModal` exported too).
- `Card({ title, subtitle, action, ... })`: panel container.
- `Toggle({ checked, onChange, ... })`: boolean controls.
- `Pagination({ currentPage, pageSize, totalItems, ... })`: paging controls.
- `ThemeProvider({ children })` + `ThemeToggle(...)`: theme context and switch.
- `UsageStats()`: usage dashboard stream consumer UI.
- `RequestLogger()`: request logs viewer.

## Dashboard Feature Components (Representative)
- `ProvidersPage()`: provider management overview (loads `/api/providers` + `/api/provider-nodes`).
- `ConnectionsCard({ providerId, isOAuth })`: per-provider connections management.
- `ModelsCard({ providerId, kindFilter })`: provider models + test/copy actions.
- `UsagePage()`: tabbed usage screen (overview/details).
- `RequestDetailsTab()`: paginated request-details table.
- `UsageChart({ period })`: chart from `/api/usage/chart`.
- `ProviderTopology({ providers, activeRequests, ... })`: visual request/provider topology.
- `CLIToolsPageClient({ machineId })`: setup UI for external CLI tools.
- `EndpointPageClient({ machineId })`: endpoint + API key onboarding page.
- `MitmPageClient()`: MITM control panel.

## Landing Components
- `Navigation()`, `HeroSection()`, `FlowAnimation()`, `HowItWorks()`, `Features()`, `GetStarted()`, `Footer()`.

## State Management in UI
- Global state via Zustand:
- `themeStore`: theme + persistence.
- `providerStore`: provider list + async fetch.
- `notificationStore`: toast notifications.
- `userStore`: simple user/loading/error state.
- Local component state: extensive `useState` usage in page-level clients (e.g. providers page).

## Props/State Confidence Notes
- Props are directly extracted from function signatures.
- Deep internal local state for every component is not fully enumerated.
- State details for uninspected components: `UNKNOWN`.
