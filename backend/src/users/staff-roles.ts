import { UserRole } from '@prisma/client';

/** Roles that belong to store staff. CUSTOMER accounts are not managed here. */
export const STAFF_ROLES: UserRole[] = [
  UserRole.OWNER,
  UserRole.ADMIN,
  UserRole.CONTENT_EDITOR,
  UserRole.INVENTORY_MANAGER,
  UserRole.ORDER_MANAGER,
];
