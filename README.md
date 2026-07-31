# Caffissimo Admin Panel

A modern, responsive admin panel for a multi-branch coffee shop system. Manages E-Commerce pickup orders, POS operations, and external platform sales (Uber Eats, DoorDash).

## Features

- **Dashboard** - Branch-wise KPIs, sales trends, charts, and recent activity
- **Sales & Reports** - Daily summaries, source breakdown, branch comparison
- **Orders Management** - Unified orders from POS, E-Commerce, Uber Eats, DoorDash
- **External Platforms** - Import/manual entry for Uber Eats and DoorDash sales
- **Products & Catalog** - CRUD with branch-wise pricing and availability
- **Offers & Promotions** - Create and manage discounts with scheduling
- **Branch Management** - Hours, open/close status, delivery platform links
- **Fridge Stock Report** - Daily inventory tracking
- **Attendance** - Employee attendance records
- **Users & Roles** - RBAC with user management
- **Audit Logs** - Track all system changes
- **Settings** - Branding, tax, and developer options

## Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Tables**: TanStack Table
- **State**: Zustand
- **Data**: Mocked API with JSON seed data

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Role-Based Access Control (RBAC)

The admin panel implements four roles with different permissions:

### Super Admin (Franchise Owner)
- Access to all branches
- Full access to all features
- Can manage users, settings, and audit logs
- Can compare branches in reports

### Branch Owner
- Access to assigned branch only
- Can manage products, offers, orders
- Can view attendance and reports
- Can manage users within their branch

### Supervisor
- Access to assigned branch only
- Can manage products, pricing, availability
- Can submit fridge stock reports
- Can toggle branch open/close

### Cashier
- POS only (not for admin panel)
- Can be created and managed by admin

## Switching Roles in Dev Mode

1. **Dev Mode Toggle**: Go to Settings > Developer > Enable "Dev Mode"
2. **Role Switcher**: When dev mode is enabled, a dropdown appears in the header
3. **Select Role**: Choose between Super Admin, Branch Owner, or Supervisor
4. **See Changes**: The UI will update to show/hide features based on permissions

Alternatively, use the login page at `/admin/login` and click one of the demo account buttons.

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── dashboard/      # KPIs and charts
│   │   ├── reports/        # Sales reports
│   │   ├── orders/         # Order management
│   │   ├── platforms/      # Uber Eats / DoorDash
│   │   ├── products/       # Product catalog
│   │   ├── offers/         # Promotions
│   │   ├── branches/       # Branch management
│   │   ├── fridge-stock/   # Stock reports
│   │   ├── attendance/     # Employee attendance
│   │   ├── users/          # User management
│   │   ├── audit-logs/     # Activity logs
│   │   ├── settings/       # System settings
│   │   ├── login/          # Login page
│   │   └── layout.tsx      # Admin layout wrapper
│   ├── api/                # API routes
│   └── page.tsx            # Redirect to dashboard
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Sidebar, Header, AdminLayout
│   └── shared/             # Reusable components
├── data/
│   └── seed.ts             # Mock data (3 branches, 30 products, 120 orders)
├── lib/
│   └── utils.ts            # Utility functions
├── stores/
│   └── app-store.ts        # Zustand store + RBAC helpers
└── types/
    └── index.ts            # TypeScript types
```

## API Routes

The project includes mock API routes that can be swapped to a real backend:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (filterable) |
| POST | `/api/orders` | Create order |
| GET | `/api/orders/:id` | Get order details |
| PATCH | `/api/orders/:id` | Update order |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create product |
| GET | `/api/branches` | List branches |
| POST | `/api/branches` | Create branch |
| GET | `/api/users` | List users |
| POST | `/api/users` | Create user |
| GET | `/api/reports` | Get sales reports |

## Seed Data

The application includes realistic seed data:

- **3 Branches**: Downtown, Westside, University
- **30 Products**: Coffee drinks, teas, pastries, sandwiches, merchandise
- **120 Orders**: Mixed sources (POS, E-Commerce, Uber Eats, DoorDash)
- **External Sales**: 30 days of Uber Eats and DoorDash entries
- **10 Users**: Various roles across branches
- **50 Audit Logs**: Price changes, order cancellations, etc.

## Design Highlights

- **Premium UI**: Clean, modern design with consistent spacing
- **Responsive**: Sidebar collapses on tablet, becomes drawer on mobile
- **Source Badges**: Color-coded badges for POS, E-Commerce, Uber Eats, DoorDash
- **Empty States**: Helpful messages when no data is available
- **Skeleton Loaders**: Loading states for better UX
- **Subtle Animations**: Framer Motion for smooth transitions

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT
