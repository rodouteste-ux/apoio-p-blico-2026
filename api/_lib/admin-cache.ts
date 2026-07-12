type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

let dashboardCache: CacheEntry<unknown> | null = null;
let adminPreCandidatosCache: CacheEntry<unknown> | null = null;
let dashboardInFlight: Promise<unknown> | null = null;
let adminPreCandidatosInFlight: Promise<unknown> | null = null;

export function getCachedDashboard<T>() {
  if (dashboardCache && dashboardCache.expiresAt > Date.now()) {
    return dashboardCache.data as T;
  }

  dashboardCache = null;
  return null;
}

export function setCachedDashboard<T>(data: T) {
  dashboardCache = {
    data,
    expiresAt: Date.now() + 30 * 1000,
  };
}

export function getDashboardInFlight<T>() {
  return dashboardInFlight as Promise<T> | null;
}

export function setDashboardInFlight<T>(request: Promise<T>) {
  dashboardInFlight = request.finally(() => {
    dashboardInFlight = null;
  });
  return dashboardInFlight as Promise<T>;
}

export function invalidateDashboardCache() {
  dashboardCache = null;
}

export function getCachedAdminPreCandidatos<T>() {
  if (adminPreCandidatosCache && adminPreCandidatosCache.expiresAt > Date.now()) {
    return adminPreCandidatosCache.data as T;
  }

  adminPreCandidatosCache = null;
  return null;
}

export function setCachedAdminPreCandidatos<T>(data: T) {
  adminPreCandidatosCache = {
    data,
    expiresAt: Date.now() + 30 * 1000,
  };
}

export function getAdminPreCandidatosInFlight<T>() {
  return adminPreCandidatosInFlight as Promise<T> | null;
}

export function setAdminPreCandidatosInFlight<T>(request: Promise<T>) {
  adminPreCandidatosInFlight = request.finally(() => {
    adminPreCandidatosInFlight = null;
  });
  return adminPreCandidatosInFlight as Promise<T>;
}

export function invalidateAdminPreCandidatosCache() {
  adminPreCandidatosCache = null;
}

export function invalidateAdminCaches() {
  invalidateDashboardCache();
  invalidateAdminPreCandidatosCache();
}
