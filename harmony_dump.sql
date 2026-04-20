--
-- PostgreSQL database dump
--

-- Dumped from database version 17.2 (Postgres.app)
-- Dumped by pg_dump version 17.2 (Postgres.app)

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

ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."TenantSettings" DROP CONSTRAINT IF EXISTS "TenantSettings_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."TaxConfig" DROP CONSTRAINT IF EXISTS "TaxConfig_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."SignatureRequest" DROP CONSTRAINT IF EXISTS "SignatureRequest_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."SignatureRequest" DROP CONSTRAINT IF EXISTS "SignatureRequest_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Sanction" DROP CONSTRAINT IF EXISTS "Sanction_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Sanction" DROP CONSTRAINT IF EXISTS "Sanction_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Sanction" DROP CONSTRAINT IF EXISTS "Sanction_advantageId_fkey";
ALTER TABLE IF EXISTS ONLY public."SalaryAdvance" DROP CONSTRAINT IF EXISTS "SalaryAdvance_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."SalaryAdvance" DROP CONSTRAINT IF EXISTS "SalaryAdvance_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_payrollId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Payroll" DROP CONSTRAINT IF EXISTS "Payroll_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Overtime" DROP CONSTRAINT IF EXISTS "Overtime_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Overtime" DROP CONSTRAINT IF EXISTS "Overtime_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."OvertimeConfig" DROP CONSTRAINT IF EXISTS "OvertimeConfig_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTemplate" DROP CONSTRAINT IF EXISTS "OnboardingTemplate_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTask" DROP CONSTRAINT IF EXISTS "OnboardingTask_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Leave" DROP CONSTRAINT IF EXISTS "Leave_leaveTypeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Leave" DROP CONSTRAINT IF EXISTS "Leave_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeaveType" DROP CONSTRAINT IF EXISTS "LeaveType_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."LeaveBalance" DROP CONSTRAINT IF EXISTS "LeaveBalance_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Holiday" DROP CONSTRAINT IF EXISTS "Holiday_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Grade" DROP CONSTRAINT IF EXISTS "Grade_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."GradeAdvantage" DROP CONSTRAINT IF EXISTS "GradeAdvantage_gradeId_fkey";
ALTER TABLE IF EXISTS ONLY public."GradeAdvantage" DROP CONSTRAINT IF EXISTS "GradeAdvantage_advantageId_fkey";
ALTER TABLE IF EXISTS ONLY public."ExpenseReport" DROP CONSTRAINT IF EXISTS "ExpenseReport_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."ExpenseReport" DROP CONSTRAINT IF EXISTS "ExpenseReport_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."ExpenseItem" DROP CONSTRAINT IF EXISTS "ExpenseItem_expenseReportId_fkey";
ALTER TABLE IF EXISTS ONLY public."Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_evaluatorId_fkey";
ALTER TABLE IF EXISTS ONLY public."Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_campaignId_fkey";
ALTER TABLE IF EXISTS ONLY public."EvaluationCampaign" DROP CONSTRAINT IF EXISTS "EvaluationCampaign_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_managerId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_gradeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_departmentId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeTimeline" DROP CONSTRAINT IF EXISTS "EmployeeTimeline_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeAdvantage" DROP CONSTRAINT IF EXISTS "EmployeeAdvantage_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeAdvantage" DROP CONSTRAINT IF EXISTS "EmployeeAdvantage_advantageId_fkey";
ALTER TABLE IF EXISTS ONLY public."Document" DROP CONSTRAINT IF EXISTS "Document_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Department" DROP CONSTRAINT IF EXISTS "Department_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Department" DROP CONSTRAINT IF EXISTS "Department_parentId_fkey";
ALTER TABLE IF EXISTS ONLY public."Declaration" DROP CONSTRAINT IF EXISTS "Declaration_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_employeeId_fkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_attendanceCodeId_fkey";
ALTER TABLE IF EXISTS ONLY public."AttendanceCode" DROP CONSTRAINT IF EXISTS "AttendanceCode_tenantId_fkey";
ALTER TABLE IF EXISTS ONLY public."Advantage" DROP CONSTRAINT IF EXISTS "Advantage_tenantId_fkey";
DROP INDEX IF EXISTS public."User_tenantId_phone_key";
DROP INDEX IF EXISTS public."User_tenantId_email_key";
DROP INDEX IF EXISTS public."User_employeeId_key";
DROP INDEX IF EXISTS public."Tenant_subdomain_key";
DROP INDEX IF EXISTS public."TenantSettings_tenantId_key";
DROP INDEX IF EXISTS public."TaxConfig_tenantId_key";
DROP INDEX IF EXISTS public."SignatureRequest_tenantId_idx";
DROP INDEX IF EXISTS public."SignatureRequest_status_idx";
DROP INDEX IF EXISTS public."SignatureRequest_employeeId_idx";
DROP INDEX IF EXISTS public."Sanction_tenantId_idx";
DROP INDEX IF EXISTS public."Sanction_status_idx";
DROP INDEX IF EXISTS public."Sanction_employeeId_idx";
DROP INDEX IF EXISTS public."SalaryAdvance_tenantId_idx";
DROP INDEX IF EXISTS public."SalaryAdvance_status_idx";
DROP INDEX IF EXISTS public."SalaryAdvance_employeeId_idx";
DROP INDEX IF EXISTS public."Payslip_payrollId_employeeId_key";
DROP INDEX IF EXISTS public."Payroll_tenantId_year_month_idx";
DROP INDEX IF EXISTS public."Payroll_tenantId_month_year_key";
DROP INDEX IF EXISTS public."Overtime_tenantId_employeeId_date_tier_key";
DROP INDEX IF EXISTS public."Overtime_tenantId_date_idx";
DROP INDEX IF EXISTS public."Overtime_employeeId_idx";
DROP INDEX IF EXISTS public."OvertimeConfig_tenantId_key";
DROP INDEX IF EXISTS public."Leave_status_idx";
DROP INDEX IF EXISTS public."Leave_employeeId_startDate_idx";
DROP INDEX IF EXISTS public."LeaveType_tenantId_code_key";
DROP INDEX IF EXISTS public."LeaveBalance_employeeId_leaveTypeCode_year_key";
DROP INDEX IF EXISTS public."Holiday_tenantId_date_key";
DROP INDEX IF EXISTS public."Holiday_tenantId_date_idx";
DROP INDEX IF EXISTS public."Grade_tenantId_name_key";
DROP INDEX IF EXISTS public."GradeAdvantage_gradeId_advantageId_key";
DROP INDEX IF EXISTS public."ExpenseReport_tenantId_idx";
DROP INDEX IF EXISTS public."ExpenseReport_status_idx";
DROP INDEX IF EXISTS public."ExpenseReport_employeeId_idx";
DROP INDEX IF EXISTS public."Evaluation_campaignId_employeeId_key";
DROP INDEX IF EXISTS public."Employee_tenantId_matricule_key";
DROP INDEX IF EXISTS public."Employee_tenantId_cin_key";
DROP INDEX IF EXISTS public."EmployeeAdvantage_employeeId_advantageId_key";
DROP INDEX IF EXISTS public."Department_tenantId_name_key";
DROP INDEX IF EXISTS public."AuditLog_userId_idx";
DROP INDEX IF EXISTS public."AuditLog_tenantId_idx";
DROP INDEX IF EXISTS public."AuditLog_createdAt_idx";
DROP INDEX IF EXISTS public."AuditLog_action_idx";
DROP INDEX IF EXISTS public."Attendance_tenantId_employeeId_date_key";
DROP INDEX IF EXISTS public."Attendance_tenantId_date_idx";
DROP INDEX IF EXISTS public."Attendance_employeeId_idx";
DROP INDEX IF EXISTS public."AttendanceCode_tenantId_idx";
DROP INDEX IF EXISTS public."AttendanceCode_tenantId_code_key";
DROP INDEX IF EXISTS public."Advantage_tenantId_name_key";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."Tenant" DROP CONSTRAINT IF EXISTS "Tenant_pkey";
ALTER TABLE IF EXISTS ONLY public."TenantSettings" DROP CONSTRAINT IF EXISTS "TenantSettings_pkey";
ALTER TABLE IF EXISTS ONLY public."TaxConfig" DROP CONSTRAINT IF EXISTS "TaxConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."SignatureRequest" DROP CONSTRAINT IF EXISTS "SignatureRequest_pkey";
ALTER TABLE IF EXISTS ONLY public."Sanction" DROP CONSTRAINT IF EXISTS "Sanction_pkey";
ALTER TABLE IF EXISTS ONLY public."SalaryAdvance" DROP CONSTRAINT IF EXISTS "SalaryAdvance_pkey";
ALTER TABLE IF EXISTS ONLY public."Payslip" DROP CONSTRAINT IF EXISTS "Payslip_pkey";
ALTER TABLE IF EXISTS ONLY public."Payroll" DROP CONSTRAINT IF EXISTS "Payroll_pkey";
ALTER TABLE IF EXISTS ONLY public."Overtime" DROP CONSTRAINT IF EXISTS "Overtime_pkey";
ALTER TABLE IF EXISTS ONLY public."OvertimeConfig" DROP CONSTRAINT IF EXISTS "OvertimeConfig_pkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTemplate" DROP CONSTRAINT IF EXISTS "OnboardingTemplate_pkey";
ALTER TABLE IF EXISTS ONLY public."OnboardingTask" DROP CONSTRAINT IF EXISTS "OnboardingTask_pkey";
ALTER TABLE IF EXISTS ONLY public."Leave" DROP CONSTRAINT IF EXISTS "Leave_pkey";
ALTER TABLE IF EXISTS ONLY public."LeaveType" DROP CONSTRAINT IF EXISTS "LeaveType_pkey";
ALTER TABLE IF EXISTS ONLY public."LeaveBalance" DROP CONSTRAINT IF EXISTS "LeaveBalance_pkey";
ALTER TABLE IF EXISTS ONLY public."Holiday" DROP CONSTRAINT IF EXISTS "Holiday_pkey";
ALTER TABLE IF EXISTS ONLY public."Grade" DROP CONSTRAINT IF EXISTS "Grade_pkey";
ALTER TABLE IF EXISTS ONLY public."GradeAdvantage" DROP CONSTRAINT IF EXISTS "GradeAdvantage_pkey";
ALTER TABLE IF EXISTS ONLY public."ExpenseReport" DROP CONSTRAINT IF EXISTS "ExpenseReport_pkey";
ALTER TABLE IF EXISTS ONLY public."ExpenseItem" DROP CONSTRAINT IF EXISTS "ExpenseItem_pkey";
ALTER TABLE IF EXISTS ONLY public."Evaluation" DROP CONSTRAINT IF EXISTS "Evaluation_pkey";
ALTER TABLE IF EXISTS ONLY public."EvaluationCampaign" DROP CONSTRAINT IF EXISTS "EvaluationCampaign_pkey";
ALTER TABLE IF EXISTS ONLY public."Employee" DROP CONSTRAINT IF EXISTS "Employee_pkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeTimeline" DROP CONSTRAINT IF EXISTS "EmployeeTimeline_pkey";
ALTER TABLE IF EXISTS ONLY public."EmployeeAdvantage" DROP CONSTRAINT IF EXISTS "EmployeeAdvantage_pkey";
ALTER TABLE IF EXISTS ONLY public."Document" DROP CONSTRAINT IF EXISTS "Document_pkey";
ALTER TABLE IF EXISTS ONLY public."Department" DROP CONSTRAINT IF EXISTS "Department_pkey";
ALTER TABLE IF EXISTS ONLY public."Declaration" DROP CONSTRAINT IF EXISTS "Declaration_pkey";
ALTER TABLE IF EXISTS ONLY public."AuditLog" DROP CONSTRAINT IF EXISTS "AuditLog_pkey";
ALTER TABLE IF EXISTS ONLY public."Attendance" DROP CONSTRAINT IF EXISTS "Attendance_pkey";
ALTER TABLE IF EXISTS ONLY public."AttendanceCode" DROP CONSTRAINT IF EXISTS "AttendanceCode_pkey";
ALTER TABLE IF EXISTS ONLY public."Advantage" DROP CONSTRAINT IF EXISTS "Advantage_pkey";
DROP TABLE IF EXISTS public."User";
DROP TABLE IF EXISTS public."TenantSettings";
DROP TABLE IF EXISTS public."Tenant";
DROP TABLE IF EXISTS public."TaxConfig";
DROP TABLE IF EXISTS public."SignatureRequest";
DROP TABLE IF EXISTS public."Sanction";
DROP TABLE IF EXISTS public."SalaryAdvance";
DROP TABLE IF EXISTS public."Payslip";
DROP TABLE IF EXISTS public."Payroll";
DROP TABLE IF EXISTS public."OvertimeConfig";
DROP TABLE IF EXISTS public."Overtime";
DROP TABLE IF EXISTS public."OnboardingTemplate";
DROP TABLE IF EXISTS public."OnboardingTask";
DROP TABLE IF EXISTS public."LeaveType";
DROP TABLE IF EXISTS public."LeaveBalance";
DROP TABLE IF EXISTS public."Leave";
DROP TABLE IF EXISTS public."Holiday";
DROP TABLE IF EXISTS public."GradeAdvantage";
DROP TABLE IF EXISTS public."Grade";
DROP TABLE IF EXISTS public."ExpenseReport";
DROP TABLE IF EXISTS public."ExpenseItem";
DROP TABLE IF EXISTS public."EvaluationCampaign";
DROP TABLE IF EXISTS public."Evaluation";
DROP TABLE IF EXISTS public."EmployeeTimeline";
DROP TABLE IF EXISTS public."EmployeeAdvantage";
DROP TABLE IF EXISTS public."Employee";
DROP TABLE IF EXISTS public."Document";
DROP TABLE IF EXISTS public."Department";
DROP TABLE IF EXISTS public."Declaration";
DROP TABLE IF EXISTS public."AuditLog";
DROP TABLE IF EXISTS public."AttendanceCode";
DROP TABLE IF EXISTS public."Attendance";
DROP TABLE IF EXISTS public."Advantage";
DROP TYPE IF EXISTS public."UserRole";
DROP TYPE IF EXISTS public."TerminationReason";
DROP TYPE IF EXISTS public."SignatureStatus";
DROP TYPE IF EXISTS public."SignatureMode";
DROP TYPE IF EXISTS public."SignatureInitiator";
DROP TYPE IF EXISTS public."SanctionType";
DROP TYPE IF EXISTS public."SanctionStatus";
DROP TYPE IF EXISTS public."SalaryAdvanceStatus";
DROP TYPE IF EXISTS public."PayrollStatus";
DROP TYPE IF EXISTS public."OvertimeTier";
DROP TYPE IF EXISTS public."OrgUnitType";
DROP TYPE IF EXISTS public."LeaveStatus";
DROP TYPE IF EXISTS public."LeaveCarryOverPolicy";
DROP TYPE IF EXISTS public."Gender";
DROP TYPE IF EXISTS public."ExpenseStatus";
DROP TYPE IF EXISTS public."ExpenseCategory";
DROP TYPE IF EXISTS public."EvaluationStatus";
DROP TYPE IF EXISTS public."EvaluationCampaignStatus";
DROP TYPE IF EXISTS public."EmployeeStatus";
DROP TYPE IF EXISTS public."DocumentType";
DROP TYPE IF EXISTS public."DeclarationType";
DROP TYPE IF EXISTS public."DeclarationStatus";
DROP TYPE IF EXISTS public."Currency";
DROP TYPE IF EXISTS public."ContractType";
DROP TYPE IF EXISTS public."AdvantageType";
--
-- Name: AdvantageType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AdvantageType" AS ENUM (
    'PRIME',
    'INDEMNITE',
    'AVANTAGE_NATURE'
);


--
-- Name: ContractType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ContractType" AS ENUM (
    'CDI',
    'CDD',
    'STAGE',
    'PRESTATION'
);


--
-- Name: Currency; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Currency" AS ENUM (
    'MRU',
    'EUR',
    'USD'
);


--
-- Name: DeclarationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DeclarationStatus" AS ENUM (
    'DRAFT',
    'GENERATED',
    'SUBMITTED'
);


--
-- Name: DeclarationType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DeclarationType" AS ENUM (
    'DAS_UNITE_MIXTE',
    'DAS_DGI',
    'ITS_DGI',
    'ITS_GTA',
    'TAXE_APPRENTISSAGE_DGI'
);


--
-- Name: DocumentType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."DocumentType" AS ENUM (
    'CONTRACT',
    'PAYSLIP',
    'ATTESTATION',
    'JUSTIFICATION',
    'BADGE',
    'OTHER'
);


--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'ON_LEAVE',
    'TERMINATED'
);


--
-- Name: EvaluationCampaignStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EvaluationCampaignStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'CLOSED'
);


--
-- Name: EvaluationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."EvaluationStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED'
);


--
-- Name: ExpenseCategory; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExpenseCategory" AS ENUM (
    'TRANSPORT',
    'MEALS',
    'ACCOMMODATION',
    'SUPPLIES',
    'COMMUNICATION',
    'TRAINING',
    'OTHER'
);


--
-- Name: ExpenseStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ExpenseStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'APPROVED',
    'REJECTED',
    'REIMBURSED'
);


--
-- Name: Gender; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE'
);


--
-- Name: LeaveCarryOverPolicy; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeaveCarryOverPolicy" AS ENUM (
    'NONE',
    'CAPPED',
    'UNLIMITED',
    'CONFIGURABLE'
);


--
-- Name: LeaveStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: OrgUnitType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OrgUnitType" AS ENUM (
    'DIRECTION',
    'DEPARTMENT',
    'SERVICE'
);


--
-- Name: OvertimeTier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."OvertimeTier" AS ENUM (
    'TIER_1',
    'TIER_2',
    'TIER_3'
);


--
-- Name: PayrollStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."PayrollStatus" AS ENUM (
    'DRAFT',
    'PROCESSING',
    'VALIDATED',
    'CLOSED'
);


--
-- Name: SalaryAdvanceStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SalaryAdvanceStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'DEDUCTED'
);


--
-- Name: SanctionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SanctionStatus" AS ENUM (
    'ACTIVE',
    'ARCHIVED'
);


--
-- Name: SanctionType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SanctionType" AS ENUM (
    'DEDUCTION_PRIME',
    'RETENUE_SALAIRE',
    'AVERTISSEMENT',
    'MISE_A_PIED'
);


--
-- Name: SignatureInitiator; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SignatureInitiator" AS ENUM (
    'ADMIN',
    'EMPLOYEE'
);


--
-- Name: SignatureMode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SignatureMode" AS ENUM (
    'EMPLOYEE_ONLY',
    'ADMIN_ONLY',
    'DUAL'
);


--
-- Name: SignatureStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SignatureStatus" AS ENUM (
    'PENDING',
    'AWAITING_ADMIN',
    'AWAITING_VALIDATION',
    'SIGNED',
    'REJECTED',
    'CANCELLED'
);


--
-- Name: TerminationReason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TerminationReason" AS ENUM (
    'RESIGNATION',
    'DISMISSAL',
    'MUTUAL_AGREEMENT',
    'END_OF_CONTRACT',
    'RETIREMENT',
    'LAYOFF',
    'ABANDONMENT',
    'DEATH'
);


--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."UserRole" AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'HR',
    'EMPLOYEE'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Advantage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Advantage" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    type public."AdvantageType" NOT NULL,
    amount numeric(12,2),
    "isPercentage" boolean DEFAULT false NOT NULL,
    "isTaxable" boolean DEFAULT true NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    note text,
    "recordedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attendanceCodeId" text NOT NULL
);


--
-- Name: AttendanceCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AttendanceCode" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    code text NOT NULL,
    label text NOT NULL,
    color text DEFAULT '#3b82f6'::text NOT NULL,
    "deductsSalary" boolean DEFAULT false NOT NULL,
    "isDefault" boolean DEFAULT false NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: AuditLog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."AuditLog" (
    id text NOT NULL,
    "tenantId" text,
    "userId" text,
    action text NOT NULL,
    resource text NOT NULL,
    "resourceId" text,
    details jsonb,
    ip text,
    "userAgent" text,
    "statusCode" integer,
    method text,
    path text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Declaration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Declaration" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    type public."DeclarationType" NOT NULL,
    period text NOT NULL,
    status public."DeclarationStatus" DEFAULT 'DRAFT'::public."DeclarationStatus" NOT NULL,
    data jsonb NOT NULL,
    "pdfUrl" text,
    "generatedBy" text,
    "generatedAt" timestamp(3) without time zone,
    "submittedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Department; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    description text,
    "managerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "parentId" text,
    type public."OrgUnitType" DEFAULT 'DEPARTMENT'::public."OrgUnitType" NOT NULL
);


--
-- Name: Document; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    type public."DocumentType" NOT NULL,
    name text NOT NULL,
    url text NOT NULL,
    "generatedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Employee; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Employee" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    matricule text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    cin text,
    "dateOfBirth" timestamp(3) without time zone,
    gender public."Gender",
    address text,
    phone text,
    email text,
    photo text,
    "departmentId" text,
    "position" text NOT NULL,
    "gradeId" text,
    "contractType" public."ContractType" NOT NULL,
    "hireDate" timestamp(3) without time zone NOT NULL,
    "contractEndDate" timestamp(3) without time zone,
    "trialEndDate" timestamp(3) without time zone,
    "baseSalary" numeric(12,2) NOT NULL,
    currency public."Currency" DEFAULT 'MRU'::public."Currency" NOT NULL,
    status public."EmployeeStatus" DEFAULT 'ACTIVE'::public."EmployeeStatus" NOT NULL,
    "managerId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "terminationDate" date,
    "terminationNotes" text,
    "terminationReason" public."TerminationReason"
);


--
-- Name: EmployeeAdvantage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeAdvantage" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "advantageId" text NOT NULL,
    "customAmount" numeric(12,2),
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone,
    "isActive" boolean DEFAULT true NOT NULL
);


--
-- Name: EmployeeTimeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EmployeeTimeline" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    event text NOT NULL,
    description text NOT NULL,
    "oldValue" text,
    "newValue" text,
    "performedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Evaluation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Evaluation" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "campaignId" text NOT NULL,
    "employeeId" text NOT NULL,
    "evaluatorId" text,
    scores jsonb,
    "overallScore" numeric(4,2),
    strengths text,
    improvements text,
    objectives text,
    status public."EvaluationStatus" DEFAULT 'PENDING'::public."EvaluationStatus" NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: EvaluationCampaign; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."EvaluationCampaign" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    description text,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    status public."EvaluationCampaignStatus" DEFAULT 'DRAFT'::public."EvaluationCampaignStatus" NOT NULL,
    criteria jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: ExpenseItem; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExpenseItem" (
    id text NOT NULL,
    "expenseReportId" text NOT NULL,
    category public."ExpenseCategory" NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    date date NOT NULL,
    "receiptUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: ExpenseReport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."ExpenseReport" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "employeeId" text NOT NULL,
    title text NOT NULL,
    "totalAmount" numeric(12,2) DEFAULT 0 NOT NULL,
    status public."ExpenseStatus" DEFAULT 'DRAFT'::public."ExpenseStatus" NOT NULL,
    "submittedAt" timestamp(3) without time zone,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Grade; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Grade" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    level integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: GradeAdvantage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GradeAdvantage" (
    id text NOT NULL,
    "gradeId" text NOT NULL,
    "advantageId" text NOT NULL,
    "customAmount" numeric(12,2)
);


--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Holiday" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    date date NOT NULL,
    "isRecurring" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Leave; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Leave" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeId" text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "totalDays" numeric(4,1) NOT NULL,
    reason text,
    status public."LeaveStatus" DEFAULT 'PENDING'::public."LeaveStatus" NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "justificationUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LeaveBalance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveBalance" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    "leaveTypeCode" text NOT NULL,
    year integer NOT NULL,
    entitled numeric(4,1) DEFAULT 0 NOT NULL,
    taken numeric(4,1) DEFAULT 0 NOT NULL,
    "carriedOver" numeric(4,1) DEFAULT 0 NOT NULL,
    remaining numeric(4,1) DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: LeaveType; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."LeaveType" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "defaultDays" integer NOT NULL,
    "isPaid" boolean DEFAULT true NOT NULL,
    "requiresJustification" boolean DEFAULT false NOT NULL,
    color text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnboardingTask; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnboardingTask" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    title text NOT NULL,
    description text,
    "assignedTo" text,
    "isCompleted" boolean DEFAULT false NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "dueDate" timestamp(3) without time zone,
    "order" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OnboardingTemplate; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OnboardingTemplate" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    name text NOT NULL,
    tasks jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Overtime; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Overtime" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "employeeId" text NOT NULL,
    date date NOT NULL,
    hours numeric(5,2) NOT NULL,
    tier public."OvertimeTier" DEFAULT 'TIER_1'::public."OvertimeTier" NOT NULL,
    rate numeric(4,2) NOT NULL,
    reason text,
    "recordedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: OvertimeConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OvertimeConfig" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    tiers jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payroll; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payroll" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    status public."PayrollStatus" DEFAULT 'DRAFT'::public."PayrollStatus" NOT NULL,
    "processedBy" text,
    "processedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Payslip; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Payslip" (
    id text NOT NULL,
    "payrollId" text NOT NULL,
    "employeeId" text NOT NULL,
    "baseSalary" numeric(12,2) NOT NULL,
    "totalAdvantages" numeric(12,2) NOT NULL,
    "grossSalary" numeric(12,2) NOT NULL,
    "cnssEmployee" numeric(12,2) NOT NULL,
    "cnssEmployer" numeric(12,2) NOT NULL,
    "itsAmount" numeric(12,2) NOT NULL,
    "otherDeductions" numeric(12,2) DEFAULT 0 NOT NULL,
    "netSalary" numeric(12,2) NOT NULL,
    "advantagesDetail" jsonb,
    "deductionsDetail" jsonb,
    "pdfUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "attendanceDeductions" numeric(12,2) DEFAULT 0 NOT NULL,
    "advanceDeductions" numeric(12,2) DEFAULT 0 NOT NULL,
    "overtimePay" numeric(12,2) DEFAULT 0 NOT NULL,
    "cnamEmployee" numeric(12,2) DEFAULT 0 NOT NULL,
    "cnamEmployer" numeric(12,2) DEFAULT 0 NOT NULL,
    "mdtAmount" numeric(12,2) DEFAULT 0 NOT NULL
);


--
-- Name: SalaryAdvance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SalaryAdvance" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "employeeId" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    "requestDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reason text,
    status public."SalaryAdvanceStatus" DEFAULT 'PENDING'::public."SalaryAdvanceStatus" NOT NULL,
    "reviewedBy" text,
    "reviewedAt" timestamp(3) without time zone,
    "rejectionReason" text,
    "deductedInPayslipId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: Sanction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Sanction" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "employeeId" text NOT NULL,
    type public."SanctionType" NOT NULL,
    reason text NOT NULL,
    comment text,
    date date NOT NULL,
    "advantageId" text,
    "deductionAmount" numeric(12,2) NOT NULL,
    "issuedBy" text NOT NULL,
    status public."SanctionStatus" DEFAULT 'ACTIVE'::public."SanctionStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: SignatureRequest; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SignatureRequest" (
    id text NOT NULL,
    "employeeId" text NOT NULL,
    status public."SignatureStatus" DEFAULT 'PENDING'::public."SignatureStatus" NOT NULL,
    "requestedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    description text,
    "documentType" public."DocumentType" DEFAULT 'CONTRACT'::public."DocumentType" NOT NULL,
    "expiresAt" timestamp(3) without time zone,
    "requestedBy" text NOT NULL,
    "tenantId" text NOT NULL,
    title text NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "adminSignature" text,
    "adminSignedAt" timestamp(3) without time zone,
    "employeeSignature" text,
    "employeeSignedAt" timestamp(3) without time zone,
    "initiatedBy" public."SignatureInitiator" DEFAULT 'ADMIN'::public."SignatureInitiator" NOT NULL,
    "pdfData" text,
    "rejectionReason" text,
    "signatureMode" public."SignatureMode" DEFAULT 'EMPLOYEE_ONLY'::public."SignatureMode" NOT NULL,
    "validatedBy" text
);


--
-- Name: TaxConfig; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TaxConfig" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "cnssEmployeeRate" numeric(5,4) DEFAULT 0.01 NOT NULL,
    "cnssEmployerRate" numeric(5,4) DEFAULT 0.13 NOT NULL,
    "cnssCeiling" numeric(12,2) DEFAULT 70000 NOT NULL,
    "itsBrackets" jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cnamCeiling" numeric(12,2) DEFAULT 70000 NOT NULL,
    "cnamEmployeeRate" numeric(5,4) DEFAULT 0.0 NOT NULL,
    "cnamEmployerRate" numeric(5,4) DEFAULT 0.04 NOT NULL,
    "mdtRate" numeric(5,4) DEFAULT 0.0025 NOT NULL
);


--
-- Name: Tenant; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Tenant" (
    id text NOT NULL,
    name text NOT NULL,
    subdomain text NOT NULL,
    logo text,
    address text,
    phone text,
    email text,
    currency public."Currency" DEFAULT 'MRU'::public."Currency" NOT NULL,
    "leaveCarryOver" public."LeaveCarryOverPolicy" DEFAULT 'CONFIGURABLE'::public."LeaveCarryOverPolicy" NOT NULL,
    "maxCarryOverDays" integer,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


--
-- Name: TenantSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TenantSettings" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    "fiscalYearStart" integer DEFAULT 1 NOT NULL,
    "workDaysPerWeek" integer DEFAULT 5 NOT NULL,
    "weekStartDay" integer DEFAULT 1 NOT NULL,
    "smtpHost" text,
    "smtpPort" integer,
    "smtpUser" text,
    "smtpPassword" text,
    "smtpFromEmail" text,
    "smtpFromName" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "contractTemplate" text,
    "defaultLeaveDays" integer DEFAULT 24 NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    "tenantId" text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    role public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "lastLogin" timestamp(3) without time zone,
    "refreshToken" text,
    "employeeId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    phone text,
    permissions jsonb
);


--
-- Data for Name: Advantage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Advantage" (id, "tenantId", name, type, amount, "isPercentage", "isTaxable", description, "createdAt", "updatedAt") FROM stdin;
8a1ed1cd-3ef1-4d77-b2ea-e96a66ea5e58	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	logement	PRIME	1000.00	f	t	\N	2026-04-12 14:19:54.502	2026-04-12 14:19:54.502
91d024d7-b19f-45fa-8be6-72738c3d601a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	transport	PRIME	1000.00	f	t	\N	2026-04-14 18:22:43.057	2026-04-14 18:22:43.057
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Attendance" (id, "tenantId", "employeeId", date, note, "recordedBy", "createdAt", "updatedAt", "attendanceCodeId") FROM stdin;
\.


--
-- Data for Name: AttendanceCode; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AttendanceCode" (id, "tenantId", code, label, color, "deductsSalary", "isDefault", "order", "createdAt", "updatedAt") FROM stdin;
66dfb440-f63c-4a25-9083-5b52a5d5332c	3176a7db-252e-4866-a862-59aecca1a446	T	Travaillé	#22c55e	f	t	1	2026-04-16 23:34:49.567	2026-04-16 23:34:49.567
d16f6e1c-457b-42ac-badb-b542bc216043	3176a7db-252e-4866-a862-59aecca1a446	AB	Absence	#ef4444	t	f	2	2026-04-16 23:34:49.58	2026-04-16 23:34:49.58
1f60a657-c515-4e3e-93e7-714d7cbe04a6	3176a7db-252e-4866-a862-59aecca1a446	PR	Permission	#f59e0b	f	f	3	2026-04-16 23:34:49.583	2026-04-16 23:34:49.583
7bc8e2c0-9327-4302-94a3-7782e2a87c6c	3176a7db-252e-4866-a862-59aecca1a446	PS	Permission Spéciale	#8b5cf6	f	f	4	2026-04-16 23:34:49.585	2026-04-16 23:34:49.585
ba229b9a-c12f-403c-a388-03e9de8867b8	3176a7db-252e-4866-a862-59aecca1a446	RM	Repos Médical	#3b82f6	f	f	5	2026-04-16 23:34:49.588	2026-04-16 23:34:49.588
20f86835-d0f0-4522-bc5a-4347ca3e8192	3176a7db-252e-4866-a862-59aecca1a446	RS	Repos Société	#06b6d4	f	f	6	2026-04-16 23:34:49.591	2026-04-16 23:34:49.591
0471653e-fb09-4773-82fc-8322240c43e4	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	T	Travaillé	#22c55e	f	t	1	2026-04-16 23:34:49.594	2026-04-16 23:34:49.594
8504715a-a0c2-40af-ac29-f2acbfc81d49	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	AB	Absence	#ef4444	t	f	2	2026-04-16 23:34:49.597	2026-04-16 23:34:49.597
0d28a486-8805-49dc-a8c4-0b7a1af03748	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	PR	Permission	#f59e0b	f	f	3	2026-04-16 23:34:49.6	2026-04-16 23:34:49.6
a0bca315-ba62-44e2-b62f-f85087b66306	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	PS	Permission Spéciale	#8b5cf6	f	f	4	2026-04-16 23:34:49.602	2026-04-16 23:34:49.602
e15f2cbb-d296-4674-b6b0-36735f3a705e	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	RM	Repos Médical	#3b82f6	f	f	5	2026-04-16 23:34:49.604	2026-04-16 23:34:49.604
59081272-f496-443d-9d3b-8169141ceb59	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	RS	Repos Société	#06b6d4	f	f	6	2026-04-16 23:34:49.607	2026-04-16 23:34:49.607
aab86d4d-7baa-4307-92bd-41505e8944d2	ce382c53-87c2-46e3-b75a-bed8f80652f1	T	Travaillé	#22c55e	f	t	1	2026-04-16 23:34:49.61	2026-04-16 23:34:49.61
cca7e3ac-62a0-47cb-ac07-8b478216240c	ce382c53-87c2-46e3-b75a-bed8f80652f1	AB	Absence	#ef4444	t	f	2	2026-04-16 23:34:49.612	2026-04-16 23:34:49.612
8071e882-b8c0-48d4-81f3-29ac9101b74a	ce382c53-87c2-46e3-b75a-bed8f80652f1	PR	Permission	#f59e0b	f	f	3	2026-04-16 23:34:49.614	2026-04-16 23:34:49.614
ffc0626f-65b4-4b16-b860-bf71b804f32c	ce382c53-87c2-46e3-b75a-bed8f80652f1	PS	Permission Spéciale	#8b5cf6	f	f	4	2026-04-16 23:34:49.616	2026-04-16 23:34:49.616
798f74f8-caad-4180-bace-c122584077d8	ce382c53-87c2-46e3-b75a-bed8f80652f1	RM	Repos Médical	#3b82f6	f	f	5	2026-04-16 23:34:49.618	2026-04-16 23:34:49.618
6e94da2c-da15-470d-a374-7c9f77f63cd5	ce382c53-87c2-46e3-b75a-bed8f80652f1	RS	Repos Société	#06b6d4	f	f	6	2026-04-16 23:34:49.621	2026-04-16 23:34:49.621
f4c8654a-f925-4c5c-98ef-4c3630ef5843	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	T	Travaillé	#22c55e	f	t	1	2026-04-16 23:34:49.623	2026-04-16 23:34:49.623
365ae678-ed0a-4e02-871f-278608bfb2e9	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	AB	Absence	#ef4444	t	f	2	2026-04-16 23:34:49.625	2026-04-16 23:34:49.625
cca978d0-67c9-4882-9408-4f650f698347	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	PR	Permission	#f59e0b	f	f	3	2026-04-16 23:34:49.628	2026-04-16 23:34:49.628
4944b706-e937-4145-ad8b-0063e12418fe	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	PS	Permission Spéciale	#8b5cf6	f	f	4	2026-04-16 23:34:49.63	2026-04-16 23:34:49.63
1162ecdf-9db0-46b4-9637-1f1531b7cb1f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	RM	Repos Médical	#3b82f6	f	f	5	2026-04-16 23:34:49.632	2026-04-16 23:34:49.632
c166b6f9-0266-440e-b8db-1e91c443f3c2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	RS	Repos Société	#06b6d4	f	f	6	2026-04-16 23:34:49.634	2026-04-16 23:34:49.634
c6c68f7b-48b6-4eea-a9b8-8fc285568044	3176a7db-252e-4866-a862-59aecca1a446	JF	Jour Férié	#f97316	f	f	7	2026-04-17 00:44:25.818	2026-04-17 00:44:25.818
847f5074-fc16-4c57-b364-c5c6c1980fe6	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	JF	Jour Férié	#f97316	f	f	7	2026-04-17 00:44:25.835	2026-04-17 00:44:25.835
dd380188-de61-42be-9482-6354aad06ae3	ce382c53-87c2-46e3-b75a-bed8f80652f1	JF	Jour Férié	#f97316	f	f	7	2026-04-17 00:44:25.839	2026-04-17 00:44:25.839
1ec0d4f5-2f47-46a2-b88a-27734321c4c9	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	JF	Jour Férié	#f97316	f	f	7	2026-04-17 00:44:25.841	2026-04-17 00:44:25.841
\.


--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."AuditLog" (id, "tenantId", "userId", action, resource, "resourceId", details, ip, "userAgent", "statusCode", method, path, "createdAt") FROM stdin;
fcdc79b1-ed36-406c-9717-a930a38f96fb	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-11 23:48:45.18
1cea6518-ecc4-46b6-9bac-c7f8b2200e1c	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-12 00:06:18.448
ed8f6f3c-98ae-4851-b00c-f833c531baf9	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-12 00:06:56.784
4f5ff15c-70a6-4d8e-88ea-4be3e597f162	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-12 01:09:25.33
a2df0281-8616-44d1-a1b5-01703141a3c3	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-12 01:09:47.301
a1120aaf-4c3e-43a8-af14-60239da8239d	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-12 23:59:55.872
f97a43c6-08a1-4b10-b616-fc0e1bfb5f2f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-14 00:16:15.009
3153c0bb-244f-4993-ac5b-246c7a367e64	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-14 00:18:50.421
84a97272-9087-4efd-9fa2-80823723b8b1	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-14 00:18:55.525
b14f1dcb-000f-43c1-b522-19d5520b44e6	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-14 00:20:42.176
3fe27d6f-2124-4db3-8603-99c25e4749e2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-16 19:44:23.6
ad6e18e4-227e-4c23-bbb9-0d1abbcffefd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 19:44:30.589
b8996963-43a4-4741-a886-9ae6dcc2d21d	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	409	POST	/api/payrolls	2026-03-16 19:50:21.737
c0071f31-dc91-4a66-89c4-8cce8071d8f6	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-16 19:53:18.781
84cb54dd-77b9-49cf-a2f8-d3b981a4dcbe	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-16 19:53:48.608
1135d47c-c845-4163-b8a6-dfed13d416b8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-16 19:53:52.34
a189ca27-a57d-4bb3-ac41-ace4deb52621	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 19:54:02.695
57fc68ab-6b4c-4af3-9ede-138d77be222d	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-16 19:55:46.917
9114873a-1b44-497a-8ea5-956bd26ea43f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 19:55:52.136
6580f04e-a11d-4576-aad5-0e74198b18e4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	73d1c45c-27c4-4378-8722-be8ab225613b	CREATE_LEAVE	Leave	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/leaves	2026-03-16 19:56:51.753
6d005f68-ff71-401e-a204-f06907fb2f75	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 19:57:05.341
5063b0bc-c251-4703-9668-642e32043c70	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	PROCESS_LEAVE	Leave	9f724ab5-0fc7-4e4d-b444-ff8c51c90667	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PATCH	/api/leaves/9f724ab5-0fc7-4e4d-b444-ff8c51c90667/process	2026-03-16 19:58:53.614
8a4c09bd-4b34-484c-afde-1895a06620f1	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-16 19:59:54.706
5978214b-8a55-4ee2-b3d1-59d63c21db8c	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 20:45:02.765
c77aa0e5-90b1-42d7-b504-671aa621c089	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 21:57:45.027
ff5b093d-8cf6-430a-adde-ea571a898caa	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 22:18:34.408
ad20bf52-7e9c-488e-9dc8-44ace278d360	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures	2026-03-16 22:19:39.331
3b46e16c-1b52-4c60-a770-1f437e87bd79	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures	2026-03-16 22:20:21.779
9b654bba-85dd-445d-9799-23538cebf603	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures	2026-03-16 22:20:22.046
c6cadc28-ef78-48ac-8d55-f91c45a0f69c	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures	2026-03-16 22:22:07.786
a8ffd954-c544-4db8-a8a4-a4b968f0f2f8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures	2026-03-16 22:22:14.93
67ba4a3f-e282-4881-8a7f-57a6d6351384	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/signatures	2026-03-16 22:24:57.491
e5f77c43-b87a-4372-ac28-113e0e64685a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	SIGN_DOCUMENT	SignatureRequest	dd1ebc29-1554-47c4-8e41-217c03bf5331	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures/dd1ebc29-1554-47c4-8e41-217c03bf5331/sign	2026-03-16 22:26:08.907
aa1fd203-2146-4c4d-8d9c-e026a3ccf88e	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	SIGN_DOCUMENT	SignatureRequest	dd1ebc29-1554-47c4-8e41-217c03bf5331	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures/dd1ebc29-1554-47c4-8e41-217c03bf5331/sign	2026-03-16 22:26:30.253
51a8dfb6-99f6-46d5-b891-ebe09eb7dd31	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/signatures	2026-03-16 22:26:54.158
d9568692-3bdb-48df-be71-6c9e0c1cc063	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	SIGN_DOCUMENT	SignatureRequest	93c90ba2-453b-4928-803e-d6fa2d4d7e6a	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures/93c90ba2-453b-4928-803e-d6fa2d4d7e6a/sign	2026-03-16 22:27:00.943
c9ce1e34-298c-4506-b053-c45072390930	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	SIGN_DOCUMENT	SignatureRequest	93c90ba2-453b-4928-803e-d6fa2d4d7e6a	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures/93c90ba2-453b-4928-803e-d6fa2d4d7e6a/sign	2026-03-16 22:28:52.072
12544279-fcbb-4f59-a4b7-99195e88d9d4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	SIGN_DOCUMENT	SignatureRequest	93c90ba2-453b-4928-803e-d6fa2d4d7e6a	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/signatures/93c90ba2-453b-4928-803e-d6fa2d4d7e6a/sign	2026-03-16 22:29:18.878
3422a5be-983b-491f-9bb4-ace177f82e6a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 22:32:38.255
2f3b50c5-747a-4554-b3fa-f73ec3317c46	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 23:18:17.708
2795413b-2007-45f1-bed7-88064f878655	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	73d1c45c-27c4-4378-8722-be8ab225613b	SIGN_DOCUMENT	SignatureRequest	93c90ba2-453b-4928-803e-d6fa2d4d7e6a	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/signatures/93c90ba2-453b-4928-803e-d6fa2d4d7e6a/sign	2026-03-16 23:24:01.642
67108763-7cb4-4f30-a170-5d4df27f2c43	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 23:34:34.311
1b2720eb-eb40-484c-a876-063c3bc22b87	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 23:41:14.05
6a13ebe6-487f-4d0b-b88a-6f5631dec739	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-16 23:58:36.289
ea1a1988-a2e6-46c2-80d5-2d81afd0eeff	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-17 00:21:41.129
b2bdb6e0-2278-4032-bb56-7d6f3196dd04	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-27 18:50:34.961
602eecd9-7712-46e7-9f4e-589eea901354	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ATTENDANCE	Attendance	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/attendance	2026-03-27 18:52:05.821
126f21ce-599d-4316-85c7-29e14a1f1fae	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-27 19:24:32.688
611f6e2d-3165-4671-af33-1588d8866273	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-27 20:17:00.473
04687742-4f6a-4104-8c89-7e07925326e0	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-27 20:17:30.734
c9c9a992-4b89-4512-847a-69c0e86ea813	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-27 20:32:16.13
813db29a-5c20-460f-9ed1-0e8c4d4393d7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 18:08:31.961
7c4e804f-cd03-4e24-b87e-a0512be2bb26	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 18:31:48.967
19cb336e-6aa3-4f2d-a402-9add82c572c0	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 18:48:01.206
a802dc9b-7d04-47fd-a547-513255d4858a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 21:11:40.919
01c732e3-8dc1-4b91-9bd1-f5be1f01045a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-03-28 21:22:37.065
2bb69920-eed6-4c6e-9fb5-c4e7b1b87cd6	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	713021d0-bcfd-47de-ad18-1d2213021004	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/713021d0-bcfd-47de-ad18-1d2213021004/generate	2026-03-28 21:22:37.262
dcb33b6d-064a-4717-85d2-dc3d62aeaabd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_EMPLOYEE	Employee	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/employees	2026-03-28 21:26:25.564
778dd07b-972e-453b-9299-f33ad7c2cc0f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 21:26:52.445
f3ae9a86-8657-422e-a36e-d4a7eed3db6b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 21:41:44.749
139c035e-5184-488c-8d53-16402e23613e	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 21:45:05.534
d6f8dfae-457d-454d-bff0-8120b956fbcf	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-28 23:27:49.741
fd4ddf36-4e63-4edb-97c6-c6e055dddb73	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	CREATE_TENANT	Tenant	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/tenants	2026-03-28 23:29:28.705
18070a60-81be-44af-9d99-12350e3871bc	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-28 23:31:56.507
91ffc494-ba66-41ef-960c-34a1404dbc87	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 23:37:30.324
743c9123-5260-43ab-a65f-6c8c4afb5424	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-28 23:54:22.408
6d2a26a5-c7c5-4880-ac0e-bcac79b64eca	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 00:31:17.974
fd7ab17f-7370-48a0-9b07-10cf68cbba12	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 00:39:19.23
fcce6edb-8909-4711-8f05-f593666f1cf7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 01:03:41.64
537b7584-e277-4d82-ae17-dc4eac627b51	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 01:47:34.983
101fe203-e7bc-482a-b334-1bcfd823da01	\N	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-28 23:30:33.851
e45be2aa-3d15-4037-8966-62f357979349	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	UPDATE_ATTENDANCE_CONFIG	AttendanceConfig	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PUT	/api/attendance/config	2026-03-29 01:55:31.524
c1c1e982-1f55-404e-819d-da9f291d3400	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-29 01:56:43.777
b4d00c1c-dfac-4d29-a741-01252dce84b3	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	TOGGLE_TENANT_STATUS	Tenant	ec8b230a-dbfb-4f24-bb77-237c9a0a9287	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PATCH	/api/tenants/ec8b230a-dbfb-4f24-bb77-237c9a0a9287/status	2026-03-29 02:11:17.492
7bd5ea86-a291-48f6-86d0-35997afb53e7	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	TOGGLE_TENANT_STATUS	Tenant	ec8b230a-dbfb-4f24-bb77-237c9a0a9287	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PATCH	/api/tenants/ec8b230a-dbfb-4f24-bb77-237c9a0a9287/status	2026-03-29 02:11:18.348
d6244f50-7338-4250-a5a6-cfe31b784fcb	\N	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-28 23:31:12.295
72b27cb4-c6c4-4b2b-90b0-881294d80a3b	\N	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-28 23:31:23.716
45b9d735-6821-43fc-8884-82d7084cf8ad	\N	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/login	2026-03-29 01:56:30.895
552a3d71-a5ef-4ee6-949a-5696a3f1c7c6	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	DELETE_TENANT	Tenant	ec8b230a-dbfb-4f24-bb77-237c9a0a9287	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	DELETE	/api/tenants/ec8b230a-dbfb-4f24-bb77-237c9a0a9287	2026-03-29 02:11:22.236
b332cd7a-4056-4d54-ba6f-470d07f8be37	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	401	POST	/api/auth/super-login	2026-03-29 02:12:57.879
01a98e96-f1d3-4c7d-b1dd-133729584bdd	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-03-29 02:13:05.752
52372a00-4fef-4a22-abcd-571dd76a9ac2	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	CREATE_TENANT	Tenant	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/tenants	2026-03-29 02:13:47.81
15c14900-f3b4-437a-a353-a0fe184954c8	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	CREATE_TENANT	Tenant	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	400	POST	/api/tenants	2026-03-29 02:14:04.537
6f189cf5-ff7b-4dda-8383-132186f810b2	ce382c53-87c2-46e3-b75a-bed8f80652f1	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 02:15:40.323
836a2b72-06ae-4175-a251-879f93e1e0d8	ce382c53-87c2-46e3-b75a-bed8f80652f1	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-03-29 19:52:34.124
d811c528-bd56-46a7-8ec2-a75cae9503cb	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-04 13:58:06.472
31942f6e-157e-478a-9710-fa531473decf	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-04 14:45:40.403
c342910c-8955-4982-abfe-0c6d81b41eed	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-07 15:47:25.916
88aca359-f47b-4a7d-aadc-7bca3f556e1b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-07 23:22:24.381
27584692-56d7-436c-b796-be8ffdfae517	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-07 23:37:48.15
70dd56cf-e122-41eb-a791-31144bc2d5d2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SANCTION	Sanction	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/sanctions	2026-04-07 23:41:13.131
b6c7f4d5-6987-4a57-93e3-3005876086e8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	409	POST	/api/payrolls	2026-04-07 23:41:41.791
17c7d524-4528-48c1-ad61-50c15521182a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-07 23:46:38.681
3c4ec65f-82a6-4f2a-b352-33dfbc7419f7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	56bbd093-631a-40e4-a15b-2879a3e3a1e8	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/56bbd093-631a-40e4-a15b-2879a3e3a1e8/generate	2026-04-07 23:46:38.946
779534d3-99a3-40d6-80fb-85a2b1de551f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SANCTION	Sanction	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/sanctions	2026-04-07 23:47:26.632
93993e9d-0891-410b-9a53-37cafe44b41d	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-07 23:47:57.377
0eb34bd5-43cc-447b-bd00-4dcdb4530f82	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	88999dbe-6f0a-4fcc-93c7-ac85fd7abc88	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/88999dbe-6f0a-4fcc-93c7-ac85fd7abc88/generate	2026-04-07 23:47:57.473
e50c3f88-8a19-4a3e-881a-5891846b82bf	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-07 23:50:19.209
fdfa0735-8a93-46ce-a39f-e840cb529b02	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-07 23:50:19.318
0c93251d-6390-403f-b0f6-13bad0bd03c3	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-07 23:57:33.196
d896a99d-a7f0-4310-bc47-aca29a4db3d8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-08 00:10:15.901
5d834cfa-6baf-4ff1-abb2-c0ae4155e52d	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 00:14:13.812
e6871e17-eb6d-45d6-858a-a374d1f1a5cd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ORG_LEVEL	OrgLevel	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/org-levels	2026-04-08 00:24:01.418
8021f6de-588a-411e-93b1-e4d430c31825	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ORG_LEVEL	OrgLevel	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/org-levels	2026-04-08 00:24:21.417
da95b169-6563-4f89-a2c5-836d3a428fcf	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ORG_LEVEL	OrgLevel	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	409	POST	/api/org-levels	2026-04-08 00:24:35.798
a961340a-761f-4f99-b2ef-5a8783cb40b3	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	UPDATE_EMPLOYEE	Employee	97f72f1f-6416-4630-a8f5-e8cc9c45edf4	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PUT	/api/employees/97f72f1f-6416-4630-a8f5-e8cc9c45edf4	2026-04-08 00:29:11.455
3eeac91a-e7a6-4784-98fa-6a040ac8144b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 00:29:20.051
75855711-02a4-4ec5-bd1f-9343e2ecaf25	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ORG_LEVEL	OrgLevel	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/org-levels	2026-04-08 00:39:56.452
511fcea2-bf39-4a8a-82e2-a97efffcb799	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 00:45:48.058
4b4f9668-9b5b-47fa-bd31-d512e237d4b2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 01:01:50.173
8d19d79c-5938-4da6-a106-140bf8ed4b3a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 01:20:19.426
e3aa4605-c5cd-4292-846e-fbfac060cd90	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 14:13:47.007
6ddc890f-b505-4c18-8f90-1fa42ec2c4b3	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_ORG_LEVEL	OrgLevel	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/org-levels	2026-04-08 14:14:36.827
8f9a2cbb-3441-4baa-8928-13134097f818	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 14:30:23.108
ab16ba54-234e-46dd-87c2-2272f042fad0	\N	\N	SUPER_ADMIN_LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/super-login	2026-04-08 14:37:52.753
e8adad07-60f7-41d7-94bb-f85331fd0dc4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 14:41:16.301
96d9317c-18b5-46fe-8384-4f446cf8945b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_EMPLOYEE	Employee	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/employees	2026-04-08 14:48:50.242
af27c9ea-2c6a-4b40-92c6-a8632fee9a67	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-08 17:23:31.239
779c527a-16e2-4c59-b37d-ce67aec06f57	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 17:25:36.44
2f7501b7-882e-4442-b902-98e0cf0f6f5e	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 17:45:01.678
0256a2d9-1f32-4cb6-ad63-3cf9cf9f388f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 18:03:53.046
a22b6ba7-f72a-4716-a716-8fc0d179e6cc	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-09 18:07:48.573
5bf4ce9e-0195-4d57-a1d3-09abffbe3db8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	88999dbe-6f0a-4fcc-93c7-ac85fd7abc88	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/88999dbe-6f0a-4fcc-93c7-ac85fd7abc88/generate	2026-04-09 18:07:50.212
4569462b-5f0f-449e-9219-23344cf6618f	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-09 18:07:51.983
44969dd0-ac2a-4403-892b-08b4b40a41e4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-09 18:08:41.981
728baa54-9957-418b-b194-7590ab414c74	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	fbac9d82-af6d-451c-9fae-bd031046680d	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/fbac9d82-af6d-451c-9fae-bd031046680d/generate	2026-04-09 18:18:33.48
cede8716-99b5-4815-98ae-ad05c17fe5eb	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	88999dbe-6f0a-4fcc-93c7-ac85fd7abc88	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/88999dbe-6f0a-4fcc-93c7-ac85fd7abc88/generate	2026-04-09 18:18:34.249
8fea890c-1dde-4374-a617-bd252aca5910	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 18:19:40.401
41f0ba5c-a4a9-42c6-9247-06eb37db85b6	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 18:46:51.66
122dc644-620c-4f98-a40f-c3dd940b4dc3	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 20:52:30.307
764fc53b-fc5b-4b62-bfa2-63cfbf589bc7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-09 21:31:07.58
79a4f076-89cb-4869-b9aa-aefd2cf48583	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-10 14:50:26.224
1b6e96e1-ecd3-40c1-86cf-3aeb66284676	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-10 21:38:02.107
7addf3cb-20d9-4e06-9c14-7a8c5d88c1c6	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-11 13:03:23.067
5c1edf55-102b-4968-a600-cd339f4c6411	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-12 14:03:49.824
66705206-b0b9-4cf1-9e98-0a926bd519d1	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-12 14:04:25.343
f8e58062-1a65-4eb0-a1ef-32c7dd77ca8e	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	UPDATE_EMPLOYEE	Employee	47909f95-9d28-4edf-9ed1-931251394661	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	PUT	/api/employees/47909f95-9d28-4edf-9ed1-931251394661	2026-04-12 14:25:26.244
c8374931-f6c0-4a67-b20c-5cdd8426ceca	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-12 14:25:47.048
bc147d45-1db7-4354-a611-a551311946db	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	f2fc90f6-b024-4d17-9ec8-b7f9895c61b2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/f2fc90f6-b024-4d17-9ec8-b7f9895c61b2/generate	2026-04-12 14:25:47.732
f52b5abe-badc-499f-a51a-e4d4c2eb60f3	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-12 14:29:56.682
65d97112-8b98-42b3-b874-e09ff18d55e9	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	51c37985-8570-4b38-bcbd-fac843e94862	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/51c37985-8570-4b38-bcbd-fac843e94862/generate	2026-04-12 14:29:56.813
0bd1515f-ddcf-45f3-8cb3-7429a6e64303	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	51c37985-8570-4b38-bcbd-fac843e94862	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/51c37985-8570-4b38-bcbd-fac843e94862/generate	2026-04-12 14:36:00.474
1de8d81e-58c5-4c77-9434-984dcb7d2a45	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	51c37985-8570-4b38-bcbd-fac843e94862	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/51c37985-8570-4b38-bcbd-fac843e94862/generate	2026-04-12 14:40:15.943
10a07600-5214-49b4-8521-5a8b1e559dd7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_PAYROLL	Payroll	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/payrolls	2026-04-12 14:40:42.006
d320b7b9-5582-45a4-8ef6-f45d04dc966c	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	c7bb2616-fb99-415b-b20b-d403272705f2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/c7bb2616-fb99-415b-b20b-d403272705f2/generate	2026-04-12 14:40:42.116
f159bf20-84c7-4918-a78f-1371f6475609	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	c7bb2616-fb99-415b-b20b-d403272705f2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/c7bb2616-fb99-415b-b20b-d403272705f2/generate	2026-04-12 14:50:23.175
d272ae03-9db0-4c86-9dea-bc0001436e4b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	c7bb2616-fb99-415b-b20b-d403272705f2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/c7bb2616-fb99-415b-b20b-d403272705f2/generate	2026-04-12 14:50:56.484
6464bde7-8dab-4c2e-a804-5f1a49658a8b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-12 16:14:51.773
f04a6de2-fc71-4cbf-b616-06303da26ea1	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-14 18:20:18.682
f9e58132-4aad-4053-aec0-3b729b38b28c	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	c7bb2616-fb99-415b-b20b-d403272705f2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/c7bb2616-fb99-415b-b20b-d403272705f2/generate	2026-04-14 18:23:29.836
9ab37091-b1d1-4b38-9058-b957feecc09a	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SIGNATURE_REQUEST	SignatureRequest	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/signatures	2026-04-14 18:31:34.058
84ce5b7d-d21d-4408-817c-eb280a744405	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	\N	LOGIN	Auth	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/auth/login	2026-04-14 18:33:42.928
bf3a9a2a-1ad1-47a6-ae69-87b509184832	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	d042c10f-70dd-49a3-8a52-9361339f623d	SIGN_DOCUMENT	SignatureRequest	cc967d5f-c6c2-4d1f-90e8-fd7df519879e	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/signatures/cc967d5f-c6c2-4d1f-90e8-fd7df519879e/sign	2026-04-14 18:34:54.54
f1669b3d-204a-4518-a518-556828214941	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	CREATE_SANCTION	Sanction	\N	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	201	POST	/api/sanctions	2026-04-14 18:40:02.092
f6912e5b-b3a6-4c2b-8dbb-dce218c7af69	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	23293730-f826-4bee-89d4-e73ebeb32ecd	GENERATE_PAYSLIPS	Payroll	c7bb2616-fb99-415b-b20b-d403272705f2	null	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36	200	POST	/api/payrolls/c7bb2616-fb99-415b-b20b-d403272705f2/generate	2026-04-14 18:40:18.766
\.


--
-- Data for Name: Declaration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Declaration" (id, "tenantId", type, period, status, data, "pdfUrl", "generatedBy", "generatedAt", "submittedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Department" (id, "tenantId", name, description, "managerId", "createdAt", "updatedAt", "parentId", type) FROM stdin;
537e9b65-4dad-4284-8e41-d8df0d623230	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Technique	Équipe Tech	\N	2026-03-08 22:36:14.123	2026-03-08 22:36:14.123	\N	DEPARTMENT
daf9f457-00a7-4181-acb8-94cf811ae2bf	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Operations		9bd775c8-495a-4889-9741-c2599046b477	2026-03-08 19:30:07.471	2026-04-08 17:26:36.582	\N	DEPARTMENT
457b15b2-d1ae-4e6e-9b96-c2eb2b492ed7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Ressourse humaine		\N	2026-03-08 19:32:05.12	2026-04-08 17:26:36.582	\N	DEPARTMENT
43510810-becb-4248-8359-e67407bc6d73	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	direction informatique	\N	97f72f1f-6416-4630-a8f5-e8cc9c45edf4	2026-04-10 15:22:41.188	2026-04-10 15:22:41.188	\N	DIRECTION
9b391d2d-b82d-4f9f-8c20-f0c049177c06	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Informatique	\N	\N	2026-04-08 00:17:56.542	2026-04-10 15:22:58.792	43510810-becb-4248-8359-e67407bc6d73	DEPARTMENT
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Document" (id, "employeeId", type, name, url, "generatedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Employee; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Employee" (id, "tenantId", matricule, "firstName", "lastName", cin, "dateOfBirth", gender, address, phone, email, photo, "departmentId", "position", "gradeId", "contractType", "hireDate", "contractEndDate", "trialEndDate", "baseSalary", currency, status, "managerId", "createdAt", "updatedAt", "terminationDate", "terminationNotes", "terminationReason") FROM stdin;
0b75a453-deb9-49e4-ba78-7ba4ab003fe1	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	EMP-0001	adama	sall	5454545454	2026-03-06 00:00:00	\N	thies	+22245565565	demsscash@gmail.com	\N	\N	test	\N	CDI	2026-03-08 00:00:00	2027-03-08 00:00:00	2026-06-08 00:00:00	10000.00	MRU	ACTIVE	\N	2026-03-08 00:12:42.27	2026-03-08 00:12:42.27	\N	\N	\N
2628cbc5-7609-40e8-aa08-07585641b5f8	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	EMP-0002	adama	sall	3434343434	2026-03-03 00:00:00	\N	thies	+22243455444	demsscash@gmail.com	\N	\N	tttt	\N	STAGE	2026-03-08 00:00:00	2026-04-08 00:00:00	2026-04-08 00:00:00	3000.00	MRU	ACTIVE	\N	2026-03-08 04:14:02.755	2026-03-08 04:14:02.755	\N	\N	\N
9bd775c8-495a-4889-9741-c2599046b477	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	EMP-0001	adama	sall	3343434232	2026-03-12 00:00:00	\N		+22245454545	demsscash@gmail.com	\N	\N	fffff	\N	CDI	2026-03-08 00:00:00	\N	\N	100.00	MRU	ACTIVE	\N	2026-03-08 16:19:04.48	2026-03-08 16:19:04.48	\N	\N	\N
e420741e-4c46-4a94-9498-4bdbb5810119	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	EMP-0002	adama	sall	6666666666	2026-03-04 00:00:00	\N		+22246454545	demss@gmail.com	\N	457b15b2-d1ae-4e6e-9b96-c2eb2b492ed7	rh	4a30a52f-4674-4994-8adf-45286c844a98	CDI	2026-03-09 00:00:00	\N	\N	40000.00	MRU	ACTIVE	9bd775c8-495a-4889-9741-c2599046b477	2026-03-09 12:35:26.612	2026-03-09 13:31:15.955	\N	\N	\N
203829d3-af37-451c-89bb-5e6bcccfcdd0	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	EMP-0003	ahmed	sid	2323232323	2002-06-28 00:00:00	\N		+22248793343	dems@gmail.com	\N	daf9f457-00a7-4181-acb8-94cf811ae2bf	stage dev	\N	STAGE	2026-03-28 00:00:00	\N	\N	3000.00	MRU	ACTIVE	\N	2026-03-28 21:26:25.506	2026-03-28 21:26:25.506	\N	\N	\N
97f72f1f-6416-4630-a8f5-e8cc9c45edf4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	EMP-0004	Ahmed	Ould Mohamed		2026-04-08 00:00:00	MALE		+222 20000001	ahmed@example.com	data:image/png;base64,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	9b391d2d-b82d-4f9f-8c20-f0c049177c06	Développeur Senior	\N	CDI	2024-01-15 00:00:00	\N	\N	250000.00	MRU	ACTIVE	\N	2026-04-08 00:17:56.557	2026-04-08 00:29:11.185	\N	\N	\N
47909f95-9d28-4edf-9ed1-931251394661	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	EMP-0005	prime	Sall	4444444444	2026-04-09 00:00:00	\N		+22243434343	demsscashdddd@gmail.com		9b391d2d-b82d-4f9f-8c20-f0c049177c06	test	4a30a52f-4674-4994-8adf-45286c844a98	CDI	2026-04-08 00:00:00	\N	\N	4000.00	MRU	ACTIVE	\N	2026-04-08 14:48:50.197	2026-04-12 14:25:26.13	\N	\N	\N
\.


--
-- Data for Name: EmployeeAdvantage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmployeeAdvantage" (id, "employeeId", "advantageId", "customAmount", "startDate", "endDate", "isActive") FROM stdin;
1eef997a-c619-4e10-86d5-a61f8561fe3f	47909f95-9d28-4edf-9ed1-931251394661	8a1ed1cd-3ef1-4d77-b2ea-e96a66ea5e58	\N	2026-04-12 14:24:53.326	\N	t
4a02d733-2654-4153-bee0-a2fcf485c3e9	47909f95-9d28-4edf-9ed1-931251394661	91d024d7-b19f-45fa-8be6-72738c3d601a	\N	2026-04-14 18:23:20.018	\N	t
\.


--
-- Data for Name: EmployeeTimeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EmployeeTimeline" (id, "employeeId", event, description, "oldValue", "newValue", "performedBy", "createdAt") FROM stdin;
0a59997f-f6c5-4b16-a05c-425dd2d52082	0b75a453-deb9-49e4-ba78-7ba4ab003fe1	HIRED	Employé embauché en tant que test (CDI)	\N	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	2026-03-08 00:12:42.27
db027d2c-7a2f-483f-a7da-2e685a85eb81	2628cbc5-7609-40e8-aa08-07585641b5f8	HIRED	Employé embauché en tant que tttt (STAGE)	\N	\N	8986510c-e2c1-4dfd-8a91-5f42ef376ed6	2026-03-08 04:14:02.755
eed41446-d5b8-4767-ab62-2fb5a774108c	9bd775c8-495a-4889-9741-c2599046b477	HIRED	Employé embauché en tant que fffff (CDI)	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-08 16:19:04.48
a9141fd7-9b5b-4aae-a2e9-40a827a9ea10	9bd775c8-495a-4889-9741-c2599046b477	ACCOUNT_CREATED	Accès portail Self-Service généré	\N	\N	SYSTEM	2026-03-09 03:48:18.555
ec640270-dba4-4457-98cf-e06e08c0a21d	e420741e-4c46-4a94-9498-4bdbb5810119	HIRED	Employé embauché en tant que rh (CDI)	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-09 12:35:26.612
8715125b-3a64-47c4-b148-875d9f75906d	e420741e-4c46-4a94-9498-4bdbb5810119	PROFILE_UPDATED	Mise à jour des informations de l'employé	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-09 13:31:15.967
4bbd0542-6da4-4e1c-b637-23e11801544d	e420741e-4c46-4a94-9498-4bdbb5810119	ACCOUNT_CREATED	Accès portail Self-Service généré	\N	\N	SYSTEM	2026-03-11 22:17:38.25
40f433d4-738b-4210-82d7-bec77b6f173b	203829d3-af37-451c-89bb-5e6bcccfcdd0	HIRED	Employé embauché en tant que stage dev (STAGE)	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-28 21:26:25.506
7f6af9b3-2389-4a9b-bf6c-899f88ebc65f	203829d3-af37-451c-89bb-5e6bcccfcdd0	SANCTION	Sanction: DEDUCTION_PRIME — testtt	\N	4 MRU	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-07 23:41:13.12
9c59b944-1cc5-4def-ac70-c32845ebda24	203829d3-af37-451c-89bb-5e6bcccfcdd0	SANCTION	Sanction: RETENUE_SALAIRE — ggg	\N	400 MRU	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-07 23:47:26.628
ed3c6bd3-5206-47b9-a102-8808b930d506	97f72f1f-6416-4630-a8f5-e8cc9c45edf4	PROFILE_UPDATED	Mise à jour des informations de l'employé	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-08 00:29:11.328
5b709dbf-a7bb-4417-8b14-27e099eeaaa6	47909f95-9d28-4edf-9ed1-931251394661	HIRED	Employé embauché en tant que test (CDI)	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-08 14:48:50.197
3d865daf-9212-4e91-a525-4551df187016	47909f95-9d28-4edf-9ed1-931251394661	PROFILE_UPDATED	Mise à jour des informations de l'employé	\N	\N	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-12 14:25:26.156
b5b279af-f334-4098-b86c-3f8c96c55870	47909f95-9d28-4edf-9ed1-931251394661	ACCOUNT_CREATED	Accès portail Self-Service généré	\N	\N	SYSTEM	2026-04-14 18:33:18.578
1bd6ec55-21d7-4683-bf60-b17f72d43fcc	47909f95-9d28-4edf-9ed1-931251394661	SANCTION	Sanction: DEDUCTION_PRIME — fraude	\N	1000 MRU	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-04-14 18:40:02.088
\.


--
-- Data for Name: Evaluation; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Evaluation" (id, "tenantId", "campaignId", "employeeId", "evaluatorId", scores, "overallScore", strengths, improvements, objectives, status, "completedAt", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: EvaluationCampaign; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."EvaluationCampaign" (id, "tenantId", title, description, "startDate", "endDate", status, criteria, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: ExpenseItem; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseItem" (id, "expenseReportId", category, description, amount, date, "receiptUrl", "createdAt") FROM stdin;
\.


--
-- Data for Name: ExpenseReport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."ExpenseReport" (id, "tenantId", "employeeId", title, "totalAmount", status, "submittedAt", "reviewedBy", "reviewedAt", "rejectionReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Grade; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Grade" (id, "tenantId", name, level, description, "createdAt", "updatedAt") FROM stdin;
ab911ef4-31b8-4b88-b910-a0c3183edec1	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Senior	3	Senior Dev	2026-03-08 22:36:14.159	2026-03-08 22:36:14.159
4a30a52f-4674-4994-8adf-45286c844a98	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	cadre 	2		2026-03-09 12:40:04.567	2026-03-09 12:40:04.567
\.


--
-- Data for Name: GradeAdvantage; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GradeAdvantage" (id, "gradeId", "advantageId", "customAmount") FROM stdin;
\.


--
-- Data for Name: Holiday; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Holiday" (id, "tenantId", name, date, "isRecurring", "createdAt") FROM stdin;
fee1bb2c-263f-4a98-bebd-2812adf4191e	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Nouvel An	2026-01-01	t	2026-03-17 00:08:25.409
15f719e0-5ac9-4530-8079-ab1596c803f7	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Fête du Travail	2026-05-01	t	2026-03-17 00:08:25.517
292a8881-b5d3-46a2-9a14-3f3874a1a357	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Journée de l'Afrique	2026-05-25	t	2026-03-17 00:08:25.522
405f2e4b-08ed-4874-8a2a-bd1468ffd8de	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Fête de l'Indépendance	2026-11-28	t	2026-03-17 00:08:25.529
\.


--
-- Data for Name: Leave; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Leave" (id, "employeeId", "leaveTypeId", "startDate", "endDate", "totalDays", reason, status, "reviewedBy", "reviewedAt", "rejectionReason", "justificationUrl", "createdAt", "updatedAt") FROM stdin;
686882e8-9ec2-4919-84cd-dc7bd2884a7d	9bd775c8-495a-4889-9741-c2599046b477	61c34c92-1223-47ac-8972-2f21eb80f765	2026-03-09 00:00:00	2026-03-12 00:00:00	4.0		APPROVED	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-09 12:29:52.294	\N	\N	2026-03-09 12:20:43.307	2026-03-09 12:29:52.295
9f724ab5-0fc7-4e4d-b444-ff8c51c90667	9bd775c8-495a-4889-9741-c2599046b477	889659ca-4148-46be-accf-f7046cb3fad4	2026-03-17 00:00:00	2026-03-21 00:00:00	4.0	twest	APPROVED	23293730-f826-4bee-89d4-e73ebeb32ecd	2026-03-16 19:58:53.609	\N	\N	2026-03-16 19:56:51.736	2026-03-16 19:58:53.61
\.


--
-- Data for Name: LeaveBalance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveBalance" (id, "employeeId", "leaveTypeCode", year, entitled, taken, "carriedOver", remaining, "createdAt", "updatedAt") FROM stdin;
28a71ab7-d056-40f8-aacc-92e219c38f85	e420741e-4c46-4a94-9498-4bdbb5810119	MAL	2026	15.0	0.0	0.0	15.0	2026-03-17 00:11:02.361	2026-03-17 00:11:02.361
40de02fa-0d17-48dd-8d53-f4fd3f5bab45	e420741e-4c46-4a94-9498-4bdbb5810119	CSS	2026	0.0	0.0	0.0	0.0	2026-03-17 00:11:02.366	2026-03-17 00:11:02.366
577f2803-7ec4-4267-8a05-bfab8a20e290	9bd775c8-495a-4889-9741-c2599046b477	MAL	2026	15.0	0.0	0.0	15.0	2026-03-17 00:11:02.405	2026-03-17 00:11:02.405
0b0d5b41-dec5-47ca-b39d-d5c1757c7b02	9bd775c8-495a-4889-9741-c2599046b477	CSS	2026	0.0	0.0	0.0	0.0	2026-03-17 00:11:02.407	2026-03-17 00:11:02.407
f2c6d4ec-9eae-4268-8d64-3e362707db9f	e420741e-4c46-4a94-9498-4bdbb5810119	CA	2026	24.0	0.0	0.0	24.0	2026-03-17 00:11:02.347	2026-03-17 00:11:02.347
98444efe-d892-43c7-8d8a-5cf6e07f3621	9bd775c8-495a-4889-9741-c2599046b477	CA	2026	24.0	0.0	0.0	24.0	2026-03-17 00:11:02.402	2026-03-17 00:11:02.402
\.


--
-- Data for Name: LeaveType; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."LeaveType" (id, "tenantId", name, code, "defaultDays", "isPaid", "requiresJustification", color, "createdAt", "updatedAt") FROM stdin;
5a448232-1a61-4c3b-87e1-8a2e8fa85805	3176a7db-252e-4866-a862-59aecca1a446	Maladie	MAL	15	t	f	\N	2026-03-09 09:56:27.416	2026-03-09 09:56:27.416
c87d7085-3843-4429-91ec-8c8e8d97f33d	3176a7db-252e-4866-a862-59aecca1a446	Sans Solde	CSS	0	f	f	\N	2026-03-09 09:56:27.416	2026-03-09 09:56:27.416
6844b210-701d-49d5-8dad-1a35dae42ac7	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Maladie	MAL	15	t	f	\N	2026-03-09 09:56:27.436	2026-03-09 09:56:27.436
bdae16d9-7445-4280-b940-3b8702232491	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Sans Solde	CSS	0	f	f	\N	2026-03-09 09:56:27.436	2026-03-09 09:56:27.436
61c34c92-1223-47ac-8972-2f21eb80f765	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Maladie	MAL	15	t	f	\N	2026-03-09 09:56:27.439	2026-03-09 09:56:27.439
889659ca-4148-46be-accf-f7046cb3fad4	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Sans Solde	CSS	0	f	f	\N	2026-03-09 09:56:27.439	2026-03-09 09:56:27.439
de876ef6-f789-43fc-a57a-8fa4c8ba6cf5	3176a7db-252e-4866-a862-59aecca1a446	Congé Annuel	CA	24	t	f	\N	2026-03-09 09:56:27.416	2026-03-09 09:56:27.416
7c715bdb-d891-4351-8ec3-04a869df67a3	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Congé Annuel	CA	24	t	f	\N	2026-03-09 09:56:27.436	2026-03-09 09:56:27.436
438079ff-cdf1-4d3d-a5dc-b0c2bded9aeb	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	Congé Annuel	CA	24	t	f	\N	2026-03-09 09:56:27.439	2026-03-09 09:56:27.439
\.


--
-- Data for Name: OnboardingTask; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnboardingTask" (id, "employeeId", title, description, "assignedTo", "isCompleted", "completedAt", "dueDate", "order", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OnboardingTemplate; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OnboardingTemplate" (id, "tenantId", name, tasks, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Overtime; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Overtime" (id, "tenantId", "employeeId", date, hours, tier, rate, reason, "recordedBy", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: OvertimeConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."OvertimeConfig" (id, "tenantId", tiers, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Payroll; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payroll" (id, "tenantId", month, year, status, "processedBy", "processedAt", "createdAt", "updatedAt") FROM stdin;
c7bb2616-fb99-415b-b20b-d403272705f2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	4	2026	DRAFT	\N	\N	2026-04-12 14:40:42	2026-04-12 14:40:42
\.


--
-- Data for Name: Payslip; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Payslip" (id, "payrollId", "employeeId", "baseSalary", "totalAdvantages", "grossSalary", "cnssEmployee", "cnssEmployer", "itsAmount", "otherDeductions", "netSalary", "advantagesDetail", "deductionsDetail", "pdfUrl", "createdAt", "updatedAt", "attendanceDeductions", "advanceDeductions", "overtimePay", "cnamEmployee", "cnamEmployer", "mdtAmount") FROM stdin;
64327ff2-8c40-4972-94e3-a7bd80328abb	c7bb2616-fb99-415b-b20b-d403272705f2	97f72f1f-6416-4630-a8f5-e8cc9c45edf4	250000.00	0.00	250000.00	700.00	9100.00	87650.00	0.00	158850.00	"[]"	\N	\N	2026-04-14 18:40:18.76	2026-04-14 18:40:18.76	0.00	0.00	0.00	2800.00	0.00	625.00
ba76a264-ec82-4283-87e5-4026cf758839	c7bb2616-fb99-415b-b20b-d403272705f2	203829d3-af37-451c-89bb-5e6bcccfcdd0	3000.00	0.00	3000.00	30.00	390.00	0.00	404.00	2446.00	"[]"	"[{\\"name\\":\\"Sanction — Retenue\\",\\"amount\\":4,\\"type\\":\\"SANCTION\\"},{\\"name\\":\\"Sanction — Retenue\\",\\"amount\\":400,\\"type\\":\\"SANCTION\\"}]"	\N	2026-04-14 18:40:18.76	2026-04-14 18:40:18.76	0.00	0.00	0.00	120.00	0.00	7.50
9debafd0-1a63-4d34-860b-426c77c0b700	c7bb2616-fb99-415b-b20b-d403272705f2	9bd775c8-495a-4889-9741-c2599046b477	100.00	0.00	100.00	1.00	13.00	0.00	0.00	95.00	"[]"	\N	\N	2026-04-14 18:40:18.76	2026-04-14 18:40:18.76	0.00	0.00	0.00	4.00	0.00	0.25
dcd904b4-202e-4098-861b-2a5dc953dd86	c7bb2616-fb99-415b-b20b-d403272705f2	47909f95-9d28-4edf-9ed1-931251394661	4000.00	2000.00	6000.00	60.00	780.00	0.00	1000.00	4700.00	"[{\\"name\\":\\"logement\\",\\"amount\\":1000,\\"isTaxable\\":true},{\\"name\\":\\"transport\\",\\"amount\\":1000,\\"isTaxable\\":true}]"	"[{\\"name\\":\\"Sanction — logement\\",\\"amount\\":1000,\\"type\\":\\"SANCTION\\"}]"	\N	2026-04-14 18:40:18.76	2026-04-14 18:40:18.76	0.00	0.00	0.00	240.00	0.00	15.00
f3ff97b7-b1b6-4979-9853-f2c76ed79eab	c7bb2616-fb99-415b-b20b-d403272705f2	e420741e-4c46-4a94-9498-4bdbb5810119	40000.00	0.00	40000.00	400.00	5200.00	6050.00	0.00	31950.00	"[]"	\N	\N	2026-04-14 18:40:18.76	2026-04-14 18:40:18.76	0.00	0.00	0.00	1600.00	0.00	100.00
\.


--
-- Data for Name: SalaryAdvance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SalaryAdvance" (id, "tenantId", "employeeId", amount, "requestDate", reason, status, "reviewedBy", "reviewedAt", "rejectionReason", "deductedInPayslipId", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Sanction; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Sanction" (id, "tenantId", "employeeId", type, reason, comment, date, "advantageId", "deductionAmount", "issuedBy", status, "createdAt", "updatedAt") FROM stdin;
3bd13143-1669-4ecc-8a94-4d4385fcb279	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	203829d3-af37-451c-89bb-5e6bcccfcdd0	DEDUCTION_PRIME	testtt		2026-04-07	\N	4.00	23293730-f826-4bee-89d4-e73ebeb32ecd	ACTIVE	2026-04-07 23:41:13.094	2026-04-07 23:41:13.094
06a6f9aa-916d-407a-b020-a5d74e308278	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	203829d3-af37-451c-89bb-5e6bcccfcdd0	RETENUE_SALAIRE	ggg		2026-04-07	\N	400.00	23293730-f826-4bee-89d4-e73ebeb32ecd	ACTIVE	2026-04-07 23:47:26.613	2026-04-07 23:47:26.613
905a85cc-f1f6-4a46-9ffd-3daa6e2b4cb2	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	47909f95-9d28-4edf-9ed1-931251394661	DEDUCTION_PRIME	fraude		2026-04-14	8a1ed1cd-3ef1-4d77-b2ea-e96a66ea5e58	1000.00	23293730-f826-4bee-89d4-e73ebeb32ecd	ACTIVE	2026-04-14 18:40:02.073	2026-04-14 18:40:02.073
\.


--
-- Data for Name: SignatureRequest; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SignatureRequest" (id, "employeeId", status, "requestedAt", "createdAt", description, "documentType", "expiresAt", "requestedBy", "tenantId", title, "updatedAt", "adminSignature", "adminSignedAt", "employeeSignature", "employeeSignedAt", "initiatedBy", "pdfData", "rejectionReason", "signatureMode", "validatedBy") FROM stdin;
dd1ebc29-1554-47c4-8e41-217c03bf5331	e420741e-4c46-4a94-9498-4bdbb5810119	PENDING	2026-03-16 22:24:57.396	2026-03-16 22:24:57.396	jjjj	ATTESTATION	2026-03-20 00:00:00	23293730-f826-4bee-89d4-e73ebeb32ecd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	hghh	2026-03-16 22:24:57.396	\N	\N	\N	\N	ADMIN	\N	\N	EMPLOYEE_ONLY	\N
93c90ba2-453b-4928-803e-d6fa2d4d7e6a	9bd775c8-495a-4889-9741-c2599046b477	SIGNED	2026-03-16 22:26:54.152	2026-03-16 22:26:54.152	fddf	CONTRACT	2026-03-20 00:00:00	23293730-f826-4bee-89d4-e73ebeb32ecd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	dfedf	2026-03-16 23:24:01.481	\N	\N	\N	\N	ADMIN	\N	\N	EMPLOYEE_ONLY	\N
cc967d5f-c6c2-4d1f-90e8-fd7df519879e	47909f95-9d28-4edf-9ed1-931251394661	SIGNED	2026-04-14 18:31:34.041	2026-04-14 18:31:34.041	\N	CONTRACT	2026-04-15 00:00:00	23293730-f826-4bee-89d4-e73ebeb32ecd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	contrat de travail	2026-04-14 18:34:54.482	\N	\N	\N	\N	ADMIN	\N	\N	EMPLOYEE_ONLY	\N
\.


--
-- Data for Name: TaxConfig; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TaxConfig" (id, "tenantId", "cnssEmployeeRate", "cnssEmployerRate", "cnssCeiling", "itsBrackets", "createdAt", "updatedAt", "cnamCeiling", "cnamEmployeeRate", "cnamEmployerRate", "mdtRate") FROM stdin;
d94f81eb-ae15-4980-a1ab-fc242df73258	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	0.0100	0.1300	70000.00	[{"max": 9000, "min": 0, "rate": 0}, {"max": 21000, "min": 9000, "rate": 0.15}, {"max": 50000, "min": 21000, "rate": 0.25}, {"max": null, "min": 50000, "rate": 0.4}]	2026-04-12 14:40:01.402	2026-04-12 14:50:48.364	70000.00	0.0400	0.0400	0.0025
\.


--
-- Data for Name: Tenant; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Tenant" (id, name, subdomain, logo, address, phone, email, currency, "leaveCarryOver", "maxCarryOverDays", "isActive", "createdAt", "updatedAt") FROM stdin;
3176a7db-252e-4866-a862-59aecca1a446	test	test	\N	\N	\N	\N	MRU	CONFIGURABLE	\N	t	2026-03-08 05:20:39.08	2026-03-08 05:20:39.08
e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	Harmony Enterprise	demo	\N	\N	\N	contact@harmony-erp.com	MRU	CONFIGURABLE	\N	t	2026-03-07 23:05:23.706	2026-03-08 05:22:05.877
ce382c53-87c2-46e3-b75a-bed8f80652f1	hondong	hongdong	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAIwAlgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoqtfaha6bbNcXkyxRjjJ6k+gHUn2FR6bd3N7E881o1tEx/crIfnK+rD+H6VXK+Xm6Ee0jzcnUu0UUVJYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFV72+tdOtWubydIYV6sx/zk00m3ZCclFXexYrn9U8Tx293/AGbpkJv9TbjykPyx+7t2rFbV9Y8Yzta6Mr2OmA7ZbxxhmHoP8B+JFdRo2h2OhWnkWcfzHmSVuXkPqTXQ6caOtTV9v8/8jiVeeIdqOkf5v8l+u3qVNM0GRbldS1icXmoj7vH7uD2Rf69a3aKKxnOU3dnVTpRpq0QoooqDQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKgu7y2sLZ7m7mSGFPvO5wK861jxrqGuXP9meH4pUWQ7d6j94/0/uj3/lW9DDzrP3du/Q5MVjaWGXvat7Jbs6bxH40sdDDQRYub3p5SnhD/ALR7fTrWHpvhvVPFF0mp+JJXS36xWo+XI+n8I/U1peGPA0GllbzUdtzffeAPKRn29T712FbSrU6K5aG/83+RzQw9XEvnxWi6R/z7kcEEVtAkEEaxxIMKijAAqSiiuK9z00klZBRRRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooqG6uoLK3e4uZkihQZZ3OAKaTbshNpK7Jq5zxF4xsNBVoQRcXuOIUP3f949v51yfiP4hTXW+10fdDB0NweHb6f3R+v0qv4Z8DXOrMt7qe+G0Y7gp/1kv+A969Gng404+0xDsu3U8Wtmc60/Y4JXffov6/q5Vih17x5qW93PkIeWIIihHoB3P616XoXh2x0C28u1TdKw/eTN95/wDAe1aFra29lbJb2sKRQoMKijAFTVhiMW6i5Iq0ex1YPL40H7Sb5pvq/wBAooorkPRCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiori4htIHnuJUiiQZZ3OAK848R/EOSffa6Nuij6NckYZv90dvr1+lb0MPUrO0EcmKxtHCxvUfy6nWeIfF2n6AhjZvPvCPlgQ9P8AePYV5bqWsar4ov0SUvKzNiK3iB2r9B/U1FpGiah4gvjHbIWJOZZnJ2rnuT6/rXrnh/wxY+H4MQr5lyw/eTuPmPsPQe1em/YYFae9P+vuPDX1rNZa+7T/AK+/8jC8L+AobDZeaqqzXQ5WHqkf19T+ldxRRXlVq06suabPoMPhqWHhyU1YKKKKyNwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiio5p4raFpp5FjjQZZ3OABQDdtWSVg+IPFmn6BGUkbzroj5bdDz+PoK5TxH8Q2ffa6KSq9GumHJ/3R2+prgv3tzP8AxyzSN7szE/zNerhsucveq6LsfP47Oow/d4fV9+ny7mlrfiLUNen33cuIlOUhThF/Dufc1q+GPBV1rZS5ut1vYdd2Pmk/3fb3rf8AC/gBYtl7rKB5OqWvUL/vep9uld+AAAAAAOABV4jHRpr2dD7/APIyweUzrS9vi+vT/P8AyK9jYWum2iWtnCsUKdFUdfc+p96s0UV5Dbbuz6SMVFWWwUUUUhhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUVXvL+0sIvNu7mKBPWRgM00m3ZCclFXZYpCQBknAHU1xOq/EnT7bcmnQvdydA7fIn+J/KuF1fxTq2tZW5uSsJ/5YxfKn4+v413UcvrVNZaI8rE5zhqOkXzPy/zPRtc8eaXpe6K2b7bcjjbGfkU+7f4ZrzXWvEWo67LuvJv3YOVhThF/Dv8AU1lUV7FDB0qOqV33PmsXmVfE6Sdo9kFehfDHTYpHvNSkUM8ZEUZI+7kZJ/lXnteofC9wdIvk7rOD+aj/AAqMwbWHdjTJoxljI38/yO6ooor5s+3CiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAorG1PxVo2k5W5vUMg/5ZRfO35Dp+NclqHxPOSunaf8AR7hv/ZR/jXRSwlap8MTir5hhqGk569tz0amSzRQrulkSNfV2AFeL3vjPX73Ia/eJT/DAAn6j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				MRU	CONFIGURABLE	\N	t	2026-03-29 02:13:47.794	2026-03-29 02:16:07.991
920dd3ff-d4b9-4f60-96ee-58d67aebc70a	acme	acme	data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAIwAlgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAoqtfaha6bbNcXkyxRjjJ6k+gHUn2FR6bd3N7E881o1tEx/crIfnK+rD+H6VXK+Xm6Ee0jzcnUu0UUVJYUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFV72+tdOtWubydIYV6sx/zk00m3ZCclFXexYrn9U8Tx293/AGbpkJv9TbjykPyx+7t2rFbV9Y8Yzta6Mr2OmA7ZbxxhmHoP8B+JFdRo2h2OhWnkWcfzHmSVuXkPqTXQ6caOtTV9v8/8jiVeeIdqOkf5v8l+u3qVNM0GRbldS1icXmoj7vH7uD2Rf69a3aKKxnOU3dnVTpRpq0QoooqDQKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKgu7y2sLZ7m7mSGFPvO5wK861jxrqGuXP9meH4pUWQ7d6j94/0/uj3/lW9DDzrP3du/Q5MVjaWGXvat7Jbs6bxH40sdDDQRYub3p5SnhD/ALR7fTrWHpvhvVPFF0mp+JJXS36xWo+XI+n8I/U1peGPA0GllbzUdtzffeAPKRn29T712FbSrU6K5aG/83+RzQw9XEvnxWi6R/z7kcEEVtAkEEaxxIMKijAAqSiiuK9z00klZBRRRQMKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooqG6uoLK3e4uZkihQZZ3OAKaTbshNpK7Jq5zxF4xsNBVoQRcXuOIUP3f949v51yfiP4hTXW+10fdDB0NweHb6f3R+v0qv4Z8DXOrMt7qe+G0Y7gp/1kv+A969Gng404+0xDsu3U8Wtmc60/Y4JXffov6/q5Vih17x5qW93PkIeWIIihHoB3P616XoXh2x0C28u1TdKw/eTN95/wDAe1aFra29lbJb2sKRQoMKijAFTVhiMW6i5Iq0ex1YPL40H7Sb5pvq/wBAooorkPRCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiori4htIHnuJUiiQZZ3OAK848R/EOSffa6Nuij6NckYZv90dvr1+lb0MPUrO0EcmKxtHCxvUfy6nWeIfF2n6AhjZvPvCPlgQ9P8AePYV5bqWsar4ov0SUvKzNiK3iB2r9B/U1FpGiah4gvjHbIWJOZZnJ2rnuT6/rXrnh/wxY+H4MQr5lyw/eTuPmPsPQe1em/YYFae9P+vuPDX1rNZa+7T/AK+/8jC8L+AobDZeaqqzXQ5WHqkf19T+ldxRRXlVq06suabPoMPhqWHhyU1YKKKKyNwooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiio5p4raFpp5FjjQZZ3OABQDdtWSVg+IPFmn6BGUkbzroj5bdDz+PoK5TxH8Q2ffa6KSq9GumHJ/3R2+prgv3tzP8AxyzSN7szE/zNerhsucveq6LsfP47Oow/d4fV9+ny7mlrfiLUNen33cuIlOUhThF/Dufc1q+GPBV1rZS5ut1vYdd2Pmk/3fb3rf8AC/gBYtl7rKB5OqWvUL/vep9uld+AAAAAAOABV4jHRpr2dD7/APIyweUzrS9vi+vT/P8AyK9jYWum2iWtnCsUKdFUdfc+p96s0UV5Dbbuz6SMVFWWwUUUUhhRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUVXvL+0sIvNu7mKBPWRgM00m3ZCclFXZYpCQBknAHU1xOq/EnT7bcmnQvdydA7fIn+J/KuF1fxTq2tZW5uSsJ/5YxfKn4+v413UcvrVNZaI8rE5zhqOkXzPy/zPRtc8eaXpe6K2b7bcjjbGfkU+7f4ZrzXWvEWo67LuvJv3YOVhThF/Dv8AU1lUV7FDB0qOqV33PmsXmVfE6Sdo9kFehfDHTYpHvNSkUM8ZEUZI+7kZJ/lXnteofC9wdIvk7rOD+aj/AAqMwbWHdjTJoxljI38/yO6ooor5s+3CiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAorG1PxVo2k5W5vUMg/5ZRfO35Dp+NclqHxPOSunaf8AR7hv/ZR/jXRSwlap8MTir5hhqGk569tz0amSzRQrulkSNfV2AFeL3vjPX73Ia/eJT/DAAn6j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				MRU	CONFIGURABLE	\N	t	2026-03-08 06:12:30.55	2026-04-12 14:50:50.494
\.


--
-- Data for Name: TenantSettings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TenantSettings" (id, "tenantId", "fiscalYearStart", "workDaysPerWeek", "weekStartDay", "smtpHost", "smtpPort", "smtpUser", "smtpPassword", "smtpFromEmail", "smtpFromName", "createdAt", "updatedAt", "contractTemplate", "defaultLeaveDays") FROM stdin;
fe07b792-ae2b-47ce-bf4e-f5d5f264f4a0	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	1	5	1	\N	\N	\N	\N	\N	\N	2026-03-07 23:05:23.706	2026-03-07 23:05:23.706	\N	24
2e13e4e8-8217-4508-9121-32bc9f5d057b	3176a7db-252e-4866-a862-59aecca1a446	1	5	1	\N	\N	\N	\N	\N	\N	2026-03-08 05:20:39.08	2026-03-08 05:20:39.08	\N	24
6daa0d76-6ffe-4f77-ba9f-060c6446535b	ce382c53-87c2-46e3-b75a-bed8f80652f1	1	5	1	\N	\N	\N	\N	\N	\N	2026-03-29 02:13:47.794	2026-03-29 02:16:07.991		24
efdde4b2-a180-4fda-8f7c-140963a9e7bb	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	1	5	1	\N	\N	\N	\N	\N	\N	2026-03-08 06:12:30.55	2026-04-12 14:50:50.494	Entre les soussignés :\n\n{{COMPANY_NAME}}, ci-après dénommé « l'Employeur », représenté par la Direction Générale,\n\nEt\n\n{{GENDER_PREFIX}} {{EMPLOYEE_NAME}}, ci-après dénommé(e) « le Salarié »,\nNé(e) le : {{DOB}}\nCIN / NNI : {{CIN}}\nAdresse : {{ADDRESS}}\nTéléphone : {{PHONE}}\nEmail : {{EMAIL}}\nMatricule : {{MATRICULE}}\n\nIl a été convenu et arrêté ce qui suit, conformément aux dispositions du Code du Travail mauritanien (Loi n°2004-017) :\n\n\nArticle 1 — Engagement et Fonction\n\nL'Employeur engage {{GENDER_PREFIX}} {{EMPLOYEE_NAME}} en qualité de {{POSITION}} au sein du département {{DEPARTMENT}}.\nGrade : {{GRADE}}\nNiveau hiérarchique : {{ORG_LEVEL}}\nSupérieur hiérarchique : {{MANAGER}} ({{MANAGER_POSITION}})\n\nLe Salarié exercera ses fonctions conformément aux instructions et directives de sa hiérarchie, dans le respect du règlement intérieur de l'entreprise. Il pourra être amené à effectuer toute tâche connexe relevant de sa qualification professionnelle.\n\n\nArticle 2 — Nature et Durée du Contrat\n\nLe présent contrat de type {{CONTRACT_TYPE}} prend effet à compter du {{START_DATE}}.\nDate de fin prévue : {{END_DATE}}\nDate de fin de période d'essai : {{TRIAL_END}}\n\n\nArticle 3 — Période d'Essai\n\nLe Salarié est soumis à une période d'essai de trois (3) mois, renouvelable une fois pour une durée égale, conformément à l'article 20 du Code du Travail. Durant cette période, chacune des parties pourra mettre fin au contrat sans préavis ni indemnité, par notification écrite.\n\n\nArticle 4 — Rémunération\n\nEn contrepartie de ses services, le Salarié percevra une rémunération mensuelle brute de {{SALARY}} {{CURRENCY}}, payable à terme échu, au plus tard le cinq (5) du mois suivant.\n\nCette rémunération est soumise aux cotisations sociales (CNSS) et à l'Impôt sur les Traitements et Salaires (ITS) conformément à la législation en vigueur. Les avantages en nature et primes éventuels feront l'objet d'avenants distincts.\n\n\nArticle 5 — Durée et Horaires de Travail\n\nLa durée hebdomadaire de travail est fixée à quarante (40) heures, conformément à l'article 49 du Code du Travail. Les horaires de travail sont ceux en vigueur au sein de {{COMPANY_NAME}}. Les heures supplémentaires éventuelles seront rémunérées conformément à la réglementation applicable.\n\n\nArticle 6 — Congés Payés\n\nLe Salarié bénéficiera d'un congé annuel payé de vingt-quatre (24) jours ouvrables par an, conformément à l'article 68 du Code du Travail mauritanien. La date de départ en congé sera fixée d'un commun accord entre les parties, en tenant compte des nécessités du service.\n\n\nArticle 7 — Obligations du Salarié\n\nLe Salarié s'engage à :\n— Exécuter son travail avec diligence et professionnalisme ;\n— Respecter le règlement intérieur, les consignes de sécurité et les procédures de {{COMPANY_NAME}} ;\n— Observer une stricte discrétion professionnelle sur toutes les informations dont il aura connaissance dans l'exercice de ses fonctions ;\n— Ne pas exercer d'activité concurrente, directement ou indirectement, pendant la durée du contrat.\n\n\nArticle 8 — Obligations de l'Employeur\n\n{{COMPANY_NAME}} s'engage à :\n— Fournir au Salarié les moyens nécessaires à l'accomplissement de ses missions ;\n— Verser la rémunération convenue aux échéances prévues ;\n— Respecter les dispositions légales en matière d'hygiène, de sécurité et de conditions de travail ;\n— Affilier le Salarié à la Caisse Nationale de Sécurité Sociale (CNSS).\n\n\nArticle 9 — Résiliation du Contrat\n\nAprès la période d'essai, le contrat pourra être résilié par l'une ou l'autre des parties moyennant un préavis dont la durée est fixée conformément à l'article 38 du Code du Travail :\n— Un (1) mois pour les employés et ouvriers ;\n— Trois (3) mois pour les cadres et agents de maîtrise.\n\nEn cas de faute lourde dûment établie, le licenciement pourra intervenir sans préavis ni indemnité, conformément à l'article 36 du Code du Travail.\n\n\nArticle 10 — Clause de Confidentialité\n\nLe Salarié s'engage, tant pendant la durée du contrat qu'après sa cessation, à ne divulguer aucune information confidentielle relative aux activités, procédés, clientèle ou stratégie de {{COMPANY_NAME}}. Toute violation de cette clause pourra donner lieu à des poursuites judiciaires et au versement de dommages-intérêts.\n\n\nArticle 11 — Dispositions Diverses\n\nLe présent contrat est régi par les lois et règlements de la République Islamique de Mauritanie. Tout litige relatif à son interprétation ou à son exécution sera soumis aux juridictions compétentes après tentative de conciliation.\n\nLe Salarié déclare avoir pris connaissance du règlement intérieur de {{COMPANY_NAME}} et s'engage à en respecter les dispositions.\n	24
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, "tenantId", email, "passwordHash", role, "isActive", "lastLogin", "refreshToken", "employeeId", "createdAt", "updatedAt", phone, permissions) FROM stdin;
914d4d57-c1b1-4120-84bc-ba5fdbe9ef56	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	rh@test.mr	$2b$12$HPVlMbXG0B4R58ov813VbewlAKXch.YSSEd66eynMfFEnf3/pm0vy	HR	t	2026-03-28 21:45:05.524	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5MTRkNGQ1Ny1jMWIxLTQxMjAtODRiYy1iYTVmZGJlOWVmNTYiLCJ0ZW5hbnRJZCI6IjkyMGRkM2ZmLWQ0YjktNGY2MC05NmVlLTU4ZDY3YWViYzcwYSIsInJvbGUiOiJIUiIsImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3NDczNDMwNSwiZXhwIjoxNzc1MzM5MTA1fQ.rb6tbHZKzlKgLniCnRUzfjm8MryZ-qC3RnGPumo5HnI	\N	2026-03-12 00:06:42.84	2026-03-28 21:45:05.525	\N	[]
8986510c-e2c1-4dfd-8a91-5f42ef376ed6	e3b86a34-dc7d-4b6d-b8d6-d6f9878ce1cc	admin@harmony-erp.com	$2b$12$4kH6Z5vTwZOMI2CHsI40UeeyV.eOLFueYs6Lqfnj8HGcbhmFh5.ga	SUPER_ADMIN	t	2026-04-08 14:37:52.628	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI4OTg2NTEwYy1lMmMxLTRkZmQtOGE5MS01ZjQyZWYzNzZlZDYiLCJ0ZW5hbnRJZCI6bnVsbCwicm9sZSI6IlNVUEVSX0FETUlOIiwiZW1wbG95ZWVJZCI6bnVsbCwiaWF0IjoxNzc1NjU5MDcyLCJleHAiOjE3NzYyNjM4NzJ9.1XecYazKFKIyLTgcno799uVKb1fgJBzShOWeNC1xbGg	\N	2026-03-07 23:05:24.107	2026-04-08 14:37:52.638	\N	\N
4d972355-0ad9-42f5-83a0-7e029cda89b8	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	demss@gmail.com	$2b$10$DUabvWcwmNLhXoW8mlBxs.wXzjzePfalWhlCe9dafOfshdhWRLWFe	EMPLOYEE	t	2026-03-11 22:18:00.967	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0ZDk3MjM1NS0wYWQ5LTQyZjUtODNhMC03ZTAyOWNkYTg5YjgiLCJ0ZW5hbnRJZCI6IjkyMGRkM2ZmLWQ0YjktNGY2MC05NmVlLTU4ZDY3YWViYzcwYSIsInJvbGUiOiJFTVBMT1lFRSIsImVtcGxveWVlSWQiOiJlNDIwNzQxZS00YzQ2LTRhOTQtOTQ5OC00YmRiYjU4MTAxMTkiLCJpYXQiOjE3NzMyNjc0ODAsImV4cCI6MTc3Mzg3MjI4MH0.ScHDM3bGpmpYEt400niGeAL9dbtlrPCIYvJ2L9PXJpk	e420741e-4c46-4a94-9498-4bdbb5810119	2026-03-11 22:17:38.241	2026-03-11 22:18:00.968	\N	\N
23293730-f826-4bee-89d4-e73ebeb32ecd	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	test@test.mr	$2b$10$fAl7jG.cP/GdHStNG6jF4O8GoDhtvPpdLlje6EWNNIxBk84r5DbU2	ADMIN	t	2026-04-14 18:20:18.524	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIyMzI5MzczMC1mODI2LTRiZWUtODlkNC1lNzNlYmViMzJlY2QiLCJ0ZW5hbnRJZCI6IjkyMGRkM2ZmLWQ0YjktNGY2MC05NmVlLTU4ZDY3YWViYzcwYSIsInJvbGUiOiJBRE1JTiIsImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3NjE5MDgxOCwiZXhwIjoxNzc4NzgyODE4fQ.HP8acxwfyk4RCIx46x0MkjzoqMt30lPdQENlwB0Dogw	\N	2026-03-08 06:12:30.575	2026-04-14 18:20:18.528	\N	\N
b47032b7-1d2a-4c4a-ad59-d7df45c9238f	3176a7db-252e-4866-a862-59aecca1a446	test@test.mr	$2b$10$KAUZdPx0HrGEJ/IUTGmhiOaVO7Ob2zft7Y4SjTUfyao32SFeaU1fa	ADMIN	t	\N	\N	\N	2026-03-08 05:20:39.157	2026-03-08 05:20:39.157	\N	\N
f639fdd0-9549-4946-87e2-ade396c56e82	ce382c53-87c2-46e3-b75a-bed8f80652f1	admin@hongdong.com	$2b$10$KXEn1ysfsiytsO5q4YSgVOdTHYpMCryKnfxTi/KmstEjJkQ/uf.Ou	ADMIN	t	2026-03-29 19:52:33.957	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmNjM5ZmRkMC05NTQ5LTQ5NDYtODdlMi1hZGUzOTZjNTZlODIiLCJ0ZW5hbnRJZCI6ImNlMzgyYzUzLTg3YzItNDZlMy1iNzVhLWJlZDhmODA2NTJmMSIsInJvbGUiOiJBRE1JTiIsImVtcGxveWVlSWQiOm51bGwsImlhdCI6MTc3NDgxMzk1MywiZXhwIjoxNzc1NDE4NzUzfQ.DHuBwUiC5Uyrefff9qcgMCsCwIiVgNvWHTuIlEn-0DU	\N	2026-03-29 02:13:47.804	2026-03-29 19:52:33.96	\N	\N
d042c10f-70dd-49a3-8a52-9361339f623d	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	demsscashdddd@gmail.com	$2b$10$8eX6FlVV26XA9cf88M7JzOJCEomo9LX52EHIQEsxUQKTNt5VVyp1C	EMPLOYEE	t	2026-04-14 18:33:42.922	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMDQyYzEwZi03MGRkLTQ5YTMtOGE1Mi05MzYxMzM5ZjYyM2QiLCJ0ZW5hbnRJZCI6IjkyMGRkM2ZmLWQ0YjktNGY2MC05NmVlLTU4ZDY3YWViYzcwYSIsInJvbGUiOiJFTVBMT1lFRSIsImVtcGxveWVlSWQiOiI0NzkwOWY5NS05ZDI4LTRlZGYtOWVkMS05MzEyNTEzOTQ2NjEiLCJpYXQiOjE3NzYxOTE2MjIsImV4cCI6MTc3ODc4MzYyMn0.k4rLkqFVVYymHSUmFLLQA2S4ucfu64FNIBQ65Tnv9W0	47909f95-9d28-4edf-9ed1-931251394661	2026-04-14 18:33:18.564	2026-04-14 18:33:42.923	\N	\N
73d1c45c-27c4-4378-8722-be8ab225613b	920dd3ff-d4b9-4f60-96ee-58d67aebc70a	demsscash@gmail.com	$2b$10$qTKFPMFcaTJ4/ifQW/IpiOmi3QvqeXYr8flhiGLCGZJzSrmzMQF6O	EMPLOYEE	t	2026-03-28 21:41:44.708	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI3M2QxYzQ1Yy0yN2M0LTQzNzgtODcyMi1iZThhYjIyNTYxM2IiLCJ0ZW5hbnRJZCI6IjkyMGRkM2ZmLWQ0YjktNGY2MC05NmVlLTU4ZDY3YWViYzcwYSIsInJvbGUiOiJFTVBMT1lFRSIsImVtcGxveWVlSWQiOiI5YmQ3NzVjOC00OTVhLTQ4ODktOTc0MS1jMjU5OTA0NmI0NzciLCJpYXQiOjE3NzQ3MzQxMDQsImV4cCI6MTc3NTMzODkwNH0.IqD3Dkw0Djr_T-jF1h8GJb7M5gQV8Lz5zs2fie-tjUQ	9bd775c8-495a-4889-9741-c2599046b477	2026-03-09 03:48:18.534	2026-03-28 21:41:44.71	\N	\N
\.


--
-- Name: Advantage Advantage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Advantage"
    ADD CONSTRAINT "Advantage_pkey" PRIMARY KEY (id);


--
-- Name: AttendanceCode AttendanceCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceCode"
    ADD CONSTRAINT "AttendanceCode_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: AuditLog AuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Declaration Declaration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Declaration"
    ADD CONSTRAINT "Declaration_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeAdvantage EmployeeAdvantage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAdvantage"
    ADD CONSTRAINT "EmployeeAdvantage_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeTimeline EmployeeTimeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeTimeline"
    ADD CONSTRAINT "EmployeeTimeline_pkey" PRIMARY KEY (id);


--
-- Name: Employee Employee_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_pkey" PRIMARY KEY (id);


--
-- Name: EvaluationCampaign EvaluationCampaign_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EvaluationCampaign"
    ADD CONSTRAINT "EvaluationCampaign_pkey" PRIMARY KEY (id);


--
-- Name: Evaluation Evaluation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evaluation"
    ADD CONSTRAINT "Evaluation_pkey" PRIMARY KEY (id);


--
-- Name: ExpenseItem ExpenseItem_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseItem"
    ADD CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY (id);


--
-- Name: ExpenseReport ExpenseReport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseReport"
    ADD CONSTRAINT "ExpenseReport_pkey" PRIMARY KEY (id);


--
-- Name: GradeAdvantage GradeAdvantage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradeAdvantage"
    ADD CONSTRAINT "GradeAdvantage_pkey" PRIMARY KEY (id);


--
-- Name: Grade Grade_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_pkey" PRIMARY KEY (id);


--
-- Name: Holiday Holiday_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_pkey" PRIMARY KEY (id);


--
-- Name: LeaveBalance LeaveBalance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY (id);


--
-- Name: LeaveType LeaveType_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveType"
    ADD CONSTRAINT "LeaveType_pkey" PRIMARY KEY (id);


--
-- Name: Leave Leave_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Leave"
    ADD CONSTRAINT "Leave_pkey" PRIMARY KEY (id);


--
-- Name: OnboardingTask OnboardingTask_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_pkey" PRIMARY KEY (id);


--
-- Name: OnboardingTemplate OnboardingTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTemplate"
    ADD CONSTRAINT "OnboardingTemplate_pkey" PRIMARY KEY (id);


--
-- Name: OvertimeConfig OvertimeConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OvertimeConfig"
    ADD CONSTRAINT "OvertimeConfig_pkey" PRIMARY KEY (id);


--
-- Name: Overtime Overtime_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Overtime"
    ADD CONSTRAINT "Overtime_pkey" PRIMARY KEY (id);


--
-- Name: Payroll Payroll_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_pkey" PRIMARY KEY (id);


--
-- Name: Payslip Payslip_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_pkey" PRIMARY KEY (id);


--
-- Name: SalaryAdvance SalaryAdvance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalaryAdvance"
    ADD CONSTRAINT "SalaryAdvance_pkey" PRIMARY KEY (id);


--
-- Name: Sanction Sanction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sanction"
    ADD CONSTRAINT "Sanction_pkey" PRIMARY KEY (id);


--
-- Name: SignatureRequest SignatureRequest_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignatureRequest"
    ADD CONSTRAINT "SignatureRequest_pkey" PRIMARY KEY (id);


--
-- Name: TaxConfig TaxConfig_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxConfig"
    ADD CONSTRAINT "TaxConfig_pkey" PRIMARY KEY (id);


--
-- Name: TenantSettings TenantSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantSettings"
    ADD CONSTRAINT "TenantSettings_pkey" PRIMARY KEY (id);


--
-- Name: Tenant Tenant_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Tenant"
    ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Advantage_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Advantage_tenantId_name_key" ON public."Advantage" USING btree ("tenantId", name);


--
-- Name: AttendanceCode_tenantId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "AttendanceCode_tenantId_code_key" ON public."AttendanceCode" USING btree ("tenantId", code);


--
-- Name: AttendanceCode_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AttendanceCode_tenantId_idx" ON public."AttendanceCode" USING btree ("tenantId");


--
-- Name: Attendance_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_employeeId_idx" ON public."Attendance" USING btree ("employeeId");


--
-- Name: Attendance_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Attendance_tenantId_date_idx" ON public."Attendance" USING btree ("tenantId", date);


--
-- Name: Attendance_tenantId_employeeId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Attendance_tenantId_employeeId_date_key" ON public."Attendance" USING btree ("tenantId", "employeeId", date);


--
-- Name: AuditLog_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_action_idx" ON public."AuditLog" USING btree (action);


--
-- Name: AuditLog_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_createdAt_idx" ON public."AuditLog" USING btree ("createdAt");


--
-- Name: AuditLog_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_tenantId_idx" ON public."AuditLog" USING btree ("tenantId");


--
-- Name: AuditLog_userId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "AuditLog_userId_idx" ON public."AuditLog" USING btree ("userId");


--
-- Name: Department_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Department_tenantId_name_key" ON public."Department" USING btree ("tenantId", name);


--
-- Name: EmployeeAdvantage_employeeId_advantageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "EmployeeAdvantage_employeeId_advantageId_key" ON public."EmployeeAdvantage" USING btree ("employeeId", "advantageId");


--
-- Name: Employee_tenantId_cin_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Employee_tenantId_cin_key" ON public."Employee" USING btree ("tenantId", cin);


--
-- Name: Employee_tenantId_matricule_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Employee_tenantId_matricule_key" ON public."Employee" USING btree ("tenantId", matricule);


--
-- Name: Evaluation_campaignId_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Evaluation_campaignId_employeeId_key" ON public."Evaluation" USING btree ("campaignId", "employeeId");


--
-- Name: ExpenseReport_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExpenseReport_employeeId_idx" ON public."ExpenseReport" USING btree ("employeeId");


--
-- Name: ExpenseReport_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExpenseReport_status_idx" ON public."ExpenseReport" USING btree (status);


--
-- Name: ExpenseReport_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "ExpenseReport_tenantId_idx" ON public."ExpenseReport" USING btree ("tenantId");


--
-- Name: GradeAdvantage_gradeId_advantageId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "GradeAdvantage_gradeId_advantageId_key" ON public."GradeAdvantage" USING btree ("gradeId", "advantageId");


--
-- Name: Grade_tenantId_name_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Grade_tenantId_name_key" ON public."Grade" USING btree ("tenantId", name);


--
-- Name: Holiday_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Holiday_tenantId_date_idx" ON public."Holiday" USING btree ("tenantId", date);


--
-- Name: Holiday_tenantId_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Holiday_tenantId_date_key" ON public."Holiday" USING btree ("tenantId", date);


--
-- Name: LeaveBalance_employeeId_leaveTypeCode_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LeaveBalance_employeeId_leaveTypeCode_year_key" ON public."LeaveBalance" USING btree ("employeeId", "leaveTypeCode", year);


--
-- Name: LeaveType_tenantId_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "LeaveType_tenantId_code_key" ON public."LeaveType" USING btree ("tenantId", code);


--
-- Name: Leave_employeeId_startDate_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Leave_employeeId_startDate_idx" ON public."Leave" USING btree ("employeeId", "startDate");


--
-- Name: Leave_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Leave_status_idx" ON public."Leave" USING btree (status);


--
-- Name: OvertimeConfig_tenantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "OvertimeConfig_tenantId_key" ON public."OvertimeConfig" USING btree ("tenantId");


--
-- Name: Overtime_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Overtime_employeeId_idx" ON public."Overtime" USING btree ("employeeId");


--
-- Name: Overtime_tenantId_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Overtime_tenantId_date_idx" ON public."Overtime" USING btree ("tenantId", date);


--
-- Name: Overtime_tenantId_employeeId_date_tier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Overtime_tenantId_employeeId_date_tier_key" ON public."Overtime" USING btree ("tenantId", "employeeId", date, tier);


--
-- Name: Payroll_tenantId_month_year_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payroll_tenantId_month_year_key" ON public."Payroll" USING btree ("tenantId", month, year);


--
-- Name: Payroll_tenantId_year_month_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Payroll_tenantId_year_month_idx" ON public."Payroll" USING btree ("tenantId", year, month);


--
-- Name: Payslip_payrollId_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Payslip_payrollId_employeeId_key" ON public."Payslip" USING btree ("payrollId", "employeeId");


--
-- Name: SalaryAdvance_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalaryAdvance_employeeId_idx" ON public."SalaryAdvance" USING btree ("employeeId");


--
-- Name: SalaryAdvance_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalaryAdvance_status_idx" ON public."SalaryAdvance" USING btree (status);


--
-- Name: SalaryAdvance_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SalaryAdvance_tenantId_idx" ON public."SalaryAdvance" USING btree ("tenantId");


--
-- Name: Sanction_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Sanction_employeeId_idx" ON public."Sanction" USING btree ("employeeId");


--
-- Name: Sanction_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Sanction_status_idx" ON public."Sanction" USING btree (status);


--
-- Name: Sanction_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Sanction_tenantId_idx" ON public."Sanction" USING btree ("tenantId");


--
-- Name: SignatureRequest_employeeId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignatureRequest_employeeId_idx" ON public."SignatureRequest" USING btree ("employeeId");


--
-- Name: SignatureRequest_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignatureRequest_status_idx" ON public."SignatureRequest" USING btree (status);


--
-- Name: SignatureRequest_tenantId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "SignatureRequest_tenantId_idx" ON public."SignatureRequest" USING btree ("tenantId");


--
-- Name: TaxConfig_tenantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TaxConfig_tenantId_key" ON public."TaxConfig" USING btree ("tenantId");


--
-- Name: TenantSettings_tenantId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON public."TenantSettings" USING btree ("tenantId");


--
-- Name: Tenant_subdomain_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Tenant_subdomain_key" ON public."Tenant" USING btree (subdomain);


--
-- Name: User_employeeId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_employeeId_key" ON public."User" USING btree ("employeeId");


--
-- Name: User_tenantId_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_email_key" ON public."User" USING btree ("tenantId", email);


--
-- Name: User_tenantId_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_tenantId_phone_key" ON public."User" USING btree ("tenantId", phone);


--
-- Name: Advantage Advantage_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Advantage"
    ADD CONSTRAINT "Advantage_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AttendanceCode AttendanceCode_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AttendanceCode"
    ADD CONSTRAINT "AttendanceCode_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_attendanceCodeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_attendanceCodeId_fkey" FOREIGN KEY ("attendanceCodeId") REFERENCES public."AttendanceCode"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Attendance Attendance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AuditLog AuditLog_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."AuditLog"
    ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Declaration Declaration_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Declaration"
    ADD CONSTRAINT "Declaration_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Department Department_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Document Document_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmployeeAdvantage EmployeeAdvantage_advantageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAdvantage"
    ADD CONSTRAINT "EmployeeAdvantage_advantageId_fkey" FOREIGN KEY ("advantageId") REFERENCES public."Advantage"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EmployeeAdvantage EmployeeAdvantage_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeAdvantage"
    ADD CONSTRAINT "EmployeeAdvantage_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: EmployeeTimeline EmployeeTimeline_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EmployeeTimeline"
    ADD CONSTRAINT "EmployeeTimeline_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Employee Employee_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_gradeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES public."Grade"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_managerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Employee Employee_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Employee"
    ADD CONSTRAINT "Employee_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: EvaluationCampaign EvaluationCampaign_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."EvaluationCampaign"
    ADD CONSTRAINT "EvaluationCampaign_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Evaluation Evaluation_campaignId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evaluation"
    ADD CONSTRAINT "Evaluation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES public."EvaluationCampaign"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Evaluation Evaluation_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evaluation"
    ADD CONSTRAINT "Evaluation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Evaluation Evaluation_evaluatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evaluation"
    ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Evaluation Evaluation_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Evaluation"
    ADD CONSTRAINT "Evaluation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExpenseItem ExpenseItem_expenseReportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseItem"
    ADD CONSTRAINT "ExpenseItem_expenseReportId_fkey" FOREIGN KEY ("expenseReportId") REFERENCES public."ExpenseReport"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ExpenseReport ExpenseReport_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseReport"
    ADD CONSTRAINT "ExpenseReport_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ExpenseReport ExpenseReport_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."ExpenseReport"
    ADD CONSTRAINT "ExpenseReport_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: GradeAdvantage GradeAdvantage_advantageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradeAdvantage"
    ADD CONSTRAINT "GradeAdvantage_advantageId_fkey" FOREIGN KEY ("advantageId") REFERENCES public."Advantage"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: GradeAdvantage GradeAdvantage_gradeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GradeAdvantage"
    ADD CONSTRAINT "GradeAdvantage_gradeId_fkey" FOREIGN KEY ("gradeId") REFERENCES public."Grade"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Grade Grade_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Grade"
    ADD CONSTRAINT "Grade_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Holiday Holiday_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Holiday"
    ADD CONSTRAINT "Holiday_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeaveBalance LeaveBalance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveBalance"
    ADD CONSTRAINT "LeaveBalance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LeaveType LeaveType_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."LeaveType"
    ADD CONSTRAINT "LeaveType_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Leave Leave_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Leave"
    ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Leave Leave_leaveTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Leave"
    ADD CONSTRAINT "Leave_leaveTypeId_fkey" FOREIGN KEY ("leaveTypeId") REFERENCES public."LeaveType"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnboardingTask OnboardingTask_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTask"
    ADD CONSTRAINT "OnboardingTask_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OnboardingTemplate OnboardingTemplate_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OnboardingTemplate"
    ADD CONSTRAINT "OnboardingTemplate_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OvertimeConfig OvertimeConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OvertimeConfig"
    ADD CONSTRAINT "OvertimeConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Overtime Overtime_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Overtime"
    ADD CONSTRAINT "Overtime_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Overtime Overtime_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Overtime"
    ADD CONSTRAINT "Overtime_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payroll Payroll_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payroll"
    ADD CONSTRAINT "Payroll_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payslip Payslip_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Payslip Payslip_payrollId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Payslip"
    ADD CONSTRAINT "Payslip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES public."Payroll"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalaryAdvance SalaryAdvance_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalaryAdvance"
    ADD CONSTRAINT "SalaryAdvance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SalaryAdvance SalaryAdvance_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SalaryAdvance"
    ADD CONSTRAINT "SalaryAdvance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sanction Sanction_advantageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sanction"
    ADD CONSTRAINT "Sanction_advantageId_fkey" FOREIGN KEY ("advantageId") REFERENCES public."Advantage"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Sanction Sanction_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sanction"
    ADD CONSTRAINT "Sanction_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Sanction Sanction_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Sanction"
    ADD CONSTRAINT "Sanction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SignatureRequest SignatureRequest_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignatureRequest"
    ADD CONSTRAINT "SignatureRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SignatureRequest SignatureRequest_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SignatureRequest"
    ADD CONSTRAINT "SignatureRequest_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TaxConfig TaxConfig_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TaxConfig"
    ADD CONSTRAINT "TaxConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: TenantSettings TenantSettings_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TenantSettings"
    ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: User User_employeeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES public."Employee"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public."Tenant"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

