import { AdminProfile } from '../store/authStore';

export const PERMISSIONS = {
  'users.list':           ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'SUPPORT', 'READ_ONLY'],
  'users.detail':         ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'SUPPORT', 'READ_ONLY'],
  'users.suspend':        ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
  'users.role_change':    ['SUPER_ADMIN', 'ADMIN'],
  'users.plan_change':    ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
  'users.password_reset': ['SUPER_ADMIN', 'ADMIN', 'SUPPORT'],
  'analytics.view':       ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'OPERATIONS', 'SUPPORT', 'READ_ONLY'],
  'analytics.export':     ['SUPER_ADMIN', 'ADMIN', 'ANALYST'],
  'catalog.view':         ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'OPERATIONS', 'SUPPORT', 'READ_ONLY'],
  'catalog.edit':         ['SUPER_ADMIN', 'ADMIN'],
  'etl.view':             ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'OPERATIONS'],
  'etl.control':          ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS'],
  'system.view':          ['SUPER_ADMIN', 'ADMIN', 'OPERATIONS', 'READ_ONLY'],
  'audit.view':           ['SUPER_ADMIN', 'ADMIN', 'ANALYST', 'OPERATIONS', 'SUPPORT'],
  'rbac.manage':          ['SUPER_ADMIN'],
};

export function hasPermission(
  adminProfile: AdminProfile | null,
  permission: keyof typeof PERMISSIONS
): boolean {
  if (!adminProfile) return false;
  if (adminProfile.isSuspended) return false;

  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(adminProfile.adminRole) : false;
}
