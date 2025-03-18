CREATE TABLE IF NOT EXISTS "holiday_discounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"holiday_date" timestamp with time zone,
	"holiday_name" text NOT NULL,
	"start_before" real NOT NULL,
	"end_after" real NOT NULL,
	"discount_percentage" real,
	"coupon_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "holiday_discounts_product_id_holiday_date_pk" PRIMARY KEY("product_id","holiday_date")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "holiday_discounts" ADD CONSTRAINT "holiday_discounts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "holiday_discounts_coupon_code_idx" ON "holiday_discounts" USING btree ("coupon_code");