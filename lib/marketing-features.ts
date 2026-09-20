export type MarketingFeature = {
  slug: string;
  eyebrow: string;
  title: string;
  summary: string;
  description: string;
  highlights: { title: string; description: string }[];
  steps: { title: string; description: string }[];
};

export const marketingFeatures: MarketingFeature[] = [
  {
    slug: "storefront-builder",
    eyebrow: "Storefront builder",
    title: "Build a store that feels like your brand.",
    summary: "Compose pages from reusable sections, tune the visual system, import themes, preview drafts and publish when the store is ready.",
    description: "SellCore keeps presentation separate from commerce data. Products, inventory and orders stay stable while you change layouts, colors, typography and content.",
    highlights: [
      { title: "Section-based pages", description: "Arrange heroes, product grids, rich text, reviews, FAQs and spacing blocks without rebuilding the store." },
      { title: "Draft and publish", description: "Preview theme and page changes privately, then publish an explicit version to customers." },
      { title: "Theme imports", description: "Bring in supported JSON or ZIP packages and review a conversion report before publishing." },
      { title: "Brand controls", description: "Choose colors, radius, typography, card treatment, navigation style and custom CSS." },
      { title: "Responsive storefronts", description: "The same content adapts across mobile, tablet and desktop storefront routes." },
      { title: "Structured content", description: "Create store pages with editable SEO titles and descriptions instead of hard-coded templates." },
    ],
    steps: [
      { title: "Choose a foundation", description: "Start with an included theme or import a compatible theme package." },
      { title: "Compose the experience", description: "Arrange homepage and page sections, then tune the global visual settings." },
      { title: "Preview and publish", description: "Inspect the draft storefront and publish only when the full experience is ready." },
    ],
  },
  {
    slug: "digital-fulfillment",
    eyebrow: "Fulfillment",
    title: "Deliver every digital product through one order pipeline.",
    summary: "Automate license keys, account credentials and private files, or track services, subscriptions, generated products and custom delivery.",
    description: "Payment and fulfillment state are handled separately, with inventory reservation and idempotent processing designed to prevent duplicate delivery.",
    highlights: [
      { title: "Variant inventory", description: "Assign license pools, encrypted account inventory and private files to an exact product variant." },
      { title: "License delivery", description: "Import keys in bulk and claim available inventory only after verified payment." },
      { title: "Private downloads", description: "Store files privately and authorize customer downloads after purchase." },
      { title: "Encrypted accounts", description: "Import transferable credentials into encrypted inventory pools with duplicate protection." },
      { title: "Generated delivery", description: "Call a signed merchant endpoint with the order item and selected variant after payment." },
      { title: "Service workflows", description: "Track manual work through paid, in-progress, awaiting-customer and completed states." },
    ],
    steps: [
      { title: "Attach inventory", description: "Add fulfillment inventory to the product or to each individual variant." },
      { title: "Verify payment", description: "SellCore waits for an authoritative payment event before issuing delivery." },
      { title: "Deliver and record", description: "The order receives a durable delivery record visible to the customer and merchant." },
    ],
  },
  {
    slug: "payments-checkout",
    eyebrow: "Payments and checkout",
    title: "Checkout with server-owned pricing and verified payment state.",
    summary: "Connect Stripe, validate carts and coupons on the server, and offer eligible cards and wallets without keeping payment details in SellCore.",
    description: "Customer totals are rebuilt from catalog data at checkout. Variant ownership, inventory and coupon rules are checked again before a payment session is created.",
    highlights: [
      { title: "Stripe Connect", description: "Merchants onboard their own connected payment account and receive customer payments through Stripe." },
      { title: "Dynamic payment methods", description: "Eligible Apple Pay, Google Pay, Cash App Pay and stablecoin options appear according to merchant, buyer, device and currency support." },
      { title: "Server-side totals", description: "Product and variant prices are loaded from the database rather than trusted from the browser." },
      { title: "Coupon validation", description: "Validate status, dates, redemptions and store ownership before applying a discount." },
      { title: "Variant-safe carts", description: "Products with variants require an active variant that belongs to that exact product." },
      { title: "Verified webhooks", description: "Payment state changes only after a signed provider webhook is verified." },
    ],
    steps: [
      { title: "Connect", description: "Complete Stripe onboarding from the merchant Payments workspace." },
      { title: "Validate", description: "SellCore reconstructs the cart, selected variants, discounts and totals on the server." },
      { title: "Confirm", description: "A verified payment event updates the order and starts the correct fulfillment path." },
    ],
  },
  {
    slug: "analytics-insights",
    eyebrow: "Analytics",
    title: "See the events behind every conversion.",
    summary: "Measure revenue, product views, cart activity, checkout starts, purchases and traffic sources from stored storefront events.",
    description: "SellCore analytics joins commerce outcomes with storefront behavior so merchants can understand what customers view, add and buy.",
    highlights: [
      { title: "Revenue overview", description: "Track paid-order revenue alongside storefront conversion activity." },
      { title: "Product views", description: "Record product interest before the customer reaches the cart." },
      { title: "Cart and checkout events", description: "See how many visitors progress from discovery to purchase intent." },
      { title: "Conversion rate", description: "Compare purchases against product views over the active reporting period." },
      { title: "Traffic source capture", description: "Store attribution context with analytics events for deeper source analysis." },
      { title: "Developer access", description: "Eligible plans can query analytics through scoped API access." },
    ],
    steps: [
      { title: "Capture", description: "Storefront interactions create tenant-scoped analytics events." },
      { title: "Combine", description: "Events are compared with verified order and payment outcomes." },
      { title: "Act", description: "Use product and conversion signals to improve the catalog and storefront." },
    ],
  },
  {
    slug: "domains-branding",
    eyebrow: "Domains and branding",
    title: "Give every store a real home on the web.",
    summary: "Publish on a SellCore merchant subdomain, connect eligible custom domains and keep links consistent across storefront routes.",
    description: "Hostname-aware routing resolves the correct published tenant while storefront components preserve navigation across platform and custom-domain URLs.",
    highlights: [
      { title: "Merchant subdomains", description: "Every published store can use its slug on the SellCore platform domain." },
      { title: "Custom domains", description: "Eligible plans can attach and verify merchant-owned domains." },
      { title: "Hostname routing", description: "Requests resolve a published store from the incoming hostname before rendering commerce data." },
      { title: "Brand settings", description: "Store logos, metadata, support details, theme settings and content stay tenant-specific." },
      { title: "Consistent paths", description: "Products, pages, carts and legal links work on platform and custom-domain routes." },
      { title: "Publish controls", description: "Draft, published, unpublished and suspended states control public availability." },
    ],
    steps: [
      { title: "Name the store", description: "Choose a unique store slug during onboarding." },
      { title: "Prepare the storefront", description: "Add products, content, navigation and theme settings." },
      { title: "Publish", description: "Open the SellCore subdomain or connect an eligible custom domain." },
    ],
  },
  {
    slug: "developer-platform",
    eyebrow: "Developer platform",
    title: "Connect SellCore to the rest of your operation.",
    summary: "Use scoped API keys, signed outbound webhooks, delivery history and generated-product callbacks.",
    description: "Developer tooling is isolated by merchant, protected by hashed credentials and designed around explicit scopes and event subscriptions.",
    highlights: [
      { title: "Scoped API keys", description: "Create keys for selected capabilities and revoke them without changing merchant credentials." },
      { title: "Signed webhooks", description: "Subscribe endpoints to commerce events and verify deliveries with a shared signing secret." },
      { title: "Delivery logs", description: "Review recent webhook status and response codes from the dashboard." },
      { title: "Automatic retries", description: "Failed outbound webhook deliveries can be retried by the dispatch workflow." },
      { title: "Generated products", description: "Receive a signed post-payment callback to create unique customer delivery." },
      { title: "Auditability", description: "Security-sensitive merchant actions produce tenant-scoped audit records." },
    ],
    steps: [
      { title: "Create credentials", description: "Generate a scoped API key or configure a signed webhook endpoint." },
      { title: "Integrate", description: "Read commerce resources or react to the event types your system needs." },
      { title: "Observe", description: "Use delivery logs, status codes and audit records to keep integrations healthy." },
    ],
  },
  {
    slug: "customer-trust",
    eyebrow: "Customer experience",
    title: "Keep buyers informed after checkout.",
    summary: "Give customers a durable account for purchases and delivery, plus verified reviews and merchant responses.",
    description: "SellCore links purchases to verified customer identity while keeping each store’s customer, order and review data isolated.",
    highlights: [
      { title: "Customer accounts", description: "Customers can revisit linked orders, delivery records and subscription state." },
      { title: "Verified reviews", description: "Review eligibility is tied to purchase records instead of an open public form." },
      { title: "Moderation", description: "Merchants approve, hide or reject reviews before they appear on the storefront." },
      { title: "Merchant responses", description: "Add a public response to an approved customer review." },
      { title: "Order states", description: "Separate payment and fulfillment status makes the order lifecycle easier to understand." },
      { title: "Private delivery", description: "Sensitive licenses, credentials and downloads are exposed only through authorized customer flows." },
    ],
    steps: [
      { title: "Purchase", description: "A customer completes verified checkout with an email address." },
      { title: "Access", description: "Orders and delivery records attach to the matching customer account." },
      { title: "Review", description: "Eligible buyers can submit a review for merchant moderation." },
    ],
  },
];

export function getMarketingFeature(slug: string) {
  return marketingFeatures.find((feature) => feature.slug === slug);
}
