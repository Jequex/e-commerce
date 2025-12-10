DO $$ BEGIN
 CREATE TYPE "day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "staff_role" AS ENUM('owner', 'manager', 'cashier', 'sales_associate', 'inventory_manager');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "store_status" AS ENUM('active', 'inactive', 'pending_approval', 'suspended', 'closed');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "store_type" AS ENUM('physical', 'online', 'hybrid');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_addresses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"type" varchar(50) DEFAULT 'primary' NOT NULL,
	"street_address" varchar(500) NOT NULL,
	"city" varchar(100) NOT NULL,
	"state" varchar(100) NOT NULL,
	"postal_code" varchar(20) NOT NULL,
	"country" varchar(100) NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"date" timestamp NOT NULL,
	"total_sales" numeric(15, 2) DEFAULT '0',
	"total_orders" integer DEFAULT 0,
	"average_order_value" numeric(10, 2),
	"page_views" integer DEFAULT 0,
	"unique_visitors" integer DEFAULT 0,
	"conversion_rate" numeric(5, 4),
	"products_viewed" integer DEFAULT 0,
	"products_added_to_cart" integer DEFAULT 0,
	"new_customers" integer DEFAULT 0,
	"returning_customers" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"description" text,
	"image" varchar(500),
	"parent_id" uuid,
	"is_active" boolean DEFAULT true,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "store_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"open_time" time,
	"close_time" time,
	"is_closed" boolean DEFAULT false,
	"is_holiday" boolean DEFAULT false,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"order_id" uuid,
	"rating" integer NOT NULL,
	"title" varchar(200),
	"comment" text,
	"images" jsonb,
	"is_verified" boolean DEFAULT false,
	"is_approved" boolean DEFAULT true,
	"admin_response" text,
	"admin_response_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "store_staff" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"store_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "staff_role" DEFAULT 'sales_associate' NOT NULL,
	"permissions" jsonb,
	"salary" numeric(12, 2),
	"commission" numeric(5, 2),
	"is_active" boolean DEFAULT true,
	"hired_at" timestamp DEFAULT now(),
	"terminated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "stores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(200) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"description" text,
	"type" "store_type" DEFAULT 'physical' NOT NULL,
	"status" "store_status" DEFAULT 'pending_approval' NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"website" varchar(500),
	"business_license" varchar(100),
	"tax_id" varchar(100),
	"category_id" uuid,
	"allow_online_orders" boolean DEFAULT true,
	"allow_pickup" boolean DEFAULT true,
	"allow_delivery" boolean DEFAULT false,
	"delivery_radius" numeric(10, 2),
	"min_order_amount" numeric(10, 2),
	"logo" varchar(500),
	"banner" varchar(500),
	"images" jsonb,
	"total_products" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_revenue" numeric(15, 2) DEFAULT '0',
	"average_rating" numeric(3, 2),
	"total_reviews" integer DEFAULT 0,
	"metadata" jsonb,
	"approved_at" timestamp,
	"last_active_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stores_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_addresses" ADD CONSTRAINT "store_addresses_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_analytics" ADD CONSTRAINT "store_analytics_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "store_staff" ADD CONSTRAINT "store_staff_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "stores" ADD CONSTRAINT "stores_category_id_store_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "store_categories"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
