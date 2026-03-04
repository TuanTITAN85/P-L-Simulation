--
-- PostgreSQL database dump
--

\restrict QgQCrrp1GDAjFc2ztRiniYqlGIdkz96DxLj25lZMxR71bJrSezLtrVly6328CVx

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

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

--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: actual_entries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.actual_entries (
    id bigint NOT NULL,
    project_id bigint,
    tab text NOT NULL,
    month text DEFAULT ''::text,
    imported_at text DEFAULT ''::text,
    file_name text DEFAULT ''::text,
    selected_codes text[] DEFAULT '{}'::text[],
    offshore_actual_mm numeric DEFAULT 0,
    onsite_actual_mm numeric DEFAULT 0,
    actual_revenue numeric DEFAULT 0,
    calendar_effort numeric DEFAULT 0,
    rows jsonb DEFAULT '[]'::jsonb,
    project_code text DEFAULT ''::text NOT NULL
);


ALTER TABLE public.actual_entries OWNER TO postgres;

--
-- Name: actual_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.actual_entries_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.actual_entries_id_seq OWNER TO postgres;

--
-- Name: actual_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.actual_entries_id_seq OWNED BY public.actual_entries.id;


--
-- Name: admin_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_config (
    id integer DEFAULT 1 NOT NULL,
    target_gross_margin numeric DEFAULT 40,
    target_direct_margin numeric DEFAULT 54,
    project_income_pct numeric DEFAULT 30,
    roles jsonb DEFAULT '[]'::jsonb,
    contract_types jsonb DEFAULT '[]'::jsonb,
    locations jsonb DEFAULT '[]'::jsonb,
    other_cost_cats jsonb DEFAULT '[]'::jsonb,
    cost_ref jsonb DEFAULT '{}'::jsonb,
    last_updated_roles text,
    last_updated_contracts text,
    last_updated_locations text,
    last_updated_other_cats text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT admin_config_id_check CHECK ((id = 1))
);


ALTER TABLE public.admin_config OWNER TO postgres;

--
-- Name: dcl_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.dcl_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    title text DEFAULT 'DCL'::text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT dcl_roles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text]))),
    CONSTRAINT dcl_roles_title_check CHECK ((title = ANY (ARRAY['DCL'::text, 'Vice DCL'::text])))
);


ALTER TABLE public.dcl_roles OWNER TO postgres;

--
-- Name: line_services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.line_services OWNER TO postgres;

--
-- Name: lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lines (
    id bigint NOT NULL,
    code text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lines OWNER TO postgres;

--
-- Name: lines_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lines_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lines_id_seq OWNER TO postgres;

--
-- Name: lines_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lines_id_seq OWNED BY public.lines.id;


--
-- Name: master_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.master_projects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    project_code text NOT NULL,
    project_name text NOT NULL,
    project_description text,
    start_date date,
    end_date date,
    project_type text,
    contract_type text,
    imported_at timestamp with time zone DEFAULT now() NOT NULL,
    project_manager text,
    imported_by_email text
);


ALTER TABLE public.master_projects OWNER TO postgres;

--
-- Name: pm_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pm_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pm_roles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


ALTER TABLE public.pm_roles OWNER TO postgres;

--
-- Name: pmo_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pmo_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT pmo_roles_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


ALTER TABLE public.pmo_roles OWNER TO postgres;

--
-- Name: projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.projects (
    id bigint NOT NULL,
    code text DEFAULT ''::text NOT NULL,
    name text DEFAULT ''::text NOT NULL,
    start_date text DEFAULT ''::text,
    end_date text DEFAULT ''::text,
    currency text DEFAULT 'USD'::text,
    status text DEFAULT 'active'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    line_id bigint,
    line_service_id uuid,
    created_by_name text,
    master_project_id uuid,
    created_by_email text
);


ALTER TABLE public.projects OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.projects_id_seq OWNER TO postgres;

--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: sm_role_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sm_role_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    line_service_id uuid NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT sm_role_assignments_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


ALTER TABLE public.sm_role_assignments OWNER TO postgres;

--
-- Name: system_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    username text,
    password_hash text,
    account_type text NOT NULL,
    is_pmo boolean DEFAULT false NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT system_users_account_type_check CHECK ((account_type = ANY (ARRAY['local'::text, 'sso'::text]))),
    CONSTRAINT system_users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text])))
);


ALTER TABLE public.system_users OWNER TO postgres;

--
-- Name: user_lines; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_lines (
    user_email text NOT NULL,
    line_id bigint NOT NULL
);


ALTER TABLE public.user_lines OWNER TO postgres;

--
-- Name: user_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_projects (
    user_email text NOT NULL,
    project_id bigint NOT NULL
);


ALTER TABLE public.user_projects OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    email text NOT NULL,
    display_name text DEFAULT ''::text NOT NULL,
    role text NOT NULL,
    active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash text,
    CONSTRAINT users_role_check CHECK ((role = ANY (ARRAY['pm'::text, 'sm'::text, 'pmo'::text, 'dcl'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.versions (
    id bigint NOT NULL,
    project_id bigint NOT NULL,
    type text DEFAULT 'bidding'::text NOT NULL,
    date text DEFAULT ''::text,
    note text DEFAULT ''::text,
    created_by text DEFAULT ''::text,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'draft'::text NOT NULL,
    submitted_at timestamp with time zone,
    approval_history jsonb DEFAULT '[]'::jsonb NOT NULL,
    current_rejection_comment text,
    sm_skipped boolean DEFAULT false NOT NULL
);


ALTER TABLE public.versions OWNER TO postgres;

--
-- Name: versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.versions_id_seq OWNER TO postgres;

--
-- Name: versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.versions_id_seq OWNED BY public.versions.id;


--
-- Name: actual_entries id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_entries ALTER COLUMN id SET DEFAULT nextval('public.actual_entries_id_seq'::regclass);


--
-- Name: lines id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lines ALTER COLUMN id SET DEFAULT nextval('public.lines_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.versions ALTER COLUMN id SET DEFAULT nextval('public.versions_id_seq'::regclass);


--
-- Data for Name: actual_entries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.actual_entries (id, project_id, tab, month, imported_at, file_name, selected_codes, offshore_actual_mm, onsite_actual_mm, actual_revenue, calendar_effort, rows, project_code) FROM stdin;
3	\N	prime	2026-03	2026-03-04	Test.xlsx	{JSCLCM}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP DLG AS", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "JSCLCM", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "SCSK-D", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-334.1467476472", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "334.1467476472", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	JSCLCM
4	\N	prime	2026-03	2026-03-04	Test.xlsx	{TATEMONO}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP DLG AS", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "TATEMONO", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "SCSK-D", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-264.283784771", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "264.283784771", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	TATEMONO
1	7	prime	2026-03	2026-03-04	Test.xlsx	{"FSOFT LM PROGRAM 2025"}	0	0	0.0000000000004547473508864641	38.1071428581	[{"EE": "1", "PL": "", "Sub PL": "", "Gross Margin": "0.3830465078458", "Gross Profit": "1149.1395235374", "Productivity": "3000", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "0.433574792452833", "Direct Profit": "1300.7243773585", "Project Group": "FHM", "Project Status": "On-going", "Calendar Effort": "1", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "1", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FHM FCT", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "6.7324145924", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "3000", "Direct Cost - Salary Expense": "1573.0756226415", "Indirect Cost - Sub Delivery Unit": "144.8524392287", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "126.2"}, {"EE": "1.02439024389245", "PL": "", "Sub PL": "", "Gross Margin": "0.127944459256352", "Gross Profit": "690.9000799843", "Productivity": "2765.8536585096", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "0.229665822261296", "Direct Profit": "1240.195440211", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "1.9523809524", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "2", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 PSI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "69.4665963005", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "5400", "Direct Cost - Salary Expense": "3815.2093216904", "Indirect Cost - Sub Delivery Unit": "479.8287639262", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "344.5952380986"}, {"EE": "-0.143589743585841", "PL": "", "Sub PL": "", "Gross Margin": "5.69447518283989", "Gross Profit": "-64349.8473561639", "Productivity": "-405.655384604359", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "5.22491321836663", "Direct Profit": "-59043.6093328303", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "27.8571428579", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "-4", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "991.169727719", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "-11300.4", "Direct Cost - Salary Expense": "44694.860285135", "Indirect Cost - Sub Delivery Unit": "4315.0682956146", "Direct Cost - Other Direct Expense": "-759.4414285946", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "3807.7904762899"}, {"EE": "1.1052631578482", "PL": "", "Sub PL": "", "Gross Margin": "0.479948791153703", "Gross Profit": "1392.0434738622", "Productivity": "3205.70526302292", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "0.506340590854744", "Direct Profit": "1468.5902497151", "Project Group": "IVS", "Project Status": "On-going", "Calendar Effort": "0.9047619048", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "1", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "IVS ERA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "22.4097114708", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "2900.4", "Direct Cost - Salary Expense": "1317.6287978991", "Indirect Cost - Sub Delivery Unit": "54.1370643821", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "114.1809523858"}, {"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-111.9534938181", "Productivity": "", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "", "Direct Profit": "-89.1052155146", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.107142857", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "16.5319557052", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "75.5837869612", "Indirect Cost - Sub Delivery Unit": "6.3163225983", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "13.5214285534"}, {"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-0.6226415094", "Productivity": "", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "", "Direct Profit": "-0.6226415094", "Project Group": "G0 IP", "Project Status": "On-going", "Calendar Effort": "", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "G0 IP ACE", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "0.6226415094", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}, {"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-10658.6700031588", "Productivity": "", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "", "Direct Profit": "-6621.0673227559", "Project Group": "LMP", "Project Status": "On-going", "Calendar Effort": "1.8571428572", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "LMP BizDev", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "4037.6026804029", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "6494.8673227508", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "-108.1714285736", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "234.3714285786"}, {"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-490.0188679245", "Productivity": "", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "", "Direct Profit": "-490.0188679245", "Project Group": "LMP", "Project Status": "On-going", "Calendar Effort": "", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "LMP BOD", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "490.0188679245", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}, {"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-26575.6632801744", "Productivity": "", "Project Code": "FSOFT LM Program 2025", "Direct Margin": "", "Direct Profit": "-15592.5191544877", "Project Group": "LMP", "Project Status": "On-going", "Calendar Effort": "4.4285714288", "Primary Customer": "DMO-BCC", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "LMP CoE", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "9628.1294688536", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "15012.4620115933", "Indirect Cost - Sub Delivery Unit": "1355.014656833", "Direct Cost - Other Direct Expense": "-151.2857142887", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "731.3428571832"}]	FSOFT LM PROGRAM 2025
14	\N	prime	2026-03	2026-03-04	Test.xlsx	{IPBM2}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP DMG G2", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "IPBM2", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "ISCUBE", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-964.4370570683", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "964.4370570683", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	IPBM2
17	\N	prime	2026-03	2026-03-04	Test.xlsx	{HKK}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP FA G5D1", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "HKK", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "THS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-253.6085130775", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "253.6085130775", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	HKK
23	\N	prime	2026-03	2026-03-04	Test.xlsx	{NIT_SMILE}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP IFS IS", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "NIT_SMILE", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "NissayIT", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-1091.2217797156", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "1091.2217797156", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	NIT_SMILE
24	\N	prime	2026-03	2026-03-04	Test.xlsx	{SPM}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP MDE ITX", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "SPM", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "TP-M", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-570.59473706", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "570.59473706", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	SPM
28	\N	prime	2026-03	2026-03-04	Test.xlsx	{ENECOM}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "ENECOM", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "Enecomu", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-117.1154463649", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "117.1154463649", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	ENECOM
36	\N	prime	2026-03	2026-03-04	Test.xlsx	{NGK.P7}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "NGK.P7", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "NGK", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-3421.5661984833", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "3421.5661984833", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	NGK.P7
40	\N	prime	2026-03	2026-03-04	Test.xlsx	{CTG_PY}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "CTG_Py", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "TOGIS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-244.359215462", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "244.359215462", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	CTG_PY
53	\N	prime	2026-03	2026-03-04	Test.xlsx	{HVN.EV2025}	0	0	0	0	[{"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "HVN.EV2025", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "HONDA-SAP", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-658.7218884694", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "658.7218884694", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	HVN.EV2025
52	\N	prime	2026-03	2026-03-04	Test.xlsx	{HD_AMS}	0	0	0	0	[{"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "HD_AMS", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "HONDA-SAP", "Project Category": "AMS Service", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-54.4018877702", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "54.4018877702", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	HD_AMS
56	\N	prime	2026-03	2026-03-04	Test.xlsx	{VHT2025}	0	0	0	0	[{"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "VHT2025", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "VHT", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-341.960304239", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "341.960304239", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	VHT2025
57	\N	prime	2026-03	2026-03-04	Test.xlsx	{VHTBDS01}	0	0	0	0	[{"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "", "Gross Profit": "0", "Productivity": "", "Project Code": "VHTBDS01", "Direct Margin": "", "Direct Profit": "0", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "VHT", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-484.729219606", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "484.729219606", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	VHTBDS01
2	\N	prime	2026-03	2026-03-04	Test.xlsx	{"STI 2025"}	0	0	0	0	[{"EE": "", "PL": "", "Sub PL": "", "Gross Margin": "", "Gross Profit": "-1216.7507395824", "Productivity": "", "Project Code": "STI 2025", "Direct Margin": "", "Direct Profit": "-1216.7507395824", "Project Group": "FPHI", "Project Status": "On-going", "Calendar Effort": "", "Primary Customer": "FSU-FI", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FPHI DEV", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "1216.7507395824", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	STI 2025
5	\N	prime	2026-03	2026-03-04	Test.xlsx	{KAIZENPROCESSODC}	3.5200000000000005	0	9807	2.2785714286000003	[{"EE": "2.28899999995422", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.621477966609714", "Gross Profit": "1887.4285845937", "Productivity": "6377.69999987245", "Project Code": "KaizenProcessODC", "Direct Margin": "0.651344586127363", "Direct Profit": "1978.1335080688", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "0.4761904762", "Primary Customer": "SCSK", "Project Category": "Other", "Billable MM / BMM": "1.09", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "16.9430722686", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "3037", "Direct Cost - Salary Expense": "1010.390301454", "Indirect Cost - Sub Delivery Unit": "73.7618512066", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "48.4761904772"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-899.0503696443", "Productivity": "", "Project Code": "KaizenProcessODC", "Direct Margin": "", "Direct Profit": "-611.380129717", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "0.3125", "Primary Customer": "SCSK", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "287.6702399273", "Project Department": "FJP DCC PMO", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "579.567629717", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "31.8125"}, {"EE": "1.92293923691438", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.77430802022319", "Gross Profit": "5242.065296911", "Productivity": "5357.32454070385", "Project Code": "KaizenProcessODC", "Direct Margin": "0.819351627534786", "Direct Profit": "5547.0105184105", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "1.2636904762", "Primary Customer": "SCSK", "Project Category": "Other", "Billable MM / BMM": "2.43", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "194.9852333846", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "6770", "Direct Cost - Salary Expense": "1094.3457911124", "Indirect Cost - Sub Delivery Unit": "109.9599881149", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "128.6436904772"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-401.1823630762", "Productivity": "", "Project Code": "KaizenProcessODC", "Direct Margin": "", "Direct Profit": "-343.4830754862", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2261904762", "Primary Customer": "SCSK", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "57.69928759", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "320.456885009", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "23.0261904772"}]	KAIZENPROCESSODC
6	\N	prime	2026-03	2026-03-04	Test.xlsx	{EXITIE}	17.43	0	45396	13.9002976194	[{"EE": "1.37864406775922", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.64583070746694", "Gross Profit": "29318.1307961692", "Productivity": "3590.64406769924", "Project Code": "ExitIE", "Direct Margin": "0.698879780475178", "Direct Profit": "31726.3465144512", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "12.6428571432", "Primary Customer": "SCSK-D", "Project Category": "Migration", "Billable MM / BMM": "17.43", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "449.838568734", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "45396", "Direct Cost - Salary Expense": "11766.3591873079", "Indirect Cost - Sub Delivery Unit": "1958.377149548", "Direct Cost - Other Direct Expense": "616.2514410631", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1287.0428571778"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-370.4965090215", "Productivity": "", "Project Code": "ExitIE", "Direct Margin": "", "Direct Profit": "-302.6271650943", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.28125", "Primary Customer": "SCSK-D", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "43.396383784", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "273.9959150943", "Indirect Cost - Sub Delivery Unit": "24.4729601432", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "28.63125"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-1348.4458612201", "Productivity": "", "Project Code": "ExitIE", "Direct Margin": "", "Direct Profit": "-1099.4278832081", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.9761904762", "Primary Customer": "SCSK-D", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "249.017978012", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "1000.0516927309", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "99.3761904772"}]	EXITIE
7	\N	prime	2026-03	2026-03-04	Test.xlsx	{MTLB}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-38.6037735849", "Productivity": "", "Project Code": "MTLB", "Direct Margin": "", "Direct Profit": "-38.6037735849", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "SCSK-I", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-1459.8703426396", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "1498.4741162245", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	MTLB
19	\N	prime	2026-03	2026-03-04	Test.xlsx	{"FINANCIAL DEVELOPMENT CENTER"}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP FSG CO", "Gross Margin": "", "Gross Profit": "-502.6143396226", "Productivity": "", "Project Code": "Financial Development Center", "Direct Margin": "", "Direct Profit": "-502.6143396226", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "SCSK-F", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "502.6143396226", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	FINANCIAL DEVELOPMENT CENTER
8	\N	prime	2026-03	2026-03-04	Test.xlsx	{PROACTIVE2025}	14.280000000000001	0	46259	15.4839285717	[{"EE": "1.00870292884835", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.383386567521813", "Gross Profit": "12512.2040176419", "Productivity": "2867.59832629744", "Project Code": "PROACTIVE2025", "Direct Margin": "0.449811609532464", "Direct Profit": "14680.0516887015", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "11.3809523812", "Primary Customer": "SCSK-PA", "Project Category": "Maintenance", "Billable MM / BMM": "11.48", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "404.9394272198", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "32636", "Direct Cost - Salary Expense": "16797.3673588923", "Indirect Cost - Sub Delivery Unit": "1762.9082438398", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1158.5809524062"}, {"EE": "0.681081081044266", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.0917250166477362", "Gross Profit": "186.3852338282", "Productivity": "2306.59459446991", "Project Code": "PROACTIVE2025", "Direct Margin": "0.117146523500049", "Direct Profit": "238.0417357521", "Project Group": "JES", "Project Status": "On-going", "Calendar Effort": "0.880952381", "Primary Customer": "SCSK-PA", "Project Category": "Maintenance", "Billable MM / BMM": "0.6", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "JES DJV", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "14.7201514173", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "2032", "Direct Cost - Salary Expense": "1704.2773118621", "Indirect Cost - Sub Delivery Unit": "36.9363505066", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "89.6809523858"}, {"EE": "1", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "-0.202534441962229", "Gross Profit": "-2347.5767167842", "Productivity": "5268.63636363636", "Project Code": "PROACTIVE2025", "Direct Margin": "0.0952689233458029", "Direct Profit": "1104.2620905012", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "2.2", "Primary Customer": "SCSK-PA", "Project Category": "Maintenance", "Billable MM / BMM": "2.2", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "2025.1984890881", "Project Department": "FJP DLG EM", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "11591", "Direct Cost - Salary Expense": "9606.7379094988", "Indirect Cost - Sub Delivery Unit": "1426.6403181973", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "880"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-24.2968664384", "Productivity": "", "Project Code": "PROACTIVE2025", "Direct Margin": "", "Direct Profit": "-18.9822299885", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0220238095", "Primary Customer": "SCSK-PA", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "3.3982353403", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "16.7402061814", "Indirect Cost - Sub Delivery Unit": "1.9164011097", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "2.2420238071"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-1416.4841910029", "Productivity": "", "Project Code": "PROACTIVE2025", "Direct Margin": "", "Direct Profit": "-1161.3926037736", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "1", "Primary Customer": "SCSK-PA", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "255.0915872293", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "1059.5926037736", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "101.8"}]	PROACTIVE2025
9	\N	prime	2026-03	2026-03-04	Test.xlsx	{C2J2023}	10	0	22579	5.3988095238	[{"EE": "1.97879858656125", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.686339351543323", "Gross Profit": "15496.8562184967", "Productivity": "4467.92932859665", "Project Code": "C2J2023", "Direct Margin": "0.72897215194928", "Direct Profit": "16459.4622188628", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "5.0535714286", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "10", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "179.8083544477", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "22579", "Direct Cost - Salary Expense": "1731.6991013032", "Indirect Cost - Sub Delivery Unit": "782.7976459184", "Direct Cost - Other Direct Expense": "3873.3851084025", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "514.4535714315"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-125.1720772437", "Productivity": "", "Project Code": "C2J2023", "Direct Margin": "", "Direct Profit": "-96.4443126299", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.119047619", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "18.3688396896", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "84.3252650157", "Indirect Cost - Sub Delivery Unit": "10.3589249242", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "12.1190476142"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-401.1823630762", "Productivity": "", "Project Code": "C2J2023", "Direct Margin": "", "Direct Profit": "-343.4830754862", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2261904762", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "57.69928759", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "320.456885009", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "23.0261904772"}]	C2J2023
10	\N	prime	2026-03	2026-03-04	Test.xlsx	{SST_EXIT_ORA}	16.94	0	45477	17.8001700682	[{"EE": "1.08700336697702", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.537586979556763", "Gross Profit": "15996.9757506706", "Productivity": "2805.37373730573", "Project Code": "SST_EXIT_ORA", "Direct Margin": "0.605485362136233", "Direct Profit": "18017.4279210879", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "10.6071428574", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "11.53", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "377.4069347842", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "29757", "Direct Cost - Salary Expense": "10413.0225858063", "Indirect Cost - Sub Delivery Unit": "1643.045235633", "Direct Cost - Other Direct Expense": "246.7423502225", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1079.8071428833"}, {"EE": "1.15225130885467", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "0.576466032858229", "Gross Profit": "7797.2795604404", "Productivity": "2974.30366480312", "Project Code": "SST_EXIT_ORA", "Direct Margin": "0.613645059621448", "Direct Profit": "8300.1630764397", "Project Group": "IVS", "Project Status": "On-going", "Calendar Effort": "4.5476190478", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "5.24", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "IVS ELI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "112.6382866031", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "13526", "Direct Cost - Salary Expense": "4666.6257324623", "Indirect Cost - Sub Delivery Unit": "390.2452293962", "Direct Cost - Other Direct Expense": "96.2635720319", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "462.947619066"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-457.6871158497", "Productivity": "", "Project Code": "SST_EXIT_ORA", "Direct Margin": "", "Direct Profit": "-457.6871158497", "Project Group": "FHO FWA", "Project Status": "On-going", "Calendar Effort": "0.6904761904", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FWA EC", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "417.6942587126", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "-30.2976190457", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "70.2904761827"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-5348.9084975097", "Productivity": "", "Project Code": "SST_EXIT_ORA", "Direct Margin": "", "Direct Profit": "-3779.8908578345", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "1", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "920.5447677673", "Project Department": "FJP DLG EM", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "3379.8908578345", "Indirect Cost - Sub Delivery Unit": "648.4728719079", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "400"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "1", "Gross Profit": "2194", "Productivity": "", "Project Code": "SST_EXIT_ORA", "Direct Margin": "1", "Direct Profit": "2194", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "0.17", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FJP DLG RD", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "2194", "Direct Cost - Salary Expense": "", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-518.1831120023", "Productivity": "", "Project Code": "SST_EXIT_ORA", "Direct Margin": "", "Direct Profit": "-386.1379938736", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.5471938776", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "84.4310596146", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "330.4336571339", "Indirect Cost - Sub Delivery Unit": "47.6140585141", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "55.7043367397"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG EM", "Gross Margin": "", "Gross Profit": "-464.9879082574", "Productivity": "", "Project Code": "SST_EXIT_ORA", "Direct Margin": "", "Direct Profit": "-360.97735043", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.407738095", "Primary Customer": "SST", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "104.0105578274", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "319.469612359", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "41.507738071"}]	SST_EXIT_ORA
11	\N	prime	2026-03	2026-03-04	Test.xlsx	{A2POS}	4.67	0	12158	2.2976190476	[{"EE": "2.39195121948886", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "0.711485903384496", "Gross Profit": "8650.2456133487", "Productivity": "6227.26829262217", "Project Code": "A2PoS", "Direct Margin": "0.742074008849564", "Direct Profit": "9022.135799593", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "1.9523809524", "Primary Customer": "ATOO", "Project Category": "Migration", "Billable MM / BMM": "4.67", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "69.4665963005", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "12158", "Direct Cost - Salary Expense": "2975.8927718334", "Indirect Cost - Sub Delivery Unit": "302.4235899438", "Direct Cost - Other Direct Expense": "-38.7809523807", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "198.7523809543"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-137.3581023717", "Productivity": "", "Project Code": "A2PoS", "Direct Margin": "", "Direct Profit": "-122.2760259434", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0625", "Primary Customer": "ATOO", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "9.6436408409", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "115.9135259434", "Indirect Cost - Sub Delivery Unit": "5.4384355874", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "6.3625"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-501.4779537565", "Productivity": "", "Project Code": "A2PoS", "Direct Margin": "", "Direct Profit": "-429.3538442818", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2827380952", "Primary Customer": "ATOO", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "72.1241094747", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "400.5711061904", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "28.7827380914"}]	A2POS
12	\N	prime	2026-03	2026-03-04	Test.xlsx	{RLIW_TC}	5.8	0	16526	5.5232738097	[{"EE": "1.11232876707758", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "0.538488237465866", "Gross Profit": "8899.0566123609", "Productivity": "3169.36986288345", "Project Code": "RLIW_TC", "Direct Margin": "0.59858861941393", "Direct Profit": "9892.2755244346", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "5.2142857145", "Primary Customer": "RLC", "Project Category": "Development", "Billable MM / BMM": "5.8", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "185.5266413449", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "16526", "Direct Cost - Salary Expense": "6157.4459041187", "Indirect Cost - Sub Delivery Unit": "807.6922707288", "Direct Cost - Other Direct Expense": "-54.5357142894", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "530.8142857361"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-323.2782053941", "Productivity": "", "Project Code": "RLIW_TC", "Direct Margin": "", "Direct Profit": "-271.6975040094", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.21375", "Primary Customer": "RLC", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "32.9812516759", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "249.9377540094", "Indirect Cost - Sub Delivery Unit": "18.5994497088", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "21.75975"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-119.3107530936", "Productivity": "", "Project Code": "RLIW_TC", "Direct Margin": "", "Direct Profit": "-95.0163162243", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.0952380952", "Primary Customer": "RLC", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "24.2944368693", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "85.321078133", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "9.6952380914"}]	RLIW_TC
27	\N	prime	2026-03	2026-03-04	Test.xlsx	{DELTAX}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-38.6037735849", "Productivity": "", "Project Code": "DELTAX", "Direct Margin": "", "Direct Profit": "-38.6037735849", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "DTK", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "38.6037735849", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	DELTAX
13	\N	prime	2026-03	2026-03-04	Test.xlsx	{AIMLOT2}	1.3800000000000001	0	6037	1.2916666665999998	[{"EE": "1.30983050843906", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "0.525427701638767", "Gross Profit": "1311.992970992", "Productivity": "3555.05084736122", "Project Code": "AIMLOT2", "Direct Margin": "0.579007902730797", "Direct Profit": "1445.7827331188", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "0.7023809524", "Primary Customer": "YSD", "Project Category": "Migration", "Billable MM / BMM": "0.92", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "24.9910315963", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "2497", "Direct Cost - Salary Expense": "979.7148859269", "Indirect Cost - Sub Delivery Unit": "108.7987305304", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "71.5023809543"}, {"EE": "1.050000000175", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "0.249757364263827", "Gross Profit": "345.9139495054", "Productivity": "8079.16666801319", "Project Code": "AIMLOT2", "Direct Margin": "0.36369792343213", "Direct Profit": "503.7216239535", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "0.1714285714", "Primary Customer": "YSD", "Project Category": "Migration", "Billable MM / BMM": "0.18", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "157.8076744481", "Project Department": "FJP DCC DC", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "1385", "Direct Cost - Salary Expense": "812.7069474865", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "68.57142856"}, {"EE": "1.08888888907037", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "0.116931212605012", "Gross Profit": "251.9867631638", "Productivity": "8380.55555695231", "Project Code": "AIMLOT2", "Direct Margin": "0.351015121965197", "Direct Profit": "756.437587835", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "0.2571428571", "Primary Customer": "YSD", "Project Category": "Migration", "Billable MM / BMM": "0.28", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "236.7115116721", "Project Department": "FJP DLG RD", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "2155", "Direct Cost - Salary Expense": "1295.705269325", "Indirect Cost - Sub Delivery Unit": "267.739312999", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "102.85714284"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-92.010112055", "Productivity": "", "Project Code": "AIMLOT2", "Direct Margin": "", "Direct Profit": "-79.0826179667", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0535714286", "Primary Customer": "YSD", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "8.265977868", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "73.6290465352", "Indirect Cost - Sub Delivery Unit": "4.6615162202", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "5.4535714315"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP DLG RD", "Gross Margin": "", "Gross Profit": "-130.8362549136", "Productivity": "", "Project Code": "AIMLOT2", "Direct Margin": "", "Direct Profit": "-103.5050134357", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.1071428571", "Primary Customer": "YSD", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "27.3312414779", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "92.5978705829", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "10.9071428528"}]	AIMLOT2
15	6	prime	2026-03	2026-03-04	Test.xlsx	{BSD}	6	0	23407	5.363095238	[{"EE": "", "PL": "FJP", "Sub PL": "FJP FA G1D", "Gross Margin": "", "Gross Profit": "-550.4305656193", "Productivity": "", "Project Code": "BSD", "Direct Margin": "", "Direct Profit": "-459.358562453", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "0.4761904762", "Primary Customer": "HONDAM", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 CSM", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "16.9430722686", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "410.8823719759", "Indirect Cost - Sub Delivery Unit": "74.1289308977", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "48.4761904772"}, {"EE": "1.32492113565003", "PL": "FJP", "Sub PL": "FJP FA G1D", "Gross Margin": "0.577352156689279", "Gross Profit": "10161.975309888", "Productivity": "4663.98738171524", "Project Code": "BSD", "Direct Margin": "0.618192820204096", "Direct Profit": "10880.8118284123", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "3.7738095238", "Primary Customer": "HONDAM", "Project Category": "Development", "Billable MM / BMM": "5", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "134.2738477255", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "17601", "Direct Cost - Salary Expense": "6420.6134096842", "Indirect Cost - Sub Delivery Unit": "584.5626707988", "Direct Cost - Other Direct Expense": "-176.68", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "476.2547619036"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FA G1D", "Gross Margin": "1", "Gross Profit": "5806", "Productivity": "", "Project Code": "BSD", "Direct Margin": "1", "Direct Profit": "5806", "Project Group": "FA", "Project Status": "On-going", "Calendar Effort": "", "Primary Customer": "HONDAM", "Project Category": "Development", "Billable MM / BMM": "1", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FA ACE", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "5806", "Direct Cost - Salary Expense": "", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FA G1D", "Gross Margin": "", "Gross Profit": "-2489.698936151", "Productivity": "", "Project Code": "BSD", "Direct Margin": "", "Direct Profit": "-2003.5396603774", "Project Group": "FA", "Project Status": "On-going", "Calendar Effort": "1", "Primary Customer": "HONDAM", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FA AI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "1927.6396603774", "Indirect Cost - Sub Delivery Unit": "486.1592757736", "Direct Cost - Other Direct Expense": "-75.9", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "151.8"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FA G1D", "Gross Margin": "", "Gross Profit": "-139.1124554049", "Productivity": "", "Project Code": "BSD", "Direct Margin": "", "Direct Profit": "-114.9948282949", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.113095238", "Primary Customer": "HONDAM", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "17.4503976974", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "100.7222092593", "Indirect Cost - Sub Delivery Unit": "6.6672294126", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "14.2726190356"}]	BSD
16	8	prime	2026-03	2026-03-04	Test.xlsx	{TSASM}	7.07	0	22413	3.8984227872	[{"EE": "1.9281818181117", "PL": "FJP", "Sub PL": "FJP FA G5D1", "Gross Margin": "0.731061067919007", "Gross Profit": "16385.2717152687", "Productivity": "6112.63636341409", "Project Code": "TSASM", "Direct Margin": "0.76222280043005", "Direct Profit": "17083.6996260387", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "3.6666666668", "Primary Customer": "TCS", "Project Category": "Migration", "Billable MM / BMM": "7.07", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "130.4616564702", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "22413", "Direct Cost - Salary Expense": "4866.5670406112", "Indirect Cost - Sub Delivery Unit": "567.9662542998", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "462.7333333502"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FA G5D1", "Gross Margin": "", "Gross Profit": "-220.7707174152", "Productivity": "", "Project Code": "TSASM", "Direct Margin": "", "Direct Profit": "-194.8315389066", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1216370729", "Primary Customer": "TCS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "18.7683879038", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "179.4809403066", "Indirect Cost - Sub Delivery Unit": "7.1707906048", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "15.3505986"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FA G5D1", "Gross Margin": "", "Gross Profit": "-169.3124696371", "Productivity": "", "Project Code": "TSASM", "Direct Margin": "", "Direct Profit": "-141.2220270261", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.1101190475", "Primary Customer": "TCS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS HN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "28.090442611", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "127.3250032316", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "13.8970237945"}]	TSASM
18	\N	prime	2026-03	2026-03-04	Test.xlsx	{CLAB_M}	4.15	0	10959	3.4285714286	[{"EE": "1.23289124667389", "PL": "FJP", "Sub PL": "FJP FAI ABC", "Gross Margin": "0.575551182918387", "Gross Profit": "6307.4654136026", "Productivity": "3255.7241379034", "Project Code": "CLAB_M", "Direct Margin": "0.634057472525787", "Direct Profit": "6948.6358414101", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "3.3660714286", "Primary Customer": "TOGIS", "Project Category": "Maintenance", "Billable MM / BMM": "4.15", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "119.7663420971", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "10959", "Direct Cost - Salary Expense": "3667.6980871584", "Indirect Cost - Sub Delivery Unit": "521.4040857103", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "342.6660714315"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FAI ABC", "Gross Margin": "", "Gross Profit": "-62.5860386218", "Productivity": "", "Project Code": "CLAB_M", "Direct Margin": "", "Direct Profit": "-48.2221563149", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0595238095", "Primary Customer": "TOGIS", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "9.1844198448", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "42.1626325078", "Indirect Cost - Sub Delivery Unit": "5.1794624621", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "6.0595238071"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FAI ABC", "Gross Margin": "", "Gross Profit": "-4.6305347474", "Productivity": "", "Project Code": "CLAB_M", "Direct Margin": "", "Direct Profit": "-3.8713335889", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.0029761905", "Primary Customer": "TOGIS", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "0.7592011585", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "3.568357396", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "0.3029761929"}]	CLAB_M
20	\N	prime	2026-03	2026-03-04	Test.xlsx	{TAKUHAI}	6.52	0	16729	6.4747023811	[{"EE": "1.10866396758351", "PL": "FJP", "Sub PL": "FJP FSG CO", "Gross Margin": "0.52049751035839", "Gross Profit": "8707.4028507855", "Productivity": "2844.60728737799", "Project Code": "TAKUHAI", "Direct Margin": "0.58745942110761", "Direct Profit": "9827.6086557092", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "5.8809523811", "Primary Customer": "SCSK-F", "Project Category": "Development", "Billable MM / BMM": "6.52", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "209.246942518", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "16729", "Direct Cost - Salary Expense": "6302.7103918948", "Indirect Cost - Sub Delivery Unit": "910.9588624056", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "598.680952396"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FSG CO", "Gross Margin": "", "Gross Profit": "-123.4988363405", "Productivity": "", "Project Code": "TAKUHAI", "Direct Margin": "", "Direct Profit": "-100.8757216981", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.09375", "Primary Customer": "SCSK-F", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "14.4654612613", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "91.3319716981", "Indirect Cost - Sub Delivery Unit": "8.1576533811", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "9.54375"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP FSG CO", "Gross Margin": "", "Gross Profit": "-751.8920955014", "Productivity": "", "Project Code": "TAKUHAI", "Direct Margin": "", "Direct Profit": "-624.3463018868", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.5", "Primary Customer": "SCSK-F", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "127.5457936146", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "573.4463018868", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "50.9"}]	TAKUHAI
21	\N	prime	2026-03	2026-03-04	Test.xlsx	{NECES}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP FSG CX", "Gross Margin": "", "Gross Profit": "-19.3018867925", "Productivity": "", "Project Code": "NECES", "Direct Margin": "", "Direct Profit": "-19.3018867925", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "NES-JP", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "19.3018867925", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	NECES
22	\N	prime	2026-03	2026-03-04	Test.xlsx	{NISSAYITNOTESMIGRATION}	40.8	0	91471	32.5892857146	[{"EE": "1.27003891049398", "PL": "FJP", "Sub PL": "FJP IFS IS", "Gross Margin": "0.663971456476012", "Gross Profit": "60734.1330953173", "Productivity": "2847.34630347536", "Project Code": "NissayITNotesMigration", "Direct Margin": "0.730868952948951", "Direct Profit": "66853.3139951935", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "32.1250000003", "Primary Customer": "NissayIT", "Project Category": "Migration", "Billable MM / BMM": "40.8", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "1143.0220129069", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "91471", "Direct Cost - Salary Expense": "21550.5916940533", "Indirect Cost - Sub Delivery Unit": "4976.1588869693", "Direct Cost - Other Direct Expense": "-987.0806892847", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "4054.1750000379"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP IFS IS", "Gross Margin": "", "Gross Profit": "-278.2249110558", "Productivity": "", "Project Code": "NissayITNotesMigration", "Direct Margin": "", "Direct Profit": "-229.9896567932", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.2261904762", "Primary Customer": "NissayIT", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "34.9007954257", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "201.4444186967", "Indirect Cost - Sub Delivery Unit": "13.334458837", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "28.5452380964"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP IFS IS", "Gross Margin": "", "Gross Profit": "-656.3877993085", "Productivity": "", "Project Code": "NissayITNotesMigration", "Direct Margin": "", "Direct Profit": "-595.6517071098", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2380952381", "Primary Customer": "NissayIT", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS HN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "60.7360921987", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "565.6040880616", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "30.0476190482"}]	NISSAYITNOTESMIGRATION
25	\N	prime	2026-03	2026-03-04	Test.xlsx	{DSLPOC}	2.75	0	7106	2.5565476191	[{"EE": "1.07566938298145", "PL": "FJP", "Sub PL": "FJP NVI IS", "Gross Margin": "0.505764650162876", "Gross Profit": "3593.9636040574", "Productivity": "2779.52968562408", "Project Code": "dSLPOC", "Direct Margin": "0.574294351528961", "Direct Profit": "4080.9356619648", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "2.5565476191", "Primary Customer": "IBMJ-U", "Project Category": "Migration", "Billable MM / BMM": "2.75", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "90.963119242", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "7106", "Direct Cost - Salary Expense": "2798.5804094566", "Indirect Cost - Sub Delivery Unit": "396.0089386654", "Direct Cost - Other Direct Expense": "-96.1523809518", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "322.6363095304"}]	DSLPOC
26	\N	prime	2026-03	2026-03-04	Test.xlsx	{DELTAXI}	10.08	0	27080	9.3869047619	[{"EE": "1.04", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "0.401866793177825", "Gross Profit": "236.9728106011", "Productivity": "4717.44", "Project Code": "DELTAXI", "Direct Margin": "0.448693351110772", "Direct Profit": "264.585495283", "Project Group": "FHM", "Project Status": "On-going", "Calendar Effort": "0.125", "Primary Customer": "DTK", "Project Category": "Migration", "Billable MM / BMM": "0.13", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FHM QAI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "0.8415518241", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "589.68", "Direct Cost - Salary Expense": "309.319504717", "Indirect Cost - Sub Delivery Unit": "26.7711328579", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "15.775"}, {"EE": "1.15203308062134", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "0.61014590863164", "Gross Profit": "16162.9603663429", "Productivity": "3067.10803580353", "Project Code": "DELTAXI", "Direct Margin": "0.672250124417463", "Direct Profit": "17808.1209158584", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "8.636904762", "Primary Customer": "DTK", "Project Category": "Migration", "Billable MM / BMM": "9.95", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "307.3049732686", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "26490.32", "Direct Cost - Salary Expense": "7653.4437269843", "Indirect Cost - Sub Delivery Unit": "1337.8555762469", "Direct Cost - Other Direct Expense": "-61.2220238071", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1089.9773809644"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-195.062583328", "Productivity": "", "Project Code": "DELTAXI", "Direct Margin": "", "Direct Profit": "-163.3288634217", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1488095238", "Primary Customer": "DTK", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "22.9610496197", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "144.5491015182", "Indirect Cost - Sub Delivery Unit": "8.7726702865", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "18.7797619036"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-1210.8543000892", "Productivity": "", "Project Code": "DELTAXI", "Direct Margin": "", "Direct Profit": "-1089.3821157174", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.4761904761", "Primary Customer": "DTK", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS HN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "121.4721843718", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "1029.2868776336", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "60.0952380838"}]	DELTAXI
29	\N	prime	2026-03	2026-03-04	Test.xlsx	{MCCNMPH3}	17.59	0	56598	17.4523809528	[{"EE": "1.06222861248486", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "0.564137847773414", "Gross Profit": "31929.0739082797", "Productivity": "3417.8519050266", "Project Code": "MCCNMPH3", "Direct Margin": "0.619868857947917", "Direct Profit": "35083.3376221362", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "16.5595238099", "Primary Customer": "MCSY", "Project Category": "Migration", "Billable MM / BMM": "17.59", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "589.1953381415", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "56598", "Direct Cost - Salary Expense": "19487.9504730545", "Indirect Cost - Sub Delivery Unit": "2565.068375715", "Direct Cost - Other Direct Expense": "-63.1", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "2089.8119048094"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-546.1752333969", "Productivity": "", "Project Code": "MCCNMPH3", "Direct Margin": "", "Direct Profit": "-457.3208176466", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.4166666667", "Primary Customer": "MCSY", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "64.2909389445", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "404.7374843091", "Indirect Cost - Sub Delivery Unit": "24.5634768059", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "52.5833333375"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-905.0904054372", "Productivity": "", "Project Code": "MCCNMPH3", "Direct Margin": "", "Direct Profit": "-783.6182210399", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.4761904762", "Primary Customer": "MCSY", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS HN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "121.4721843973", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "723.5229829435", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "60.0952380964"}]	MCCNMPH3
30	\N	prime	2026-03	2026-03-04	Test.xlsx	{SPAD}	0.8	0	2348	0.78125	[{"EE": "1.1199999999776", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "0.664512678199787", "Gross Profit": "1560.2757684131", "Productivity": "3287.19999993426", "Project Code": "SPAD", "Direct Margin": "0.72245875367368", "Direct Profit": "1696.3331536258", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "0.7142857143", "Primary Customer": "SCSK-O", "Project Category": "Development", "Billable MM / BMM": "0.8", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "25.4146084029", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "2348", "Direct Cost - Salary Expense": "561.5239892296", "Indirect Cost - Sub Delivery Unit": "110.6427768098", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "90.1428571447"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI MS", "Gross Margin": "", "Gross Profit": "-87.7781624845", "Productivity": "", "Project Code": "SPAD", "Direct Margin": "", "Direct Profit": "-73.4979885288", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0669642857", "Primary Customer": "SCSK-O", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "10.3324723273", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "65.0470956735", "Indirect Cost - Sub Delivery Unit": "3.9477016284", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "8.4508928553"}]	SPAD
31	\N	prime	2026-03	2026-03-04	Test.xlsx	{HIKARICOLABO}	4.75	0	18629	4.564484127	[{"EE": "1.24260355031939", "PL": "FJP", "Sub PL": "FJP NVI TS", "Gross Margin": "0.380567716420456", "Gross Profit": "4143.2407286695", "Productivity": "3607.52662728724", "Project Code": "HIKARICOLABO", "Direct Margin": "0.433368529546321", "Direct Profit": "4718.0831811708", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "3.0178571428", "Primary Customer": "SCSK-I", "Project Category": "Development", "Billable MM / BMM": "3.75", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "107.3767204979", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "10887", "Direct Cost - Salary Expense": "5861.6989616922", "Indirect Cost - Sub Delivery Unit": "467.4657320034", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "307.217857137"}, {"EE": "1", "PL": "FJP", "Sub PL": "FJP NVI TS", "Gross Margin": "0.273199672881336", "Gross Profit": "2115.1118674473", "Productivity": "7742", "Project Code": "HIKARICOLABO", "Direct Margin": "0.484168818578055", "Direct Profit": "3748.4349934313", "Project Group": "FJP", "Project Status": "On-going", "Calendar Effort": "1", "Primary Customer": "SCSK-I", "Project Category": "Development", "Billable MM / BMM": "1", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "920.5447677673", "Project Department": "FJP NVI TS", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "7742", "Direct Cost - Salary Expense": "3983.3850065687", "Indirect Cost - Sub Delivery Unit": "712.7783582166", "Direct Cost - Other Direct Expense": "-91.62", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "101.8"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI TS", "Gross Margin": "", "Gross Profit": "-121.4843321919", "Productivity": "", "Project Code": "HIKARICOLABO", "Direct Margin": "", "Direct Profit": "-94.9111499423", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1101190475", "Primary Customer": "SCSK-I", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "16.9911767013", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "83.7010309068", "Indirect Cost - Sub Delivery Unit": "9.5820055483", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "11.2101190355"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI TS", "Gross Margin": "", "Gross Profit": "-659.9362711459", "Productivity": "", "Project Code": "HIKARICOLABO", "Direct Margin": "", "Direct Profit": "-548.5867687349", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.4365079367", "Primary Customer": "SCSK-I", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "111.349502411", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "504.1502607789", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "44.4365079561"}]	HIKARICOLABO
32	\N	prime	2026-03	2026-03-04	Test.xlsx	{CEPC_LP}	11.25	0	31358	10.6917517008	[{"EE": "1.0582306830561", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.657255017740828", "Gross Profit": "20610.2028463169", "Productivity": "2949.68868971318", "Project Code": "CEPC_LP", "Direct Margin": "0.721831438960555", "Direct Profit": "22635.1902629251", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "10.6309523813", "Primary Customer": "CEPC", "Project Category": "Development", "Billable MM / BMM": "11.25", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "378.2540884008", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "31358", "Direct Cost - Salary Expense": "7640.5787846586", "Indirect Cost - Sub Delivery Unit": "1646.7333282073", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1082.2309524163"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-57.5759011127", "Productivity": "", "Project Code": "CEPC_LP", "Direct Margin": "", "Direct Profit": "-42.9042213769", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0607993195", "Primary Customer": "CEPC", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "9.3812288101", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "36.7148506518", "Indirect Cost - Sub Delivery Unit": "5.2904509257", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "6.1893707251"}]	CEPC_LP
33	\N	prime	2026-03	2026-03-04	Test.xlsx	{MEP}	3.02	0	9144	2.7523809524	[{"EE": "1.29428571424873", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.508711538685991", "Gross Profit": "4651.6583097447", "Productivity": "3918.85714274518", "Project Code": "MEP", "Direct Margin": "0.557317632849595", "Direct Profit": "5096.1124347767", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "2.3333333334", "Primary Customer": "CEPC", "Project Category": "Maintenance", "Billable MM / BMM": "3.02", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "83.0210541168", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "9144", "Direct Cost - Salary Expense": "3733.7032417179", "Indirect Cost - Sub Delivery Unit": "361.4330709152", "Direct Cost - Other Direct Expense": "76.6509901653", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "237.5333333401"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-204.4669154869", "Productivity": "", "Project Code": "MEP", "Direct Margin": "", "Direct Profit": "-175.7391508731", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.119047619", "Primary Customer": "CEPC", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "18.3688396896", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "163.6201032589", "Indirect Cost - Sub Delivery Unit": "10.3589249242", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "12.1190476142"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-366.3415139046", "Productivity": "", "Project Code": "MEP", "Direct Margin": "", "Direct Profit": "-289.8140377358", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.3", "Primary Customer": "CEPC", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "76.5274761688", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "259.2740377358", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "30.54"}]	MEP
34	\N	prime	2026-03	2026-03-04	Test.xlsx	{SMALLPO2026}	4.5	0	11180	4.4787799301	[{"EE": "1.03278688523236", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.312626603824222", "Gross Profit": "3495.1654307548", "Productivity": "2565.90163931061", "Project Code": "SmallPO2026", "Direct Margin": "0.386861849780555", "Direct Profit": "4325.1154805466", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "4.3571428572", "Primary Customer": "KYU-DS", "Project Category": "Other", "Billable MM / BMM": "4.5", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "155.0291112564", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "11180", "Direct Cost - Salary Expense": "6532.1730908748", "Indirect Cost - Sub Delivery Unit": "674.9209385354", "Direct Cost - Other Direct Expense": "-227.16", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "549.8714285786"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-220.7707174152", "Productivity": "", "Project Code": "SmallPO2026", "Direct Margin": "", "Direct Profit": "-194.8315389066", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1216370729", "Primary Customer": "KYU-DS", "Project Category": "Other", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "18.7683879038", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "179.4809403066", "Indirect Cost - Sub Delivery Unit": "7.1707906048", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "15.3505986"}]	SMALLPO2026
35	\N	prime	2026-03	2026-03-04	Test.xlsx	{MCOR_MMDSDAMAI}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-80.2679245283", "Productivity": "", "Project Code": "MCOR_MMDSDamai", "Direct Margin": "", "Direct Profit": "-80.2679245283", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "MCOR", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-150.1733932546", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "230.4413177829", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	MCOR_MMDSDAMAI
37	\N	prime	2026-03	2026-03-04	Test.xlsx	{NGK-WARRANTY-P1}	1.5	0	3387	0.6256473634	[{"EE": "2.51999999973792", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.466233041564098", "Gross Profit": "1579.1313117776", "Productivity": "5690.15999940822", "Project Code": "NGK-Warranty-P1", "Direct Margin": "0.499708434051078", "Direct Profit": "1692.512466131", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "0.5952380953", "Primary Customer": "NGK", "Project Category": "Maintenance", "Billable MM / BMM": "1.5", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "21.1788403375", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "3387", "Direct Cost - Salary Expense": "1400.0768709925", "Indirect Cost - Sub Delivery Unit": "92.2023140159", "Direct Cost - Other Direct Expense": "219.2916152496", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "75.1190476269"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-55.1926791269", "Productivity": "", "Project Code": "NGK-Warranty-P1", "Direct Margin": "", "Direct Profit": "-48.7078845264", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0304092681", "Primary Customer": "NGK", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "4.6920969567", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "44.8702348922", "Indirect Cost - Sub Delivery Unit": "1.7926976438", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "3.8376496342"}]	NGK-WARRANTY-P1
38	\N	prime	2026-03	2026-03-04	Test.xlsx	{STNC2SQL}	1.15	0	3729	1.074404762	[{"EE": "1.08539325834892", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.517414951512202", "Gross Profit": "1929.440354189", "Productivity": "3519.50561772444", "Project Code": "STNC2SQL", "Direct Margin": "0.571536285581041", "Direct Profit": "2131.2588089317", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "1.0595238096", "Primary Customer": "STNet", "Project Category": "Migration", "Billable MM / BMM": "1.15", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "37.6983357995", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "3729", "Direct Cost - Salary Expense": "1485.8138101102", "Indirect Cost - Sub Delivery Unit": "164.1201189431", "Direct Cost - Other Direct Expense": "-21.7845238134", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "133.7119047715"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-27.0088588852", "Productivity": "", "Project Code": "STNC2SQL", "Direct Margin": "", "Direct Profit": "-23.8354868903", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0148809524", "Primary Customer": "STNet", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "2.2961049651", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "21.9575106975", "Indirect Cost - Sub Delivery Unit": "0.8772670298", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1.8779761929"}]	STNC2SQL
39	\N	prime	2026-03	2026-03-04	Test.xlsx	{STNET89}	0	0	0	0	[{"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-38.6037735849", "Productivity": "", "Project Code": "STNet89", "Direct Margin": "", "Direct Profit": "-38.6037735849", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "STNet", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "38.6037735849", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	STNET89
41	\N	prime	2026-03	2026-03-04	Test.xlsx	{TOGIS_OSVU}	5.48	0	13638	4.9910714285	[{"EE": "1.24410810809735", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.435872490254275", "Gross Profit": "5944.4290220878", "Productivity": "3096.19459456782", "Project Code": "TOGIS_OSVU", "Direct Margin": "0.49739328084934", "Direct Profit": "6783.4495642233", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "4.4047619048", "Primary Customer": "TOGIS", "Project Category": "Migration", "Billable MM / BMM": "5.48", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "156.7234184826", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "13638", "Direct Cost - Salary Expense": "6406.145673868", "Indirect Cost - Sub Delivery Unit": "682.2971236529", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "448.4047619086"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-121.4843321919", "Productivity": "", "Project Code": "TOGIS_OSVU", "Direct Margin": "", "Direct Profit": "-94.9111499423", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1101190475", "Primary Customer": "TOGIS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "16.9911767013", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "83.7010309068", "Indirect Cost - Sub Delivery Unit": "9.5820055483", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "11.2101190355"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-581.4944665269", "Productivity": "", "Project Code": "TOGIS_OSVU", "Direct Margin": "", "Direct Profit": "-460.0222821296", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.4761904762", "Primary Customer": "TOGIS", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "121.4721843973", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "411.5460916524", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "48.4761904772"}]	TOGIS_OSVU
42	\N	prime	2026-03	2026-03-04	Test.xlsx	{BIZNEX2}	9.48	0	21407	7.348214286	[{"EE": "1.47671766336227", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "0.589641748240197", "Gross Profit": "12622.4609045779", "Productivity": "3334.60917928229", "Project Code": "BIZNEX2", "Direct Margin": "0.646763986275592", "Direct Profit": "13845.2766542016", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "6.4196428574", "Primary Customer": "TOHOGAS", "Project Category": "Maintenance", "Billable MM / BMM": "9.48", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "228.4137930254", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "21407", "Direct Cost - Salary Expense": "6908.2037029151", "Indirect Cost - Sub Delivery Unit": "994.4019565983", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "653.5196428833"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-250.3441545925", "Productivity": "", "Project Code": "BIZNEX2", "Direct Margin": "", "Direct Profit": "-192.8886253408", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.2380952381", "Primary Customer": "TOHOGAS", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "36.7376793946", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "168.6505301022", "Indirect Cost - Sub Delivery Unit": "20.7178498571", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "24.2380952386"}, {"EE": "", "PL": "FJP", "Sub PL": "FJP NVI US", "Gross Margin": "", "Gross Profit": "-735.3099683855", "Productivity": "", "Project Code": "BIZNEX2", "Direct Margin": "", "Direct Profit": "-559.1753010068", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.6904761905", "Primary Customer": "TOHOGAS", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "176.1346673787", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "488.8848248139", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "70.2904761929"}]	BIZNEX2
43	\N	prime	2026-03	2026-03-04	Test.xlsx	{"PET MYAPPROVAL"}	9.37	0	30195	1.0238095238	[{"EE": "9.15209302334095", "PL": "FMI", "Sub PL": "FMI DT", "Gross Margin": "0.935853111066372", "Gross Profit": "28258.0846886491", "Productivity": "29492.7906979488", "Project Code": "PET myApproval", "Direct Margin": "0.942311650078321", "Direct Profit": "28453.1002741149", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "1.0238095238", "Primary Customer": "PET-ICT", "Project Category": "Development", "Billable MM / BMM": "9.37", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "36.4276053764", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "30195", "Direct Cost - Salary Expense": "1617.2021068369", "Indirect Cost - Sub Delivery Unit": "158.5879800895", "Direct Cost - Other Direct Expense": "-4.5071428553", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "129.2047619036"}]	PET MYAPPROVAL
44	\N	prime	2026-03	2026-03-04	Test.xlsx	{PETOSD}	3.01	0	9793	2.8511904764000002	[{"EE": "1.11383259902866", "PL": "FMI", "Sub PL": "FMI DT", "Gross Margin": "0.609040295814367", "Gross Profit": "5964.3316169101", "Productivity": "3623.84140939789", "Project Code": "PETOSD", "Direct Margin": "0.661603396064832", "Direct Profit": "6479.0820576629", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "2.7023809526", "Primary Customer": "PET-ICT", "Project Category": "Development", "Billable MM / BMM": "3.01", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "96.1519351301", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "9793", "Direct Cost - Salary Expense": "2984.1453232636", "Indirect Cost - Sub Delivery Unit": "418.5985056228", "Direct Cost - Other Direct Expense": "-11.2678571447", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "341.0404762181"}, {"EE": "", "PL": "FMI", "Sub PL": "FMI DT", "Gross Margin": "", "Gross Profit": "-195.062583328", "Productivity": "", "Project Code": "PETOSD", "Direct Margin": "", "Direct Profit": "-163.3288634217", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.1488095238", "Primary Customer": "PET-ICT", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "22.9610496197", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "144.5491015182", "Indirect Cost - Sub Delivery Unit": "8.7726702865", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "18.7797619036"}]	PETOSD
45	\N	prime	2026-03	2026-03-04	Test.xlsx	{IBSMAINFRAME}	0	0	0	0	[{"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-57.9056603774", "Productivity": "", "Project Code": "IBSMainFrame", "Direct Margin": "", "Direct Profit": "-57.9056603774", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "IBMJ", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "-33752.9750252184", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "33810.8806855957", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	IBSMAINFRAME
46	\N	prime	2026-03	2026-03-04	Test.xlsx	{IBSMAINFRAME2026}	26	0	62110	24.062500000900002	[{"EE": "1.18534599723354", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "0.519111882071813", "Gross Profit": "32242.0389954803", "Productivity": "2831.60922646828", "Project Code": "IBSMainframe2026", "Direct Margin": "0.586381171037775", "Direct Profit": "36420.1345331562", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "21.9345238105", "Primary Customer": "IBMJ", "Project Category": "Migration", "Billable MM / BMM": "26", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "780.4402663906", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "62110", "Direct Cost - Salary Expense": "23482.3809429349", "Indirect Cost - Sub Delivery Unit": "3397.6552712853", "Direct Cost - Other Direct Expense": "-25.45", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "2232.9345239089"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-149.0259838461", "Productivity": "", "Project Code": "IBSMainframe2026", "Direct Margin": "", "Direct Profit": "-149.0259838461", "Project Group": "FHO FWA", "Project Status": "On-going", "Calendar Effort": "0.1904761905", "Primary Customer": "IBMJ", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FWA EC", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "139.3307457497", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "-9.6952380965", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "19.3904761929"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-707.9265376833", "Productivity": "", "Project Code": "IBSMainframe2026", "Direct Margin": "", "Direct Profit": "-606.6611673896", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.4196428571", "Primary Customer": "IBMJ", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "64.7501599251", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "563.9415245368", "Indirect Cost - Sub Delivery Unit": "36.5152103686", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "42.7196428528"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-2840.4489813557", "Productivity": "", "Project Code": "IBSMainframe2026", "Direct Margin": "", "Direct Profit": "-2453.2563936116", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "1.5178571428", "Primary Customer": "IBMJ", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "387.1925877441", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "2298.7385364745", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "154.517857137"}]	IBSMAINFRAME2026
47	\N	prime	2026-03	2026-03-04	Test.xlsx	{LPM2026}	9.68	0	29224	8.714285714499999	[{"EE": "1.15829059825496", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "0.6165268364763", "Gross Profit": "18017.3802691834", "Productivity": "3496.88888878129", "Project Code": "LPM2026", "Direct Margin": "0.670998209560266", "Direct Profit": "19609.2516761892", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "8.3571428574", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "9.68", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "297.3509183168", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "29224", "Direct Cost - Salary Expense": "8763.9911809274", "Indirect Cost - Sub Delivery Unit": "1294.520488689", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "850.7571428833"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-125.1720772437", "Productivity": "", "Project Code": "LPM2026", "Direct Margin": "", "Direct Profit": "-96.4443126299", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.119047619", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "18.3688396896", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "84.3252650157", "Indirect Cost - Sub Delivery Unit": "10.3589249242", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "12.1190476142"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-290.7472332635", "Productivity": "", "Project Code": "LPM2026", "Direct Margin": "", "Direct Profit": "-230.0111410648", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2380952381", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "60.7360921987", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "205.7730458262", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "24.2380952386"}]	LPM2026
48	\N	prime	2026-03	2026-03-04	Test.xlsx	{MYPAGEMAINTAIN}	10.43	0	35666	10.1607142859	[{"EE": "1.16273390841931", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "0.638820674960523", "Gross Profit": "22784.178193142", "Productivity": "3976.03715989293", "Project Code": "MyPageMaintain", "Direct Margin": "0.686727757222074", "Direct Profit": "24492.8321890825", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "8.9702380953", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "10.43", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "319.1651238552", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "35666", "Direct Cost - Salary Expense": "10259.997572816", "Indirect Cost - Sub Delivery Unit": "1389.4888720853", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "913.1702381015"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-863.2142743665", "Productivity": "", "Project Code": "MyPageMaintain", "Direct Margin": "", "Direct Profit": "-559.2210889861", "Project Group": "DES", "Project Status": "On-going", "Calendar Effort": "0.4285714286", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "DES", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "0", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "515.5925175546", "Indirect Cost - Sub Delivery Unit": "303.9931853804", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "43.6285714315"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-378.1031642037", "Productivity": "", "Project Code": "MyPageMaintain", "Direct Margin": "", "Direct Profit": "-317.7748584906", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.25", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "38.5745633636", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "292.3248584906", "Indirect Cost - Sub Delivery Unit": "21.7537423495", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "25.45"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-854.6535439797", "Productivity": "", "Project Code": "MyPageMaintain", "Direct Margin": "", "Direct Profit": "-724.0709457309", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.511904762", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "130.5825982488", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "686.5018981065", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "-14.5428571472", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "52.1119047716"}]	MYPAGEMAINTAIN
49	\N	prime	2026-03	2026-03-04	Test.xlsx	{ZHRMSA}	13	0	35808	12.214285714499999	[{"EE": "1.19474835883496", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "0.462778979768412", "Gross Profit": "16571.1897075473", "Productivity": "3290.88840255093", "Project Code": "ZhrMSA", "Direct Margin": "0.520660109722964", "Direct Profit": "18643.7972089599", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "10.8809523812", "Primary Customer": "ZHR", "Project Category": "Migration", "Billable MM / BMM": "13", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "387.1492013381", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "35808", "Direct Cost - Salary Expense": "16056.5218386339", "Indirect Cost - Sub Delivery Unit": "1685.4583000745", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1107.6809524062"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-715.6342045476", "Productivity": "", "Project Code": "ZhrMSA", "Direct Margin": "", "Direct Profit": "-615.0870283511", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.4166666667", "Primary Customer": "ZHR", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "64.2909389445", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "572.670361681", "Indirect Cost - Sub Delivery Unit": "36.256237252", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "42.4166666701"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-1337.05012839", "Productivity": "", "Project Code": "ZhrMSA", "Direct Margin": "", "Direct Profit": "-1103.2161734468", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.9166666666", "Primary Customer": "ZHR", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "233.8339549432", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "1009.8995067869", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "93.3166666599"}]	ZHRMSA
50	\N	prime	2026-03	2026-03-04	Test.xlsx	{ZWEB2}	7.17	0	23393	7.0337301587	[{"EE": "1.07549999997849", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "0.561894767409358", "Gross Profit": "13144.4042940071", "Productivity": "3508.94999992982", "Project Code": "ZWeb2", "Direct Margin": "0.616178909189031", "Direct Profit": "14414.273222659", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "6.6666666668", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "7.17", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "237.2030117601", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "23393", "Direct Cost - Salary Expense": "8300.0601106608", "Indirect Cost - Sub Delivery Unit": "1032.6659168918", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "678.6666666802"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-189.0515821018", "Productivity": "", "Project Code": "ZWeb2", "Direct Margin": "", "Direct Profit": "-158.8874292453", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.125", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "19.2872816818", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "146.1624292453", "Indirect Cost - Sub Delivery Unit": "10.8768711747", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "12.725"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS DEV", "Gross Margin": "", "Gross Profit": "-326.5599196291", "Productivity": "", "Project Code": "ZWeb2", "Direct Margin": "", "Direct Profit": "-264.8115592701", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2420634919", "Primary Customer": "ZHR", "Project Category": "Maintenance", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS DN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "61.748360359", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "240.1694957947", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "24.6420634754"}]	ZWEB2
51	\N	prime	2026-03	2026-03-04	Test.xlsx	{KDS_PCA}	14.5	0	44938	13.5170068031	[{"EE": "1.1191860464856", "PL": "FNS", "Sub PL": "FNS FKO", "Gross Margin": "0.535628890002117", "Gross Profit": "21659.7610539056", "Productivity": "3291.46511620252", "Project Code": "KDS_PCA", "Direct Margin": "0.593499878321673", "Direct Profit": "23999.9480795718", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "12.285714286", "Primary Customer": "KYU-DS", "Project Category": "Development", "Billable MM / BMM": "13.75", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "437.1312645308", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "40438", "Direct Cost - Salary Expense": "15187.3662061134", "Indirect Cost - Sub Delivery Unit": "1903.0557611354", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "1250.6857143148"}, {"EE": "1", "PL": "FNS", "Sub PL": "FNS FKO", "Gross Margin": "0.381080065243933", "Gross Profit": "1714.8602935977", "Productivity": "6000", "Project Code": "KDS_PCA", "Direct Margin": "0.4560705376344", "Direct Profit": "2052.3174193548", "Project Group": "FNS", "Project Status": "On-going", "Calendar Effort": "0.75", "Primary Customer": "KYU-DS", "Project Category": "Development", "Billable MM / BMM": "0.75", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "1.4624189476", "Project Department": "FNS FKO", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "4500", "Direct Cost - Salary Expense": "2147.6825806452", "Indirect Cost - Sub Delivery Unit": "335.9947068096", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "300"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS FKO", "Gross Margin": "", "Gross Profit": "-230.3036053975", "Productivity": "", "Project Code": "KDS_PCA", "Direct Margin": "", "Direct Profit": "-171.6168862131", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.243197279", "Primary Customer": "KYU-DS", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC F1", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "37.5249153946", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "146.8594032109", "Indirect Cost - Sub Delivery Unit": "21.1618037898", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "24.7574830022"}, {"EE": "", "PL": "FNS", "Sub PL": "FNS FKO", "Gross Margin": "", "Gross Profit": "-413.0294794474", "Productivity": "", "Project Code": "KDS_PCA", "Direct Margin": "", "Direct Profit": "-352.2933872487", "Project Group": "GLS", "Project Status": "On-going", "Calendar Effort": "0.2380952381", "Primary Customer": "KYU-DS", "Project Category": "Development", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "GLS HN", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "60.7360921987", "Project Contract Type": "T&M", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "340.1743396294", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "-12.1190476193", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "24.2380952386"}]	KDS_PCA
54	\N	prime	2026-03	2026-03-04	Test.xlsx	{HVNTCMMIGRATION}	6.51	0	19023	7.0494047618	[{"EE": "0.933970964992295", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "0.770687879621069", "Gross Profit": "14660.7955340316", "Productivity": "2729.17506406274", "Project Code": "HVNTCMMigration", "Direct Margin": "0.840481987665726", "Direct Profit": "15988.4888513651", "Project Group": "F1", "Project Status": "On-going", "Calendar Effort": "6.9702380952", "Primary Customer": "HONDA-SAP", "Project Category": "Migration", "Billable MM / BMM": "6.51", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "248.004220325", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "19023", "Direct Cost - Salary Expense": "1346.3710462416", "Indirect Cost - Sub Delivery Unit": "1079.6890970085", "Direct Cost - Other Direct Expense": "808.4960547791", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "879.6440476142"}, {"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "", "Gross Profit": "-97.3787187834", "Productivity": "", "Project Code": "HVNTCMMigration", "Direct Margin": "", "Direct Profit": "-80.4963798064", "Project Group": "FQC", "Project Status": "On-going", "Calendar Effort": "0.0791666666", "Primary Customer": "HONDA-SAP", "Project Category": "Migration", "Billable MM / BMM": "", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "FQC FA", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "12.2152783882", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "", "Direct Cost - Salary Expense": "70.5055464815", "Indirect Cost - Sub Delivery Unit": "4.6670605888", "Direct Cost - Other Direct Expense": "", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": "9.9908333249"}]	HVNTCMMIGRATION
55	\N	prime	2026-03	2026-03-04	Test.xlsx	{"SMALL PO 2025"}	-0.07	0	-132	0	[{"EE": "", "PL": "FVN", "Sub PL": "FVN CDM", "Gross Margin": "1.1462264150947", "Gross Profit": "-151.3018867925", "Productivity": "", "Project Code": "Small PO 2025", "Direct Margin": "1.1462264150947", "Direct Profit": "-151.3018867925", "Project Group": "F1", "Project Status": "Closed", "Calendar Effort": "", "Primary Customer": "HONDA-SAP", "Project Category": "Development", "Billable MM / BMM": "-0.07", "Dept Owner In Jira": "F1 STI", "Indirect Cost - PL": "", "Project Department": "F1 STI", "Group Owner In Jira": "F1", "Indirect Cost - FSU": "", "Project Contract Type": "Fixed Price", "WIP Revenue / FSU Revenue": "-132", "Direct Cost - Salary Expense": "-471.0378571243", "Indirect Cost - Sub Delivery Unit": "", "Direct Cost - Other Direct Expense": "490.3397439167", "Direct Cost - Manpower Hiring (APP)": "", "Direct Cost - Manpower Hiring (POI)": "", "Direct Cost - General Expense Per Norm": ""}]	SMALL PO 2025
\.


--
-- Data for Name: admin_config; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.admin_config (id, target_gross_margin, target_direct_margin, project_income_pct, roles, contract_types, locations, other_cost_cats, cost_ref, last_updated_roles, last_updated_contracts, last_updated_locations, last_updated_other_cats, updated_at) FROM stdin;
1	40	56	30	["Project Manager", "Business Analyst", "Tech Lead", "Senior Developer", "Developer", "Junior Developer", "QA Engineer", "DevOps", "Designer", "Comtor", "Scrum Master"]	["EMP", "APP", "POI"]	[{"code": "HN", "name": {"en": "Hanoi", "vi": "Hà Nội"}, "active": true}, {"code": "HL", "name": {"en": "Hoa Lac", "vi": "Hoà Lạc"}, "active": true}, {"code": "DN", "name": {"en": "Da Nang", "vi": "Đà Nẵng"}, "active": true}, {"code": "HCM", "name": {"en": "Ho Chi Minh", "vi": "Hồ Chí Minh"}, "active": true}, {"code": "CT", "name": {"en": "Can Tho", "vi": "Cần Thơ"}, "active": true}, {"code": "QNH", "name": {"en": "Quy Nhon", "vi": "Quy Nhơn"}, "active": true}, {"code": "HUE", "name": {"en": "Hue", "vi": "Huế"}, "active": true}, {"code": "NT", "name": {"en": "Nha Trang", "vi": "Nha Trang"}, "active": true}]	["AI License", "VDI", "Office Mini", "Office 365", "Cloud Infrastructure", "Other"]	{"Primer": {"salary": {"unit": "USD", "table": {"CT": {"P1": "236", "P2": "428", "P3": "589", "P4": "841", "P5": "1246", "P6": "1694", "P7": "2200", "P8": "2672", "P9": "3340"}, "DN": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "HL": {"P1": "236", "P2": "409", "P3": "562", "P4": "802", "P5": "1187", "P6": "1611", "P7": "2094", "P8": "2546", "P9": "3340"}, "HN": {"P1": "236", "P2": "409", "P3": "562", "P4": "802", "P5": "1187", "P6": "1611", "P7": "2094", "P8": "2546", "P9": "3340"}, "NT": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "HCM": {"P1": "236", "P2": "428", "P3": "589", "P4": "841", "P5": "1246", "P6": "1694", "P7": "2200", "P8": "2672", "P9": "3340"}, "HUE": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "QNH": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}}, "lastUpdated": "2026-03-02"}, "insurance": {"unit": "USD", "table": {"CT": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "DN": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "HL": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "HN": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "NT": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "HCM": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "HUE": {"P1": "51", "P2": "51", "P3": "51", "P4": "54", "P5": "54", "P6": "63", "P7": "63", "P8": "63", "P9": "189"}, "QNH": {"P1": "46", "P2": "46", "P3": "46", "P4": "49", "P5": "49", "P6": "58", "P7": "58", "P8": "58", "P9": "189"}}, "lastUpdated": "2026-03-02"}}, "Supplier": {"salary": {"unit": "USD", "table": {"CT": {"P1": "236", "P2": "428", "P3": "589", "P4": "841", "P5": "1246", "P6": "1694", "P7": "2200", "P8": "2672", "P9": "3340"}, "DN": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "HL": {"P1": "236", "P2": "409", "P3": "562", "P4": "802", "P5": "1187", "P6": "1611", "P7": "2094", "P8": "2546", "P9": "3340"}, "HN": {"P1": "236", "P2": "409", "P3": "562", "P4": "802", "P5": "1187", "P6": "1611", "P7": "2094", "P8": "2546", "P9": "3340"}, "NT": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "HCM": {"P1": "236", "P2": "428", "P3": "589", "P4": "841", "P5": "1246", "P6": "1694", "P7": "2200", "P8": "2672", "P9": "3340"}, "HUE": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}, "QNH": {"P1": "236", "P2": "389", "P3": "534", "P4": "762", "P5": "1128", "P6": "1532", "P7": "1988", "P8": "2420", "P9": "3340"}}, "lastUpdated": "2026-03-02"}, "insurance": null}}	\N	\N	\N	\N	2026-03-02 11:35:37.854001+07
\.


--
-- Data for Name: dcl_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.dcl_roles (id, email, name, title, status, created_at) FROM stdin;
c017c9cf-d7fc-4a55-ba57-af581584ed1c	trinhnd1@fpt.com	Trinh Ngo Duy	Vice DCL	active	2026-03-04 00:26:13.295458+07
06379fec-2b1c-4b3c-8f6d-1de7cea40ac1	tuannm6@fpt.com	Tuan Nguyen Minh	DCL	active	2026-03-03 21:55:23.755689+07
\.


--
-- Data for Name: line_services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_services (id, name, created_at) FROM stdin;
96f91b38-2399-4e13-9331-24d02a556466	EOSL	2026-03-03 15:09:00.714029+07
ab675010-f583-417f-95b2-f49187291918	Groupware Modernization	2026-03-03 13:51:08.669624+07
bcf1fab7-9809-4728-90ac-d7bf11da9d35	Mainframe Modernization	2026-03-03 13:50:47.288291+07
4bb7dfbe-5a7f-4de2-8426-4e661f10f2e8	ITO	2026-03-04 17:00:03.144182+07
\.


--
-- Data for Name: lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lines (id, code, name, created_at) FROM stdin;
\.


--
-- Data for Name: master_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.master_projects (id, project_code, project_name, project_description, start_date, end_date, project_type, contract_type, imported_at, project_manager, imported_by_email) FROM stdin;
dd318344-1b9d-4f06-b654-7c8d4249a072	OPERA	Oracle IE Weblogic Exit	Dự án thực hiện Transition 3 nội dung sau: O: Oracle → PostgreSQL P: Presentation IE → Edge E: Enterprise Middleware WebLogic → JBoss theo request khách hàng	2026-02-01	2026-12-31	Migration	T&M	2026-03-04 15:58:29.767142+07	hanhnt67	tuannm6@fpt.com
5a37a3ae-c81c-44b4-947f-89f4a210cea5	STNC2SQL	STN COBOL to PLSQL project	Migrate hệ thống COBOL (IBM mainframe) lên JAVA và PL/SQL	2026-01-19	2026-04-15	Migration	T&M	2026-03-04 15:58:29.767142+07	vandh1	tuannm6@fpt.com
674bc001-e2ab-41d8-a57d-0ff6732f62fe	SMALLPO2026	Small PO 2026	Dự án quản lý các PO nhỏ, lẻ và có hoạt động deliver cho khách hàng	2026-01-01	2026-12-31	Other	T&M	2026-03-04 15:58:29.767142+07	haitt15	tuannm6@fpt.com
6c84ac34-e5c8-4da7-af93-c93245901413	MYPAGEMAINTAIN	MyPageMaintain	Đối ứng phase CR và Maintain system Mypage của khách hàng Zenhoren.	2025-12-22	2026-12-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	dungpt64	tuannm6@fpt.com
2a3893be-40de-490b-8889-65292fc5004b	LPM2026	Lifeplan System Maintenance in 2026	Thực hiện Manitance, phát triển mới các chức năng theo yêu cầu của khách hàng.	2025-12-01	2026-08-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	thonh5	tuannm6@fpt.com
8a1c086c-5f3a-4457-a06a-6c8b35d6a061	MEP	CEPC Macro EcoPlan	N/A	2025-12-01	2026-02-28	Maintenance	Fixed Price	2026-03-04 15:58:29.767142+07	quangvn1	tuannm6@fpt.com
aa24bffe-d1a8-4cc0-b4a7-329a272e6800	TSASM	TS Assembly Migration	Thực hiện Assessment hệ thống Assembly (HLASM) của khách hàng TS (Toyota System) Detect và create mới pattern migration nếu có. thực hiện sample conversion Assembly (HLASM) to COBOL	2025-12-01	2026-07-15	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	tienca1	tuannm6@fpt.com
39e4e2d9-1c00-4c9a-9bed-89051329c78b	ZWEB2	ZWEB2.0 Maintenance	Thực hiện đối ứng bug và các new request change của hệ thống ZWeb2.0	2025-11-17	2026-03-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	tainlh	tuannm6@fpt.com
1244de00-5b77-4bd1-b7e4-ccb4dd18be1d	DELTAXI	DELTA XI	Scope: Coding, UT, Design, Other\r\r\nSummary:\r\r\nDự án thực hiện 3 topic:\r\r\n• Migrate lagacy system từ RPG sang .NET\r\r\n• Migrate legacry system từ Vb\\Vb.net sang C#.NET\r\r\n• Tạo report dựa trên Oracle BIP theo yêu cầu	2025-11-01	2026-11-16	Migration	T&M	2026-03-04 15:58:29.767142+07	hiepnd8	tuannm6@fpt.com
2aa90a03-4d78-4571-8b27-f055b5df1fd3	KAIZENPROCESSODC	KaizenProcessODC	Project description: Dự án thực hiện tạo và đồng bộ process cho toàn bộ các dự án ODC	2025-11-01	2026-04-15	Other	T&M	2026-03-04 15:58:29.767142+07	tampp	tuannm6@fpt.com
a28e93ab-ea0e-491e-aeab-c4bd2aefd380	MCCNMPH3	MCC NotesMigration PH3	Migrate Notes applications	2025-11-01	2027-01-31	Migration	T&M	2026-03-04 15:58:29.767142+07	lamnt6	tuannm6@fpt.com
ab85c89a-aab2-4e3f-8f64-ce475b8486dd	A2POS	A2PoS	Migration hệ thống quản lý siêu thị từ Seasar sang Spring và version up .Net3.5 lên .Net4.8	2025-10-13	2026-07-17	Migration	T&M	2026-03-04 15:58:29.767142+07	motpv2	tuannm6@fpt.com
88826132-d431-4a5f-832e-58453aa59361	CEPC_LP	CEPC_PowerPlatformDevelopment	Develop PowerApps applications for CEPC customer	2025-10-01	2026-04-15	Development	T&M	2026-03-04 15:58:29.767142+07	phuongtt76	tuannm6@fpt.com
adeeb46e-befb-4da6-9437-1c376593c6fb	PROACTIVE2025	Proactive 2025	Maintain hệ thống C4 đã migration từ C2 của Proactive,	2025-10-01	2026-12-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	datlp	tuannm6@fpt.com
3eaca46d-9998-495a-9c31-9808229c592e	RLIW_TC	RLIW_TC	Develop new warehouse system for Japan customer. This is a system for clients that can run on PC, Handy Device, Mobile	2025-10-01	2026-03-31	Development	T&M	2026-03-04 15:58:29.767142+07	huyhm2	tuannm6@fpt.com
f14bebba-ec18-422d-9d14-0e7a29037a17	ZHRMSA	ZhrMicroService	Microservice hóa cho chức năng thẩm định của system LifePlan.	2025-10-01	2026-11-30	Migration	T&M	2026-03-04 15:58:29.767142+07	binhdd	tuannm6@fpt.com
bc7c42f9-f8bc-4176-a7df-da4d0fb2be07	SST_EXIT_ORA	SST_EXIT_ORA	Dự án thực hiện migration(DB,Exit IE, weblogic, endcoding) 16 system cho khách hàng, với scope CD và UT	2025-09-15	2026-12-31	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	tampp	tuannm6@fpt.com
15841d42-d718-41a1-9439-1468e6cb3254	KDS_PCA	Payment Collection Agency System Renewal	Renewal of the active payment collection system in operation	2025-09-01	2026-04-30	Development	T&M	2026-03-04 15:58:29.767142+07	nguyenptv1	tuannm6@fpt.com
c111a7c2-346b-4c52-8e68-b631c973f6d5	NISSAYITNOTESMIGRATION	NissayIT_NotesMigration	Migrate Lotus Notes application	2025-09-01	2026-12-31	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	lamnt6	tuannm6@fpt.com
f0084599-2786-47d6-8707-5e9de23664c8	HVNTCMMIGRATION	HVN_TCMMigration	Migrate hệ thống cũ sang nền tảng SharePoint Online	2025-07-14	2026-04-30	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	lamnt6	tuannm6@fpt.com
73db4d5e-fcc5-4cfb-978b-cf52cd81399c	NGK-WARRANTY-P1	NGK-Warranty-P1	Dự án thực hiện các task bảo hành cho dự án từ phase trước	2025-07-01	2026-06-30	Maintenance	Fixed Price	2026-03-04 15:58:29.767142+07	vandh1	tuannm6@fpt.com
b4d6e094-62bd-4c6b-b996-e3faab79ea9f	TOGIS_OSVU	TOGIS_OS Version Up	. Project thực hiện version-up OS & middle ware.\r\r\n. Migrate framework struts ->springboo	2025-07-01	2026-03-31	Migration	T&M	2026-03-04 15:58:29.767142+07	motpv2	tuannm6@fpt.com
152c4f47-2b35-49b7-b253-43e7d658f8cb	CLAB_M	Clab maintain	Tham gia tiếp tục vận hành và maintain tool của khách hàng cùng với OB/KH dưới hình thức Bodyshop.	2025-05-01	2026-03-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	minhnq21	tuannm6@fpt.com
27ea731b-30b5-4653-af49-fc74e216e618	THG.EXITEDGE	THG Exit Edge	Điều tra các vị trí bị lỗi/vỡ layout	2025-02-17	2026-02-20	Migration	T&M	2026-03-04 15:58:29.767142+07	maivt1	tuannm6@fpt.com
b7c27893-06be-444b-abc7-cbbbe57b4c4c	FSOFT LM PROGRAM 2025	FSOFT LM Program 2025	Dự án internal quản lý các task xây dựng năng lực về Mainframe Modernization cho công ty	2025-01-01	2026-03-31	Other	T&M	2026-03-04 15:58:29.767142+07	nuptn	tuannm6@fpt.com
f29c5599-c4f8-4355-82dd-c3986b648799	STI 2025	STI 2025	For other internal management & have NO income\r\r\n- To manage task operation, training of OB\r\r\n- To manage BackOffice HO tasks\r\r\n- To manage program\r\r\n- To mock up (for test tool...)	2025-01-01	2025-12-31	Other	\N	2026-03-04 15:58:29.767142+07	tuannm6	tuannm6@fpt.com
ac4d33bc-1b8e-40fe-a6c2-10ba51c3558f	TAKUHAI	TAKUHAI	Dự án đối ứng phát triển mới hệ thống.	2024-11-18	2026-03-31	Development	T&M	2026-03-04 15:58:29.767142+07	quangpv4	tuannm6@fpt.com
bf5b6b39-78ae-4363-9059-c9c38e1aa0e7	VDS TTS	VDS Thanh Toan So	Develop and maintain a digital payment application	2024-11-12	2026-03-10	Development	T&M	2026-03-04 15:58:29.767142+07	haitt15	tuannm6@fpt.com
c1a2c8f3-d735-4d16-9410-2a14ab73e766	BSD	HONDAM Backlog System Development	Dự án phát triển hệ thống idea Backlog	2024-10-01	2026-04-17	Development	T&M	2026-03-04 15:58:29.767142+07	phuongtt76	tuannm6@fpt.com
1d084ecc-615e-4c5b-a9d1-0806ac330a8a	C2J2023	C2J2023	Thực hiện migration hệ thống KH	2023-04-01	2026-04-30	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	quangpv4	tuannm6@fpt.com
90fd51f0-ac68-40ec-a72e-98a84bc5bacc	BIZNEX2	BIZNEX2	maintenance, update CR cho hệ thống khách hàng	2021-03-01	2026-03-31	Maintenance	T&M	2026-03-04 15:58:29.767142+07	minhnq21	tuannm6@fpt.com
e0818766-1ff5-4d6c-ab70-52f68c413bb5	SPAD	S Power Apps Development	Develop PowerApps and migrate Notes application	2026-01-12	2027-01-31	Development	T&M	2026-03-04 15:58:29.767142+07	lamnt6	tuannm6@fpt.com
cbc9134b-8f69-4ab7-9991-f28209045456	AIMLOT2	AIM COBOL Migration Lot 2	N/A	2026-01-07	2026-03-31	Migration	T&M	2026-03-04 15:58:29.767142+07	quangvn1	tuannm6@fpt.com
db075fcc-494a-4673-b4ee-7886b4f33ea8	HIKARICOLABO	Hikari Colabo Development	Đây là dự án lần đầu hợp tác với Cus-S làm từ requirement đến ST.	2026-01-02	2026-09-30	Development	T&M	2026-03-04 15:58:29.767142+07	quangpv4	tuannm6@fpt.com
f25855d7-820f-499a-9ab6-413b10d161bc	DSLPOC	dSL COBOL HITACHI MIGRATION PoC	Thực hiện assessment & PoC hệ thống COBOL Hitachi 2002	2026-01-01	2026-03-31	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	anhldt	tuannm6@fpt.com
ff65b832-731f-4c3e-b97f-378ffc6279bb	IBSMAINFRAME2026	IBSMainframe2026	T	2026-01-01	2026-08-31	Migration	Fixed Price	2026-03-04 15:58:29.767142+07	thanhnd14	tuannm6@fpt.com
1f713ede-1883-46be-a301-1b854b7d2b5c	PETOSD	PET_OSDevelopment	Develop Outsystems system	2026-01-01	2027-01-31	Development	T&M	2026-03-04 15:58:29.767142+07	lamnt6	tuannm6@fpt.com
\.


--
-- Data for Name: pm_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pm_roles (id, email, name, status, created_at) FROM stdin;
572143ec-1058-448e-bfbe-3aaf28f57b14	pm1@fpt.com	PM 1	active	2026-03-04 16:41:58.12902+07
2db32d46-4623-4097-af83-13b82d917134	pm2@fpt.com	PM 2	active	2026-03-04 16:42:05.447949+07
1cac5212-7a38-4745-a6d9-1d3090cf55c4	pm3@fpt.com	PM 3	active	2026-03-04 16:42:12.365411+07
455df602-5e92-4de1-966e-98f0e6fd72dd	hanhnt67@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
751b0b2e-1e5b-49ed-a13e-6eeb1196d904	thanhnd14@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
56157474-5a5d-451c-9367-7460d6870270	dungpt64@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
a3344315-390f-4920-a453-487728fe9117	thonh5@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
9f8b8a6d-90d4-4510-b3e7-e53d2f67b7c2	quangvn1@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
e60a733c-bea4-4d5f-a9ce-9acaf438d85a	tienca1@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
7312721f-187f-41a6-b869-1564701911a6	tainlh@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
e493a6aa-8272-47a0-a41f-cda55a6dca5d	hiepnd8@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
6abd783a-57af-406a-bb12-cb204ac7416b	datlp@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
189c20bd-4bca-4f03-a46e-9dcbe28e0e48	huyhm2@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
2e3aaf5e-3dc4-4a71-92f6-06fa0f5adc20	binhdd@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
52928c01-5b18-4a5e-89d1-dccf2ecd9f42	tampp@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
3e5a996c-f9ae-4c0f-83af-2e228246ff75	nguyenptv1@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
ed20e544-8c9c-456e-9d76-499d21cf5d87	vandh1@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
b237cdde-a5ca-4df0-9e6c-3deb672d346f	motpv2@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
82d13c2a-84da-4ca4-ad98-e471ec357ff3	maivt1@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
cd96dbc7-e9f0-4fc8-9aa6-f781d90cfcfb	nuptn@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
0e4f914c-cd95-4129-aa9e-762f5eaec228	tuannm6@fpt.com	Name	active	2026-03-03 21:50:52.464819+07
c690c4ed-1840-4f71-ac54-0ae2f6c9f38d	phuongtt76@fpt.com	Name	active	2026-03-04 00:06:59.716872+07
ee9b6289-5b71-4e32-8e21-ae04c0ed56d5	quangpv4@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
ac1878dd-7140-4e7f-9097-0f91745808c8	minhnq21@fpt.com	Name	active	2026-03-04 16:55:36.254286+07
24057b28-2a5e-437d-8ebe-3974adec4b51	anhldt@fpt.com	Anh Le Duy Tuan	active	2026-03-04 16:55:36.254286+07
3141541a-50f3-4398-9bb7-40f346b4378d	lamnt6@fpt.com	Lam Nguyen Tung	active	2026-03-04 16:55:36.254286+07
8411a971-3705-4abb-9d82-5eb667963021	haitt15@fpt.com	Hai Tran Thanh	active	2026-03-04 16:55:36.254286+07
\.


--
-- Data for Name: pmo_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pmo_roles (id, email, name, status, created_at) FROM stdin;
8e13d964-9905-4511-8e80-7b963a37b9d4	thaolt8@fpt.com	Lê Thanh Thảo	active	2026-03-04 16:42:26.143266+07
2a7daf4e-7416-4fdd-ab03-190401e1a928	pmo1@fpt.com	PMO 1	active	2026-03-04 16:42:35.359781+07
eee3efd7-eeb5-4119-b9ba-ed7b1933becf	pmo2@fpt.com	PMO 2	active	2026-03-04 16:42:43.224495+07
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.projects (id, code, name, start_date, end_date, currency, status, created_at, updated_at, line_id, line_service_id, created_by_name, master_project_id, created_by_email) FROM stdin;
6	BSD	HONDAM Backlog System Development	2024-10-01T00:00:00.000+07:00	2026-04-17T00:00:00.000+07:00	USD	active	2026-03-03 14:51:32.122963+07	2026-03-03 14:51:32.122963+07	\N	ab675010-f583-417f-95b2-f49187291918	Trần Thanh Phương	c1a2c8f3-d735-4d16-9410-2a14ab73e766	phuongtt76@fpt.com
8	TSASM	TS Assembly Migration	2025-12-01T00:00:00.000+07:00	2026-07-15T00:00:00.000+07:00	USD	active	2026-03-03 22:42:39.932612+07	2026-03-03 22:42:39.932612+07	\N	bcf1fab7-9809-4728-90ac-d7bf11da9d35	Tuấn Nguyễn Minh	aa24bffe-d1a8-4cc0-b4a7-329a272e6800	tuannm6@fpt.com
7	FSOFT LM PROGRAM 2025	FSOFT LM Program 2025	2025-01-01T00:00:00.000+07:00	2026-03-31T00:00:00.000+07:00	USD	active	2026-03-03 22:39:10.746687+07	2026-03-04 00:28:01.334432+07	\N	bcf1fab7-9809-4728-90ac-d7bf11da9d35	Tuấn Nguyễn Minh	b7c27893-06be-444b-abc7-cbbbe57b4c4c	tuannm6@fpt.com
\.


--
-- Data for Name: sm_role_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sm_role_assignments (id, email, name, line_service_id, status, created_at) FROM stdin;
8db1e4f0-1dc2-42de-b2da-8a61b4aa3c8c	trinhnd1@fpt.com	Trinh Ngo Duy	96f91b38-2399-4e13-9331-24d02a556466	active	2026-03-04 16:57:23.989579+07
705e4b4e-2dcc-4bbb-ae90-3a79070489d3	lamnt6@fpt.com	Lam Nguyen Tung	ab675010-f583-417f-95b2-f49187291918	active	2026-03-04 16:59:22.654815+07
30a2d192-88d1-4795-a55b-f7eaacb865ed	anhldt@fpt.com	Anh Le Duy Tuan	bcf1fab7-9809-4728-90ac-d7bf11da9d35	active	2026-03-04 16:59:30.783176+07
e5b95f68-f4c3-4c6e-97df-4c92ca9bbe38	haitt15@fpt.com	Hai Tran Thanh	4bb7dfbe-5a7f-4de2-8426-4e661f10f2e8	active	2026-03-04 17:00:03.144182+07
\.


--
-- Data for Name: system_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.system_users (id, name, email, username, password_hash, account_type, is_pmo, status, created_at) FROM stdin;
5ad36d90-3d4f-427e-b6db-e87ce5e92d94	PMO User	pmo@system.local	pmo	$2a$10$cOn1E4kypdJOxQ8Ll7nU9Oo0CLDscY3wnAaI6RbRG2eF5jkEp4MrS	local	t	active	2026-03-03 13:47:27.857701+07
ed7e4c4d-ab8f-4efa-9f38-27d448d92945	Administrator	admin@system.local	admin	$2a$10$fH0kozlKnirK9tp8MBOVjeNjzTZFJV/A1n/QJRwRx0wj8FEauHjGy	local	t	active	2026-03-03 13:47:27.857701+07
\.


--
-- Data for Name: user_lines; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_lines (user_email, line_id) FROM stdin;
\.


--
-- Data for Name: user_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_projects (user_email, project_id) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, display_name, role, active, created_at, updated_at, password_hash) FROM stdin;
3	tuannm6@fpt.com	Nguyễn Minh Tuấn	dcl	t	2026-03-02 16:41:56.70344+07	2026-03-02 16:41:56.70344+07	\N
1	admin	Admin	pmo	t	2026-03-02 16:05:45.616684+07	2026-03-02 16:57:44.235627+07	$2b$10$AjImwR8vnfKcIwqRuyNG/en94S9xueN3L7txQ0.Elo0rIoODBPrAy
4	pmo	PMO	pmo	t	2026-03-02 17:11:52.335535+07	2026-03-02 17:11:52.335535+07	\N
7	anhldt@fpt.com	Lê Duy Tuấn Anh	sm	t	2026-03-03 15:10:46.855623+07	2026-03-03 15:10:46.855623+07	\N
8	thanhnd14@fpt.com	Nguyễn Đức Thạnh	sm	t	2026-03-03 15:10:57.322553+07	2026-03-03 15:10:57.322553+07	\N
9	phuongtt76@fpt.com	Trần Thanh Phương	pm	t	2026-03-03 15:11:05.394073+07	2026-03-03 15:11:05.394073+07	\N
10	lamnt6@fpt.com	Nguyễn Tùng Lâm	sm	t	2026-03-03 15:11:18.756262+07	2026-03-03 15:11:18.756262+07	\N
\.


--
-- Data for Name: versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.versions (id, project_id, type, date, note, created_by, data, created_at, updated_at, status, submitted_at, approval_history, current_rejection_comment, sm_skipped) FROM stdin;
16	6	planning	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}}	2026-03-03 14:56:10.336639+07	2026-03-03 14:56:10.336639+07	draft	\N	[]	\N	f
14	6	bidding	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}}	2026-03-03 14:55:51.722908+07	2026-03-03 14:55:51.722908+07	pending_sm	2026-03-03 14:56:36.344+07	[]	\N	f
15	6	bidding	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}}	2026-03-03 14:55:59.591103+07	2026-03-03 14:55:59.591103+07	draft	\N	[]	\N	f
17	7	bidding	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "30", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "40", "P3": "30", "P4": "20", "P5": "", "P6": "", "P7": "10", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "1", "wipRevenue": "8000"}, "currency": "USD", "offshore": {"billableMM": "100", "wipRevenue": "450000"}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "1", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": "7000"}}	2026-03-03 22:39:16.976971+07	2026-03-03 22:40:08.229159+07	pending_sm	2026-03-03 22:41:18.978+07	[]	\N	f
18	8	bidding	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "0", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "4", "P3": "3", "P4": "2", "P5": "", "P6": "", "P7": "", "P8": "1", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "1", "wipRevenue": "8000"}, "currency": "USD", "offshore": {"billableMM": "8", "wipRevenue": "40000"}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [{"id": 1772552623577.4902, "qty": "1", "note": "", "months": "5", "category": "AI License", "unitPrice": "19"}], "onsiteCeAPP": "", "onsiteCeEMP": "1", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": "7000"}}	2026-03-03 22:42:44.018717+07	2026-03-03 22:43:53.103903+07	pending_dcl	2026-03-03 22:43:56.683+07	[{"step": "SM", "action": "approved", "userId": "me@tuantitan.com", "userName": "NMT", "timestamp": "2026-03-03T15:46:39.114Z"}, {"step": "PMO", "action": "approved", "userId": "tuannm6@fpt.com", "userName": "Tuấn Nguyễn Minh", "timestamp": "2026-03-03T15:54:53.230Z"}]	\N	f
19	8	planning	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "0", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "4", "P3": "3", "P4": "2", "P5": "", "P6": "", "P7": "", "P8": "1", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "1", "wipRevenue": "8000"}, "currency": "USD", "offshore": {"billableMM": "8", "wipRevenue": "40000"}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [{"id": 1772552623577.4902, "qty": "1", "note": "", "months": "5", "category": "AI License", "unitPrice": "19"}], "onsiteCeAPP": "", "onsiteCeEMP": "1", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": "7000"}}	2026-03-03 23:30:00.451927+07	2026-03-03 23:30:00.451927+07	approved	2026-03-03 23:33:20.763+07	[{"step": "SM", "action": "approved", "userId": "me@tuantitan.com", "userName": "NMT", "timestamp": "2026-03-03T16:33:54.099Z"}, {"step": "PMO", "action": "approved", "userId": "tuannm6@fpt.com", "userName": "Tuấn Nguyễn Minh", "timestamp": "2026-03-03T16:34:30.244Z"}, {"step": "DCL", "action": "approved", "userId": "tuannm6@fpt.com", "userName": "Tuấn Nguyễn Minh", "timestamp": "2026-03-03T16:34:35.451Z"}]	\N	f
20	8	monthly	2026-03-03		PM	{"forecast": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}, "planning": {"prime": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "onsite": {"billableMM": "", "wipRevenue": ""}, "currency": "USD", "offshore": {"billableMM": "", "wipRevenue": ""}, "supplier": {"xjob": "", "ceAPP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "ceEMP": {"CT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "DN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HL": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HN": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "NT": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HCM": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "HUE": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}, "QNH": {"P1": "", "P2": "", "P3": "", "P4": "", "P5": "", "P6": "", "P7": "", "P8": "", "P9": ""}}, "otherExp": "", "otCampaignPct": 10}, "otherCosts": [], "onsiteCeAPP": "", "onsiteCeEMP": "", "onsiteOtherExp": "", "onsiteUnitSalAPP": "", "onsiteUnitSalEMP": ""}}	2026-03-03 23:34:44.78237+07	2026-03-03 23:34:44.78237+07	draft	\N	[]	\N	f
\.


--
-- Name: actual_entries_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.actual_entries_id_seq', 57, true);


--
-- Name: lines_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lines_id_seq', 1, false);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.projects_id_seq', 8, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.versions_id_seq', 20, true);


--
-- Name: actual_entries actual_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_entries
    ADD CONSTRAINT actual_entries_pkey PRIMARY KEY (id);


--
-- Name: admin_config admin_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_config
    ADD CONSTRAINT admin_config_pkey PRIMARY KEY (id);


--
-- Name: dcl_roles dcl_roles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dcl_roles
    ADD CONSTRAINT dcl_roles_email_key UNIQUE (email);


--
-- Name: dcl_roles dcl_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.dcl_roles
    ADD CONSTRAINT dcl_roles_pkey PRIMARY KEY (id);


--
-- Name: line_services line_services_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_services
    ADD CONSTRAINT line_services_name_key UNIQUE (name);


--
-- Name: line_services line_services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_services
    ADD CONSTRAINT line_services_pkey PRIMARY KEY (id);


--
-- Name: lines lines_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_code_key UNIQUE (code);


--
-- Name: lines lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lines
    ADD CONSTRAINT lines_pkey PRIMARY KEY (id);


--
-- Name: master_projects master_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_projects
    ADD CONSTRAINT master_projects_pkey PRIMARY KEY (id);


--
-- Name: master_projects master_projects_project_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.master_projects
    ADD CONSTRAINT master_projects_project_code_key UNIQUE (project_code);


--
-- Name: pm_roles pm_roles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pm_roles
    ADD CONSTRAINT pm_roles_email_key UNIQUE (email);


--
-- Name: pm_roles pm_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pm_roles
    ADD CONSTRAINT pm_roles_pkey PRIMARY KEY (id);


--
-- Name: pmo_roles pmo_roles_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pmo_roles
    ADD CONSTRAINT pmo_roles_email_key UNIQUE (email);


--
-- Name: pmo_roles pmo_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pmo_roles
    ADD CONSTRAINT pmo_roles_pkey PRIMARY KEY (id);


--
-- Name: projects projects_master_project_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_master_project_id_key UNIQUE (master_project_id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: sm_role_assignments sm_role_assignments_email_line_service_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sm_role_assignments
    ADD CONSTRAINT sm_role_assignments_email_line_service_id_key UNIQUE (email, line_service_id);


--
-- Name: sm_role_assignments sm_role_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sm_role_assignments
    ADD CONSTRAINT sm_role_assignments_pkey PRIMARY KEY (id);


--
-- Name: system_users system_users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_email_key UNIQUE (email);


--
-- Name: system_users system_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_pkey PRIMARY KEY (id);


--
-- Name: system_users system_users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_users
    ADD CONSTRAINT system_users_username_key UNIQUE (username);


--
-- Name: user_lines user_lines_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_lines
    ADD CONSTRAINT user_lines_pkey PRIMARY KEY (user_email, line_id);


--
-- Name: user_projects user_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_pkey PRIMARY KEY (user_email, project_id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: versions versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_pkey PRIMARY KEY (id);


--
-- Name: idx_actual_entries_proj_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_actual_entries_proj_code ON public.actual_entries USING btree (project_code);


--
-- Name: idx_dcl_roles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_dcl_roles_email ON public.dcl_roles USING btree (email);


--
-- Name: idx_pm_roles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pm_roles_email ON public.pm_roles USING btree (email);


--
-- Name: idx_pmo_roles_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pmo_roles_email ON public.pmo_roles USING btree (email);


--
-- Name: idx_projects_line_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_line_id ON public.projects USING btree (line_id);


--
-- Name: idx_projects_line_svc_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_line_svc_id ON public.projects USING btree (line_service_id);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_sm_role_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sm_role_email ON public.sm_role_assignments USING btree (email);


--
-- Name: idx_sm_role_ls_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sm_role_ls_id ON public.sm_role_assignments USING btree (line_service_id);


--
-- Name: idx_sys_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sys_users_email ON public.system_users USING btree (email);


--
-- Name: idx_sys_users_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sys_users_status ON public.system_users USING btree (status);


--
-- Name: idx_user_lines_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_lines_email ON public.user_lines USING btree (user_email);


--
-- Name: idx_user_lines_line; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_lines_line ON public.user_lines USING btree (line_id);


--
-- Name: idx_user_projects_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_projects_email ON public.user_projects USING btree (user_email);


--
-- Name: idx_user_projects_proj; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_projects_proj ON public.user_projects USING btree (project_id);


--
-- Name: idx_versions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_versions_status ON public.versions USING btree (status);


--
-- Name: actual_entries actual_entries_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.actual_entries
    ADD CONSTRAINT actual_entries_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: projects projects_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE SET NULL;


--
-- Name: projects projects_line_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_line_service_id_fkey FOREIGN KEY (line_service_id) REFERENCES public.line_services(id);


--
-- Name: projects projects_master_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_master_project_id_fkey FOREIGN KEY (master_project_id) REFERENCES public.master_projects(id);


--
-- Name: sm_role_assignments sm_role_assignments_line_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sm_role_assignments
    ADD CONSTRAINT sm_role_assignments_line_service_id_fkey FOREIGN KEY (line_service_id) REFERENCES public.line_services(id) ON DELETE CASCADE;


--
-- Name: user_lines user_lines_line_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_lines
    ADD CONSTRAINT user_lines_line_id_fkey FOREIGN KEY (line_id) REFERENCES public.lines(id) ON DELETE CASCADE;


--
-- Name: user_projects user_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: versions versions_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.versions
    ADD CONSTRAINT versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict QgQCrrp1GDAjFc2ztRiniYqlGIdkz96DxLj25lZMxR71bJrSezLtrVly6328CVx

