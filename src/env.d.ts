type Runtime = import("@astrojs/cloudflare").Runtime<Env>;

interface ImportMetaEnv {
  readonly PUBLIC_POSTHOG_ENABLED?: string;
  readonly PUBLIC_POSTHOG_PROJECT_TOKEN?: string;
  readonly PUBLIC_CLOUDFLARE_ANALYTICS_ENABLED?: string;
  readonly PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN?: string;
	readonly WIX_QUOTE_REQUESTS_COLLECTION_ID?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare namespace App {
	interface Locals extends Runtime {}
}

// Cloudflare runtime secrets/binding. Never PUBLIC_* or build-time email credentials.
interface Env {
  BREVO_API_KEY?: string;
  BREVO_SENDER_EMAIL?: string;
  BREVO_SENDER_NAME?: string;
  QUOTE_EMAIL_MODE?: string;
  QUOTE_NOTIFICATIONS_DB?: D1Database;
}
