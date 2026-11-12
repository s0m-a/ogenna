# Frontend Architecture and Admin Design System

## 1. Objective

Build a polished, functional administration frontend for the fabric e-commerce platform, inspired by the visual identity and content structure of https://mylittlefabricshop.com/en-en.

Use the reference for visual inspiration: warm neutral colours, editorial typography, generous whitespace, high-quality textile imagery, understated accents, and a premium handmade aesthetic.

Do not copy the reference site's source code, proprietary assets, logo, or exact branded content.

The admin must prioritize usability, clarity, accessibility, and efficient store management.

The store owner must be able to manage products, variants, categories, collections, images, homepage content, discounts, referrals, and supported store settings without editing frontend source code.

## 2. Mandatory Repository Inspection

Before writing code:

1. Inspect the existing frontend architecture.
2. Identify the framework, routing system, language, data-fetching library, state management, form library, and styling conventions.
3. Inspect existing shared components, layouts, authentication flows, and API clients.
4. Identify current hardcoded content and existing theme files.
5. Inspect package dependencies before installing anything.
6. Propose the smallest set of files needed for the next feature.

Reuse the existing application architecture. Do not introduce a new framework or replace existing libraries without justification.

Do not implement the entire admin dashboard in one pass.

## 3. Styling Requirements

### Styled Components

Use styled-components for application component styling.

- Define reusable styled components for common interface elements.
- Keep styling close to the component or in a clearly organized component styles file.
- Use the shared theme for colours, typography, spacing, borders, radii, and other reusable design tokens.
- Avoid adding Tailwind, CSS Modules, or another styling system unless the repository already uses it and a change is justified.
- Do not use inline styles for ordinary layout or repeated design decisions.
- Avoid global selectors except for deliberate resets, typography, and global application styles.

Follow the existing import conventions and file extensions.

### Central Theme File

Maintain one authoritative theme definition, preferably at `src/styles/theme.js` or the equivalent existing location.

All shared design tokens must be defined there.

Use semantic token names, including:

- primary100
- primary200
- primary300
- primary400
- primary500
- primary600
- background
- surface
- surfaceMuted
- textPrimary
- textSecondary
- textInverse
- border
- success
- warning
- danger

Include shared tokens for typography, spacing, border radii, shadows, and breakpoints where useful.

All components must consume tokens through the styled-components theme.

Do not scatter raw hexadecimal colour values throughout components.

Do not duplicate colour palettes in individual features.

If the repository already has a theme, extend or refine it rather than creating a competing theme.

### ThemeProvider and Global Styles

Use the existing application root to provide the shared theme through ThemeProvider.

Create or update a global styles file for:

- Box sizing.
- Body margin and background.
- Base typography.
- Link defaults.
- Form control typography.
- Focus-visible outlines.
- Consistent selection and disabled states.

Load fonts deliberately. Prefer the existing font setup or a reliable self-hosted font strategy.

Use a serif font for selected editorial headings and a readable sans-serif font for controls, forms, navigation, and tables.

Do not use the serif font for dense data-heavy interfaces.

## 4. Visual Direction

The visual language should reflect the reference fabric store without sacrificing the usability of an administration tool.

### Palette

Use warm ivory or off-white application backgrounds, white or cream surfaces, muted terracotta primary actions, soft beige accents, dark brown text, and restrained sage or amber status colours.

Primary colour usage must be consistent across the application.

Use primary400 for the standard primary action where appropriate, primary500 for hover states, and primary600 for pressed or emphasized states.

Use accessible text contrast. Do not rely on colour alone to communicate errors, stock levels, permissions, or order status.

### Layout

Build a responsive admin shell with:

1. A persistent left navigation sidebar on desktop.
2. A top header with page title, contextual actions, search where appropriate, notifications where supported, and the authenticated user's profile.
3. A main content area with consistent spacing.
4. Responsive sidebar behavior for smaller screens.
5. Reusable page headers and breadcrumbs where useful.

The content area should use generous but practical spacing.

Avoid excessive shadows, gradients, decorative animations, large rounded cards, and unnecessary dashboard charts.

Use subtle borders and clear visual hierarchy.

### Typography

Use consistent typography tokens.

- Editorial page headings may use the serif heading font.
- Tables, buttons, labels, inputs, metadata, and navigation should use the body font.
- Maintain clear distinctions between page titles, section headings, body text, helper text, and metadata.
- Avoid inconsistent font sizes and arbitrary font weights.
- use font family Petrona, lora, inter,PingFang SC
-Petrona for header
- lora for sub header

### Product Photography

Use real media returned by the API.

Display fabric thumbnails using appropriate aspect ratios and consistent image containers.

Use object-fit intentionally. Product fabric images should not be distorted.

Show a graceful fallback for missing images.

Never hardcode image URLs in production UI components when the image should be managed through the media library.

## 5. Admin Navigation

Create a persistent, permission-aware sidebar with these logical groups.

### Overview
- Dashboard.

### Catalogue
- Products.
- Categories.
- Collections.
- Inventory.
- Media Library.

### Storefront
- Homepage Editor.
- Pages and Editorial Content.
- Navigation Menus.
- Reviews.

### Marketing
- Discounts and Coupons.
- Referrals.
- Gift Cards, if implemented.

### Operations
- Orders.
- Customers.

### Configuration
- Store Settings.
- Users and Permissions.
- Activity Log.

Use clear labels and suitable icons.

Show active navigation states using the shared theme.

Collapse related navigation groups where appropriate.

Do not show links that the authenticated user is not authorized to access.

Hiding a link is not sufficient authorization. The backend remains responsible for enforcing access control.

## 6. Dashboard Page

Create a clean operational dashboard rather than a decorative analytics page.

Include data-backed summaries where available:

- Sales over a defined period.
- Total orders.
- Pending orders.
- Published products.
- Draft products.
- Low-stock products.
- Out-of-stock products.
- Active discounts.
- Pending referral rewards.
- Recent orders.
- Recent administrative activity.

Use reusable summary cards and tables.

Every metric must be based on actual API data. Do not invent values or create misleading sample charts in production.

When no data exists, show a useful empty state and a relevant action.

## 7. Products Interface

Build a searchable, filterable, paginated product table.

Display:

- Product image.
- Product name.
- SKU or variant count where appropriate.
- Category.
- Price or price range.
- Inventory status.
- Publication status.
- Last updated timestamp.
- Row actions.

Provide actions to create, edit, duplicate, publish, unpublish, and archive products according to permissions.

The product form must be divided into clear sections or a step-based workflow when useful.

Include:

- Basic details.
- Descriptions and specifications.
- Image gallery.
- Variants and options.
- Pricing.
- Fabric selling rules.
- Inventory.
- Categories and collections.
- SEO metadata.
- Publication controls.

Provide clear validation, unsaved-change warnings, and loading, success, and error states.

Variant editing must allow administrators to manage options, valid combinations, SKUs, variant images, prices, and stock.

Do not make complex variant configuration a single unstructured text field.

## 8. Categories and Collections Interface

Build reusable listing and editing interfaces for categories and collections.

Category fields should include name, slug, description, image, parent category where applicable, ordering, and visibility.

Collection fields should include name, slug, description, image, product selection, product ordering, publication status, and supported collection rules.

Support image upload and media-library selection.

Use explicit controls for hierarchy, product selection, and ordering.

Prevent accidental destructive operations.

Show clear empty states when no categories or collections exist.

## 9. Media Library Interface

Create a reusable media picker and media library.

Support:

- Grid and list views where useful.
- Image thumbnails and larger previews.
- Upload progress.
- Multiple image selection.
- Drag-and-drop upload where supported.
- Search and filtering.
- Alternative text editing.
- Asset replacement.
- Image ordering.
- Reference information where an asset is used.
- Safe deletion or archival.

The media picker must be reusable in product forms, variant forms, category forms, collection forms, homepage sections, page content, and other supported content interfaces.

Use the backend media API and object-storage workflow.

Do not implement a separate, incompatible image upload mechanism for every page.

## 10. Storefront Editor

Create an admin interface that manages existing supported homepage section types and editable content pages.

Allow authorized users to:

- Add and remove supported sections.
- Edit headings, descriptions, and buttons.
- Select media from the media library.
- Choose products or collections.
- Reorder sections.
- Duplicate sections.
- Toggle visibility.
- Preview drafts.
- Publish validated content.

Use a clear section list or editor with recognizable section types.

Display the configuration controls appropriate to each section type.

Do not expose arbitrary HTML, JavaScript, or unrestricted CSS editing.

Do not build a generic page builder before the supported section types and their data contracts are defined.

The public storefront must render published content from the API.

Draft content must not appear publicly.

Provide a preview mechanism that does not expose drafts to unauthorized users.

## 11. Discounts and Coupons Interface

Build a discount listing page with search, filtering, status badges, date information, and redemption summaries where available.

Create and edit forms for:

- Percentage discounts.
- Fixed-amount discounts.
- Coupon codes.
- Automatic promotions where supported.
- Eligible products, categories, and collections.
- Minimum order requirements.
- Maximum discount values.
- Redemption limits.
- Per-customer limits.
- Start and end dates.
- Combination rules.
- Activation and expiry.

Show a readable summary of the configured promotion before activation.

Display active, scheduled, paused, expired, and archived states.

Provide confirmation for activation, pausing, and archival where appropriate.

The frontend must submit configuration to the backend. It must not determine final discount eligibility or calculate authoritative checkout totals.

## 12. Referrals Interface

Build a referrals management page with:

- Program configuration.
- Program status.
- Referral list.
- Referral and reward status.
- Qualifying order reference.
- Reward amount and type.
- Reward availability and expiry.
- Search and filters.
- Pending review actions.
- Performance summaries.

Provide forms for configuring attribution windows, qualifying purchase requirements, reward types, reward values, expiry, and combination rules.

Show the referral lifecycle clearly.

Manual approvals, rejections, and reversals must include a reason and be recorded by the backend.

Do not allow the frontend to issue arbitrary rewards or override authoritative order eligibility.

Provide clear empty, pending, rejected, expired, and completed states.

## 13. Shared Components

Create reusable components where they reduce duplication and establish consistent behavior.

Examples:

- AdminLayout.
- AdminSidebar.
- AdminHeader.
- PageHeader.
- Breadcrumbs.
- PrimaryButton.
- SecondaryButton.
- IconButton.
- TextInput.
- SelectInput.
- TextArea.
- FormField.
- Modal.
- ConfirmationDialog.
- DropdownMenu.
- DataTable.
- Pagination.
- SearchInput.
- FilterBar.
- StatusBadge.
- EmptyState.
- ErrorState.
- LoadingState.
- Skeleton.
- Toast or notification system.
- ImageUploader.
- MediaPicker.
- ProductImage.
- PriceDisplay.

Use a consistent API and visual behavior for shared components.

Do not create a separate implementation of the same component in every feature.

Avoid creating abstractions that add complexity without reducing meaningful duplication.

## 14. Data Fetching and State

Use the repository's existing API client, data-fetching library, and state management conventions.

Do not introduce a second data-fetching library without justification.

Treat the backend as the source of truth for products, prices, stock, discounts, referrals, permissions, and published content.

Handle loading, error, empty, and success states explicitly.

Refresh or invalidate relevant cached data after successful mutations.

Prevent stale product data or stale permissions from enabling invalid actions.

Avoid duplicating server state in global client state without a clear reason.

Forms may keep local editing state, but submitted values must be validated by the backend.

## 15. Form and Interaction Standards

Every visible control must perform its advertised action.

- Buttons must submit, navigate, open a dialog, or perform the specified action.
- Dropdowns must support their intended selection behavior.
- Search fields must filter or query the relevant data.
- Pagination controls must change the displayed result set.
- Upload controls must upload files and report progress or failure.
- Modals must have working close and confirmation behavior.
- Destructive actions must require appropriate confirmation.
- Save and publish actions must have clear success and failure feedback.

Do not use placeholder links or inert buttons in completed features.

Prevent duplicate submissions where operations are sensitive.

Preserve user input when recoverable request errors occur.

## 16. Accessibility and Responsiveness

Support keyboard navigation and visible focus states.

Use semantic HTML and accessible labels.

Ensure modal focus behavior is correct.

Do not rely exclusively on colour to communicate status.

Provide accessible alternatives to drag-and-drop interactions.

Make tables, forms, navigation, and dialogs usable at smaller screen sizes.

Use responsive breakpoints defined centrally or follow the existing responsive system.

The admin should be fully usable on desktop and tablet, with sensible mobile behavior for essential operations.

## 17. Security

Never place secrets in frontend environment variables exposed to the browser.

Do not trust client-side permissions or validation as security boundaries.

Do not expose unpublished content through public APIs.

Do not display private customer or payment information to unauthorized users.

Handle authentication expiration and unauthorized API responses according to the existing authentication architecture.

Avoid rendering unsanitized HTML.

Do not leak internal errors or sensitive API response details into user-facing messages.

## 18. File Organization

Follow the existing project conventions.

Where the current repository permits, organize the admin by feature.

Suggested structure:

src/
  styles/
    theme.js
    GlobalStyles.js
  components/
    admin/
    common/
    forms/
    media/
  features/
    admin/
      dashboard/
      products/
      categories/
      collections/
      inventory/
      media/
      storefront/
      discounts/
      referrals/
      orders/
      customers/
      settings/
  layouts/
  services/
  hooks/
  utils/

This is a suggested organization, not permission to reorganize the entire repository. Adapt it to the existing framework, routing model, and folder conventions.

Keep shared components separate from feature-specific components.

Keep API calls in the existing service or data-access layer rather than scattering fetch logic across unrelated UI files.

## 19. Implementation Order

Build the frontend in the following order:

### Milestone 1: Design System and Admin Shell
- Inspect the repository.
- Establish the shared theme.
- Set up ThemeProvider and global styles where needed.
- Implement responsive admin layout.
- Implement sidebar and header.
- Create reusable buttons, inputs, badges, dialogs, and page headers.
- Connect authentication and permission-aware navigation.

### Milestone 2: Product Management
- Build the product list.
- Build product creation and editing.
- Add variants and fabric quantity rules.
- Connect categories and collections.
- Integrate the media picker.
- Implement publication workflows.

### Milestone 3: Categories, Collections, and Inventory
- Build category management.
- Build collection management.
- Add inventory controls.
- Connect all forms to the API.

### Milestone 4: Media Library
- Implement reusable upload and selection workflows.
- Connect product, category, collection, and variant images.
- Add metadata and safe deletion behavior.

### Milestone 5: Storefront Editor
- Build homepage section management.
- Implement section configuration and ordering.
- Add draft preview and publication workflows.
- Build editable page content and navigation management.

### Milestone 6: Discounts and Referrals
- Build discount and coupon administration.
- Build referral program configuration.
- Build referral and reward review interfaces.
- Connect all actions to backend APIs.

### Milestone 7: Remaining Administration
- Orders.
- Customers.
- Store settings.
- Reviews.
- Gift cards and editorial content where implemented.
- User permissions and activity logs.

### Milestone 8: Quality Review
- Verify responsive behavior.
- Verify accessibility.
- Verify API integration and permissions.
- Verify empty, error, and loading states.
- Verify all visible controls work.
- Remove hardcoded production content.
- Run relevant tests and report actual results.

## 20. Coding Agent Instructions

Before each milestone, inspect the relevant existing files and explain the intended changes.

Do not modify unrelated files.

Do not replace existing architecture without justification.

Do not introduce a new styling library.

Use styled-components and the shared theme.

Do not hardcode production images, products, prices, categories, discounts, referrals, or homepage content that should come from the backend.

Use mock data only when explicitly needed for an isolated prototype, and keep it separate from production data access.

Implement one coherent workflow at a time.

After implementation, summarize:
- Files created or modified.
- What now works.
- API endpoints used.
- Validation and permission behavior.
- Tests run and their actual results.
- Known limitations.
- The next smallest implementation step.

Start by auditing the existing repository and proposing Milestone 1. Do not make substantial code changes until the plan is reviewed.