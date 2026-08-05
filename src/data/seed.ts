import {
  Branch,
  BranchPurpose,
  Category,
  Product,
  BranchProduct,
  Order,
  OrderSource,
  OrderStatus,
  PaymentMethod,
  User,
  Offer,
  ExternalSalesEntry,
  FridgeStockReport,
  AttendanceEntry,
  POSDayRecord,
  POSSession,
  AuditLog,
  UserRole,
} from "@/types";
import { subDays, format, addHours } from "date-fns";

// ============== BRANCHES ==============
export const branches: Branch[] = [
  {
    branchId: "branch-1",
    purpose: BranchPurpose.Operational,
    branchName: "Downtown Caffissimo",
    branchAddress: "123 Main Street, Downtown, CA 90001",
    branchPhoneNumber: "(555) 123-4567",
    branchEmail: "downtown@caffissimo.com",
    isOpen: true,
    isActive: true,
    openingHours: [
      { branchOpeningHoursId: "bh-1-1", dayOfWeek: 1, openAt: "06:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-2", dayOfWeek: 2, openAt: "06:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-3", dayOfWeek: 3, openAt: "06:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-4", dayOfWeek: 4, openAt: "06:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-5", dayOfWeek: 5, openAt: "06:00", closeAt: "21:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-6", dayOfWeek: 6, openAt: "07:00", closeAt: "21:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-1-0", dayOfWeek: 0, openAt: "07:00", closeAt: "18:00", isClosed: false, isActive: true },
    ],
    uberEatsUrl: "https://ubereats.com/caffissimo-downtown",
    doorDashUrl: "https://doordash.com/caffissimo-downtown",
    createdAt: "2024-01-15T08:00:00Z",
    updatedAt: "2024-01-15T08:00:00Z",
  },
  {
    branchId: "branch-2",
    purpose: BranchPurpose.Operational,
    branchName: "Westside Caffissimo",
    branchAddress: "456 Ocean Boulevard, Westside, CA 90002",
    branchPhoneNumber: "(555) 234-5678",
    branchEmail: "westside@caffissimo.com",
    isOpen: true,
    isActive: true,
    openingHours: [
      { branchOpeningHoursId: "bh-2-1", dayOfWeek: 1, openAt: "07:00", closeAt: "19:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-2", dayOfWeek: 2, openAt: "07:00", closeAt: "19:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-3", dayOfWeek: 3, openAt: "07:00", closeAt: "19:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-4", dayOfWeek: 4, openAt: "07:00", closeAt: "19:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-5", dayOfWeek: 5, openAt: "07:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-6", dayOfWeek: 6, openAt: "08:00", closeAt: "20:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-2-0", dayOfWeek: 0, openAt: "08:00", closeAt: "17:00", isClosed: false, isActive: true },
    ],
    uberEatsUrl: "https://ubereats.com/caffissimo-westside",
    doorDashUrl: "https://doordash.com/caffissimo-westside",
    createdAt: "2024-03-01T08:00:00Z",
    updatedAt: "2024-03-01T08:00:00Z",
  },
  {
    branchId: "branch-3",
    purpose: BranchPurpose.Operational,
    branchName: "University Caffissimo",
    branchAddress: "789 College Ave, University District, CA 90003",
    branchPhoneNumber: "(555) 345-6789",
    branchEmail: "university@caffissimo.com",
    isOpen: false,
    isActive: true,
    openingHours: [
      { branchOpeningHoursId: "bh-3-1", dayOfWeek: 1, openAt: "06:30", closeAt: "22:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-2", dayOfWeek: 2, openAt: "06:30", closeAt: "22:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-3", dayOfWeek: 3, openAt: "06:30", closeAt: "22:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-4", dayOfWeek: 4, openAt: "06:30", closeAt: "22:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-5", dayOfWeek: 5, openAt: "06:30", closeAt: "23:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-6", dayOfWeek: 6, openAt: "08:00", closeAt: "23:00", isClosed: false, isActive: true },
      { branchOpeningHoursId: "bh-3-0", dayOfWeek: 0, openAt: "09:00", closeAt: "20:00", isClosed: false, isActive: true },
    ],
    uberEatsUrl: "https://ubereats.com/caffissimo-university",
    doorDashUrl: "https://doordash.com/caffissimo-university",
    createdAt: "2024-06-15T08:00:00Z",
    updatedAt: "2024-06-15T08:00:00Z",
  },
];

// ============== CATEGORIES ==============
export const categories: Category[] = [
  { productCategoryId: "cat-1", categoryName: "Espresso Drinks", isActive: true },
  { productCategoryId: "cat-2", categoryName: "Cold Brew & Iced", isActive: true },
  { productCategoryId: "cat-3", categoryName: "Tea & Specialty", isActive: true },
  { productCategoryId: "cat-4", categoryName: "Pastries", isActive: true },
  { productCategoryId: "cat-5", categoryName: "Sandwiches", isActive: true },
  { productCategoryId: "cat-6", categoryName: "Merchandise", isActive: true },
];

// ============== PRODUCTS ==============
export const products: Product[] = [
  // Espresso Drinks
  { productId: "prod-1", productName: "Classic Espresso", productDescription: "Rich, bold single or double shot of espresso", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 4.5, posImage: ["/products/espresso.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-2", productName: "Caffissimo Latte", productDescription: "Smooth espresso with steamed milk and light foam", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 5.0, posImage: ["/products/latte.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-3", productName: "Cappuccino", productDescription: "Equal parts espresso, steamed milk, and foam", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 5.0, posImage: ["/products/cappuccino.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-4", productName: "Americano", productDescription: "Espresso diluted with hot water", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 4.0, posImage: ["/products/americano.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-5", productName: "Flat White", productDescription: "Velvety microfoam with ristretto shots", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 5.0, posImage: ["/products/flatwhite.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-6", productName: "Mocha", productDescription: "Espresso with chocolate and steamed milk", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 5.5, posImage: ["/products/mocha.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { productId: "prod-7", productName: "Caramel Macchiato", productDescription: "Vanilla-flavored latte with caramel drizzle", productCategoryId: "cat-1", productCategoryName: "Espresso Drinks", productPrice: 5.75, posImage: ["/products/caramel-macchiato.jpg"], isVisible: true, isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
];

export function generateBranchProducts(): BranchProduct[] {
  const result: BranchProduct[] = [];
  let id = 1;
  for (const branch of branches) {
    for (const product of products) {
      const basePrice = product.productPrice;
      const priceVariation = branch.branchId === "branch-1" ? 0 : branch.branchId === "branch-2" ? 0.25 : -0.25;
      result.push({
        id: `bp-${id++}`,
        productId: product.productId,
        branchId: branch.branchId,
        price: parseFloat((basePrice + priceVariation).toFixed(2)),
        isAvailable: true,
        isVisible: true,
        createdAt: "2024-01-15T08:00:00Z",
        updatedAt: "2024-01-15T08:00:00Z",
      });
    }
  }
  return result;
}

export const branchProducts = generateBranchProducts();

// ============== USERS ==============
export const users: User[] = [
  { id: "user-1", name: "Alex Johnson", email: "alex@caffissimo.com", role: UserRole.SuperAdmin, avatar: "", isActive: true, createdAt: "2024-01-01T08:00:00Z", updatedAt: "2024-01-01T08:00:00Z" },
  { id: "user-2", name: "Maria Garcia", email: "maria@caffissimo.com", role: UserRole.BranchOwner, branchId: "branch-1", avatar: "", isActive: true, createdAt: "2024-01-15T08:00:00Z", updatedAt: "2024-01-15T08:00:00Z" },
  { id: "user-3", name: "James Wilson", email: "james@caffissimo.com", role: UserRole.BranchOwner, branchId: "branch-2", avatar: "", isActive: true, createdAt: "2024-03-01T08:00:00Z", updatedAt: "2024-03-01T08:00:00Z" },
  { id: "user-4", name: "Sarah Chen", email: "sarah@caffissimo.com", role: UserRole.BranchOwner, branchId: "branch-3", avatar: "", isActive: true, createdAt: "2024-06-15T08:00:00Z", updatedAt: "2024-06-15T08:00:00Z" },
  { id: "user-5", name: "Michael Brown", email: "michael@caffissimo.com", role: UserRole.Supervisor, branchId: "branch-1", avatar: "", isActive: true, createdAt: "2024-02-01T08:00:00Z", updatedAt: "2024-02-01T08:00:00Z" },
  { id: "user-6", name: "Emily Davis", email: "emily@caffissimo.com", role: UserRole.Supervisor, branchId: "branch-2", avatar: "", isActive: true, createdAt: "2024-04-01T08:00:00Z", updatedAt: "2024-04-01T08:00:00Z" },
  { id: "user-7", name: "David Lee", email: "david@caffissimo.com", role: UserRole.Cashier, branchId: "branch-1", avatar: "", isActive: true, createdAt: "2024-02-15T08:00:00Z", updatedAt: "2024-02-15T08:00:00Z" },
  { id: "user-8", name: "Jessica Martinez", email: "jessica@caffissimo.com", role: UserRole.Cashier, branchId: "branch-1", avatar: "", isActive: true, createdAt: "2024-02-15T08:00:00Z", updatedAt: "2024-02-15T08:00:00Z" },
  { id: "user-9", name: "Chris Taylor", email: "chris@caffissimo.com", role: UserRole.Cashier, branchId: "branch-2", avatar: "", isActive: true, createdAt: "2024-04-15T08:00:00Z", updatedAt: "2024-04-15T08:00:00Z" },
  { id: "user-10", name: "Amanda White", email: "amanda@caffissimo.com", role: UserRole.Cashier, branchId: "branch-3", avatar: "", isActive: false, createdAt: "2024-07-01T08:00:00Z", updatedAt: "2024-07-01T08:00:00Z" },
];

function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

const BASE_DATE = new Date("2026-02-05T12:00:00Z");

// ============== ORDERS ==============
export function generateOrders(): Order[] {
  const orders: Order[] = [];
  const sources: OrderSource[] = ["pos", "ecommerce", "uber_eats", "doordash"];
  const statuses: OrderStatus[] = ["completed", "completed", "completed", "cancelled", "ready", "preparing"];
  const paymentMethods: PaymentMethod[] = ["cash", "card", "card", "online"];
  const customerNames = ["John D.", "Sarah M.", "Mike T.", "Emma R.", "Alex K.", "Lisa P.", null, null];
  const random = seededRandom(12345);

  for (let i = 0; i < 120; i++) {
    const daysAgo = Math.floor(random() * 30);
    const hoursAgo = Math.floor(random() * 14) + 6;
    const orderDate = addHours(subDays(BASE_DATE, daysAgo), -hoursAgo);
    const source = sources[Math.floor(random() * sources.length)];
    const branch = branches[Math.floor(random() * branches.length)];
    const status = statuses[Math.floor(random() * statuses.length)];
    const itemCount = Math.floor(random() * 4) + 1;
    const items = [];
    let subtotal = 0;

    for (let j = 0; j < itemCount; j++) {
      const product = products[Math.floor(random() * products.length)];
      const bp = branchProducts.find(bp => bp.productId === product.productId && bp.branchId === branch.branchId);
      const quantity = Math.floor(random() * 2) + 1;
      const unitPrice = bp?.price || 5.00;
      const totalPrice = unitPrice * quantity;
      subtotal += totalPrice;

      items.push({
        id: `item-${i}-${j}`,
        productId: product.productId,
        productName: product.productName,
        quantity,
        unitPrice,
        totalPrice: parseFloat(totalPrice.toFixed(2)),
      });
    }

    const tax = parseFloat((subtotal * 0.0875).toFixed(2));
    const discount = random() > 0.8 ? parseFloat((subtotal * 0.1).toFixed(2)) : 0;
    const total = parseFloat((subtotal + tax - discount).toFixed(2));

    const paymentMethod: PaymentMethod = source === "uber_eats" || source === "doordash" 
      ? "external" 
      : source === "ecommerce" 
        ? "online" 
        : paymentMethods[Math.floor(random() * paymentMethods.length)];

    const customerName = source === "pos" && random() > 0.5 
      ? null 
      : customerNames[Math.floor(random() * customerNames.length)];
    
    orders.push({
      id: `order-${i + 1}`,
      orderNumber: `ORD-${format(orderDate, "yyyyMMdd")}-${String(i + 1).padStart(4, "0")}`,
      branchId: branch.branchId,
      source,
      status,
      items,
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      discount,
      total,
      paymentMethod,
      customerName: customerName || undefined,
      customerEmail: customerName ? `${customerName.toLowerCase().replace(" ", ".")}@email.com` : undefined,
      isReadOnly: source === "uber_eats" || source === "doordash",
      statusHistory: [
        { status: "pending", timestamp: orderDate.toISOString() },
        { status: "confirmed", timestamp: addHours(orderDate, 0.05).toISOString() },
      ],
      createdAt: orderDate.toISOString(),
      updatedAt: addHours(orderDate, 0.5).toISOString(),
    });
  }

  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const orders = generateOrders();

// ============== EXTERNAL SALES ENTRIES ==============
export function generateExternalSales(): ExternalSalesEntry[] {
  const entries: ExternalSalesEntry[] = [];
  let id = 1;

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    const date = subDays(BASE_DATE, daysAgo);
    const dateStr = format(date, "yyyy-MM-dd");

    for (const branch of branches) {
      if (daysAgo % 5 !== 0) {
        entries.push({
          id: `ext-${id++}`,
          branchId: branch.branchId,
          platform: "uber_eats",
          date: dateStr,
          totalSales: 100 + (id % 300),
          orderCount: 5 + (id % 15),
          source: "import",
          createdAt: date.toISOString(),
        });
      }
    }
  }
  return entries;
}

export const externalSalesEntries = generateExternalSales();

// ============== FRIDGE STOCK REPORTS ==============
export function generateFridgeReports(): FridgeStockReport[] {
  const reports: FridgeStockReport[] = [];
  const fridgeUnits = ["Main Fridge", "Milk Fridge"];

  for (const branch of branches) {
    reports.push({
      id: `fridge-${branch.branchId}`,
      branchId: branch.branchId,
      date: format(BASE_DATE, "yyyy-MM-dd"),
      temperatures: fridgeUnits.map(name => ({ name, temperature: 38 })),
      submittedBy: "Staff",
      createdAt: BASE_DATE.toISOString(),
    });
  }
  return reports;
}

export const fridgeStockReports = generateFridgeReports();

// ============== ATTENDANCE ==============
export function generateAttendance(): AttendanceEntry[] {
  const entries: AttendanceEntry[] = [];
  const staff = users.filter(u => u.role === UserRole.Cashier);

  for (const user of staff) {
    entries.push({
      id: `att-${user.id}`,
      branchId: user.branchId || "branch-1",
      userId: user.id,
      userName: user.name,
      date: format(BASE_DATE, "yyyy-MM-dd"),
      status: "present",
      checkIn: "08:00",
      checkOut: "16:00",
      createdAt: BASE_DATE.toISOString(),
    });
  }
  return entries;
}

export const attendanceEntries = generateAttendance();

// ============== POS DAY RECORDS ==============
export function generatePOSDayRecords(): POSDayRecord[] {
  const records: POSDayRecord[] = [];
  const staff = users.filter(u => u.role === UserRole.Cashier);

  for (const user of staff) {
    records.push({
      id: `pos-${user.id}`,
      branchId: user.branchId || "branch-1",
      userId: user.id,
      userName: user.name,
      date: format(BASE_DATE, "yyyy-MM-dd"),
      firstLogin: "08:00",
      lastLogout: "16:00",
      sessions: [{ loginAt: "08:00", logoutAt: "16:00" }],
    });
  }
  return records;
}

export const posDayRecords = generatePOSDayRecords();

// ============== OFFERS ==============
export const offers: Offer[] = [
  {
    id: "offer-1",
    name: "Morning Rush 20% Off",
    description: "20% off all espresso drinks before 9am",
    discountType: "percent",
    discountValue: 20,
    startDate: subDays(BASE_DATE, 5).toISOString(),
    endDate: addHours(BASE_DATE, 24 * 30).toISOString(),
    categoryIds: ["cat-1"],
    branchIds: ["branch-1", "branch-2", "branch-3"],
    isActive: true,
    createdAt: subDays(BASE_DATE, 5).toISOString(),
    updatedAt: subDays(BASE_DATE, 5).toISOString(),
  },
];

// ============== AUDIT LOGS ==============
export function generateAuditLogs(): AuditLog[] {
  const logs: AuditLog[] = [];
  const actions: AuditLog["action"][] = ["price_change", "order_cancelled", "product_updated", "branch_updated"];

  for (let i = 0; i < 50; i++) {
    const daysAgo = (i * 17) % 30;
    const date = subDays(BASE_DATE, daysAgo);
    const action = actions[i % actions.length];
    const user = users[i % 4];

    logs.push({
      id: `log-${i + 1}`,
      action,
      entityType: "System",
      entityId: `entity-${i}`,
      userId: user.id,
      userName: user.name,
      branchId: user.branchId,
      details: {},
      createdAt: date.toISOString(),
    });
  }
  return logs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export const auditLogs = generateAuditLogs();
