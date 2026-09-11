import { UserRole } from "@/types";

export const isSuperAdmin = (role: UserRole | undefined): boolean => {
  return role === UserRole.SuperAdmin || role === UserRole.SuperAdminDeveloper;
};

const isAdmin = (role: UserRole | undefined): boolean => {
  if (!role) return false;
  return isSuperAdmin(role) || role === UserRole.BranchOwner || role === UserRole.Supervisor || role === UserRole.BranchAdmin;
};

export const canAccessAllBranches = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canAccessAdmin = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canManageUsers = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role) || role === UserRole.BranchOwner || role === UserRole.BranchAdmin || role === UserRole.Supervisor;
};

export const getAllowedTargetRoles = (actorRole: UserRole | undefined): UserRole[] => {
  if (isSuperAdmin(actorRole)) {
    return [
      UserRole.SuperAdmin,
      UserRole.SuperAdminDeveloper,
      UserRole.Customer,
      UserRole.BranchOwner,
      UserRole.BranchAdmin,
      UserRole.Supervisor,
      UserRole.Cashier,
      UserRole.Employee,
    ];
  }
  if (actorRole === UserRole.BranchOwner) {
    return [
      UserRole.BranchAdmin,
      UserRole.Supervisor,
      UserRole.Cashier,
      UserRole.Employee,
    ];
  }
  if (actorRole === UserRole.BranchAdmin) {
    return [
      UserRole.Supervisor,
      UserRole.Cashier,
      UserRole.Employee,
    ];
  }
  if (actorRole === UserRole.Supervisor) {
    return [UserRole.Employee];
  }
  return [];
};

export const canManageBaseCatalog = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canManageOffers = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canManageProducts = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canManageBranch = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canCreateBranch = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canViewReports = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canCancelOrders = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canSubmitFridgeReport = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canViewAttendance = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

/**
 * Activity log visibility ranks, mirroring ActivityRanks on the server.
 *
 * Kept in step deliberately rather than fetched: this only decides what the UI offers. The server
 * re-derives the same ladder and filters every query with it, so a stale copy here can hide
 * something a user may see — never reveal something they may not.
 */
const ACTIVITY_RANKS: Record<UserRole, number> = {
  [UserRole.SuperAdminDeveloper]: 100,
  [UserRole.SuperAdmin]: 100,
  [UserRole.BranchOwner]: 65,
  [UserRole.BranchAdmin]: 65,
  [UserRole.Supervisor]: 50,
  [UserRole.Cashier]: 40,
  [UserRole.Employee]: 30,
  [UserRole.Customer]: 0,
};

/** Lowest rank that may open the activity log page. Below it, only their own history. */
const MINIMUM_RANK_FOR_ACTIVITY_LOGS = 50;

export const activityLogRank = (role: UserRole | undefined): number =>
  role ? ACTIVITY_RANKS[role] ?? 0 : 0;

/**
 * Whether this role may see anyone else's activity.
 *
 * Note this is broader than what they will actually receive: the server also applies per-category
 * clearance, so a supervisor who passes this check still sees no payment or pricing rows.
 */
export const canViewActivityLogs = (role: UserRole | undefined): boolean =>
  activityLogRank(role) >= MINIMUM_RANK_FOR_ACTIVITY_LOGS;

/** Everyone signed in can see what they themselves did. */
export const canViewOwnActivity = (role: UserRole | undefined): boolean => role !== undefined;

export const canManageSettings = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canManageSpecialDays = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};


