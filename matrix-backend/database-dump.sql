--
-- PostgreSQL database dump
--

\restrict oXSNcMj8IAPEBbEjkIcAFBAuTBWmTaaGD6JGAOXe3D1Vls8nggNxou3vVsgHnh3

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE ONLY public.sales_items DROP CONSTRAINT sales_items_sale_id_sales_id_fk;
ALTER TABLE ONLY public.sales_items DROP CONSTRAINT sales_items_item_id_items_id_fk;
ALTER TABLE ONLY public.sales_items DROP CONSTRAINT sales_items_item_group_id_item_groups_id_fk;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_daybook_id_daybooks_id_fk;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_account_id_accounts_id_fk;
ALTER TABLE ONLY public.menus DROP CONSTRAINT menus_parent_menu_id_menus_id_fk;
ALTER TABLE ONLY public.item_groups DROP CONSTRAINT item_groups_sales_rate_type_id_rate_types_id_fk;
ALTER TABLE ONLY public.item_groups DROP CONSTRAINT item_groups_purchase_rate_type_id_rate_types_id_fk;
ALTER TABLE ONLY public.item_groups DROP CONSTRAINT item_groups_metal_type_id_metals_id_fk;
ALTER TABLE ONLY public.daybooks DROP CONSTRAINT daybooks_daybook_group_id_daybook_groups_id_fk;
ALTER TABLE ONLY public.attributes DROP CONSTRAINT attributes_attribute_name_id_common_lists_id_fk;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_account_type_id_account_types_id_fk;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_account_group_id_account_groups_id_fk;
ALTER TABLE ONLY public.account_groups DROP CONSTRAINT account_groups_account_type_id_account_types_id_fk;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_unique;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_voucher_no_unique;
ALTER TABLE ONLY public.sales DROP CONSTRAINT sales_pkey;
ALTER TABLE ONLY public.sales_items DROP CONSTRAINT sales_items_pkey;
ALTER TABLE ONLY public.rate_types DROP CONSTRAINT rate_types_pkey;
ALTER TABLE ONLY public.rate_types DROP CONSTRAINT rate_types_name_unique;
ALTER TABLE ONLY public.metals DROP CONSTRAINT metals_pkey;
ALTER TABLE ONLY public.metals DROP CONSTRAINT metals_name_unique;
ALTER TABLE ONLY public.menus DROP CONSTRAINT menus_pkey;
ALTER TABLE ONLY public.menus DROP CONSTRAINT menus_menu_name_unique;
ALTER TABLE ONLY public.items DROP CONSTRAINT items_short_name_unique;
ALTER TABLE ONLY public.items DROP CONSTRAINT items_pkey;
ALTER TABLE ONLY public.item_groups DROP CONSTRAINT item_groups_pkey;
ALTER TABLE ONLY public.item_groups DROP CONSTRAINT item_groups_item_group_name_unique;
ALTER TABLE ONLY public.daybooks DROP CONSTRAINT daybooks_short_name_unique;
ALTER TABLE ONLY public.daybooks DROP CONSTRAINT daybooks_pkey;
ALTER TABLE ONLY public.daybook_groups DROP CONSTRAINT daybook_groups_short_name_unique;
ALTER TABLE ONLY public.daybook_groups DROP CONSTRAINT daybook_groups_pkey;
ALTER TABLE ONLY public.common_lists DROP CONSTRAINT common_lists_pkey;
ALTER TABLE ONLY public.attributes DROP CONSTRAINT attributes_pkey;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_user_name_unique;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_pkey;
ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_email_unique;
ALTER TABLE ONLY public.account_types DROP CONSTRAINT account_types_pkey;
ALTER TABLE ONLY public.account_types DROP CONSTRAINT account_types_name_unique;
ALTER TABLE ONLY public.account_groups DROP CONSTRAINT account_groups_pkey;
ALTER TABLE ONLY public.account_groups DROP CONSTRAINT account_groups_name_unique;
ALTER TABLE public.users ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.sales_items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.sales ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.rate_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.metals ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.menus ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.items ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.item_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.daybooks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.daybook_groups ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.common_lists ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.attributes ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.accounts ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.account_types ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.account_groups ALTER COLUMN id DROP DEFAULT;
DROP SEQUENCE public.users_id_seq;
DROP TABLE public.users;
DROP SEQUENCE public.sales_items_id_seq;
DROP TABLE public.sales_items;
DROP SEQUENCE public.sales_id_seq;
DROP TABLE public.sales;
DROP SEQUENCE public.rate_types_id_seq;
DROP TABLE public.rate_types;
DROP SEQUENCE public.metals_id_seq;
DROP TABLE public.metals;
DROP SEQUENCE public.menus_id_seq;
DROP TABLE public.menus;
DROP SEQUENCE public.items_id_seq;
DROP TABLE public.items;
DROP SEQUENCE public.item_groups_id_seq;
DROP TABLE public.item_groups;
DROP SEQUENCE public.daybooks_id_seq;
DROP TABLE public.daybooks;
DROP SEQUENCE public.daybook_groups_id_seq;
DROP TABLE public.daybook_groups;
DROP SEQUENCE public.common_lists_id_seq;
DROP TABLE public.common_lists;
DROP SEQUENCE public.attributes_id_seq;
DROP TABLE public.attributes;
DROP SEQUENCE public.accounts_id_seq;
DROP TABLE public.accounts;
DROP SEQUENCE public.account_types_id_seq;
DROP TABLE public.account_types;
DROP SEQUENCE public.account_groups_id_seq;
DROP TABLE public.account_groups;
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_groups (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    description character varying(256),
    account_type_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: account_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_groups_id_seq OWNED BY public.account_groups.id;


--
-- Name: account_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.account_types (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    description character varying(256),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: account_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.account_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: account_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.account_types_id_seq OWNED BY public.account_types.id;


--
-- Name: accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accounts (
    id integer NOT NULL,
    account_name character varying(256) NOT NULL,
    first_name character varying(256) NOT NULL,
    middle_name character varying(256),
    last_name character varying(256) NOT NULL,
    user_name character varying(256) NOT NULL,
    email character varying(256) NOT NULL,
    account_type_id integer NOT NULL,
    account_group_id integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.accounts_id_seq OWNED BY public.accounts.id;


--
-- Name: attributes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attributes (
    id integer NOT NULL,
    attribute_name_id integer NOT NULL,
    attribute_value character varying(256) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: attributes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attributes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attributes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attributes_id_seq OWNED BY public.attributes.id;


--
-- Name: common_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.common_lists (
    id integer NOT NULL,
    list_type character varying(256) NOT NULL,
    list_value character varying(256) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: common_lists_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.common_lists_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: common_lists_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.common_lists_id_seq OWNED BY public.common_lists.id;


--
-- Name: daybook_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daybook_groups (
    id integer NOT NULL,
    group_name character varying(256) NOT NULL,
    short_name character varying(256) NOT NULL,
    description character varying(256),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: daybook_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daybook_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daybook_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daybook_groups_id_seq OWNED BY public.daybook_groups.id;


--
-- Name: daybooks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daybooks (
    id integer NOT NULL,
    daybook_name character varying(256) NOT NULL,
    short_name character varying(256) NOT NULL,
    daybook_group_id integer NOT NULL,
    voucher_prefix character varying(256) NOT NULL,
    allow_manual_number boolean DEFAULT false NOT NULL,
    description character varying(256),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: daybooks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daybooks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daybooks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daybooks_id_seq OWNED BY public.daybooks.id;


--
-- Name: item_groups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_groups (
    id integer NOT NULL,
    item_group_name character varying(256) NOT NULL,
    short_name character varying(256) NOT NULL,
    metal_type_id integer NOT NULL,
    sales_rate numeric NOT NULL,
    purchase_rate numeric NOT NULL,
    sales_rate_type_id integer NOT NULL,
    purchase_rate_type_id integer NOT NULL,
    measure_unit_code character varying(256) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: item_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.item_groups_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: item_groups_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.item_groups_id_seq OWNED BY public.item_groups.id;


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id integer NOT NULL,
    item_name character varying(256) NOT NULL,
    short_name character varying(256) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    attributes integer[] DEFAULT '{}'::integer[] NOT NULL
);


--
-- Name: items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.items_id_seq OWNED BY public.items.id;


--
-- Name: menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus (
    id integer NOT NULL,
    menu_name character varying(256) NOT NULL,
    menu_caption character varying(256) NOT NULL,
    menu_icon character varying(256),
    menu_path character varying(256),
    parent_menu_id integer,
    list_right boolean DEFAULT false NOT NULL,
    view_right boolean DEFAULT false NOT NULL,
    add_right boolean DEFAULT false NOT NULL,
    edit_right boolean DEFAULT false NOT NULL,
    show_listing_total_right boolean DEFAULT false NOT NULL,
    print_right boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    export_right boolean DEFAULT false NOT NULL
);


--
-- Name: menus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menus_id_seq OWNED BY public.menus.id;


--
-- Name: metals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.metals (
    id integer NOT NULL,
    name character varying(256) NOT NULL
);


--
-- Name: metals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.metals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: metals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.metals_id_seq OWNED BY public.metals.id;


--
-- Name: rate_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.rate_types (
    id integer NOT NULL,
    name character varying(256) NOT NULL
);


--
-- Name: rate_types_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.rate_types_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: rate_types_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.rate_types_id_seq OWNED BY public.rate_types.id;


--
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id integer NOT NULL,
    voucher_no character varying(256) NOT NULL,
    voucher_date timestamp without time zone NOT NULL,
    daybook_id integer,
    account_id integer,
    reference character varying(256),
    remarks character varying(1024),
    salesman_name character varying(256),
    bill_mode character varying(256),
    subtotal numeric DEFAULT '0'::numeric NOT NULL,
    discount_rate numeric DEFAULT '0'::numeric NOT NULL,
    discount_amount numeric DEFAULT '0'::numeric NOT NULL,
    tax_rate numeric DEFAULT '0'::numeric NOT NULL,
    tax_amount numeric DEFAULT '0'::numeric NOT NULL,
    round_off numeric DEFAULT '0'::numeric NOT NULL,
    grand_total numeric DEFAULT '0'::numeric NOT NULL,
    advance_amount numeric DEFAULT '0'::numeric,
    urd_amount numeric DEFAULT '0'::numeric,
    cash_amount numeric DEFAULT '0'::numeric,
    bank_amount numeric DEFAULT '0'::numeric,
    card_amount numeric DEFAULT '0'::numeric,
    card_commission numeric DEFAULT '0'::numeric,
    scheme_amount numeric DEFAULT '0'::numeric,
    gift_voucher_amount numeric DEFAULT '0'::numeric,
    sales_return_amount numeric DEFAULT '0'::numeric,
    kasar_amount numeric DEFAULT '0'::numeric,
    tds_amount numeric DEFAULT '0'::numeric,
    rate_fix_type character varying(256),
    due_date timestamp without time zone,
    delivery_pending boolean DEFAULT false,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    sr_no integer
);


--
-- Name: sales_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_id_seq OWNED BY public.sales.id;


--
-- Name: sales_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_items (
    id integer NOT NULL,
    sale_id integer NOT NULL,
    item_id integer NOT NULL,
    item_group_id integer,
    tag_no character varying(256),
    quantity numeric DEFAULT '1'::numeric NOT NULL,
    uom character varying(256),
    weight numeric DEFAULT '0'::numeric,
    gross_wt numeric DEFAULT '0'::numeric,
    net_wt numeric DEFAULT '0'::numeric,
    adjusted_wt numeric DEFAULT '0'::numeric,
    fine_wt numeric DEFAULT '0'::numeric,
    rate numeric DEFAULT '0'::numeric NOT NULL,
    rate_type character varying(256),
    tax character varying(256),
    labour_amount numeric DEFAULT '0'::numeric,
    other_amount numeric DEFAULT '0'::numeric,
    discount_amount numeric DEFAULT '0'::numeric,
    amount numeric DEFAULT '0'::numeric NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sales_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sales_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sales_items_id_seq OWNED BY public.sales_items.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(256) NOT NULL,
    email character varying(256) NOT NULL,
    password character varying(256) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: account_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_groups ALTER COLUMN id SET DEFAULT nextval('public.account_groups_id_seq'::regclass);


--
-- Name: account_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_types ALTER COLUMN id SET DEFAULT nextval('public.account_types_id_seq'::regclass);


--
-- Name: accounts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts ALTER COLUMN id SET DEFAULT nextval('public.accounts_id_seq'::regclass);


--
-- Name: attributes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes ALTER COLUMN id SET DEFAULT nextval('public.attributes_id_seq'::regclass);


--
-- Name: common_lists id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_lists ALTER COLUMN id SET DEFAULT nextval('public.common_lists_id_seq'::regclass);


--
-- Name: daybook_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybook_groups ALTER COLUMN id SET DEFAULT nextval('public.daybook_groups_id_seq'::regclass);


--
-- Name: daybooks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybooks ALTER COLUMN id SET DEFAULT nextval('public.daybooks_id_seq'::regclass);


--
-- Name: item_groups id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups ALTER COLUMN id SET DEFAULT nextval('public.item_groups_id_seq'::regclass);


--
-- Name: items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items ALTER COLUMN id SET DEFAULT nextval('public.items_id_seq'::regclass);


--
-- Name: menus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus ALTER COLUMN id SET DEFAULT nextval('public.menus_id_seq'::regclass);


--
-- Name: metals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metals ALTER COLUMN id SET DEFAULT nextval('public.metals_id_seq'::regclass);


--
-- Name: rate_types id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_types ALTER COLUMN id SET DEFAULT nextval('public.rate_types_id_seq'::regclass);


--
-- Name: sales id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales ALTER COLUMN id SET DEFAULT nextval('public.sales_id_seq'::regclass);


--
-- Name: sales_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items ALTER COLUMN id SET DEFAULT nextval('public.sales_items_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: account_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_groups (id, name, description, account_type_id, created_at, updated_at) FROM stdin;
1	Current Assets	Short-term assets	1	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
2	Fixed Assets	Long-term assets	1	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
3	Current Liabilities	Short-term obligations	2	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
4	Long Term Liabilities	Long-term obligations	2	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
5	Capital Account	Owner capital	3	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
6	Retained Earnings	Accumulated profits	3	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
7	Direct Income	Core revenue	4	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
8	Indirect Income	Other revenue	4	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
9	Direct Expense	Cost of goods sold	5	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
10	Indirect Expense	Operating expenses	5	2026-09-04 10:01:43.605	2026-09-04 10:01:43.605
\.


--
-- Data for Name: account_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.account_types (id, name, description, created_at, updated_at) FROM stdin;
1	Asset	Resources owned by the business	2026-09-04 10:01:43.601	2026-09-04 10:01:43.601
2	Liability	Obligations of the business	2026-09-04 10:01:43.601	2026-09-04 10:01:43.601
3	Equity	Owner's claim on assets	2026-09-04 10:01:43.601	2026-09-04 10:01:43.601
4	Income	Revenue earned by the business	2026-09-04 10:01:43.601	2026-09-04 10:01:43.601
5	Expense	Costs incurred by the business	2026-09-04 10:01:43.601	2026-09-04 10:01:43.601
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accounts (id, account_name, first_name, middle_name, last_name, user_name, email, account_type_id, account_group_id, is_active, created_at, updated_at) FROM stdin;
2	Apex Steel Corporation	Rajesh	K	Mehta	apex_steel	accounts@apexsteel.com	1	1	t	2026-09-05 05:51:18.509	2026-09-05 05:51:18.509
3	Gujarat Infrastructure Ltd	Hiren	B	Patel	gujarat_infra	finance@gujinfra.com	1	1	t	2026-09-05 05:51:18.512	2026-09-05 05:51:18.512
4	Bharat Heavy Structurals	Suresh	R	Sharma	bharat_struct	info@bharatstruct.in	2	3	t	2026-09-05 05:51:18.513	2026-09-05 03:08:06.958
5	Sunrise Engineering Works	Sunil	P	Joshi	sunrise_eng	contact@sunriseeng.com	1	1	t	2026-09-05 05:51:18.515	2026-09-05 05:51:18.515
6	Metro Concretes & Precast	Vikram	S	Verma	metro_concretes	billing@metroconcretes.com	1	1	t	2026-09-05 05:51:18.517	2026-09-05 05:51:18.517
7	Kirloskar Fabrications	Anil	D	Kirloskar	kirloskar_fab	procure@kirloskarfab.com	1	1	t	2026-09-05 05:51:18.519	2026-09-05 05:51:18.519
8	L&T Western Project Site	Manoj	T	Nair	lt_western	lt_west@larsentoubro.com	1	1	t	2026-09-05 05:51:18.523	2026-09-05 05:51:18.523
9	Jindal Urban Infra	Prashant	N	Jindal	jindal_urban	accounts@jindalinfra.com	1	1	t	2026-09-05 05:51:18.525	2026-09-05 05:51:18.525
10	Shapoorji Construction Hub	Cyrus	E	Mistry	shapoorji_hub	orders@shapoorjicon.com	1	1	t	2026-09-05 05:51:18.526	2026-09-05 05:51:18.526
11	Ashoka Buildcon Highway Div	Dinesh	L	Deshmukh	ashoka_buildcon	highways@ashokabuildcon.com	1	1	t	2026-09-05 05:51:18.528	2026-09-05 05:51:18.528
12	Godrej Heavy Industries	Adi	J	Godrej	godrej_heavy	supplies@godrejheavy.com	1	1	t	2026-09-05 05:51:18.53	2026-09-05 05:51:18.53
13	DLF Urban City Project	Kushal	P	Singh	dlf_urban	procure@dlfcity.com	1	1	t	2026-09-05 05:51:18.532	2026-09-05 05:51:18.532
14	NCC Infrastructure Ltd	Ranga	A	Rao	ncc_infra	finance@nccinfra.com	1	1	t	2026-09-05 05:51:18.534	2026-09-05 05:51:18.534
15	GMR Expressways Division	Gautam	M	Reddy	gmr_express	express@gmrgroup.in	1	1	t	2026-09-05 05:51:18.536	2026-09-05 05:51:18.536
16	Afcons Infrastructure	Sandeep	G	Garg	afcons_infra	materials@afcons.com	1	1	t	2026-09-05 05:51:18.538	2026-09-05 05:51:18.538
17	Gammon Bridge Works	Harish	C	Patil	gammon_bridge	bridges@gammoninfra.com	1	1	t	2026-09-05 05:51:18.54	2026-09-05 05:51:18.54
18	IRB Tollways Construction	Virendra	D	Mhaiskar	irb_tollways	tollways@irb.co.in	1	1	t	2026-09-05 05:51:18.542	2026-09-05 05:51:18.542
19	Tata Power Transmission	Ratan	K	Tata	tata_trans	transmission@tatapower.com	1	1	t	2026-09-05 05:51:18.544	2026-09-05 05:51:18.544
20	Ahluwalia Contracts India	Bikram	S	Ahluwalia	ahluwalia_con	accounts@ahluwaliacontracts.in	1	1	t	2026-09-05 05:51:18.546	2026-09-05 05:51:18.546
21	Simplex Pipelines Corp	Amitabh	V	Mundhra	simplex_pipe	pipelines@simplexinfra.com	1	1	f	2026-09-05 05:51:18.548	2026-09-05 05:51:18.548
22	PNC Infratech Projects	Pradeep	K	Jain	pnc_infra	billing@pncinfratech.com	1	1	t	2026-09-05 05:51:18.55	2026-09-05 05:51:18.55
23	Welspun Tubular Products	Balkrishan	K	Goenka	welspun_tubes	tubes@welspun.com	1	1	t	2026-09-05 05:51:18.554	2026-09-05 05:51:18.554
24	Mahindra Heavy Auto Components	Anand	G	Mahindra	mahindra_auto	auto_metals@mahindra.com	1	1	t	2026-09-05 05:51:18.556	2026-09-05 05:51:18.556
25	BHEL Power Boiler Works	Nalin	S	Shinghal	bhel_power	boilers@bhel.in	1	1	t	2026-09-05 05:51:18.558	2026-09-05 05:51:18.558
26	Thermax Energy Solutions	Meher	P	Pudumjee	thermax_energy	energy@thermaxglobal.com	1	1	t	2026-09-05 05:51:18.56	2026-09-05 05:51:18.56
27	Isgec Heavy Engineering	Aditya	P	Puri	isgec_eng	heavy@isgec.com	1	1	t	2026-09-05 05:51:18.562	2026-09-05 05:51:18.562
28	Pennar Engineered Buildings	Nrupender	R	Rao	pennar_build	peb@pennarindia.com	1	1	t	2026-09-05 05:51:18.564	2026-09-05 05:51:18.564
29	Kirby Building Systems	Raju	V	Kurian	kirby_sys	orders@kirby-india.com	1	1	t	2026-09-05 05:51:18.566	2026-09-05 05:51:18.566
30	Everest Steel Structures	Manish	K	Sanghi	everest_steel	structures@everestind.com	1	1	t	2026-09-05 05:51:18.568	2026-09-05 05:51:18.568
31	Interarch Building Products	Arvind	N	Nanda	interarch_prod	info@interarchindia.com	1	1	t	2026-09-05 05:51:18.57	2026-09-05 05:51:18.57
32	Sterling & Wilson EPC	Khurshed	Y	Daruvala	sterling_epc	epc@sterlingwilson.com	1	1	t	2026-09-05 05:51:18.572	2026-09-05 05:51:18.572
33	Kalpataru Power Tower Unit	Mofatraj	P	Munot	kalpataru_power	towers@kalpatarupower.com	1	1	t	2026-09-05 05:51:18.575	2026-09-05 05:51:18.575
34	KEC International Line Works	Vimal	K	Kejriwal	kec_inter	lineworks@kecrpg.com	1	1	t	2026-09-05 05:51:18.577	2026-09-05 05:51:18.577
35	Techno Electric Transmission	Padam	P	Gupta	techno_electric	accounts@techno.co.in	1	1	t	2026-09-05 05:51:18.579	2026-09-05 05:51:18.579
36	Bajaj Electricals Tower Div	Shekhar	R	Bajaj	bajaj_towers	towers@bajajelectricals.com	1	1	t	2026-09-05 05:51:18.581	2026-09-05 05:51:18.581
37	Tata AutoComp Systems	Arvind	S	Goel	tata_autocomp	purchasing@tataautocomp.com	1	1	t	2026-09-05 05:51:18.583	2026-09-05 05:51:18.583
38	Bharat Forge Machining Plant	Babasaheb	N	Kalyani	bharat_forge	machining@bharatforge.com	1	1	t	2026-09-05 05:51:18.585	2026-09-05 05:51:18.585
39	Ramkrishna Forgings Ltd	Mahabir	P	Jalan	ramkrishna_forg	sales@ramkrishnaforgings.com	1	1	t	2026-09-05 05:51:18.587	2026-09-05 05:51:18.587
40	MM Forgings Heavy Div	Vidyashankar	K	Krishnan	mm_forgings	heavy@mmforgings.com	1	1	t	2026-09-05 05:51:18.59	2026-09-05 05:51:18.59
41	Sundram Fasteners Unit 4	Suresh	K	Krishna	sundram_fasteners	unit4@sundram.com	1	1	f	2026-09-05 05:51:18.591	2026-09-05 05:51:18.591
42	State Bank of India - CA 1029	Sanjay	B	Verma	sbi_ca_1029	sbi_1029@matrixcorp.com	1	1	t	2026-09-05 05:51:18.593	2026-09-05 05:51:18.593
43	HDFC Bank - CA 4401	Rohit	P	Shenoy	hdfc_ca_4401	hdfc_4401@matrixcorp.com	1	1	t	2026-09-05 05:51:18.597	2026-09-05 05:51:18.597
44	ICICI Bank - CA 8820	Girish	M	Nambiar	icici_ca_8820	icici_8820@matrixcorp.com	1	1	t	2026-09-05 05:51:18.6	2026-09-05 05:51:18.6
45	Axis Bank - CA 3105	Anand	K	Iyer	axis_ca_3105	axis_3105@matrixcorp.com	1	1	t	2026-09-05 05:51:18.602	2026-09-05 05:51:18.602
46	Bank of Baroda - CA 9012	Naveen	C	Bhatt	bob_ca_9012	bob_9012@matrixcorp.com	1	1	t	2026-09-05 05:51:18.604	2026-09-05 05:51:18.604
47	Kotak Mahindra Bank - CA 5519	Kavita	R	Kothari	kotak_ca_5519	kotak_5519@matrixcorp.com	1	1	t	2026-09-05 05:51:18.608	2026-09-05 05:51:18.608
48	Punjab National Bank - CA 7731	Deepak	J	Aggarwal	pnb_ca_7731	pnb_7731@matrixcorp.com	1	1	t	2026-09-05 05:51:18.609	2026-09-05 05:51:18.609
49	Petty Cash - Factory Plant 1	Mahesh	D	Gaikwad	cash_factory1	cash1@matrixcorp.com	1	1	t	2026-09-05 05:51:18.611	2026-09-05 05:51:18.611
50	Petty Cash - Factory Plant 2	Ramesh	S	Yadav	cash_factory2	cash2@matrixcorp.com	1	1	t	2026-09-05 05:51:18.613	2026-09-05 05:51:18.613
51	Petty Cash - Head Office	Pooja	A	Sharma	cash_headoffice	cash_ho@matrixcorp.com	1	1	t	2026-09-05 05:51:18.615	2026-09-05 05:51:18.615
52	Rolling Mill Plant & Machinery	Kailash	T	Chauhan	asset_mill_machinery	asset_machinery@matrixcorp.com	1	2	t	2026-09-05 05:51:18.617	2026-09-05 05:51:18.617
53	Induction Melting Furnace Unit	Bhagwan	L	Tiwari	asset_furnace	asset_furnace@matrixcorp.com	1	2	t	2026-09-05 05:51:18.619	2026-09-05 05:51:18.619
54	Heavy Transportation Fleet	Jaswant	S	Dhillon	asset_trucks	asset_trucks@matrixcorp.com	1	2	t	2026-09-05 05:51:18.623	2026-09-05 05:51:18.623
55	Factory Freehold Land & Sheds	Nitin	V	Gadkari	asset_land_sheds	asset_land@matrixcorp.com	1	2	t	2026-09-05 05:51:18.625	2026-09-05 05:51:18.625
56	Corporate Office Premises	Sharad	K	Pawar	asset_corp_office	asset_office@matrixcorp.com	1	2	t	2026-09-05 05:51:18.629	2026-09-05 05:51:18.629
57	Electric Overhead Cranes (EOT)	Balwant	R	Singh	asset_eot_cranes	asset_cranes@matrixcorp.com	1	2	t	2026-09-05 05:51:18.63	2026-09-05 05:51:18.63
58	Metallurgical Testing Lab Setup	Dr. Aniruddh	V	Bose	asset_lab_setup	asset_lab@matrixcorp.com	1	2	t	2026-09-05 05:51:18.632	2026-09-05 05:51:18.632
59	Automated Weighbridge 100T	Devendra	P	Shukla	asset_weighbridge	asset_weighbridge@matrixcorp.com	1	2	t	2026-09-05 05:51:18.634	2026-09-05 05:51:18.634
60	Steel Authority of India Ltd (SAIL)	Amarendu	K	Prakash	sail_raw_supplies	central_orders@sail.in	2	3	t	2026-09-05 05:51:18.637	2026-09-05 05:51:18.637
61	JSW Steel Distribution Center	Jayant	V	Acharya	jsw_distribution	dist_west@jsw.in	2	3	f	2026-09-05 05:51:18.639	2026-09-05 05:51:18.639
62	Tata Steel BSL Raw Materials	T. V.	K	Narendran	tata_bsl_raw	bsl_raw@tatasteel.com	2	3	t	2026-09-05 05:51:18.64	2026-09-05 05:51:18.64
63	Jindal Steel & Power Ltd	Naveen	O	Jindal	jspl_supplies	orders@jindalsteel.com	2	3	t	2026-09-05 05:51:18.642	2026-09-05 05:51:18.642
64	Essar Steel Processing Stockyard	Prashant	S	Ruin	essar_stockyard	stockyard@essar.com	2	3	t	2026-09-05 05:51:18.645	2026-09-05 05:51:18.645
65	Vedanta Metal Resource Corp	Anil	L	Agarwal	vedanta_metals	metal_supplies@vedanta.co.in	2	3	t	2026-09-05 05:51:18.647	2026-09-05 05:51:18.647
66	Hindalco Smelting Anodes	Satish	M	Pai	hindalco_anodes	anodes@adityabirla.com	2	3	t	2026-09-05 05:51:18.649	2026-09-05 05:51:18.649
67	Nalco Bauxite & Metal Supplies	Sridhar	K	Patra	nalco_supplies	bauxite@nalcoindia.co.in	2	3	t	2026-09-05 05:51:18.651	2026-09-05 05:51:18.651
68	Rashtriya Ispat Nigam Ltd (RINL)	Atul	B	Bhatt	rinl_vizag	vizag_steel@rinl.gov.in	2	3	t	2026-09-05 05:51:18.653	2026-09-05 05:51:18.653
69	Electrosteel Castings Depot	Umang	K	Kejriwal	electrosteel_depot	castings@electrosteel.com	2	3	t	2026-09-05 05:51:18.656	2026-09-05 05:51:18.656
70	Shyam Metalics Sponge Iron	Brij	B	Agarwal	shyam_metalics	sponge@shyammetalics.com	2	3	t	2026-09-05 05:51:18.659	2026-09-05 05:51:18.659
71	Sarda Energy & Minerals	Kamal	K	Sarda	sarda_energy	minerals@seml.co.in	2	3	t	2026-09-05 05:51:18.66	2026-09-05 05:51:18.66
72	Gallantt Metal Billet Suppliers	Chandra	P	Agarwal	gallantt_metal	billets@gallantt.com	2	3	t	2026-09-05 05:51:18.664	2026-09-05 05:51:18.664
73	Sunflag Iron & Steel Works	Ravi	B	Bhardwaj	sunflag_iron	orders@sunflagsteel.com	2	3	t	2026-09-05 05:51:18.665	2026-09-05 05:51:18.665
74	Prakash Industries Wire Rods	Vipin	P	Agarwal	prakash_ind	wires@prakash.com	2	3	t	2026-09-05 05:51:18.667	2026-09-05 05:51:18.667
75	Lloyds Metals & Energy	Mukesh	R	Gupta	lloyds_metals	pellets@lloyds.in	2	3	t	2026-09-05 05:51:18.669	2026-09-05 05:51:18.669
76	Kirloskar Ferrous Industries	R. V.	S	Gumaste	kirloskar_ferrous	pigiron@kirloskar.com	2	3	t	2026-09-05 05:51:18.671	2026-09-05 05:51:18.671
77	Jindal Stainless Stockist	Abhyuday	P	Jindal	jindal_stainless	stockist@jindalstainless.com	2	3	t	2026-09-05 05:51:18.674	2026-09-05 05:51:18.674
78	Viraj Profiles Wire Plant	Neeraj	R	Kochhar	viraj_profiles	wireplant@viraj.com	2	3	t	2026-09-05 05:51:18.676	2026-09-05 05:51:18.676
79	Mukul Scrap Merchants Hub	Mukul	D	Bansal	mukul_scrap	dealers@mukulscrap.com	2	3	t	2026-09-05 05:51:18.678	2026-09-05 05:51:18.678
80	National Oxygen & Gas Refills	Sudhir	T	Singhal	national_gas	orders@nationalgas.in	2	3	t	2026-09-05 05:51:18.68	2026-09-05 05:51:18.68
81	Industrial Lubricants & Oils	Pravin	H	Parekh	ind_lubricants	sales@indlubricants.com	2	3	f	2026-09-05 05:51:18.682	2026-09-05 05:51:18.682
82	Tayo Rolls Refractory Linings	Kallol	N	Chatterjee	tayo_rolls	refractory@tayorolls.com	2	3	t	2026-09-05 05:51:18.685	2026-09-05 05:51:18.685
83	Orient Abrasives Grinding Unit	Manubhai	G	Patel	orient_abrasives	grinding@orientabrasives.com	2	3	t	2026-09-05 05:51:18.686	2026-09-05 05:51:18.686
84	Carborundum Universal Wheels	M. M.	C	Murugappan	cumi_wheels	wheels@cumi.murugappa.com	2	3	t	2026-09-05 05:51:18.688	2026-09-05 05:51:18.688
85	Goods & Services Tax (GST) Payable	Superintendent	CGST	Division	gst_payable	gst_dept@matrixcorp.com	2	3	t	2026-09-05 05:51:18.69	2026-09-05 05:51:18.69
86	Tax Deducted at Source (TDS) Payable	Income	Tax	Officer	tds_payable	tds_dept@matrixcorp.com	2	3	t	2026-09-05 05:51:18.692	2026-09-05 05:51:18.692
87	Factory Workers Wages Payable	HR	Plant	Officer	wages_payable	wages_hr@matrixcorp.com	2	3	t	2026-09-05 05:51:18.694	2026-09-05 05:51:18.694
88	Employees Provident Fund (PF) Payable	EPFO	Regional	Commissioner	pf_payable	pf_officer@matrixcorp.com	2	3	t	2026-09-05 05:51:18.696	2026-09-05 05:51:18.696
89	Statutory Audit Fee Payable	S. R.	Batliboi	& Associates	audit_fee_payable	batliboi_audit@matrixcorp.com	2	3	t	2026-09-05 05:51:18.699	2026-09-05 05:51:18.699
90	SBI Term Loan - Rolling Mill Expansion	General	Manager	SME SBI	sbi_term_loan	sbi_loan@matrixcorp.com	2	4	t	2026-09-05 05:51:18.701	2026-09-05 05:51:18.701
91	HDFC Industrial Equipment Mortgage	Credit	Head	HDFC Infra	hdfc_mortgage	hdfc_loan@matrixcorp.com	2	4	t	2026-09-05 05:51:18.703	2026-09-05 05:51:18.703
92	SIDBI Green Furnace Credit Line	Zonal	Head	SIDBI CleanTech	sidbi_green_loan	sidbi_loan@matrixcorp.com	2	4	t	2026-09-05 05:51:18.705	2026-09-05 05:51:18.705
93	Unsecured Promoter Directors Loan	Karan	H	Harsora	promoter_loan	promoter_loan@matrixcorp.com	2	4	t	2026-09-05 05:51:18.707	2026-09-05 05:51:18.707
94	Equity Share Capital Account	Managing	Director	Board	equity_capital	board@matrixcorp.com	3	5	t	2026-09-05 05:51:18.71	2026-09-05 05:51:18.71
95	General Reserve & Surplus	Chief	Financial	Officer	general_reserve	reserve@matrixcorp.com	3	6	t	2026-09-05 05:51:18.712	2026-09-05 05:51:18.712
96	Retained Earnings P&L Account	Corporate	Finance	Controller	retained_earnings	controller@matrixcorp.com	3	6	t	2026-09-05 05:51:18.714	2026-09-05 05:51:18.714
97	Domestic Steel Rebars Revenue	Sales	Head	Domestic	rev_rebars	sales_domestic@matrixcorp.com	4	7	t	2026-09-05 05:51:18.716	2026-09-05 05:51:18.716
98	HR / CR Coil Sales Revenue	Sales	Head	Flat Products	rev_coils	sales_coils@matrixcorp.com	4	7	t	2026-09-05 05:51:18.719	2026-09-05 05:51:18.719
99	Structural Beams & Channels Sales	Sales	Head	Structurals	rev_structurals	sales_struct@matrixcorp.com	4	7	t	2026-09-05 05:51:18.721	2026-09-05 05:51:18.721
100	Industrial Pipe & Flange Revenue	Sales	Head	Tubular	rev_pipes	sales_pipes@matrixcorp.com	4	7	t	2026-09-05 05:51:18.723	2026-09-05 05:51:18.723
101	Custom Steel Fabrication Charges	Works	Manager	CustomFab	rev_fabrication	custom_fab@matrixcorp.com	4	7	f	2026-09-05 05:51:18.725	2026-09-05 05:51:18.725
102	Metal Scrap & Slag Disposal Income	Yard	Supervisor	Recycling	inc_scrap_sales	scrap_revenue@matrixcorp.com	4	8	t	2026-09-05 05:51:18.728	2026-09-05 05:51:18.728
103	Interest on Bank Term Deposits	Treasury	Officer	Banking	inc_fd_interest	treasury@matrixcorp.com	4	8	t	2026-09-05 05:51:18.73	2026-09-05 05:51:18.73
104	Cash Discounts Received from Vendors	Accounts	Payable	Head	inc_vendor_discount	discounts@matrixcorp.com	4	8	t	2026-09-05 05:51:18.732	2026-09-05 05:51:18.732
105	Foreign Exchange Realization Gain	Forex	Dealer	Treasury	inc_forex_gain	forex@matrixcorp.com	4	8	t	2026-09-05 05:51:18.738	2026-09-05 05:51:18.738
106	Raw Billets & Sponge Iron Purchase	Purchase	Head	RawMaterials	exp_raw_materials	purchase_raw@matrixcorp.com	5	9	t	2026-09-05 05:51:18.738	2026-09-05 05:51:18.738
107	High Tension Industrial Electricity	State	Electricity	Board	exp_ht_power	power_billing@matrixcorp.com	5	9	t	2026-09-05 05:51:18.74	2026-09-05 05:51:18.74
108	Furnace Gas & Fuel Oil	Fuel	Logistics	Manager	exp_furnace_fuel	furnace_fuel@matrixcorp.com	5	9	t	2026-09-05 05:51:18.742	2026-09-05 05:51:18.742
109	Factory Floor Rolling Wages	Plant	Operations	Manager	exp_rolling_wages	rolling_ops@matrixcorp.com	5	9	t	2026-09-05 05:51:18.744	2026-09-05 05:51:18.744
110	Inward Freight & Logistics Costs	Transport	Coordinator	Logistics	exp_inward_freight	inward_freight@matrixcorp.com	5	9	t	2026-09-05 05:51:18.747	2026-09-05 05:51:18.747
111	Rolling Mill Rollers & Consumables	Store	Incharge	Toolroom	exp_consumables	toolroom@matrixcorp.com	5	9	t	2026-09-05 05:51:18.749	2026-09-05 05:51:18.749
112	Corporate Administrative Salaries	Chief	HR	Officer	exp_admin_salaries	hr_admin@matrixcorp.com	5	10	t	2026-09-05 05:51:18.751	2026-09-05 05:51:18.751
113	Corporate Head Office Lease Rent	Commercial	Properties	Manager	exp_ho_rent	office_lease@matrixcorp.com	5	10	t	2026-09-05 05:51:18.753	2026-09-05 05:51:18.753
114	Industrial Plant & Stock Insurance	New	India	Assurance	exp_plant_insurance	insurance@matrixcorp.com	5	10	t	2026-09-05 05:51:18.755	2026-09-05 05:51:18.755
115	Plant Repair & Preventive Maintenance	Chief	Engineer	Maintenance	exp_repair_maint	maintenance@matrixcorp.com	5	10	t	2026-09-05 05:51:18.758	2026-09-05 05:51:18.758
116	Sales & Marketing Promotion Expenses	Marketing	Head	SteelExpo	exp_marketing_promo	marketing_exp@matrixcorp.com	5	10	t	2026-09-05 05:51:18.76	2026-09-05 05:51:18.76
117	Legal & Regulatory Compliance Fees	Legal	Counsel	Advisors	exp_legal_fees	legal_dept@matrixcorp.com	5	10	t	2026-09-05 05:51:18.762	2026-09-05 05:51:18.762
118	Corporate IT & Cloud ERP Infrastructure	Chief	Technology	Officer	exp_it_cloud	it_infra@matrixcorp.com	5	10	t	2026-09-05 05:51:18.764	2026-09-05 05:51:18.764
119	Bank Processing Charges & Commission	Bank	Relationship	Manager	exp_bank_charges	bank_charges@matrixcorp.com	5	10	t	2026-09-05 05:51:18.766	2026-09-05 05:51:18.766
\.


--
-- Data for Name: attributes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attributes (id, attribute_name_id, attribute_value, created_at) FROM stdin;
1	11	Fe500D	2026-09-04 05:22:11.776
2	11	Fe550	2026-09-04 05:22:11.776
3	12	12 mm	2026-09-04 05:22:11.776
4	12	16 mm	2026-09-04 05:22:11.776
5	13	5 mm	2026-09-04 05:22:11.776
6	13	10 mm	2026-09-04 05:22:11.776
7	14	1250 mm	2026-09-04 05:22:11.776
8	14	1500 mm	2026-09-04 05:22:11.776
9	15	12 m	2026-09-04 05:22:11.776
10	15	6 m	2026-09-04 05:22:11.776
11	16	Round	2026-09-04 05:22:11.776
12	16	Square	2026-09-04 05:22:11.776
13	17	IS 1786	2026-09-04 05:22:11.776
14	17	IS 2062	2026-09-04 05:22:11.776
15	11	Fe500D	2026-09-04 05:57:51.447
16	11	Fe550	2026-09-04 05:57:51.447
17	12	12 mm	2026-09-04 05:57:51.447
18	12	16 mm	2026-09-04 05:57:51.447
19	13	5 mm	2026-09-04 05:57:51.447
20	13	10 mm	2026-09-04 05:57:51.447
21	14	1250 mm	2026-09-04 05:57:51.447
22	14	1500 mm	2026-09-04 05:57:51.447
23	15	12 m	2026-09-04 05:57:51.447
24	15	6 m	2026-09-04 05:57:51.447
25	16	Round	2026-09-04 05:57:51.447
26	16	Square	2026-09-04 05:57:51.447
27	17	IS 1786	2026-09-04 05:57:51.447
28	17	IS 2062	2026-09-04 05:57:51.447
29	47	Fe500D	2026-09-04 10:01:43.598
30	47	Fe550	2026-09-04 10:01:43.598
31	48	12 mm	2026-09-04 10:01:43.598
32	48	16 mm	2026-09-04 10:01:43.598
33	49	5 mm	2026-09-04 10:01:43.598
34	49	10 mm	2026-09-04 10:01:43.598
35	50	1250 mm	2026-09-04 10:01:43.598
36	50	1500 mm	2026-09-04 10:01:43.598
37	51	12 m	2026-09-04 10:01:43.598
38	51	6 m	2026-09-04 10:01:43.598
39	52	Round	2026-09-04 10:01:43.598
40	52	Square	2026-09-04 10:01:43.598
41	53	IS 1786	2026-09-04 10:01:43.598
42	53	IS 2062	2026-09-04 10:01:43.598
43	12	20 mm	2026-09-05 05:51:18.39
44	12	25 mm	2026-09-05 05:51:18.395
45	13	16 mm	2026-09-05 05:51:18.396
46	13	25 mm	2026-09-05 05:51:18.398
47	16	Hollow	2026-09-05 05:51:18.4
48	17	ASTM A312	2026-09-05 05:51:18.402
\.


--
-- Data for Name: common_lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.common_lists (id, list_type, list_value, created_at) FROM stdin;
1	MU	PCS	2026-09-02 17:40:44.724
2	MU	GM	2026-09-02 17:40:44.724
3	MU	KG	2026-09-02 17:40:44.724
4	MU	MTR	2026-09-02 17:40:44.724
5	MU	SQFT	2026-09-02 17:40:44.724
11	A	Grade	2026-09-04 05:14:30.678
12	A	Diameter	2026-09-04 05:14:30.678
13	A	Thickness	2026-09-04 05:14:30.678
14	A	Width	2026-09-04 05:14:30.678
15	A	Length	2026-09-04 05:14:30.678
16	A	Shape	2026-09-04 05:14:30.678
17	A	Standard	2026-09-04 05:14:30.678
42	MU	PCS	2026-09-04 10:01:43.594
43	MU	GM	2026-09-04 10:01:43.594
44	MU	KG	2026-09-04 10:01:43.594
45	MU	MTR	2026-09-04 10:01:43.594
46	MU	SQFT	2026-09-04 10:01:43.594
47	A	Grade	2026-09-04 10:01:43.596
48	A	Diameter	2026-09-04 10:01:43.596
49	A	Thickness	2026-09-04 10:01:43.596
50	A	Width	2026-09-04 10:01:43.596
51	A	Length	2026-09-04 10:01:43.596
52	A	Shape	2026-09-04 10:01:43.596
53	A	Standard	2026-09-04 10:01:43.596
54	MU	PCS	2026-09-05 05:47:59.675
55	MU	GM	2026-09-05 05:47:59.675
56	MU	KG	2026-09-05 05:47:59.675
57	MU	MTR	2026-09-05 05:47:59.675
58	MU	SQFT	2026-09-05 05:47:59.675
\.


--
-- Data for Name: daybook_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daybook_groups (id, group_name, short_name, description, is_active, created_at, updated_at) FROM stdin;
1	Sales	SAL	Sales transactions	t	2026-09-05 09:22:55.432	2026-09-05 09:22:55.432
2	Purchase	PUR	Purchase transactions	t	2026-09-05 09:22:55.435	2026-09-05 09:22:55.435
3	Payment	PAY	Bank and cash payment vouchers	t	2026-09-05 09:22:55.436	2026-09-05 09:22:55.436
4	Receipt	RCT	Bank and cash receipt vouchers	t	2026-09-05 09:22:55.438	2026-09-05 09:22:55.438
5	Journal	JRN	General journal vouchers	t	2026-09-05 09:22:55.44	2026-09-05 09:22:55.44
6	Contra	CTR	Inter-bank and cash transfer vouchers	t	2026-09-05 09:22:55.442	2026-09-05 09:22:55.442
\.


--
-- Data for Name: daybooks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daybooks (id, daybook_name, short_name, daybook_group_id, voucher_prefix, allow_manual_number, description, is_active, created_at, updated_at) FROM stdin;
1	Wholesale Sales	WSAL	1	WS-INV	f	Wholesale steel sales	t	2026-09-05 09:22:55.445	2026-09-05 09:22:55.445
2	Retail Sales	RSAL	1	RS-INV	f	Retail counter sales	t	2026-09-05 09:22:55.448	2026-09-05 09:22:55.448
3	Export Sales	EXSAL	1	EXP-INV	f	Overseas export sales	t	2026-09-05 09:22:55.449	2026-09-05 09:22:55.449
4	Raw Material Purchase	RMPUR	2	RM-PUR	f	Raw billet & scrap purchases	t	2026-09-05 09:22:55.451	2026-09-05 09:22:55.451
5	Stores & Spares Purchase	STPUR	2	ST-PUR	f	Factory consumables purchase	t	2026-09-05 09:22:55.453	2026-09-05 09:22:55.453
6	Bank Payment	BNKPAY	3	BP-VCH	f	Vendor & expense bank payments	t	2026-09-05 09:22:55.455	2026-09-05 09:22:55.455
7	Cash Payment	CSHPAY	3	CP-VCH	t	Petty cash expenses	t	2026-09-05 09:22:55.457	2026-09-05 09:22:55.457
8	Bank Receipt	BNKRCT	4	BR-VCH	f	Customer bank receipts	t	2026-09-05 09:22:55.459	2026-09-05 04:20:23.044
9	General Journal	GENJRN	5	JV	t	Adjustment journal entries	t	2026-09-05 09:22:55.461	2026-09-05 09:22:55.461
\.


--
-- Data for Name: item_groups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.item_groups (id, item_group_name, short_name, metal_type_id, sales_rate, purchase_rate, sales_rate_type_id, purchase_rate_type_id, measure_unit_code, created_at, updated_at) FROM stdin;
5	Hot Rolled Coils	HRC	2	58.50	54.00	1	1	KG	2026-09-05 05:51:18.412	2026-09-05 05:51:18.412
6	Cold Rolled Coils	CRC	3	66.00	61.50	1	1	KG	2026-09-05 05:51:18.415	2026-09-05 05:51:18.415
7	Galvanized Plain Sheets	GP-SHT	2	72000.00	68000.00	2	2	TON	2026-09-05 05:51:18.416	2026-09-05 05:51:18.416
8	TMT Rebars Fe500D	TMT-500	2	52500.00	49000.00	2	2	TON	2026-09-05 05:51:18.418	2026-09-05 05:51:18.418
9	Stainless Steel Seamless Pipes	SS-SP	4	450.00	390.00	4	4	MTR	2026-09-05 05:51:18.42	2026-09-05 05:51:18.42
10	Mild Steel Equal Angles	MS-ANG	2	55.00	50.00	1	1	KG	2026-09-05 05:51:18.422	2026-09-05 05:51:18.422
11	Carbon Steel Heavy Plates	CS-PLT	3	64000.00	59500.00	2	2	TON	2026-09-05 05:51:18.424	2026-09-05 05:51:18.424
12	Alloy Steel Round Bars	AS-RB	5	88.00	80.00	1	1	KG	2026-09-05 05:51:18.426	2026-09-05 05:51:18.426
13	Cast Iron Billets	CI-BLT	1	42000.00	38500.00	2	2	TON	2026-09-05 05:51:18.428	2026-09-05 05:51:18.428
14	Stainless Steel Flanges	SS-FLG	4	850.00	720.00	3	3	PCS	2026-09-05 05:51:18.43	2026-09-05 05:51:18.43
15	Structural Steel Channels	ISMC	2	620.00	560.00	4	4	MTR	2026-09-05 05:51:18.432	2026-09-05 05:51:18.432
16	High Carbon Wire Rods	WR-HC	3	60.00	55.00	1	1	KG	2026-09-05 05:51:18.434	2026-09-05 05:51:18.434
17	ERW Steel Tubes	ERW-TB	2	280.00	240.00	4	4	MTR	2026-09-05 05:51:18.436	2026-09-05 05:51:18.436
18	Chequered Floor Plates	CHQ-PLT	2	350.00	310.00	5	5	SQFT	2026-09-05 05:51:18.438	2026-09-05 05:51:18.438
19	Bright Hexagon Bars	HEX-BR	5	95.00	86.00	1	1	KG	2026-09-05 05:51:18.44	2026-09-05 05:51:18.44
20	Mild Steel Flat Bars	MS-FB	2	53.00	48.50	1	1	KG	2026-09-05 05:51:18.442	2026-09-05 05:51:18.442
21	Stainless Steel Square Bars	SS-SB	4	210.00	185.00	1	1	KG	2026-09-05 05:51:18.444	2026-09-05 05:51:18.444
22	Heavy Universal Beams	UB-HV	2	1450.00	1320.00	4	4	MTR	2026-09-05 05:51:18.446	2026-09-05 05:51:18.446
23	Alloy Steel Hollow Sections	AS-HS	5	520.00	460.00	4	4	MTR	2026-09-05 05:51:18.448	2026-09-05 05:51:18.448
24	Foundry Grade Pig Iron	PI-FG	1	39000.00	36000.00	2	2	TON	2026-09-05 05:51:18.45	2026-09-05 05:51:18.45
25	Galvanized Corrugated Sheets	GC-SHT	2	780.00	710.00	4	4	MTR	2026-09-05 05:51:18.452	2026-09-05 05:51:18.452
26	Stainless Steel Angle Bars	SS-ANG	4	195.00	172.00	1	1	KG	2026-09-05 05:51:18.454	2026-09-05 05:51:18.454
\.


--
-- Data for Name: items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.items (id, item_name, short_name, is_active, created_at, updated_at, attributes) FROM stdin;
12	TMT Bar 12mm Fe500D	TMT-12-500D	t	2026-09-05 05:51:18.457	2026-09-05 05:51:18.457	{47,48,51,53}
13	TMT Bar 16mm Fe500D	TMT-16-500D	t	2026-09-05 05:51:18.459	2026-09-05 05:51:18.459	{47,48,51,53}
14	TMT Bar 20mm Fe550	TMT-20-550	t	2026-09-05 05:51:18.461	2026-09-05 05:51:18.461	{47,48,51,53}
15	TMT Bar 25mm Fe550	TMT-25-550	t	2026-09-05 05:51:18.464	2026-09-05 05:51:18.464	{47,48,51,53}
16	TMT Bar 32mm Fe550D	TMT-32-550D	t	2026-09-05 05:51:18.466	2026-09-05 05:51:18.466	{47,48,51,53}
17	SS Seamless Pipe 2 inch Sch40	SS-SP-2IN	t	2026-09-05 05:51:18.467	2026-09-05 05:51:18.467	{49,51,52,53}
18	SS Seamless Pipe 3 inch Sch40	SS-SP-3IN	t	2026-09-05 05:51:18.47	2026-09-05 05:51:18.47	{49,51,52,53}
19	SS Seamless Pipe 4 inch Sch80	SS-SP-4IN	t	2026-09-05 05:51:18.472	2026-09-05 05:51:18.472	{49,51,52,53}
20	MS Equal Angle 50x50x5 mm	MS-ANG-50-5	t	2026-09-05 05:51:18.474	2026-09-05 05:51:18.474	{49,50,51,52}
21	MS Equal Angle 75x75x6 mm	MS-ANG-75-6	t	2026-09-05 05:51:18.476	2026-09-05 05:51:18.476	{49,50,51,52}
22	MS Equal Angle 100x100x10 mm	MS-ANG-100-10	t	2026-09-05 05:51:18.478	2026-09-05 05:51:18.478	{49,50,51,52}
23	Carbon Steel Plate 10mm IS2062	CS-PLT-10MM	t	2026-09-05 05:51:18.48	2026-09-05 05:51:18.48	{49,50,51,53}
24	Carbon Steel Plate 16mm IS2062	CS-PLT-16MM	t	2026-09-05 05:51:18.482	2026-09-05 05:51:18.482	{49,50,51,53}
25	Carbon Steel Plate 25mm IS2062	CS-PLT-25MM	t	2026-09-05 05:51:18.484	2026-09-05 05:51:18.484	{49,50,51,53}
26	Hot Rolled Sheet 2.5mm	HRS-2.5MM	t	2026-09-05 05:51:18.488	2026-09-05 05:51:18.488	{49,50,51}
27	Hot Rolled Sheet 3.0mm	HRS-3.0MM	t	2026-09-05 05:51:18.49	2026-09-05 05:51:18.49	{49,50,51}
28	Cold Rolled Sheet 1.2mm	CRS-1.2MM	t	2026-09-05 05:51:18.491	2026-09-05 05:51:18.491	{49,50,51}
29	Cold Rolled Sheet 1.6mm	CRS-1.6MM	t	2026-09-05 05:51:18.493	2026-09-05 05:51:18.493	{49,50,51}
30	MS Channel ISMC 150	MS-CH-150	t	2026-09-05 05:51:18.497	2026-09-05 05:51:18.497	{50,51,52,53}
31	MS Channel ISMC 200	MS-CH-200	t	2026-09-05 05:51:18.499	2026-09-05 05:51:18.499	{50,51,52,53}
32	SS Blind Flange 4 inch Class 150	SS-FLG-4IN	t	2026-09-05 05:51:18.502	2026-09-05 05:51:18.502	{48,49,53}
33	Alloy Steel Round Bar 32mm	AS-RB-32MM	t	2026-09-05 05:51:18.503	2026-09-05 05:51:18.503	{47,48,51,52}
34	Alloy Steel Round Bar 50mm	AS-RB-50MM	t	2026-09-05 05:51:18.505	2026-09-05 05:51:18.505	{47,48,51,52}
35	Chequered Floor Plate 6mm	CHQ-6MM	t	2026-09-05 05:51:18.507	2026-09-05 05:51:18.507	{49,50,51,52}
\.


--
-- Data for Name: menus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menus (id, menu_name, menu_caption, menu_icon, menu_path, parent_menu_id, list_right, view_right, add_right, edit_right, show_listing_total_right, print_right, created_at, export_right) FROM stdin;
1	master	Master	Database	/master	\N	t	t	t	t	t	t	2026-09-01 16:49:34.126	f
47	Transactions	Transactions	NotebookTabs	/transactions	\N	t	t	t	t	t	t	2026-09-05 06:26:21.69	t
2	admin_setup	Admin Setup	Settings	/admin-setup	1	t	t	t	t	t	t	2026-09-01 16:49:34.132	t
12	Inventory	Inventory	Box	/inventory	1	t	t	t	t	t	t	2026-09-01 19:16:20.389	t
34	AccountMaster	Account Master	ContactRound	/accounts	1	t	t	t	t	t	t	2026-09-04 09:30:05.047	t
36	OtherMaster	Other Master	Database	/other-master	1	t	t	t	t	t	t	2026-09-04 09:57:24.803	t
11	menu_setup	Menu Setup	Menu	/menu-setup	2	t	t	t	t	t	t	2026-09-01 19:13:32.31	f
13	ItemGroup	Item Group	Layers	/item-groups	12	t	t	t	t	t	t	2026-09-01 19:19:32.683	t
23	Items	Items	Box	/items	12	t	t	t	t	t	t	2026-09-04 04:46:24.756	t
33	ItemCode	Item Code	Tag	/item-code	12	t	t	t	t	t	t	2026-09-04 07:37:36.674	t
35	Account	Account	UserRound	/account-master	34	t	t	t	t	t	t	2026-09-04 09:36:04.759	t
37	AccountType	Account Type	Split	/account-type	36	t	t	t	t	t	t	2026-09-04 09:59:47.352	t
55	Daybooks	Daybooks	BookOpen	/daybooks	36	t	t	t	t	t	t	2026-09-05 09:33:33.443	t
56	DaybookGroups	Daybook Groups	Folder	/daybook-groups	36	t	t	t	t	t	t	2026-09-05 09:35:01.79	t
49	CustomerInOut	Customer In Out	Wallet	/customer-in-out	47	t	t	t	t	t	t	2026-09-05 08:31:17.734	t
50	SuppliorInOut	Supplior In Out	Truck	/supplior-in-out	47	t	t	t	t	t	t	2026-09-05 08:35:04.276	t
63	Payments	Payments	Wallet	/payments	47	t	t	t	t	t	t	2026-09-05 10:13:37.708	t
64	Receipt	Receipt	Receipt	/receipt	47	t	t	t	t	t	t	2026-09-05 10:15:19.858	t
48	Sales	Sales	ShoppingBag	/sales	49	t	t	t	t	t	t	2026-09-05 06:27:52.402	t
51	Purchase	Purchase	ShoppingBag	/purchase	50	t	t	t	t	t	t	2026-09-05 08:37:22.449	t
\.


--
-- Data for Name: metals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.metals (id, name) FROM stdin;
1	Iron
2	Mild Steel
3	Carbon Steel
4	Stainless Steel
5	Alloy Steel
\.


--
-- Data for Name: rate_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.rate_types (id, name) FROM stdin;
1	Kg * Rate
2	Ton * Rate
3	Pcs * Rate
4	Meter * Rate
5	Sq Ft * Rate
6	Sq Meter * Rate
\.


--
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales (id, voucher_no, voucher_date, daybook_id, account_id, reference, remarks, salesman_name, bill_mode, subtotal, discount_rate, discount_amount, tax_rate, tax_amount, round_off, grand_total, advance_amount, urd_amount, cash_amount, bank_amount, card_amount, card_commission, scheme_amount, gift_voucher_amount, sales_return_amount, kasar_amount, tds_amount, rate_fix_type, due_date, delivery_pending, is_active, created_at, updated_at, sr_no) FROM stdin;
4	WS-INV-177	2026-09-04 18:30:00	1	100			Amit Verma	Debit Memo	88	0	0	3	2.64	0.36	91	0	0	0	0	0	0	0	0	0	0	0	Fix	2026-09-19 18:30:00	f	t	2026-09-05 19:07:44.083	2026-09-05 19:07:44.083	1
5	WS-INV-2	2026-09-05 18:30:00	1	\N			Amit Verma	Debit Memo	120	0	1	3	3.6	0.4	124	0	83	41	0	0	0	0	0	0	0	0	Fix	2026-09-20 18:30:00	f	t	2026-09-06 08:06:47.06	2026-09-06 08:06:47.06	2
\.


--
-- Data for Name: sales_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_items (id, sale_id, item_id, item_group_id, tag_no, quantity, uom, weight, gross_wt, net_wt, adjusted_wt, fine_wt, rate, rate_type, tax, labour_amount, other_amount, discount_amount, amount, created_at, updated_at) FROM stdin;
4	4	16	12	TMT-12-500D	1	KG	0	0	0	0	0	88		3%	0	0	0	88	2026-09-05 19:07:44.083	2026-09-05 19:07:44.083
5	5	14	5	TMT-20-550	1	KG	0	121	121	0	0	1	Kg * Rate	3%	0	0	1	120	2026-09-06 08:06:47.06	2026-09-06 08:06:47.06
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password, created_at) FROM stdin;
1	Admin User	admin@company.com	$2b$10$faiRQtPtpzJG1eeS7WKUpeHXkZ1Ir1K8MuGXc1mjPbClYP1jKOFOO	2026-08-31 18:15:12.216
\.


--
-- Name: account_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_groups_id_seq', 11, false);


--
-- Name: account_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.account_types_id_seq', 6, false);


--
-- Name: accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.accounts_id_seq', 120, false);


--
-- Name: attributes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attributes_id_seq', 49, false);


--
-- Name: common_lists_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.common_lists_id_seq', 59, false);


--
-- Name: daybook_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daybook_groups_id_seq', 7, false);


--
-- Name: daybooks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.daybooks_id_seq', 10, false);


--
-- Name: item_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.item_groups_id_seq', 27, false);


--
-- Name: items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.items_id_seq', 36, false);


--
-- Name: menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menus_id_seq', 65, false);


--
-- Name: metals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.metals_id_seq', 6, false);


--
-- Name: rate_types_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.rate_types_id_seq', 7, false);


--
-- Name: sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_id_seq', 6, false);


--
-- Name: sales_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sales_items_id_seq', 6, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, false);


--
-- Name: account_groups account_groups_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_groups
    ADD CONSTRAINT account_groups_name_unique UNIQUE (name);


--
-- Name: account_groups account_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_groups
    ADD CONSTRAINT account_groups_pkey PRIMARY KEY (id);


--
-- Name: account_types account_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_name_unique UNIQUE (name);


--
-- Name: account_types account_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_types
    ADD CONSTRAINT account_types_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_unique UNIQUE (email);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_user_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_user_name_unique UNIQUE (user_name);


--
-- Name: attributes attributes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_pkey PRIMARY KEY (id);


--
-- Name: common_lists common_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.common_lists
    ADD CONSTRAINT common_lists_pkey PRIMARY KEY (id);


--
-- Name: daybook_groups daybook_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybook_groups
    ADD CONSTRAINT daybook_groups_pkey PRIMARY KEY (id);


--
-- Name: daybook_groups daybook_groups_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybook_groups
    ADD CONSTRAINT daybook_groups_short_name_unique UNIQUE (short_name);


--
-- Name: daybooks daybooks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybooks
    ADD CONSTRAINT daybooks_pkey PRIMARY KEY (id);


--
-- Name: daybooks daybooks_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybooks
    ADD CONSTRAINT daybooks_short_name_unique UNIQUE (short_name);


--
-- Name: item_groups item_groups_item_group_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups
    ADD CONSTRAINT item_groups_item_group_name_unique UNIQUE (item_group_name);


--
-- Name: item_groups item_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups
    ADD CONSTRAINT item_groups_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: items items_short_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_short_name_unique UNIQUE (short_name);


--
-- Name: menus menus_menu_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_menu_name_unique UNIQUE (menu_name);


--
-- Name: menus menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_pkey PRIMARY KEY (id);


--
-- Name: metals metals_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metals
    ADD CONSTRAINT metals_name_unique UNIQUE (name);


--
-- Name: metals metals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.metals
    ADD CONSTRAINT metals_pkey PRIMARY KEY (id);


--
-- Name: rate_types rate_types_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_types
    ADD CONSTRAINT rate_types_name_unique UNIQUE (name);


--
-- Name: rate_types rate_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.rate_types
    ADD CONSTRAINT rate_types_pkey PRIMARY KEY (id);


--
-- Name: sales_items sales_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_pkey PRIMARY KEY (id);


--
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- Name: sales sales_voucher_no_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_voucher_no_unique UNIQUE (voucher_no);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: account_groups account_groups_account_type_id_account_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.account_groups
    ADD CONSTRAINT account_groups_account_type_id_account_types_id_fk FOREIGN KEY (account_type_id) REFERENCES public.account_types(id);


--
-- Name: accounts accounts_account_group_id_account_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_account_group_id_account_groups_id_fk FOREIGN KEY (account_group_id) REFERENCES public.account_groups(id);


--
-- Name: accounts accounts_account_type_id_account_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_account_type_id_account_types_id_fk FOREIGN KEY (account_type_id) REFERENCES public.account_types(id);


--
-- Name: attributes attributes_attribute_name_id_common_lists_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attributes
    ADD CONSTRAINT attributes_attribute_name_id_common_lists_id_fk FOREIGN KEY (attribute_name_id) REFERENCES public.common_lists(id);


--
-- Name: daybooks daybooks_daybook_group_id_daybook_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daybooks
    ADD CONSTRAINT daybooks_daybook_group_id_daybook_groups_id_fk FOREIGN KEY (daybook_group_id) REFERENCES public.daybook_groups(id);


--
-- Name: item_groups item_groups_metal_type_id_metals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups
    ADD CONSTRAINT item_groups_metal_type_id_metals_id_fk FOREIGN KEY (metal_type_id) REFERENCES public.metals(id);


--
-- Name: item_groups item_groups_purchase_rate_type_id_rate_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups
    ADD CONSTRAINT item_groups_purchase_rate_type_id_rate_types_id_fk FOREIGN KEY (purchase_rate_type_id) REFERENCES public.rate_types(id);


--
-- Name: item_groups item_groups_sales_rate_type_id_rate_types_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_groups
    ADD CONSTRAINT item_groups_sales_rate_type_id_rate_types_id_fk FOREIGN KEY (sales_rate_type_id) REFERENCES public.rate_types(id);


--
-- Name: menus menus_parent_menu_id_menus_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus
    ADD CONSTRAINT menus_parent_menu_id_menus_id_fk FOREIGN KEY (parent_menu_id) REFERENCES public.menus(id);


--
-- Name: sales sales_account_id_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_account_id_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.accounts(id);


--
-- Name: sales sales_daybook_id_daybooks_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_daybook_id_daybooks_id_fk FOREIGN KEY (daybook_id) REFERENCES public.daybooks(id);


--
-- Name: sales_items sales_items_item_group_id_item_groups_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_item_group_id_item_groups_id_fk FOREIGN KEY (item_group_id) REFERENCES public.item_groups(id);


--
-- Name: sales_items sales_items_item_id_items_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_item_id_items_id_fk FOREIGN KEY (item_id) REFERENCES public.items(id);


--
-- Name: sales_items sales_items_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_items
    ADD CONSTRAINT sales_items_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id);


--
-- PostgreSQL database dump complete
--

\unrestrict oXSNcMj8IAPEBbEjkIcAFBAuTBWmTaaGD6JGAOXe3D1Vls8nggNxou3vVsgHnh3

