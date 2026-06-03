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
  posImage?: string;
  ecomImages?: string;
  isVisible: boolean;
  isActive: boolean;
  variants?: any[];
  createdAt: string;
  updatedAt: string;
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

export interface CreateBranchProductRequest {
  branchId: string;
  productId: string;
  isAvailable: boolean;
  overridePosImage?: string[];
  overrideEcomImages?: string[];
  variants: CreateBranchProductVariantInput[];
}

export interface UpdateBranchProductRequest {
  isAvailable: boolean;
  overridePosImage?: string[];
  overrideEcomImages?: string[];
}

// ============== BACKEND-ALIGNED: UBER MENUS ==============
export type UberMenuType = "Delivery" | "PickUp" | "DineIn" | "Catering";
export type SyncStatus = "Pending" | "Success" | "Failed" | "InProgress";
export type PlatformCode = "UberEats" | "DoorDash";

export interface UberMenuAvailabilityResponse {
  uberMenuAvailabilityId: string;
  dayOfWeek: number;
  openAt: string;
  closeAt: string;
}

export interface UberMenuModifierResponse {
  uberMenuModifierId: string;
  toppingId: string;
  branchToppingId?: string;
  displayName: string;
  price: number;
  imageUrl?: string;
  externalModifierId?: string;
  externalReferenceId?: string;
  sortOrder: number;
}

export interface UberMenuModifierGroupResponse {
  uberMenuModifierGroupId: string;
  branchProductId: string;
  toppingCategoryId: string;
  displayName: string;
  minSelections: number;
  maxSelections: number;
  isRequired: boolean;
  externalModifierGroupId?: string;
  externalReferenceId?: string;
  sortOrder: number;
  modifiers: UberMenuModifierResponse[];
}

export interface UberMenuItemResponse {
  uberMenuItemId: string;
  branchProductId: string;
  productId: string;
  productCategoryId: string;
  displayName: string;
  description?: string;
  price: number;
  imageUrl?: string;
  externalItemId?: string;
  externalReferenceId?: string;
  sortOrder: number;
  modifierGroupIds: string[];
}

export interface UberMenuCategoryResponse {
  uberMenuCategoryId: string;
  productCategoryId: string;
  displayName: string;
  externalCategoryId?: string;
  externalReferenceId?: string;
  sortOrder: number;
}

export interface UberMenuResponse {
  uberMenuId: string;
  platformConnectionId: string;
  branchId: string;
  localMenuCode: string;
  menuName: string;
  description?: string;
  currencyCode?: string;
  menuType: UberMenuType;
  externalMenuId?: string;
  externalReferenceId?: string;
  lastSyncedAt?: string;
  lastSyncStatus?: SyncStatus;
  isActive: boolean;
  serviceAvailabilities: UberMenuAvailabilityResponse[];
  categories: UberMenuCategoryResponse[];
  items: UberMenuItemResponse[];
  modifierGroups: UberMenuModifierGroupResponse[];
}

export type UberMenuSummaryResponse = Pick<
  UberMenuResponse,
  | "uberMenuId" | "platformConnectionId" | "branchId" | "localMenuCode"
  | "menuName" | "menuType" | "externalMenuId" | "lastSyncedAt"
  | "lastSyncStatus" | "isActive"
>;

export interface UberMenuSyncResponse {
  uberMenuId: string;
  platformConnectionId: string;
  externalMenuId?: string;
  syncStatus: SyncStatus;
  syncedAt: string;
  message: string;
  success?: boolean;
}

export interface UberMenuAvailabilityRequest {
  dayOfWeek: number;
  openAt: string;
  closeAt: string;
}

export interface UberMenuItemCustomizationRequest {
  branchProductId: string;
  displayName?: string;
  description?: string;
  price?: number;
  imageUrl?: string;
  sortOrder?: number;
}

export interface CreateUberMenuRequest {
  branchId: string;
  platformCode: PlatformCode;
  localMenuCode?: string;
  menuName: string;
  description?: string;
  currencyCode?: string;
  menuType: UberMenuType;
  branchProductIds: string[];
  itemCustomizations: UberMenuItemCustomizationRequest[];
  serviceAvailabilities: UberMenuAvailabilityRequest[];
}

export type UpdateUberMenuRequest = Partial<CreateUberMenuRequest>;

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



