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

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(
  adminProfile: AdminProfile | null,
  permission: Permission
): boolean {
  if (!adminProfile) return false;
  if (adminProfile.isSuspended) return false;

  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles ? allowedRoles.includes(adminProfile.adminRole) : false;
}

// Page-level guard: the permission needed to open each dashboard route.
// Mirrors the backend's requirePermission() on the APIs each page calls, so a
// role that can't load a page's data also can't open the page by URL.
// More specific prefixes must come before shorter ones (first match wins).
const ROUTE_PERMISSIONS: { prefix: string; permission: Permission }[] = [
  { prefix: '/users/', permission: 'users.detail' },
  { prefix: '/users', permission: 'users.list' },
  { prefix: '/analytics', permission: 'analytics.view' },
  { prefix: '/intelligence', permission: 'analytics.view' },
  { prefix: '/pricing', permission: 'analytics.view' },
  { prefix: '/insights', permission: 'analytics.view' },
  { prefix: '/catalog', permission: 'catalog.view' },
  { prefix: '/operations', permission: 'etl.view' },
  { prefix: '/notifications', permission: 'system.view' },
  { prefix: '/security', permission: 'audit.view' },
  { prefix: '/system', permission: 'system.view' },
  { prefix: '/rbac', permission: 'rbac.manage' },
];

/** Permission required for a route, or null if any admin may open it (e.g. the dashboard). */
export function getRoutePermission(pathname: string): Permission | null {
  const match = ROUTE_PERMISSIONS.find(
    ({ prefix }) =>
      prefix.endsWith('/')
        ? pathname.startsWith(prefix)
        : pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return match ? match.permission : null;
}
