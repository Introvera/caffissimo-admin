export enum UserRole {
  SuperAdmin = "SuperAdmin",
  SuperAdminDeveloper = "SuperAdminDeveloper",
  BranchOwner = "BranchOwner",
  BranchAdmin = "BranchAdmin",
  Supervisor = "Supervisor",
  Cashier = "Cashier",
  Employee = "Employee",
}

export type Role = UserRole;

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: Role;
  branchId?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: unknown;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

// ============== BRANCHES ==============
export enum DayOfWeek {
  Sunday = 0,
  Monday = 1,
  Tuesday = 2,
  Wednesday = 3,
  Thursday = 4,
  Friday = 5,
  Saturday = 6,
}

export interface BranchOpeningHours {
  branchOpeningHoursId: string;
  dayOfWeek: DayOfWeek;
  openAt?: string;
  closeAt?: string;
  isClosed: boolean;
  isActive: boolean;
}

export enum BranchPurpose {
  Operational = 0,
  ListedForSale = 1,
}

export interface BranchSaleListing {
  branchSaleListingId: string;
  branchId: string;
  listingDescription: string;
  includedPackageDescription: string;
  inquiryPhone?: string;
  highlights: string[];
}

export interface Branch {
  branchId: string;
  purpose: BranchPurpose;
  branchName: string;
  branchDescription?: string;
  branchImageUrl?: string;
  branchImageFile?: File;
  branchAddress: string;
  latitude?: number;
  longitude?: number;
  branchPhoneNumber: string;
  branchPhoneNumberAlt?: string;
  branchEmail: string;
  branchEmailAlt?: string;
  isOpen: boolean;
  isActive: boolean;
  openingHours?: BranchOpeningHours[];
  saleListing?: BranchSaleListing;
  uberEatsUrl?: string;
  doorDashUrl?: string;
  uberEatsApiKey?: string;
  doorDashApiKey?: string;
  platformConnections?: PlatformConnectionSummary[];
  createdAt: string;
  updatedAt: string;
}

// PlatformEnvironment enum and extended PlatformConnectionSummary declared in BACKEND-ALIGNED section below

// ============== PRODUCTS ==============
export interface Category {
  productCategoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface Product {
  productId: string;
  productCategoryId: string;
  productCategoryName: string;
  productName: string;
  productPrice: number;
  productDescription?: string;
  // Backend stores these as jsonb string arrays (ProductResponse.PosImage/EcomImages).
  posImage?: string[];
  ecomImages?: string[];
  isVisible: boolean;
  isActive: boolean;
  variants?: any[];
  createdAt: string;
  updatedAt: string;
  branchAssignment?: {
    isAssigned: boolean;
    branchProductId?: string | null;
    isAvailable?: boolean | null;
  };
  branchProducts?: BranchProductResponse[];
}

export interface BranchProduct {
  id: string;
  productId: string;
  branchId: string;
  price: number;
  isAvailable: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BranchProductCatalogItem {
  branchProductId: string;
  branchId: string;
  productId: string;
  productName: string;
  isAvailable: boolean;
  overridePosImage?: string;
  overrideEcomImages?: string;
  isActive: boolean;
  variants: BranchProductVariant[];
}

// ============== ORDERS ==============
export type OrderSource = "pos" | "ecommerce" | "uber_eats" | "doordash";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled"
  | "Pending"
  | "Confirmed"
  | "Preparing"
  | "Ready"
  | "Completed"
  | "Cancelled";
export type PaymentMethod = "cash" | "card" | "online" | "external";

export interface OrderItemTopping {
  orderItemToppingId: string;
  orderItemId: string;
  toppingId: string;
  toppingName: string;
  price: number;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  toppings?: OrderItemTopping[];
}

export interface Order {
  id: string;
  orderNumber: string;
  branchId: string;
  source: OrderSource;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  notes?: string;
  internalNotes?: string;
  externalOrderId?: string;
  isReadOnly: boolean;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  createdAt: string;
  updatedAt: string;
}

// ============== EXTERNAL PLATFORM SALES ==============
export interface ExternalSalesEntry {
  id: string;
  branchId: string;
  platform: "uber_eats" | "doordash";
  date: string;
  totalSales: number;
  orderCount: number;
  source: "manual" | "import";
  importedAt?: string;
  createdAt: string;
}

// ============== OFFERS ==============
export type DiscountType = "percent" | "fixed" | "item_wise";

export interface Offer {
  id: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: number;
  /** For item_wise: buy this many items */
  buyQuantity?: number;
  /** For item_wise: get this many (e.g. free or discounted) */
  getQuantity?: number;
  startDate: string;
  endDate: string;
  productIds?: string[];
  categoryIds?: string[];
  branchIds?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============== UBER EATS ==============
export type PlatformCode = "UberEats" | "DoorDash";
export type UberMenuType = "Delivery" | "PickUp" | "DineIn";
export type SyncStatus = "Pending" | "Success" | "Failed";
export type UberDayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface UberMenuAvailability {
  uberMenuAvailabilityId?: string;
  dayOfWeek: UberDayOfWeek;
  openAt: string;
  closeAt: string;
}

export interface UberMenuSummary {
  uberMenuId: string;
  platformConnectionId: string;
  branchId: string;
  localMenuCode: string;
  menuName: string;
  menuType: UberMenuType;
  externalMenuId?: string;
  lastSyncedAt?: string;
  lastSyncStatus?: SyncStatus;
  isActive: boolean;
}

export interface UberMenu extends UberMenuSummary {
  description?: string;
  currencyCode?: string;
  taxRatePercentage?: number;
  isTaxInclusive?: boolean;
  externalReferenceId?: string;
  lastSyncPayloadHash?: string;
  branchProductIds: string[];
  serviceAvailabilities: UberMenuAvailability[];
}

export interface CreateUberMenuRequest {
  branchId: string;
  platformCode: PlatformCode;
  localMenuCode?: string;
  menuName: string;
  description?: string;
  currencyCode?: string;
  menuType: UberMenuType;
  /** Tax % applied to this menu's items. */
  taxRatePercentage?: number;
  /** true → tax included in price (VAT); false → added on top. */
  isTaxInclusive?: boolean;
  branchProductIds: string[];
  serviceAvailabilities: UberMenuAvailability[];
}

export interface UpdateUberMenuRequest
  extends Omit<CreateUberMenuRequest, "platformCode"> {
  isActive: boolean;
}

export interface UberMenuSyncResponse {
  uberMenuId: string;
  platformConnectionId: string;
  externalMenuId?: string;
  syncStatus: SyncStatus;
  syncedAt: string;
  message: string;
}

export type UberWebhookProcessingStatus =
  | "Received"
  | "DuplicateIgnored"
  | "Processing"
  | "Processed"
  | "UnresolvedBranch"
  | "Failed";

export interface UberOrderWebhookReceiveResponse {
  received: boolean;
  uberOrderWebhookEventId: string;
  isDuplicate: boolean;
  processingStatus: UberWebhookProcessingStatus;
}

// Uber Eats Order types
export interface UberOrderStagingSummary {
  uberOrderStagingId: string;
  uberOrderId: string;
  displayId: string | null;
  branchId: string;
  currentState: string | null;
  orderStatus: string | null;
  customerName: string | null;
  fulfillmentType: string | null;
  orderType: string | null;
  brand: string | null;
  currencyCode: string;
  subtotalAmount: number;
  discountTotal: number;
  taxTotal: number;
  feeTotal: number;
  tipTotal: number;
  totalAmount: number;
  promotionCount: number;
  promotionSummary: string | null;
  acceptDeadlineAt: string | null;
  acceptedAt: string | null;
  deniedAt: string | null;
  stagingStatus: number;
  createdAt: string;
  receivedAt: string;
  itemCount: number;
}

export interface UberOrderStagingItemModifier {
  uberOrderStagingItemModifierId: string;
  modifierGroupId: string;
  modifierGroupTitle: string | null;
  modifierId: string;
  toppingId: string | null;
  branchToppingId: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UberOrderStagingItem {
  uberOrderStagingItemId: string;
  uberItemId: string;
  branchProductId: string | null;
  branchProductVariantId: string | null;
  productId: string | null;
  instanceId: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  specialInstructions: string | null;
  modifiers: UberOrderStagingItemModifier[];
}

export interface UberOrderStagingDetail {
  uberOrderStagingId: string;
  uberOrderId: string;
  displayId: string | null;
  branchId: string;
  platformConnectionId: string;
  externalStoreId: string;
  currentState: string | null;
  orderStatus: string | null;
  customerName: string | null;
  eaterFirstName: string | null;
  eaterLastName: string | null;
  eaterPhone: string | null;
  fulfillmentType: string | null;
  orderType: string | null;
  brand: string | null;
  currencyCode: string;
  subtotalAmount: number;
  discountTotal: number;
  taxTotal: number;
  feeTotal: number;
  tipTotal: number;
  totalAmount: number;
  deliveryFee: number;
  smallOrderFee: number;
  bagFee: number;
  promotionCount: number;
  promotionSummary: string | null;
  specialInstructions: string | null;
  estimatedReadyTime: string | null;
  estimatedPickupTime: string | null;
  deliveryId: string | null;
  deliveryState: string | null;
  deliveryDriverName: string | null;
  acceptedAt: string | null;
  deniedAt: string | null;
  denyReasonCode: string | null;
  acceptDeadlineAt: string | null;
  externalReferenceId: string | null;
  stagingStatus: number;
  posSyncStatus: number;
  receivedAt: string;
  fetchedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastSyncError: string | null;
  items: UberOrderStagingItem[];
}

export interface UberOrderActionResult {
  uberOrderStagingId: string;
  uberOrderId: string;
  action: string;
  success: boolean;
  message: string | null;
  currentState: string | null;
}

// Uber Promotions (Uber API managed)
export interface MenuItemDiscountInput {
  itemExternalId: string;
  percentValue: number;
}

export interface TimeIntervalInput {
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

export interface DaypartConstraintInput {
  hours: TimeIntervalInput[];
  daysOfWeek: string[];
}

export interface CreateUberPromotionRequest {
  promoType: string;
  title?: string;

  // FLATOFF
  discountAmount?: number;
  // PERCENTOFF
  discountPercentage?: number;
  maxDiscountAmount?: number;
  // min_basket_constraint
  minOrderAmount?: number;

  // FREEITEM_MINBASKET
  freeItemExternalId?: string;
  // BOGO
  targetItemExternalIds?: string[];
  // MENU_ITEM_DISCOUNT
  menuItemDiscounts?: MenuItemDiscountInput[];

  startDate?: string;
  endDate?: string;

  // Envelope
  externalPromotionId?: string;
  userGroup?: string; // ALL_CUSTOMERS | FIRST_TIME_CUSTOMER
  currencyCode?: string;
  allowUnlimitedApply?: boolean;

  // Budget
  unlimitedBudget?: boolean;
  budgetAmount?: number;
  periodicBudgetAmount?: number;
  budgetPeriod?: string; // WEEKLY

  // Customization
  marketingExperienceType?: string; // HAPPY_HOUR
  engagementCampaignType?: string; // UBER_ONE_OFFERS
  customSchedule?: DaypartConstraintInput[];
}

export interface UberPromotionResponse {
  promotionId: string | null;
  promoType: string;
  title: string | null;
  discountPercentage: number | null;
  percentValue: number | null;
  discountAmount: number | null;
  maxDiscountAmount: number | null;
  minOrderAmount: number | null;
  freeItemIds: string[] | null;
  targetItemIds: string[] | null;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  rawJson: string | null;
}

// Uber Menu Item Partial Updates
export interface UpdateItemAvailabilityRequest {
  isAvailable: boolean;
}

export interface UpdateItemPriceRequest {
  priceInCents: number;
}

export type OfferItemRole = "Target" | "BuyItem" | "RewardItem";
export type OfferTargetType = "Product" | "BranchProduct" | "Order";

export interface OfferBranch {
  offerBranchId: string;
  offerId: string;
  branchId: string;
}

export interface OfferItem {
  offerItemId: string;
  offerId: string;
  itemRole: OfferItemRole;
  targetType: OfferTargetType;
  productId?: string;
  branchProductId?: string;
  quantity?: number;
  percentageValue?: number;
  amountValue?: number;
  fixedPriceValue?: number;
}

export interface OfferSummary {
  offerId: string;
  offerName: string;
  description?: string;
  offerType: OfferType;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  buyAmount?: number;
  getAmount?: number;
  offerBranches: OfferBranch[];
  offerItems: OfferItem[];
}

// ============== FRIDGE STOCK ==============
export interface FridgeTemperatureEntry {
  name: string;
  temperature: number; // in °F
}

export interface FridgeStockReport {
  id: string;
  branchId: string;
  date: string;
  temperatures: FridgeTemperatureEntry[];
  notes?: string;
  submittedBy: string;
  createdAt: string;
}

// ============== ATTENDANCE ==============
export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export interface AttendanceEntry {
  id: string;
  branchId: string;
  userId: string;
  userName: string;
  date: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
  notes?: string;
  createdAt: string;
}

// ============== POS LOGIN / LOGOUT REPORT ==============
/** A single login → logout session (cashiers are auto-logged out after 10 min inactivity) */
export interface POSSession {
  loginAt: string; // time e.g. "08:00"
  logoutAt: string;
  autoLogout?: boolean;
}

/** Per-user, per-day summary: first login, last logout, and all sessions in between */
export interface POSDayRecord {
  id: string;
  branchId: string;
  userId: string;
  userName: string;
  date: string;
  firstLogin: string;
  lastLogout: string;
  sessions: POSSession[];
}

// ============== AUDIT LOGS ==============
export type AuditAction =
  | "price_change"
  | "offer_change"
  | "order_cancelled"
  | "user_created"
  | "user_updated"
  | "branch_updated"
  | "product_created"
  | "product_updated"
  | "stock_report"
  | "attendance_updated"
  | "settings_updated";

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  branchId?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

// ============== SETTINGS ==============
export interface Settings {
  id: string;
  taxRate: number;
  serviceFeeRate: number;
  updatedAt: string;
}

// ============== FILTERS ==============
export interface DateRange {
  from: Date;
  to: Date;
}

export type DateRangePreset = "today" | "7d" | "30d" | "custom" | "24h" | "12m";

export interface ReportFilters {
  dateRange: DateRange;
  branchId?: string;
  source?: OrderSource | "all";
  paymentMethod?: PaymentMethod | "all";
  status?: OrderStatus | "all";
}

// ============== TOPPINGS & VARIANTS ==============
export interface ToppingCategory {
  toppingCategoryId: string;
  categoryName: string;
  isActive: boolean;
}

export interface Topping {
  toppingId: string;
  toppingCategoryId: string;
  toppingName: string;
  price: number;
  toppingPrice?: number;
  isActive: boolean;
}

export interface ProductTopping {
  productToppingId: string;
  productId: string;
  toppingId: string;
  isActive: boolean;
}

export interface BranchTopping {
  branchToppingId: string;
  branchId: string;
  toppingId: string;
  toppingName?: string;
  baseToppingPrice?: number;
  price: number;
  overrideToppingPrice: number | null;
  isAvailable: boolean;
  isVisible: boolean;
  overrideImage?: string[] | null;
  isActive?: boolean;
}

export interface BranchProductVariant {
  branchProductVariantId: string;
  branchProductId: string;
  variantName: string;
  price: number;
  isAvailable: boolean;
  isActive?: boolean;
}

// ============== BACKEND-ALIGNED: USERS ==============
/** Matches the AppUser entity / FirebaseUser response from the API */
export interface AppUser {
  id: string;
  firebaseUid: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  branchId?: string;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============== BACKEND-ALIGNED: BRANCHES ==============
/** Customer-facing branch listing (anonymous GET /api/branches/for-sale) */
export interface BranchForSale {
  branchId: string;
  branchName: string;
  branchDescription?: string;
  branchAddress: string;
  branchPhoneNumber: string;
  isOpen: boolean;
  openingHours?: BranchOpeningHours[];
  uberEatsUrl?: string;
  doorDashUrl?: string;
}

// ============== BACKEND-ALIGNED: ORDERS ==============
export type PaymentType = "Cash" | "Card" | "Online" | "External";
export type OrderType = "DineIn" | "TakeAway" | "Delivery" | "Online";

export interface OrderItemToppingResponse {
  orderItemToppingId: string;
  branchToppingId: string;
  toppingNameSnapshot: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

export interface OrderItemResponse {
  orderItemId: string;
  orderId: string;
  branchProductVariantId: string;
  branchProductId: string;
  productId: string;
  productName: string;
  sizeName?: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  discountAmount: number;
  lineTotal: number;
  appliedOfferId?: string;
  appliedOfferNameSnapshot?: string;
  toppings: OrderItemToppingResponse[];
}

export interface OrderResponse {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  branchId: string;
  paymentType: PaymentType;
  orderType: OrderType;
  subTotal: number;
  discountTotal: number;
  grandTotal: number;
  appliedOfferId?: string;
  appliedOfferNameSnapshot?: string;
  orderStatus: OrderStatus;
  items: OrderItemResponse[];
}

export interface OrderSummaryResponse {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  branchId: string;
  paymentType: PaymentType;
  orderType: OrderType;
  grandTotal: number;
  orderStatus: OrderStatus;
}

export interface OrderListParams {
  page?: number;
  pageSize?: number;
  branchId?: string;
  search?: string;
  orderStatus?: OrderStatus;
  paymentType?: PaymentType;
  orderType?: OrderType;
  orderDateFrom?: string;
  orderDateTo?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface CreateOrderSelectedToppingRequest {
  branchToppingId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderLineRequest {
  branchProductVariantId: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  discountAmount: number;
  lineTotal: number;
  appliedOfferId?: string;
  appliedOfferNameSnapshot?: string;
  selectedToppings: CreateOrderSelectedToppingRequest[];
}

export interface CreateOrderRequest {
  orderNumber: string;
  orderDate: string;
  branchId: string;
  paymentType: PaymentType;
  orderType: OrderType;
  subTotal: number;
  discountTotal: number;
  grandTotal: number;
  appliedOfferId?: string;
  appliedOfferNameSnapshot?: string;
  orderStatus: OrderStatus;
  items: CreateOrderLineRequest[];
}

export type UpdateOrderRequest = CreateOrderRequest;

export interface CreateOrderItemRequest {
  orderId: string;
  branchProductVariantId: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  discountAmount: number;
  lineTotal: number;
  appliedOfferId?: string;
  appliedOfferNameSnapshot?: string;
  selectedToppings: CreateOrderSelectedToppingRequest[];
}

export type UpdateOrderItemRequest = CreateOrderItemRequest;

// ============== BACKEND-ALIGNED: OFFERS ==============
export type OfferType =
  | "PercentageOff"
  | "AmountOff"
  | "FixedPrice"
  | "BuyXGetY";

export interface OfferBranchResponse {
  offerBranchId: string;
  offerId: string;
  branchId: string;
}

export interface OfferItemResponse {
  offerItemId: string;
  offerId: string;
  itemRole: string;
  targetType: string;
  productId?: string;
  branchProductId?: string;
  quantity?: number;
  percentageValue?: number;
  amountValue?: number;
  fixedPriceValue?: number;
}

export interface OfferResponse {
  offerId: string;
  offerName: string;
  description?: string;
  offerType: OfferType;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  buyAmount?: number;
  getAmount?: number;
  offerBranches: OfferBranchResponse[];
  offerItems: OfferItemResponse[];
}

export type OfferSummaryResponse = Omit<OfferResponse, "offerItems">;

export interface CreateOfferItemRequest {
  itemRole: string;
  targetType: string;
  productId?: string;
  branchProductId?: string;
  quantity?: number;
  percentageValue?: number;
  amountValue?: number;
  fixedPriceValue?: number;
}

export interface CreateOfferRequest {
  offerName: string;
  description?: string;
  offerType: OfferType;
  startDateTime: string;
  endDateTime: string;
  isActive: boolean;
  buyAmount?: number;
  getAmount?: number;
  branchIds: string[];
  items: CreateOfferItemRequest[];
}

export type UpdateOfferRequest = CreateOfferRequest;

// ============== BACKEND-ALIGNED: BRANCH PRODUCTS ==============
export interface BranchProductVariantResponse {
  branchProductVariantId: string;
  branchProductId: string;
  variantName: string;
  sizeName?: string;
  price: number;
  priceOverride?: number;
  isAvailable: boolean;
}

export interface BranchProductResponse {
  branchProductId: string;
  branchId: string;
  productId: string;
  productName: string;
  isAvailable: boolean;
  overridePosImage?: string[];
  overrideEcomImages?: string[];
  posImage?: string[];
  ecomImages?: string[];
  isActive: boolean;
  variants: BranchProductVariantResponse[];
}

export interface CreateBranchProductVariantInput {
  sizeName?: string;
  variantName?: string;
  price: number;
  isAvailable: boolean;
}

export interface CreateProductBranchConfigRequest {
  branchId: string;
  isAvailable: boolean;
  /** Already-uploaded URLs to keep. */
  overridePosImage?: string[];
  overrideEcomImages?: string[];
  /** New files to upload; the API turns these into URLs and merges them above. */
  overridePosImageFiles?: File[];
  overrideEcomImageFiles?: File[];
  variants: CreateBranchProductVariantInput[];
}

export interface CreateProductRequest {
  productCategoryId: string;
  productName: string;
  productPrice: number;
  productDescription?: string;
  /** Already-uploaded URLs to keep. */
  posImage?: string[];
  ecomImages?: string[];
  /** New files to upload; the API turns these into URLs and merges them above. */
  posImageFiles?: File[];
  ecomImageFiles?: File[];
  branchConfigs?: CreateProductBranchConfigRequest[];
}

export interface UpdateProductRequest {
  productCategoryId: string;
  productName: string;
  productPrice: number;
  productDescription?: string;
  /** Already-uploaded URLs to keep. */
  posImage?: string[];
  ecomImages?: string[];
  /** New files to upload; the API turns these into URLs and merges them above. */
  posImageFiles?: File[];
  ecomImageFiles?: File[];
  isActive: boolean;
}

export interface CreateBranchProductRequest {
  branchId: string;
  productId: string;
  isAvailable: boolean;
  /** Already-uploaded URLs to keep. */
  overridePosImage?: string[];
  overrideEcomImages?: string[];
  /** New files to upload; the API turns these into URLs and merges them above. */
  overridePosImageFiles?: File[];
  overrideEcomImageFiles?: File[];
  variants: CreateBranchProductVariantInput[];
}

export interface UpdateBranchProductRequest {
  isAvailable: boolean;
  /** Omitting this binds as false on the API and soft-deactivates the row. */
  isActive: boolean;
  /** Already-uploaded URLs to keep. */
  overridePosImage?: string[];
  overrideEcomImages?: string[];
  /** New files to upload; the API turns these into URLs and merges them above. */
  overridePosImageFiles?: File[];
  overrideEcomImageFiles?: File[];
}


// ============== FIREBASE USER: REQUEST TYPES ==============
export interface CreateFirebaseUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  branchId?: string;
}

export interface CreateCustomerFirebaseUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserRoleResponse {
  id: string;
  role: string;
}

export interface ResetUserPasswordRequest {
  newPassword: string;
}

// ============== BACKEND-ALIGNED: PLATFORM CONNECTIONS ==============
export enum PlatformEnvironment {
  Sandbox = 0,
  Production = 1
}

export interface PlatformConnectionSummary {
  platformConnectionId: string;
  platformCode: 0 | 1 | "UberEats" | "DoorDash";
  platformName: string;
  storeUrl?: string;
  webhookConnectionKey?: string;
  environment: PlatformEnvironment;
  isActive: boolean;
  isConfigured: boolean;
  lastMenuSyncAt?: string;
  lastSyncStatus?: SyncStatus;
  
  // Detailed client inputs if available/queried
  externalStoreId?: string;
  clientId?: string;
  clientSecret?: string;
  webhookSecret?: string;
  autoAcceptOrders?: boolean;
}

// ============== TRAINING / ACADEMY ==============

export type TrainingQualificationStatus = "NotStarted" | "InProgress" | "Passed";

export enum TrainingModuleType {
  Internal = "Internal",
  External = "External",
}

export interface TrainingQuizOptionResponse {
  trainingQuizOptionId: string;
  optionText: string;
}

export interface TrainingQuizQuestionResponse {
  trainingQuizQuestionId: string;
  questionText: string;
  sortOrder: number;
  isActive: boolean;
  options: TrainingQuizOptionResponse[];
}

export interface TrainingVideoResponse {
  trainingVideoId: string;
  trainingModuleId: string;
  title: string;
  videoUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface TrainingExternalCourseResponse {
  trainingExternalCourseId: string;
  trainingModuleId: string;
  title: string;
  courseUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface EmployeeTrainingCertificateResponse {
  employeeTrainingCertificateId: string;
  trainingModuleId: string;
  employeeId: string;
  fileUrl: string;
  originalFileName: string;
  contentType: string;
  fileSizeBytes: number;
  uploadedAt: string;
  updatedAt: string;
}

export interface TrainingModuleSummaryResponse {
  trainingModuleId: string;
  moduleType: TrainingModuleType;
  title: string;
  description?: string;
  videoCount: number;
  questionCount: number;
  externalCourseCount: number;
  isActive: boolean;
  branchId?: string;
}

export interface TrainingModuleDetailResponse {
  trainingModuleId: string;
  branchId?: string;
  moduleType: TrainingModuleType;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  videos: TrainingVideoResponse[];
  questions: TrainingQuizQuestionResponse[];
  externalCourses: TrainingExternalCourseResponse[];
  myCertificates: EmployeeTrainingCertificateResponse[];
}

export interface EmployeeTrainingStatusResponse {
  employeeId: string;
  trainingModuleId: string;
  trainingModuleTitle: string;
  status: TrainingQualificationStatus;
  passedAt?: string;
  passedAttemptId?: string;
  certificateCount: number;
  updatedAt: string;
}

// Request types
export interface CreateTrainingModuleRequest {
  branchId?: string;
  moduleType: TrainingModuleType;
  title: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateTrainingModuleRequest {
  title: string;
  description?: string;
  isActive: boolean;
}

export interface CreateTrainingVideoRequest {
  title: string;
  videoUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface CreateTrainingQuestionOptionRequest {
  optionText: string;
  isCorrect: boolean;
}

export interface CreateTrainingQuestionRequest {
  questionText: string;
  sortOrder: number;
  isActive: boolean;
  options: CreateTrainingQuestionOptionRequest[];
}

export interface UpdateTrainingQuestionOptionRequest {
  trainingQuizOptionId?: string;
  optionText: string;
  isCorrect: boolean;
}

export interface UpdateTrainingQuestionRequest {
  questionText: string;
  sortOrder: number;
  isActive: boolean;
  options: UpdateTrainingQuestionOptionRequest[];
}

export interface CreateTrainingExternalCourseRequest {
  title: string;
  courseUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface UpdateTrainingExternalCourseRequest {
  title: string;
  courseUrl: string;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface SubmitTrainingAttemptAnswerRequest {
  questionId: string;
  selectedOptionId: string;
}

export interface SubmitTrainingAttemptRequest {
  startedAt?: string;
  answers: SubmitTrainingAttemptAnswerRequest[];
}

export interface TrainingAttemptQuestionResultResponse {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
}

export interface TrainingAttemptSubmitResponse {
  attemptId: string;
  isPassed: boolean;
  correctCount: number;
  totalQuestions: number;
  qualifiedAt?: string;
  questionResults: TrainingAttemptQuestionResultResponse[];
}

// ============== BACKEND-ALIGNED: SPECIAL DAYS ==============
export type SpecialDayCategory = "newyear" | "valentines" | "easter" | "halloween" | "christmas" | "other";

export interface SpecialDayResponse {
  specialDayId: string;
  category: SpecialDayCategory;
  startDate: string;
  endDate: string;
  backgroundImage: string;
  isActive: boolean;
}

export interface SpecialDayCategoryOption {
  value: SpecialDayCategory;
  label: string;
}

export interface CreateSpecialDayRequest {
  category: SpecialDayCategory;
  startDate: string;
  endDate: string;
  backgroundImage: string;
  isActive: boolean;
}

export interface UpdateSpecialDayRequest {
  category: SpecialDayCategory;
  startDate: string;
  endDate: string;
  backgroundImage: string;
  isActive: boolean;
}

// ============== BACKEND-ALIGNED: DASHBOARD & SALES REPORT ==============
export interface DashboardStatsParams {
  startDate: string;
  endDate: string;
  branchId?: string;
}

export interface DashboardSalesByType {
  pos: number;
  dineIn: number;
  takeaway: number;
  delivery: number;
}

export interface DashboardSalesTrendItem {
  date: string;
  total: number;
  pos: number;
  dineIn: number;
  takeaway: number;
  delivery: number;
}

export interface DashboardStatsResponse {
  totalSales: number;
  orderCount: number;
  cancelledCount: number;
  averageOrderValue: number;
  salesByType: DashboardSalesByType;
  salesTrend: DashboardSalesTrendItem[];
}

export interface SalesReportParams {
  orderDateFrom: string;
  orderDateTo: string;
  branchId?: string;
}

export interface DailySummaryItem {
  date: string;
  pos: number;
  dineIn: number;
  takeaway: number;
  delivery: number;
  total: number;
  orders: number;
}

export interface BranchComparisonItem {
  branchId: string;
  branchName: string;
  totalSales: number;
  orders: number;
  avgOrder: number;
}

export interface SalesReportResponse {
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailySummary: DailySummaryItem[];
  branchComparison: BranchComparisonItem[];
}

// ============== BACKEND-ALIGNED: ATTENDANCE ==============
export interface PosSessionResponse {
  posSessionId: string;
  attendanceId: string;
  loginAt: string;
  logoutAt: string | null;
  endReason: string | null;
}

export interface AttendanceRecordResponse {
  attendanceId: string;
  userId: string;
  userDisplayName: string;
  branchId: string;
  branchName: string;
  date: string;
  firstLogin: string;
  lastLogout: string | null;
  sessions: PosSessionResponse[];
}

export interface AttendanceQueryParams {
  branchId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// ============== BACKEND-ALIGNED: FRIDGE TEMPERATURE REPORTS ==============
export interface FridgeTemperatureReportResponse {
  reportId: string;
  branchId: string;
  branchName: string;
  date: string;
  submittedByUserId: string;
  submittedByName: string;
  temperatures: Record<string, number>;
  notes: string | null;
  createdAt: string;
}

export interface FridgeTemperatureQueryParams {
  branchId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateFridgeTemperatureReportRequest {
  branchId: string;
  date: string;
  temperatures: Record<string, number>;
  notes?: string;
}




