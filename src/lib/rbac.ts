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

export const canViewAuditLogs = (role: UserRole | undefined): boolean => {
  return isAdmin(role);
};

export const canManageSettings = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};

export const canManageSpecialDays = (role: UserRole | undefined): boolean => {
  return isSuperAdmin(role);
};


