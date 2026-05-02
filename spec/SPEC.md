# Kaheteyn (كهاتين) — Application Specification

## 1. Overview
**Kaheteyn** is an Arabic (RTL) **orphan sponsorship management system** for a Palestinian charitable organization. It tracks orphaned/needy children, the sponsors (kafeel) who fund them, monthly sponsorship payments (kafala), guardian acknowledgment receipts, and produces dashboards, alerts, and printable reports.

- **Language / Direction:** Arabic, fully RTL.
- **Brand:** Logo "كهاتين" — black Arabic wordmark with a green vertical accent and a red curved accent (Palestinian flag colors).
- **Audience:** Charity admins managing sponsorships end-to-end.
- **Currency:** USD (fixed for v1).

## 2. Goals
- Maintain a registry of sponsored children with full profiles and documents.
- Maintain a registry of sponsors and their preferred payment channels.
- Record monthly sponsorship payments and reconcile them with guardian acknowledgments.
- Surface gaps (unsponsored children, missing payments, missing receipts).
- Provide printable monthly reports for transparency / donor reporting.
- Maintain an audit trail of every change.

## 3. User Roles
- **Admin (مدير عام)** — single role; all admins share the same permissions in v1.
- Login required. Demo credentials: `admin` / `123456`.
- Designed for a small charity-office staff, not public users.

## 4. Core Entities

### 4.1 Child (طفل)
- ID format: `CH-####`
- Full name
- Age, birth date, gender
- Place of residence (governorate / area)
- Health status / notes
- School stage (روضة / ابتدائي / إعدادي / ثانوي / جامعي / غير ملتحق)
- Father's name, date of father's death, cause of death
- Mother's name
- Number of siblings
- Legal guardian name + relationship
- Phone number
- Guardian bank/wallet account info
- Sponsorship status: **مكفول (sponsored)** or **غير مكفول (unsponsored)**
- Linked sponsor ID (exactly **one** sponsor max; split sponsorships are not supported in v1)
- Photo (image upload)
- Birth certificate (image or PDF upload)

### 4.2 Sponsor / Kafeel (كفيل)
- ID format: `SP-###`
- Name (individual or organization, e.g., "جمعية أصدقاء غزة")
- Phone / contact
- Preferred payment method: **بنك فلسطين**, **بال بي (PalPay)**, **تحويل بنكي**
- Notes

### 4.3 Payment / Kafala (دفعة)
- ID format: `PAY-...`
- Linked child ID
- Linked sponsor ID
- Month label, e.g., "مايو 2024"
- Amount (USD)
- Date sent
- Payment status: **مدفوع (paid)**, **انتظار (pending)**, **متأخر (late)**
- Financial status workflow: **مرسلة (sent)** → **مؤكدة (confirmed)** or **مرفوضة (rejected)**
- Payment receipt attachment (image / PDF)

### 4.4 Receipt / Acknowledgment (إقرار استلام)
- Linked payment ID
- Guardian acknowledgment document (image / PDF)
- Date received
- Notes

### 4.5 Admin User
- ID, name, username, password, role.
- All admins are equivalent in v1 (no granular permissions).

### 4.6 Action Log (سجل العمليات)
- Immutable record of every create/update/delete.
- Captures: timestamp, actor, entity, action type, old value, new value, pseudo-identifier.

## 5. Pages & Features

### 5.1 Login Page
- Username + password.
- Branded with Kaheteyn logo.
- Demo credentials may be prefilled.

### 5.2 Dashboard (الرئيسية)
- KPI tiles:
  - Total children
  - Sponsored vs. unsponsored counts
  - Total active sponsors
  - Payments awaiting receipts
  - Total disbursed this month (USD)
- Latest payments list
- Latest acknowledgment receipts list
- Chart: monthly disbursements trend
- "Ready to disburse" list (sponsored children with no payment recorded for current month)
- **Alert Center** with three severity tiers:
  - **خطر (critical)** — sponsored child with no payment for 2+ months, OR payment with missing acknowledgment receipt for **more than 3 days** past send date
  - **متوسط (warning)** — payment sent but no acknowledgment receipt within 3 days
  - **طبيعي (info)** — minor reminders / informational notices

### 5.3 Children Page (الأطفال)
- Card / grid view of all children with photo, name, status badge.
- Search and filter (by status, residence, school stage, sponsor).
- Add / edit / delete child via modal.
- File uploads for photo and birth certificate.
- Click into a **Child Profile Page** showing all details, payments timeline, attached documents, and a **PDF export** button for the profile.

### 5.4 Sponsors Page (الكفلاء)
- Table/list of sponsors.
- Add / edit / delete via modal.
- Show count of children sponsored and total disbursed per sponsor.

### 5.5 Payments Page (الدفعات)
- Table of all payments, filterable by month, sponsor, child, status.
- Add new payment (link to child + sponsor, set month, amount, attach receipt).
- Workflow actions: mark as sent → confirm / reject.

### 5.6 Receipts / Acknowledgments Page (الإقرارات)
- Table of guardian acknowledgments.
- Reconcile each acknowledgment against the corresponding payment.
- Highlight mismatches (payment exists but no acknowledgment, or vice versa).

### 5.7 Reports Page (التقارير)
- Monthly sponsorship report:
  - Summary cards (totals, counts).
  - Detailed table of all payments for the selected month.
- **Print stylesheet** optimized for A4 landscape:
  - Hides nav/chrome.
  - Adds branded header with logo and report title.
- Filters by month / sponsor / status.

### 5.8 Missing / Follow-up Page (المتابعة)
- Dashboard of gaps:
  - Unsponsored children
  - Sponsored children with no payment this month
  - Payments without acknowledgment receipts
  - Children with incomplete profiles (missing photo, birth certificate, guardian info, etc.)

### 5.9 Audit Log Page (سجل العمليات)
- Filterable list of all actions.
- Show old vs. new values for updates.
- Filters by date range, user, entity type, action type.

## 6. Cross-Cutting UX Requirements
- **RTL Arabic layout** throughout.
- **Tajawal** (or similar Arabic-friendly) font.
- **Toast notifications** for success/error.
- **Confirm dialogs** before destructive actions.
- **Undo** for the last action via a floating "↶ تراجع" button (snapshot-based).
- **Auto-save** of forms with ~500ms debounce.
- **Mobile-friendly** sidebar (collapsible).
- **File uploads** support images and PDFs for: child photo, birth certificate, payment receipt, guardian acknowledgment.
- **Status badges** in brand colors (green = good, red = critical, neutral = info).
- **Empty states** in Arabic for every list.

## 7. Business Rules
- A child marked **مكفول** must have exactly one linked sponsor.
- A child can have at most **one** active sponsor at a time (no split sponsorships).
- A payment must reference both an existing child and an existing sponsor.
- Financial status progression: **مرسلة → مؤكدة / مرفوضة**. Rejected payments remain visible and flagged.
- An acknowledgment receipt must reference an existing payment.
- Unique IDs auto-generated per entity (`CH-`, `SP-`, `PAY-`).
- Deleting a sponsor with linked payments must warn the user.
- The system flags any sponsored child without a payment for the current month.
- A payment without a matching acknowledgment receipt becomes a **warning** alert immediately and a **critical** alert after **3 days**.

## 8. Reporting & Export
- **PDF** export of an individual child's profile.
- **Printable** monthly disbursement report (A4 landscape).
- **CSV / Excel** export for: children list, sponsors list, payments list, monthly report. (Required in v1.)

## 9. Data Persistence Expectations
- All entities are persisted server-side.
- Automatic timestamped backups of the data store on every mutation (or at scheduled intervals).
- Uploaded files (photos, certificates, receipts) must be retrievable and viewable inline.

## 10. Security Expectations
- Real authentication with hashed passwords.
- Server-side authorization on every API call.
- All admin users share the same role and permissions in v1; no granular RBAC required.
- Audit log entries cannot be edited or deleted by users.

## 11. Seed / Demo Data
- 3 sample children (e.g., يوسف علاء، مريم ياسر، أحمد إياد).
- 3 sample sponsors (one being an organization such as "جمعية أصدقاء غزة").
- 1 sample payment (May 2024, $100, مدفوع / مؤكدة).
- Empty receipts and audit log to start.
- One admin user: `admin` / `123456`.

## 12. Out of Scope (v1)
- Public donor portal.
- Online payment processing (payments are recorded after the fact).
- Multi-language UI (Arabic only).
- Multi-tenant / multi-organization support.
- Split sponsorships (multiple sponsors per child).
- Multi-currency support.
- Granular roles / permissions beyond a single admin role.
