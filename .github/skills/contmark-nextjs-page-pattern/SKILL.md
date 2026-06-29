---
name: contmark-nextjs-page-pattern
description: "How to create a new page in a Next.js React project using the Pages Router conventions, feature-based structure, and project patterns."
---

# Skill: Next.js Page Pattern

Use this skill when adding a new page or route to a Next.js project using the Pages Router.

---

## Step 1 — Create the Feature Module

All page logic lives in `src/lib/features/<feature-name>/`. Create the feature folder first:

```
src/lib/features/<feature-name>/
  <FeatureName>.tsx            # Root component
  <FeatureName>.style.tsx      # Styled-components (if needed)
  <FeatureName>.type.ts        # Types & Zod schemas
  <FeatureName>.const.ts       # Constants
  <FeatureName>.config.ts      # Configuration (table columns, form configs, etc.)
  <FeatureName>.hook.ts        # Feature-specific hooks
  <FeatureName>.hook.spec.ts   # Hook tests
  <FeatureName>.cy.tsx          # Cypress component test
  <FeatureName>.spec.tsx        # Jest unit test
  index.ts                      # Barrel export
  components/                   # Sub-components
    <SubComponent>/
      <SubComponent>.tsx
      <SubComponent>.style.tsx
      <SubComponent>.type.ts
      <SubComponent>.cy.tsx
      index.ts
  api/                          # RTK Query endpoints (if feature needs API calls)
```

### Barrel File (`index.ts`)

```typescript
export { FeatureName } from "./FeatureName";
```

### Root Component

```tsx
// src/lib/features/my-feature/MyFeature.tsx
import { useAppSelector, useAppDispatch } from "@/redux/store";
import { McButton } from "@maersk-global/mds-react-wrapper/components-core/mc-button";

interface MyFeatureProps {
  initialFilter?: string;
}

export const MyFeature = ({ initialFilter }: MyFeatureProps) => {
  // Component logic here
  return (
    <div data-cy="my-feature">
      {/* Feature UI using MDS components */}
    </div>
  );
};
```

---

## Step 2 — Create the Page File

Pages are **thin shells** that wrap feature components. Create the page in `src/pages/`:

### Simple Page

```tsx
// src/pages/my-feature/index.tsx
import { ErrorBoundary } from "@/component/common/errorBoundary";
import ErrorFallback from "@/component/common/errorFallback";
import { MyFeature } from "@/lib/features/my-feature";
import type { NextPage } from "next";
import Head from "next/head";

const MyFeaturePage: NextPage = () => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Head>
        <title>Inland</title>
      </Head>
      <MyFeature />
    </ErrorBoundary>
  );
};

export default MyFeaturePage;
```

### Page with Sidebar/Layout

```tsx
// src/pages/my-feature/index.tsx
import styled from "styled-components";
import { MySidebar } from "@/lib/features/my-feature/MySidebar";
import { MyContent } from "@/lib/features/my-feature/MyContent";

const PageContainer = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
`;

const ContentWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: var(--mds_foundations_sizing_xl);
`;

export default function MyFeaturePage() {
  return (
    <PageContainer>
      <MySidebar />
      <ContentWrapper className="mds">
        <MyContent />
      </ContentWrapper>
    </PageContainer>
  );
}
```

### Dynamic Route Page

```tsx
// src/pages/my-feature/[id].tsx
import { useRouter } from "next/router";
import { MyFeatureDetail } from "@/lib/features/my-feature";
import type { NextPage } from "next";

const MyFeatureDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;

  if (!id || typeof id !== "string") return null;

  return <MyFeatureDetail featureId={id} />;
};

export default MyFeatureDetailPage;
```

---

## Step 3 — Add API Endpoints (If Needed)

Create RTK Query endpoints by injecting into `httpBaseApi`:

```typescript
// src/lib/features/my-feature/api/myFeatureApi.ts
import { httpBaseApi } from "@/redux/services/baseApi";

const apiWithTags = httpBaseApi.enhanceEndpoints({
  addTagTypes: ["MyFeature"],
});

const myFeatureApi = apiWithTags.injectEndpoints({
  endpoints: (builder) => ({
    getMyFeatureList: builder.query<FeatureItem[], { search: string }>({
      query: ({ search }) => ({
        url: "/api/my-feature",
        method: "GET",
        params: { search },
      }),
      providesTags: [{ type: "MyFeature", id: "LIST" }],
    }),

    createMyFeature: builder.mutation<FeatureItem, CreateFeaturePayload>({
      query: (payload) => ({
        url: "/api/my-feature",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: [{ type: "MyFeature", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetMyFeatureListQuery, useCreateMyFeatureMutation } = myFeatureApi;
```

---

## Step 4 — Add Redux Slice (If Needed)

Only if the feature needs global client-side state beyond what RTK Query provides:

```typescript
// src/redux/features/myFeature.slice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { MY_FEATURE_INITIAL_STATE } from "@/redux/state/myFeature.initial";

const myFeatureSlice = createSlice({
  name: "myFeature",
  initialState: MY_FEATURE_INITIAL_STATE,
  reducers: {
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
  },
});

export const { setActiveTab } = myFeatureSlice.actions;
export default myFeatureSlice;
```

Then add to `rootReducer` in `src/redux/store.tsx`:

```typescript
[myFeatureSlice.name]: myFeatureSlice.reducer,
```

---

## Step 5 — Add Tests

Every new page/feature needs:

1. **Jest test** for the root component and any hooks/utilities:

```typescript
// src/lib/features/my-feature/MyFeature.spec.tsx
import { expect } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { setupMockStore } from "@/redux/store";
import { STORE_MOCK } from "@/mocks/store.mock";
import { MyFeature } from "./MyFeature";

describe("MyFeature", () => {
  it("should render", () => {
    const store = setupMockStore(STORE_MOCK);
    render(
      <Provider store={store}>
        <MyFeature />
      </Provider>,
    );
    expect(screen.getByTestId("my-feature")).toBeInTheDocument();
  });
});
```

2. **Cypress component test** for interactive behaviour:

```tsx
// src/lib/features/my-feature/MyFeature.cy.tsx
import { ThemeProvider } from "@maersk-global/community-react-styles";
import { Provider } from "react-redux";
import { setupMockStore } from "@/redux/store";
import { STORE_MOCK } from "@/mocks/store.mock";
import { MyFeature } from "./MyFeature";

describe("MyFeature", () => {
  beforeEach(() => {
    const store = setupMockStore(STORE_MOCK);
    cy.mount(
      <ThemeProvider>
        <Provider store={store}>
          <MyFeature />
        </Provider>
      </ThemeProvider>,
    );
  });

  it("renders the feature container", () => {
    cy.get("[data-cy='my-feature']").should("exist");
  });
});
```

---

## Checklist

- [ ] Feature module created in `src/lib/features/<feature-name>/`
- [ ] Page file created in `src/pages/<route>/index.tsx` (default export, thin shell)
- [ ] Page wrapped with `ErrorBoundary` + `<Head>`
- [ ] API endpoints injected into `httpBaseApi` (if needed)
- [ ] Redux slice created and added to `rootReducer` (if needed)
- [ ] Types defined in `.type.ts`, constants in `.const.ts`
- [ ] Barrel file (`index.ts`) exports the root component
- [ ] Jest test (`*.spec.tsx`) written
- [ ] Cypress test (`*.cy.tsx`) written
- [ ] All MDS components used (no custom HTML for standard UI elements)
- [ ] Design tokens used (no hard-coded pixel/colour values)

---

## Use This Skill When

- Adding a new page or route to a Next.js Pages Router project
- Scaffolding a feature module structure (`components/`, `api/`, `hooks`) for a new page
- Deciding where to place route-level vs feature-level components

## Do Not Use This Skill When

- Working with the Next.js App Router (`app/` directory) — this skill covers Pages Router only
- Adding a component that is not a page entry point — create it inside an existing feature's `components/` folder
- Vue projects — use the Vue `spec-driven-development` and `component-library` skills

## Common Mistakes to Avoid

- **Placing feature logic directly in `pages/`** — `pages/` files should only import and render the feature root component; all logic lives in `src/lib/features/<feature-name>/`
- **Not creating a barrel `index.ts`** — every feature folder must export via `index.ts`; internal files must not be imported directly from outside the feature
- **Using custom HTML elements when MDS alternatives exist** — always check the MDS component library before writing `<button>`, `<input>`, or `<table>`
- **Putting RTK Query slice in the wrong folder** — API endpoints go in `api/` inside the feature folder, not in a global `store/` unless truly shared
- **Missing test files at feature creation time** — `*.spec.tsx` (Jest) and `*.cy.tsx` (Cypress) must be created together with the component, not as an afterthought

## Evaluation Cases

| # | Scenario | Expected behaviour |
|---|----------|--------------------|
| 1 | New page `/bookings` added | `src/lib/features/bookings/` created with root component, barrel, and test files; `pages/bookings.tsx` imports from feature |
| 2 | Feature logic placed in `pages/bookings.tsx` | Flagged; moved to `src/lib/features/bookings/Bookings.tsx` |
| 3 | Import from `../bookings/BookingsTable` bypasses barrel | Replaced with import from `@/lib/features/bookings` |
| 4 | `<button>` used instead of `<mc-button>` | Replaced with MDS component |
| 5 | No `*.spec.tsx` at end of implementation | Jest test file created before marking task complete |

## Metadata

| Field | Value |
|---|---|
| Owner | Frontend Platform Team |
| Last reviewed | 2026-05-20 |
| Supported tools | Claude Code, GitHub Copilot |
| Supported repos | solar-inland-ui, any Next.js Pages Router project |
| Security classification | Internal |
| Evaluation status | Not evaluated |
