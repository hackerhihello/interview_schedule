# Ignited Minds Learning - Premium Interview Scheduler

Ignited Minds Learning is a state-of-the-art, secure, full-stack Interview Scheduling Dashboard designed for modern recruitment operations. Built with Next.js 16, Convex real-time database capabilities, and Clerk authentication/role management, it allows companies to coordinate technical, system design, HR, managerial, and coding assessments seamlessly.

---

## 🚀 Key Features

* **Interactive Calendar & Registry Grid**: Visualize all scheduled assessments in interactive monthly calendar grids or rich, paginated registry listings with real-time keyword, category, status, and interviewer filters.
* **Creator-Owned Session Control (RBAC)**:
  * **Administrators** possess system-wide control to schedule, edit, assign coordinators, view detailed activity logs, and delete any slot.
  * **Approved Coordinators / Standard Users** can schedule new assessments and edit or delete ONLY the interviews they created themselves. They retain full visibility of all other scheduled interviews in a locked read-only state.
* **Activity & Audit Logging**: Automatic operational audits tracking creation, modifications, promotions, and deletions, compliant with strict administrative control guidelines.
* **CSV Reporting Export**: Compile and export live scheduled slots to CSV instantly.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 16 (App Router), Tailwind CSS, Lucide Icons, Recharts, React Hook Form, Zod.
* **Database & Serverless Backend**: Convex (Real-time reactive queries and mutations).
* **Authentication**: Clerk (Role-based access control, Google SSO integration).

---

## 📦 Getting Started

### 1. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/Rahul8366/interview-schedule.git
cd interview-schedule
npm install
```

### 2. Configure Environment Variables
Create a `.env.local` file in the root directory and specify your Convex and Clerk credentials:
```env
# Clerk Authentication Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Convex Real-time Database Configuration
NEXT_PUBLIC_CONVEX_URL=your_convex_url
```

### 3. Run Development Server
Start the local server for the client and Convex server concurrently:
```bash
# Run client locally
npm run dev

# Run Convex development server (in a separate terminal)
npx convex dev
```

Open [http://localhost:3000](http://localhost:3000) to access the Ignited Minds Learning platform.
