# Fabric E-commerce Platform

## 1. Project Overview

Build a full-stack fabric e-commerce platform inspired by the customer experience of https://mylittlefabricshop.com/en-en.

This is an independent implementation. Use the reference website to understand its features, navigation, product catalogue, shopping experience, and business workflows. Do not copy its proprietary assets, branding, or source code.

The project must support selling fabrics by length, browsing product collections, managing stock, shopping carts, checkout, payments, customer accounts, order management, and an administrative dashboard.

## 2. Development Approach

Backend-first development.

Build a modular monolith with clearly separated business domains. Do not introduce microservices unless a demonstrated requirement justifies them.

Work incrementally. Complete and test one milestone before moving to the next.

Before implementing any feature:
1. Inspect the existing repository and its conventions.
2. Identify related modules, models, routes, services, and tests.
3. Explain the proposed implementation and relevant design decisions.
4. Implement only the agreed scope.
5. Run relevant tests and report the results.

Do not rewrite existing code unnecessarily. Do not invent requirements or assume integrations have been configured.

## 3. Technology Stack

- Runtime: Node.js
- Backend framework: NestJS
- Language: TypeScript
- Database: PostgreSQL
- ORM: Prisma
- API style: REST
- API prefix: /api/v1
- Validation: Validate every incoming request at the API boundary
- Testing: Jest and Supertest
- Image storage: S3-compatible object storage
- Payment processing: Integrate a suitable provider after the order workflow is implemented

If a framework integration requires TypeScript, explain the trade-off before introducing a mixed-language architecture. Prefer one consistent language throughout the backend.

## 4. Core Business Requirements

### Product Catalogue
- Create, read, update, and archive products.
- Store product name, slug, description, fabric type, material composition, width, weight where applicable, care instructions, and status.
- Support multiple images per product.
- Associate products with one or more categories.
- Support product variants where attributes such as colour, pattern, or size differ.
- Support sale prices and regular prices.
- Support product search, filtering, sorting, and pagination.
- Display featured products, new arrivals, and sale items.

### Fabric Quantities and Pricing
- Model fabric sold by length explicitly.
- Configure the selling unit and minimum order quantity per product.
- Support configurable quantity increments.
- Store prices as integer minor currency units, not floating-point numbers.
- Store a currency code with prices and orders.
- Calculate line totals and order totals on the server.
- Validate requested quantities against product rules and available stock.

Do not assume every fabric is sold in the same unit or increment. Make these configurable.

### Categories and Collections
- Create and manage hierarchical categories.
- Support collections such as new arrivals, bestsellers, sale items, and product groupings.
- Allow products to appear in multiple collections.
- Keep collection membership separate from the product's primary category.

### Inventory
- Track stock for each inventory-managed product or variant.
- Prevent purchases beyond available stock.
- Record inventory adjustments.
- Keep an auditable record of stock changes.
- Use database transactions to protect stock during order placement.
- Define when stock is reserved, deducted, or released.

### Shopping Cart
- Support guest carts and authenticated customer carts.
- Add, remove, and update cart items.
- Validate products, variants, quantities, and current prices.
- Return an updated cart subtotal after each change.
- Merge guest cart items into the customer cart after login where appropriate.
- Never trust prices or totals submitted by the client.

### Checkout and Orders
- Collect customer contact information and delivery address.
- Calculate shipping and applicable taxes on the server.
- Show an order summary before payment.
- Create an order with an immutable snapshot of purchased product names, variants, unit prices, quantities, currency, and totals.
- Support order statuses such as pending payment, paid, processing, shipped, delivered, cancelled, and refunded.
- Record payment status separately from fulfillment status.
- Make order creation and payment processing safe against duplicate requests.
- Define cancellation, stock restoration, and refund rules explicitly.

### Customers and Authentication
- Register and authenticate customers.
- Support login, logout, and password reset.
- Allow customers to manage saved addresses.
- Allow customers to view their own order history.
- Restrict administrative endpoints to authorized staff.
- Enforce ownership checks on customer resources.

### Administration
- Manage products, categories, collections, variants, and inventory.
- View and update orders according to permitted status transitions.
- Search orders and customers.
- View payment and refund records.
- Restrict sensitive actions by role.
- Record important administrative changes.

## 5. Initial Data Model

Design and document relationships for these entities before implementing migrations:

- User
- Address
- Role or permission
- Product
- ProductVariant
- ProductImage
- Category
- Collection
- CollectionProduct
- InventoryItem
- InventoryMovement
- Cart
- CartItem
- Order
- OrderItem
- Payment
- Refund
- ShippingMethod

Add supporting entities only when justified by a real requirement.

Use stable IDs, appropriate foreign keys, database constraints, indexes, timestamps, and explicit deletion policies.

Product variants must have unique identifiers or SKUs where applicable. Define how products without variants are represented.

An order item must preserve the purchased details even if the original product changes or is deleted.

Keep inventory quantities and money values in appropriate numeric types. Never use floating-point arithmetic for monetary calculations.

## 6. Initial API Design

Use REST endpoints under /api/v1.

### Health
- GET /health

### Products
- GET /products
- GET /products/:slug
- POST /admin/products
- PATCH /admin/products/:id
- DELETE /admin/products/:id, implemented as an appropriate archive operation where required

### Categories and Collections
- GET /categories
- GET /categories/:slug
- GET /collections
- GET /collections/:slug

### Cart
- POST /cart
- GET /cart
- POST /cart/items
- PATCH /cart/items/:id
- DELETE /cart/items/:id

### Authentication and Customers
- POST /auth/register
- POST /auth/login
- POST /auth/logout
- POST /auth/forgot-password
- POST /auth/reset-password
- GET /customers/me
- GET /customers/me/orders

### Checkout and Orders
- POST /checkout/quote
- POST /orders
- GET /orders/:id
- GET /orders
- PATCH /admin/orders/:id/status

### Inventory
- GET /admin/inventory
- POST /admin/inventory/adjustments

These are initial API candidates, not permission to implement every endpoint immediately. Refine request and response contracts before each milestone. Protect admin routes and customer-owned resources.

## 7. Backend Architecture

Organize the application by business domain.

Suggested modules:

src/
  main.js
  app.module.js
  common/
  config/
  database/
  auth/
  users/
  products/
  categories/
  collections/
  inventory/
  carts/
  checkout/
  orders/
  payments/
  shipping/
  admin/

Within each module, separate responsibilities into controllers, services, DTOs or validation schemas, and persistence logic where appropriate.

Controllers handle HTTP requests and responses. Services implement business rules. Database operations belong behind a clear persistence boundary when that improves testability.

Do not create abstractions solely for the sake of abstraction.

## 8. Security and Reliability

- Validate all external input.
- Hash passwords using a suitable password-hashing algorithm.
- Store secrets in environment variables.
- Never commit credentials or real customer data.
- Apply rate limits to authentication and sensitive endpoints.
- Configure CORS deliberately.
- Use secure cookies when cookie-based authentication is selected.
- Verify payment webhooks using provider-supported signature verification.
- Make webhook processing idempotent.
- Do not mark orders as paid based only on a frontend redirect.
- Use database transactions for order placement and inventory changes.
- Prevent unauthorized access to other customers' orders.
- Add structured error handling and useful logs without exposing secrets.
- Document backup and recovery expectations before production deployment.

## 9. Testing Requirements

Every completed milestone must include appropriate tests.

Prioritize:
- Validation and error handling.
- Product visibility and availability.
- Quantity and price calculations.
- Stock limits and concurrent order attempts.
- Cart ownership and quantity updates.
- Authentication and authorization.
- Order creation and state transitions.
- Duplicate payment notifications.
- Customer data isolation.

Use automated tests for business rules and integration tests for critical database workflows.

## 10. Milestones

### Milestone 0: Repository and Design Audit
- Inspect the repository.
- Confirm framework, language, package manager, and existing conventions.
- Identify missing infrastructure and configuration.
- Propose the data model and module structure.
- Document unresolved decisions.
- Do not implement the whole application.

### Milestone 1: Backend Foundation
- Initialize the application if needed.
- Configure environment variables and validation.
- Connect PostgreSQL and Prisma.
- Add database migration workflow.
- Add health checks and centralized error handling.
- Establish automated testing.

### Milestone 2: Catalogue
- Implement products, variants, categories, and collections.
- Add pagination, filtering, sorting, and search.
- Seed a small set of clearly identified demonstration products.
- Test public catalogue endpoints and admin authorization.

### Milestone 3: Inventory
- Implement stock tracking and inventory movements.
- Add quantity validation and transactional stock updates.
- Test insufficient stock and concurrent purchase scenarios.

### Milestone 4: Cart
- Implement guest and authenticated carts.
- Add cart item management and server-side price calculations.
- Test cart ownership and product availability.

### Milestone 5: Orders and Checkout
- Define checkout quotes, shipping, taxes, order snapshots, and order statuses.
- Implement transactional order creation.
- Keep payment integration behind a clear boundary.

### Milestone 6: Payments
- Integrate the selected payment provider.
- Implement payment initialization, verified webhooks, and reconciliation.
- Test failed payments, duplicate notifications, and refunds.

### Milestone 7: Customers and Admin
- Complete customer account features.
- Build order administration, inventory management, and access control.

### Milestone 8: Production Readiness
- Review security, indexes, observability, backups, deployment, and API documentation.
- Run end-to-end tests against the main purchasing journey.

## 11. Definition of Done

A feature is not complete merely because an endpoint returns a successful response.

A milestone is complete when:
- Its requirements are implemented.
- Request validation and authorization are in place.
- Database constraints and error cases are addressed.
- Relevant tests pass.
- API behavior is documented.
- Environment requirements are documented.
- No unrelated refactoring or unfinished work is hidden in the change.
- The implementation and any remaining limitations are explained.

## 12. Working Instructions for the Coding Agent

Start with Milestone 0.

First inspect the repository and report:
1. Existing structure and technology stack.
2. What is already implemented.
3. Recommended module structure.
4. Proposed entity relationships.
5. Important business rules and unresolved questions.
6. The smallest next implementation step.

Do not generate the entire backend in one response. Do not skip the design review, invent payment credentials, or claim tests passed without running them.

Explain important design decisions and their trade-offs. Prefer simple, maintainable code and incremental, verifiable progress.


# Admin Dashboard and Storefront Content Management

## 1. Objective

Build a secure, comprehensive administration system that allows the store owner and authorized staff to manage the entire e-commerce platform without requiring a developer for routine content, product, inventory, or store configuration changes.

The admin dashboard must be a functional content management system (CMS), product information management system, and store operations interface.

The public storefront must render content from backend APIs and persistent storage rather than relying on hardcoded product lists, images, banners, headings, promotional content, or category data.

An authorized administrator must be able to create, edit, preview, publish, unpublish, reorder, schedule where supported, and archive supported content through the admin interface.

A developer should only be needed when adding genuinely new application functionality, introducing new component types, changing business rules, or modifying the underlying design system.

## 2. Mandatory Development Rules

Before implementation:

1. Inspect the existing repository, framework, database, API architecture, authentication, frontend routing, and existing components.
2. Identify which features already exist and reuse them where appropriate.
3. Document the proposed data model, API contracts, media storage strategy, and admin navigation.
4. Identify existing hardcoded storefront content that must become database-managed.
5. Propose the implementation milestones before writing substantial code.

Do not assume the application uses a particular frontend framework, authentication method, ORM, or cloud provider. Confirm the existing stack first.

Do not rebuild existing features unnecessarily.

Do not implement the entire administration system in one step. Work in small, testable milestones.

## 3. Admin Dashboard Navigation

Create a protected admin area with a persistent sidebar and a main content region.

Recommended navigation:

- Dashboard
- Products
- Categories
- Collections
- Inventory
- Media Library
- Storefront Editor
- Navigation Menus
- Orders
- Customers
- Discounts and Promotions
- Reviews
- Blog and Editorial Content
- Gift Cards
- Store Settings
- Users and Permissions
- Activity Log

Group related items logically. Use searchable tables, filters, pagination, forms, confirmation dialogs, clear validation messages, and loading, empty, and error states.

Only display navigation items and actions the current user is authorized to access.

## 4. Dashboard Overview

The dashboard should provide useful operational information:

- Total orders and recent orders.
- Sales summary, subject to the availability of reliable payment data.
- Products published and in draft.
- Products that are out of stock or running low.
- Recent inventory changes.
- Pending fulfillment.
- Recent administrative activity.
- Quick actions to create a product, upload media, create a category, or edit the homepage.

Do not display fabricated metrics. If a metric cannot be calculated from existing data, omit it or clearly indicate that data is unavailable.

## 5. Product Management

Administrators must be able to create, edit, duplicate, publish, unpublish, and archive products.

### Product fields

Support appropriate fields for:

- Product name.
- URL slug.
- Short description.
- Full description.
- Product type.
- Fabric composition.
- Fabric width.
- Weight or GSM, where applicable.
- Care instructions.
- Country of origin, where relevant.
- Certifications, where verified.
- Tags.
- Categories.
- Collections.
- Product images and image ordering.
- Regular price.
- Sale price and sale period.
- Currency.
- Product status.
- Featured status.
- Search engine title and description.
- Related products.
- Creation and modification timestamps.

Do not make every field mandatory. Requirements should depend on the product type.

### Product status

Support at least:

- Draft
- Published
- Archived

Only published and otherwise eligible products should appear in public catalogue endpoints.

A draft product must be available to authorized administrators for editing and preview, without being publicly purchasable.

Archiving must not destroy historical order records.

### Product forms

The product form should be organized into logical sections:

1. Basic information.
2. Description and specifications.
3. Product media.
4. Pricing.
5. Variants.
6. Inventory.
7. Categories and collections.
8. Related products.
9. Search engine metadata.
10. Publishing controls.

Validate fields on both the client and server. Show field-level errors and preserve form data when a request fails.

Warn administrators about unsaved changes before navigating away.

## 6. Product Variants

Support products with no variants and products with multiple variants.

Examples of variant attributes include colour, pattern, fabric finish, size, or other relevant product options.

### Variant requirements

An administrator must be able to:

- Define variant option names.
- Add, edit, and remove option values.
- Generate valid combinations of option values.
- Select individual variants for editing.
- Assign a SKU to each variant.
- Assign a barcode where applicable.
- Set variant-specific prices where required.
- Set variant-specific stock quantities.
- Assign images to individual variants.
- Mark a variant unavailable without necessarily disabling the entire product.
- Reorder options and values.
- Archive variants without corrupting existing orders.

Avoid duplicate combinations and duplicate SKUs where SKU uniqueness is required.

Do not generate every possible combination automatically without giving the administrator control over which combinations are valid.

### Variant pricing and inventory

A variant may inherit product-level pricing or override it.

Define inheritance explicitly. When an administrator changes a parent product's price, do not silently overwrite intentional variant-specific overrides.

Track stock at the correct level. If variants are independently purchasable, inventory must be associated with the variant or an explicit inventory item linked to it.

## 7. Fabric Selling Rules

The store sells fabrics by length, so quantity rules must be configurable.

Support:

- Selling unit, such as metre or another supported unit.
- Minimum order quantity.
- Permitted quantity increments.
- Price per selling unit.
- Available quantity.
- Optional maximum order quantity.
- Stock unit and conversion rules where necessary.

Examples:

- A fabric can be sold in increments of 0.5 metres.
- Another product can require a minimum order of 1 metre.
- An accessory can be sold as individual pieces.

These are examples, not global defaults.

Represent quantities precisely using suitable decimal or integer-scaled database types. Avoid floating-point arithmetic for stock and pricing calculations.

Validate quantity rules and stock availability on the server, not just in the storefront.

## 8. Category Management

Administrators must be able to:

- Create categories.
- Edit category names and descriptions.
- Set a unique slug.
- Upload a category image or banner.
- Set an optional parent category.
- Reorder categories.
- Choose whether a category is visible in navigation.
- Publish, unpublish, or archive categories.
- Assign and remove products.
- Configure category-specific SEO metadata.
- Preview the category page.

Support hierarchical categories where appropriate.

Prevent circular parent-child relationships.

Define what happens to products and child categories when a category is archived. Do not silently delete associated products.

The public storefront must obtain categories from the API.

## 9. Collection Management

Categories and collections must be separate concepts.

Categories describe how the catalogue is organized. Collections group products for merchandising, marketing, or campaigns.

Examples include:

- New arrivals.
- Bestsellers.
- Sale items.
- Seasonal collections.
- Featured fabrics.
- Quilted fabrics.
- Curated editorial collections.

Administrators must be able to:

- Create and edit collections.
- Set a name, slug, description, image, and publication status.
- Add or remove products.
- Reorder products manually.
- Choose a supported automatic collection rule where implemented.
- Configure collection-specific SEO metadata.
- Preview the collection page.
- Control visibility and placement in navigation or homepage sections.

Do not implement automatic collection rules as arbitrary executable code. Use explicitly supported and validated rule types.

If a collection is manually curated, preserve the administrator's chosen product ordering.

## 10. Media Library

Build a reusable media library shared across products, variants, categories, homepage sections, blog posts, and other supported content.

### Upload and management

Administrators must be able to:

- Upload one or multiple images.
- Drag and drop files into an upload area.
- View thumbnails and larger previews.
- Search and filter existing media.
- Select previously uploaded images.
- Replace an image in an existing content item.
- Reorder image galleries.
- Add descriptive alternative text.
- Edit supported image metadata.
- View where a media asset is used.
- Remove unused media or archive assets safely.

Support clear upload progress, validation errors, and retry behavior.

### Storage architecture

Store original media files in object storage, such as S3-compatible storage.

Store media metadata and storage keys in the database. Do not store image binaries directly in ordinary product records.

A media record should include:

- ID.
- Storage key.
- Original filename.
- MIME type.
- File size.
- Image width and height where applicable.
- Alternative text.
- Optional caption.
- Creation timestamp.
- Uploader ID.
- Processing status where image transformations are asynchronous.

Use a CDN or image delivery service where appropriate.

Do not rely on local server disk for production uploads.

### Security

- Allow only supported file types.
- Validate actual file content rather than trusting file extensions.
- Enforce configurable file-size limits.
- Generate safe storage keys.
- Restrict upload and deletion operations to authorized staff.
- Use private upload credentials or signed upload URLs.
- Prevent unauthorized access to private files.
- Avoid exposing storage secrets to the browser.

Deleting a media record must not automatically delete an underlying file if it is still referenced by another product, category, page, or section.

Implement reference checks and safe deletion rules.

### Image delivery

The frontend should use media records or stable media URLs returned by the backend.

Do not hardcode production image URLs in React components.

Support image optimization and responsive delivery through a suitable image-processing or CDN solution. Preserve a fallback image for missing or failed media.

## 11. Storefront Editor and Homepage Management

Build a database-driven storefront editor that allows administrators to manage the content and order of supported homepage sections.

The editor must not require editing source code to change ordinary content.

### Supported homepage sections

Implement configurable section types such as:

1. Hero banner.
2. Promotional banner.
3. Featured products.
4. New arrivals.
5. Featured categories.
6. Product collection.
7. Sale products.
8. Editorial image and text.
9. Brand or store introduction.
10. Customer reviews.
11. Newsletter signup.
12. Gift card promotion.
13. Blog or journal articles.
14. Shipping or trust information.

These are supported component types, not hardcoded homepage content.

### Section configuration

Each section should have a stable ID, section type, title, content configuration, sort order, and publication state.

Depending on its type, an administrator should be able to configure:

- Heading and subheading.
- Body text.
- Images and alternative text.
- Button label.
- Button destination.
- Selected products or collections.
- Background and text appearance using approved design tokens.
- Desktop and mobile image assets where supported.
- Number of products displayed.
- Product ordering or selection rule.
- Visibility.
- Start and end dates where scheduling is implemented.

Validate each section's configuration against its section type.

Do not permit arbitrary HTML, arbitrary JavaScript, or unrestricted CSS through ordinary content fields.

### Section management

Administrators must be able to:

- Add a supported section.
- Edit section content.
- Upload or replace section images.
- Reorder sections.
- Duplicate sections.
- Hide or show sections.
- Delete a section after confirmation.
- Preview changes before publication.
- Publish approved changes.

A change to a section must not require a developer to modify a React component or redeploy the application.

The frontend should render each section using an existing section renderer associated with its type.

### Preview and publication

Separate draft content from published content.

Administrators should be able to preview the draft homepage before publishing.

Publishing should update the public storefront only after server-side validation succeeds.

Support revision history or recoverable previous published versions for important page content.

If scheduled publication is supported, store timestamps consistently and define the timezone used by the admin interface.

## 12. Pages and Editorial Content

Create a page management system for editable content pages, including:

- About the store.
- Contact information.
- Shipping information.
- Returns and refunds.
- Frequently asked questions.
- Privacy and terms pages, subject to appropriate legal review.

Administrators should be able to edit supported text, headings, images, links, SEO metadata, and publication status.

Provide reusable content blocks such as rich text, image with text, FAQ groups, and promotional banners.

Use a safe rich-text editor with a defined schema. Sanitize content on the server before it is rendered.

Do not let arbitrary HTML or scripts execute on public pages.

Legal pages must be reviewed by the store owner or an appropriate professional before publication.

## 13. Navigation Menus and Footer

Build a menu editor for the main navigation, mobile navigation, and footer.

Administrators must be able to:

- Add menu items.
- Change labels and destinations.
- Reorder items.
- Create nested menu groups.
- Link to products, categories, collections, and content pages.
- Add external links.
- Control visibility.
- Preview menu changes.

Validate internal destinations and require safe URL handling for external links.

Manage footer columns, informational links, contact information, newsletter content, and social links through store settings or structured content.

The public navigation must use the published menu configuration returned by the backend.

## 14. Promotions and Discounts

Provide an administration interface for supported promotional rules.

Potential features:

- Percentage discounts.
- Fixed-amount discounts.
- Product-specific discounts.
- Collection-specific discounts.
- Coupon codes.
- Minimum purchase amounts.
- Start and end dates.
- Usage limits.
- Eligibility rules.

Define stacking rules and precedence between product sale prices and coupon discounts.

The server must calculate and validate every discount.

Never trust a discount amount supplied by the client.

Display sale prices and promotional badges on the storefront only when supported by valid published promotional data.

## 15. Reviews and Ratings

Provide review moderation tools.

Authorized staff should be able to view reviews, approve or hide reviews, flag inappropriate content, and respond where supported.

Only display approved reviews publicly.

Do not invent reviews, customer names, ratings, or verified-purchase labels.

Record moderation actions and the identity of the administrator responsible.

## 16. Blog and Editorial Content

Where blog content is part of the storefront, support:

- Article title and slug.
- Excerpt and body.
- Featured image.
- Author.
- Publication date.
- Tags and categories.
- Draft and published status.
- SEO metadata.

Administrators should be able to create, edit, preview, publish, unpublish, and archive articles without code changes.

Support structured content blocks rather than allowing arbitrary scripts.

## 17. Store Settings

Create a protected settings area for supported configuration, including:

- Store name and contact details.
- Logo and favicon.
- Default currency.
- Supported currencies and exchange-rate policy, if multi-currency is implemented.
- Locale and language settings.
- Timezone.
- Shipping methods and supported regions.
- Tax configuration.
- Free-shipping thresholds.
- Minimum order requirements.
- Social media links.
- Newsletter configuration.
- Product display defaults.
- Store maintenance or announcement settings.

Separate general settings from payment credentials and other secrets.

Payment secrets must be managed through secure server-side configuration or a secure secret-management facility, not ordinary editable text fields.

Changing a setting must not silently alter existing orders or historical financial records.

## 18. User Roles and Permissions

Implement role-based access control on the server.

Suggested roles:

### Owner
Full access, including staff management, security settings, store configuration, and all content.

### Administrator
Access to authorized product, content, inventory, order, and store-management features.

### Content Editor
Access to media, products and product content, categories, collections, navigation, and storefront content as explicitly granted.

### Inventory Manager
Access to stock levels, inventory adjustments, and related product availability information.

### Order Manager
Access to authorized customer orders, fulfillment operations, and permitted customer information.

Define permissions independently of frontend visibility.

Every sensitive API endpoint must enforce authorization on the server. Hiding a button in the UI is not a security control.

Require stronger authentication protections for owner and administrator accounts. Support session revocation and secure password-reset workflows.

## 19. Audit Logs and Recovery

Record important administrative operations, including:

- Product creation and changes.
- Product publication and archival.
- Price changes.
- Inventory adjustments.
- Media replacement and deletion.
- Homepage and page publication.
- Navigation changes.
- Store configuration changes.
- Role and permission changes.
- Order status changes.
- Refund actions.

An audit record should contain the actor, action, resource type, resource ID, timestamp, and relevant change metadata.

Avoid storing passwords, payment secrets, or unnecessary personal data in logs.

Provide confirmation for destructive actions.

Use soft deletion or archival where appropriate. Preserve order history and other legally or operationally important records.

Provide a recovery mechanism for important published content and configuration.

## 20. Backend Architecture

Organize admin functionality around existing business modules instead of duplicating business logic.

Potential modules:

- admin
- products
- product-variants
- categories
- collections
- inventory
- media
- storefront-pages
- storefront-sections
- navigation
- promotions
- reviews
- blog
- orders
- customers
- store-settings
- users-and-permissions
- audit-logs

Use the repository's established architectural conventions.

Admin controllers should call the same underlying product, inventory, pricing, and order services used by other application workflows.

Do not implement separate, inconsistent business rules for the admin interface.

Separate draft content from published content where necessary. Use transactions for operations that modify related database records.

## 21. API Design

Use the existing API conventions and version prefix.

Candidate endpoints include:

### Products
- GET /admin/products
- POST /admin/products
- GET /admin/products/:id
- PATCH /admin/products/:id
- POST /admin/products/:id/publish
- POST /admin/products/:id/archive

### Variants
- POST /admin/products/:id/variants
- PATCH /admin/variants/:id
- POST /admin/products/:id/variants/bulk

### Categories and Collections
- GET /admin/categories
- POST /admin/categories
- PATCH /admin/categories/:id
- GET /admin/collections
- POST /admin/collections
- PATCH /admin/collections/:id

### Media
- GET /admin/media
- POST /admin/media/upload-intent
- POST /admin/media/complete-upload
- PATCH /admin/media/:id
- DELETE /admin/media/:id

Adapt upload endpoints to the chosen storage provider. Never expose storage credentials to the frontend.

### Storefront
- GET /admin/storefront/pages
- POST /admin/storefront/pages
- PATCH /admin/storefront/pages/:id
- GET /admin/storefront/pages/:id/preview
- GET /admin/storefront/homepage/sections
- POST /admin/storefront/homepage/sections
- PATCH /admin/storefront/sections/:id
- POST /admin/storefront/sections/reorder
- POST /admin/storefront/pages/:id/publish

### Settings and Permissions
- GET /admin/settings
- PATCH /admin/settings
- GET /admin/users
- POST /admin/users
- PATCH /admin/users/:id/permissions
- GET /admin/audit-logs

These endpoints are a starting point. Inspect the existing API before adopting them. Define pagination, validation, authorization, error formats, and request/response schemas before implementation.

Public storefront endpoints must expose only published, public-facing data.

## 22. Database and Data Integrity

Design appropriate persistent entities for:

- Products and variants.
- Categories and category relationships.
- Collections and product membership.
- Media assets.
- Storefront pages and page revisions.
- Storefront sections and section configuration.
- Navigation menus and menu items.
- Store settings.
- Promotions.
- Reviews and moderation records.
- User roles and permissions.
- Audit logs.

Use relational constraints and indexes where appropriate.

Represent structured section configuration using a validated schema, potentially backed by a JSON database column when suitable.

Avoid placing the entire store configuration into one unstructured database record.

Prevent invalid references, duplicate slugs where uniqueness is required, invalid section ordering, and deletion of resources still in use.

Use transactions for operations that update related resources together.

## 23. Frontend Requirements

The admin interface must be practical for non-technical store owners.

Use:

- Clear labels and helpful descriptions.
- Searchable and paginated tables.
- Filters and sorting.
- Drag-and-drop reordering with keyboard-accessible alternatives.
- Upload progress and image previews.
- Unsaved-change warnings.
- Confirmation dialogs.
- Inline validation errors.
- Success and failure notifications.
- Accessible form controls.
- Responsive layouts for desktop and tablet.
- Loading, empty, and error states.

Reuse existing UI components and design tokens where possible.

Do not build an admin interface consisting only of placeholder buttons or static tables. Every visible action must work end to end.

Do not hardcode content into storefront sections when the same content should be editable through the admin.

## 24. Testing and Acceptance Criteria

Test both the administration APIs and the resulting public storefront behavior.

A feature is complete only when the full workflow works.

Examples:

1. An authorized administrator creates a product, uploads images, adds variants, sets prices, and publishes it.
2. The product appears on the correct public category and collection pages without redeployment.
3. An administrator replaces the product's main image and the public storefront reflects the change.
4. An administrator creates a category, uploads its image, and chooses whether it appears in navigation.
5. An administrator edits the homepage hero image and text, previews the draft, and publishes the change.
6. An administrator reorders homepage sections and the published homepage reflects the new order.
7. An administrator hides a promotional section and it no longer appears publicly.
8. A content editor cannot access restricted user-management or payment settings.
9. A deleted media asset still referenced by another resource is protected from destructive deletion.
10. An archived product remains visible in historical orders but is no longer purchasable.
11. Invalid product variants, prices, media references, and section configurations are rejected.
12. Unauthorized users cannot access admin APIs by calling endpoints directly.
13. Failed uploads, failed publications, and database errors do not silently corrupt content.
14. The published storefront does not expose draft content or unpublished products.

Write automated tests for important business rules and integration workflows.

## 25. Implementation Milestones

### Milestone 1: Admin Foundation
- Inspect the existing application.
- Establish admin routing and layout.
- Implement role and permission enforcement.
- Build reusable tables, forms, notifications, and confirmation dialogs.
- Add a minimal dashboard and health checks.

### Milestone 2: Product Catalogue Management
- Implement product creation and editing.
- Implement categories and collections.
- Implement product variants and pricing.
- Add publication and archival workflows.
- Connect admin operations to public catalogue APIs.

### Milestone 3: Media Library
- Configure object storage.
- Implement uploads, media selection, previews, metadata, and safe deletion.
- Integrate media selection into product, variant, and category forms.

### Milestone 4: Storefront CMS
- Implement homepage sections and editable content pages.
- Add section configuration and ordering.
- Implement draft previews and publication.
- Connect the public storefront to published content.

### Milestone 5: Navigation and Store Settings
- Implement menu editing and footer management.
- Implement general store settings.
- Add SEO fields and relevant public API behavior.

### Milestone 6: Store Operations
- Implement inventory administration.
- Implement order management and customer support workflows.
- Add promotions, reviews, blog content, and gift card management as required.

### Milestone 7: Hardening
- Complete permission tests and audit logs.
- Test media deletion safety, publication consistency, and recovery.
- Review security, performance, accessibility, and production configuration.

Do not start every milestone simultaneously. Complete, test, and review each milestone before continuing.

## 26. Final Instruction to the Coding Agent

Start by inspecting the existing repository and report the current architecture, what already exists, and what needs to change.

Then propose the database entities, permission model, media storage strategy, and frontend integration plan.

Identify the minimum viable admin scope that allows a non-technical store owner to manage products, variants, categories, images, and homepage content.

Wait for approval before making substantial changes.

Do not hardcode content that should be database-managed. Do not use placeholder functionality as a substitute for working features. Do not claim that a workflow works until it has been implemented and tested.