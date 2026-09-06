CREATE TABLE "account_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256),
	"account_type_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_groups_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "account_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"description" varchar(256),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "account_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"account_name" varchar(256) NOT NULL,
	"first_name" varchar(256) NOT NULL,
	"middle_name" varchar(256),
	"last_name" varchar(256) NOT NULL,
	"user_name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"account_type_id" integer NOT NULL,
	"account_group_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_user_name_unique" UNIQUE("user_name"),
	CONSTRAINT "accounts_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "attributes" (
	"id" serial PRIMARY KEY NOT NULL,
	"attribute_name_id" integer NOT NULL,
	"attribute_value" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "common_lists" (
	"id" serial PRIMARY KEY NOT NULL,
	"list_type" varchar(256) NOT NULL,
	"list_value" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daybook_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_name" varchar(256) NOT NULL,
	"short_name" varchar(256) NOT NULL,
	"description" varchar(256),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daybook_groups_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "daybooks" (
	"id" serial PRIMARY KEY NOT NULL,
	"daybook_name" varchar(256) NOT NULL,
	"short_name" varchar(256) NOT NULL,
	"daybook_group_id" integer NOT NULL,
	"voucher_prefix" varchar(256) NOT NULL,
	"allow_manual_number" boolean DEFAULT false NOT NULL,
	"description" varchar(256),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "daybooks_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "item_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_group_name" varchar(256) NOT NULL,
	"short_name" varchar(256) NOT NULL,
	"metal_type_id" integer NOT NULL,
	"sales_rate" numeric NOT NULL,
	"purchase_rate" numeric NOT NULL,
	"sales_rate_type_id" integer NOT NULL,
	"purchase_rate_type_id" integer NOT NULL,
	"measure_unit_code" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "item_groups_item_group_name_unique" UNIQUE("item_group_name")
);
--> statement-breakpoint
CREATE TABLE "items" (
	"id" serial PRIMARY KEY NOT NULL,
	"item_name" varchar(256) NOT NULL,
	"short_name" varchar(256) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"attributes" integer[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "items_short_name_unique" UNIQUE("short_name")
);
--> statement-breakpoint
CREATE TABLE "menus" (
	"id" serial PRIMARY KEY NOT NULL,
	"menu_name" varchar(256) NOT NULL,
	"menu_caption" varchar(256) NOT NULL,
	"menu_icon" varchar(256),
	"menu_path" varchar(256),
	"parent_menu_id" integer,
	"list_right" boolean DEFAULT false NOT NULL,
	"view_right" boolean DEFAULT false NOT NULL,
	"add_right" boolean DEFAULT false NOT NULL,
	"edit_right" boolean DEFAULT false NOT NULL,
	"show_listing_total_right" boolean DEFAULT false NOT NULL,
	"export_right" boolean DEFAULT false NOT NULL,
	"print_right" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "menus_menu_name_unique" UNIQUE("menu_name")
);
--> statement-breakpoint
CREATE TABLE "metals" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "metals_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rate_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	CONSTRAINT "rate_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_no" varchar(256) NOT NULL,
	"sr_no" integer,
	"voucher_date" timestamp NOT NULL,
	"daybook_id" integer,
	"account_id" integer,
	"reference" varchar(256),
	"remarks" varchar(1024),
	"salesman_name" varchar(256),
	"bill_mode" varchar(256),
	"subtotal" numeric DEFAULT '0' NOT NULL,
	"discount_rate" numeric DEFAULT '0' NOT NULL,
	"discount_amount" numeric DEFAULT '0' NOT NULL,
	"tax_rate" numeric DEFAULT '0' NOT NULL,
	"tax_amount" numeric DEFAULT '0' NOT NULL,
	"round_off" numeric DEFAULT '0' NOT NULL,
	"grand_total" numeric DEFAULT '0' NOT NULL,
	"advance_amount" numeric DEFAULT '0',
	"urd_amount" numeric DEFAULT '0',
	"cash_amount" numeric DEFAULT '0',
	"bank_amount" numeric DEFAULT '0',
	"card_amount" numeric DEFAULT '0',
	"card_commission" numeric DEFAULT '0',
	"scheme_amount" numeric DEFAULT '0',
	"gift_voucher_amount" numeric DEFAULT '0',
	"sales_return_amount" numeric DEFAULT '0',
	"kasar_amount" numeric DEFAULT '0',
	"tds_amount" numeric DEFAULT '0',
	"rate_fix_type" varchar(256),
	"due_date" timestamp,
	"delivery_pending" boolean DEFAULT false,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_voucher_no_unique" UNIQUE("voucher_no")
);
--> statement-breakpoint
CREATE TABLE "sales_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" integer NOT NULL,
	"item_id" integer NOT NULL,
	"item_group_id" integer,
	"tag_no" varchar(256),
	"quantity" numeric DEFAULT '1' NOT NULL,
	"uom" varchar(256),
	"weight" numeric DEFAULT '0',
	"gross_wt" numeric DEFAULT '0',
	"net_wt" numeric DEFAULT '0',
	"adjusted_wt" numeric DEFAULT '0',
	"fine_wt" numeric DEFAULT '0',
	"rate" numeric DEFAULT '0' NOT NULL,
	"rate_type" varchar(256),
	"tax" varchar(256),
	"labour_amount" numeric DEFAULT '0',
	"other_amount" numeric DEFAULT '0',
	"discount_amount" numeric DEFAULT '0',
	"amount" numeric DEFAULT '0' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(256) NOT NULL,
	"email" varchar(256) NOT NULL,
	"password" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "account_groups" ADD CONSTRAINT "account_groups_account_type_id_account_types_id_fk" FOREIGN KEY ("account_type_id") REFERENCES "public"."account_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_type_id_account_types_id_fk" FOREIGN KEY ("account_type_id") REFERENCES "public"."account_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_account_group_id_account_groups_id_fk" FOREIGN KEY ("account_group_id") REFERENCES "public"."account_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attributes" ADD CONSTRAINT "attributes_attribute_name_id_common_lists_id_fk" FOREIGN KEY ("attribute_name_id") REFERENCES "public"."common_lists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daybooks" ADD CONSTRAINT "daybooks_daybook_group_id_daybook_groups_id_fk" FOREIGN KEY ("daybook_group_id") REFERENCES "public"."daybook_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_groups" ADD CONSTRAINT "item_groups_metal_type_id_metals_id_fk" FOREIGN KEY ("metal_type_id") REFERENCES "public"."metals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_groups" ADD CONSTRAINT "item_groups_sales_rate_type_id_rate_types_id_fk" FOREIGN KEY ("sales_rate_type_id") REFERENCES "public"."rate_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item_groups" ADD CONSTRAINT "item_groups_purchase_rate_type_id_rate_types_id_fk" FOREIGN KEY ("purchase_rate_type_id") REFERENCES "public"."rate_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menus" ADD CONSTRAINT "menus_parent_menu_id_menus_id_fk" FOREIGN KEY ("parent_menu_id") REFERENCES "public"."menus"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_daybook_id_daybooks_id_fk" FOREIGN KEY ("daybook_id") REFERENCES "public"."daybooks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales_items" ADD CONSTRAINT "sales_items_item_group_id_item_groups_id_fk" FOREIGN KEY ("item_group_id") REFERENCES "public"."item_groups"("id") ON DELETE no action ON UPDATE no action;