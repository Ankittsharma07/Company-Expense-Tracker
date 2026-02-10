const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4010";

const AUTH_TOKEN_KEY = "auth_token";

export const getAuthToken = () => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const clearAuthToken = () => {
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

// Callback for handling 401 errors (will be set by AuthContext)
let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

const apiFetch = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const token = getAuthToken();
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const isAuthEndpoint = path.startsWith("/api/auth/");
  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    let payload: any = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
    }

    if (response.status === 401 && !isAuthEndpoint) {
      // Clear token and trigger logout for protected endpoints
      clearAuthToken();
      if (onUnauthorized) {
        onUnauthorized();
      }
      throw new Error("Session expired. Please login again.");
    }

    if (!response.ok) {
      throw new Error(payload?.message || "Request failed");
    }

    return payload as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Request timeout. Please check your connection and try again.");
    }
    throw error;
  }
};

export type ApiUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string;
  preferredCurrency?: string | null;
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
  emailNotificationsEnabled?: boolean;
  inAppNotificationsEnabled?: boolean;
};

// Expense status enum matching backend
export type ExpenseStatus =
  | "PENDING_MANAGER"
  | "PENDING_ADMIN"
  | "APPROVED"
  | "REJECTED";

export type Expense = {
  id: string;
  description: string;
  category: string;
  amount: number | string;
  currency: string;
  originalAmount?: number | string;
  originalCurrency?: string;
  exchangeRate?: number | string;
  baseAmount?: number | string;
  baseCurrency?: string;
  exchangeRateBase?: string | null;
  exchangeRates?: Record<string, number> | null;
  exchangeRateTimestamp?: string | null;
  rateProvider?: string;
  rateTimestamp?: string;
  status: ExpenseStatus;
  receiptUrl?: string | null;
  expenseDate: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export type AppNotificationType = "INFO" | "SUCCESS" | "WARNING";

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  type: AppNotificationType;
  isRead: boolean;
  createdAt: string;
};

export type MonthlyTotal = {
  month: string;
  total: number;
  currency?: string;
};

export type CategoryTotal = {
  category: string;
  total: number;
  currency?: string;
};

export const fetchMe = () => apiFetch<ApiUser>("/api/users/me");

export const fetchUsers = () => apiFetch<ApiUser[]>("/api/users");

export const createUser = (payload: {
  name: string;
  email: string;
  password: string;
  role: "MANAGER" | "EMPLOYEE";
}) => {
  return apiFetch<ApiUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateUser = (id: string, payload: { name?: string; email?: string }) => {
  return apiFetch<ApiUser>(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const fetchExpenses = (params: Record<string, string | undefined> = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.append(key, value);
    }
  });
  const query = search.toString();
  return apiFetch<Expense[]>(`/api/expenses${query ? `?${query}` : ""}`);
};

type ExpenseCreatePayload = {
  description: string;
  category: string;
  amount: number;
  currency?: string;
  expenseDate?: string;
  receiptFile?: File | null;
};

type ExpenseUpdatePayload = Partial<Expense> & {
  receiptFile?: File | null;
  removeReceipt?: boolean;
};

const buildExpenseFormData = (payload: ExpenseCreatePayload | ExpenseUpdatePayload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (key === "receiptFile" && value instanceof File) {
      formData.append("receipt", value);
      return;
    }
    if (key === "removeReceipt" && typeof value === "boolean") {
      formData.append("removeReceipt", value ? "true" : "false");
      return;
    }
    formData.append(key, String(value));
  });
  return formData;
};

export const createExpense = (payload: ExpenseCreatePayload) => {
  if (payload.receiptFile) {
    const formData = buildExpenseFormData(payload);
    return apiFetch<Expense>("/api/expenses", {
      method: "POST",
      body: formData,
    });
  }

  const { receiptFile, ...rest } = payload;
  return apiFetch<Expense>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(rest),
  });
};

export const updateExpense = (id: string, payload: ExpenseUpdatePayload) => {
  if (payload.receiptFile) {
    const formData = buildExpenseFormData(payload);
    return apiFetch<Expense>(`/api/expenses/${id}`, {
      method: "PATCH",
      body: formData,
    });
  }

  const { receiptFile, ...rest } = payload;
  return apiFetch<Expense>(`/api/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(rest),
  });
};

export const deleteExpense = (id: string) => {
  return apiFetch<{ id: string }>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
};

export const fetchMonthlyTotals = (year?: number, displayCurrency?: string) => {
  const search = new URLSearchParams();
  if (year) search.append("year", String(year));
  if (displayCurrency) search.append("displayCurrency", displayCurrency);
  const query = search.toString();
  return apiFetch<MonthlyTotal[]>(`/api/analytics/monthly${query ? `?${query}` : ""}`);
};

export const fetchCategoryTotals = (from?: string, to?: string, displayCurrency?: string) => {
  const search = new URLSearchParams();
  if (from) search.append("from", from);
  if (to) search.append("to", to);
  if (displayCurrency) search.append("displayCurrency", displayCurrency);
  const query = search.toString();
  return apiFetch<CategoryTotal[]>(`/api/analytics/categories${query ? `?${query}` : ""}`);
};

// Approval API functions
export const approveExpense = (expenseId: string, level: "manager" | "admin", payload: { decision: "approve" | "reject"; comment?: string }) => {
  return apiFetch<Expense>(`/api/approvals/${expenseId}/${level}`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// Get pending approvals for current user's role
export const fetchPendingApprovals = () => {
  return apiFetch<Expense[]>("/api/approvals/pending");
};

// Get approval counts for dashboard
export const fetchApprovalCounts = () => {
  return apiFetch<{ pending: number }>("/api/approvals/counts");
};

// Notification API functions
export const fetchNotifications = (limit?: number) => {
  const query = limit ? `?limit=${limit}` : "";
  return apiFetch<AppNotification[]>(`/api/notifications${query}`);
};

export const markNotificationRead = (id: string) => {
  return apiFetch<AppNotification>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
};

export const fetchUnreadNotificationCount = () => {
  return apiFetch<{ unread: number }>("/api/notifications/unread-count");
};

// Notification Audit Log types
export type NotificationAuditLog = {
  id: string;
  userId: string;
  userRole: string;
  notificationType: string;
  channel: string;
  status: string;
  reason?: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

export type NotificationAuditResponse = {
  logs: NotificationAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Fetch notification audit logs
export const fetchNotificationAuditLogs = (params: {
  page?: number;
  limit?: number;
  userId?: string;
  channel?: string;
  status?: string;
} = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
  return apiFetch<NotificationAuditResponse>(`/api/notification-audit${query ? `?${query}` : ""}`);
};


// Approve expense (Manager or Admin)
export const approveExpenseById = (expenseId: string, role: "MANAGER" | "ADMIN", comment?: string) => {
  const level = role === "MANAGER" ? "manager" : "admin";
  return approveExpense(expenseId, level, { decision: "approve", comment });
};

// Reject expense (Manager or Admin)
export const rejectExpenseById = (expenseId: string, role: "MANAGER" | "ADMIN", comment?: string) => {
  const level = role === "MANAGER" ? "manager" : "admin";
  return approveExpense(expenseId, level, { decision: "reject", comment });
};

// Export/Report API functions
export const exportToExcel = async (startDate: string, endDate: string, displayCurrency?: string): Promise<Blob> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const search = new URLSearchParams();
  search.append("startDate", startDate);
  search.append("endDate", endDate);

  if (displayCurrency) {
    search.append("displayCurrency", displayCurrency);
  }

  const response = await fetch(`${API_BASE_URL}/api/reports/export/excel?${search.toString()}`, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to export to Excel");
  }

  return response.blob();
};

export const exportToPDF = async (startDate: string, endDate: string, displayCurrency?: string): Promise<Blob> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const search = new URLSearchParams();
  search.append("startDate", startDate);
  search.append("endDate", endDate);

  if (displayCurrency) {
    search.append("displayCurrency", displayCurrency);
  }

  const response = await fetch(`${API_BASE_URL}/api/reports/export/pdf?${search.toString()}`, {
    method: "GET",
    headers,
  });

  if (response.status === 401) {
    clearAuthToken();
    if (onUnauthorized) {
      onUnauthorized();
    }
    throw new Error("Session expired. Please login again.");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to export to PDF");
  }

  return response.blob();
};

// Auth API types
export type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    companyId: string;
    preferredCurrency?: string | null;
    avatarUrl?: string | null;
    googleAvatarUrl?: string | null;
  };
  company: {
    id: string;
    name: string;
    plan: string;
  };
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  companyName: string;
  name: string;
  email: string;
  password: string;
};

export type PasswordResetRequest = {
  email: string;
};

export type PasswordResetPayload = {
  token: string;
  password: string;
};

// Auth API functions
export const login = async (payload: LoginPayload): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const signup = async (payload: SignupPayload): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const googleLogin = async (token: string): Promise<AuthResponse> => {
  return apiFetch<AuthResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
};

export const requestPasswordReset = async (payload: PasswordResetRequest) => {
  return apiFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const resetPassword = async (payload: PasswordResetPayload) => {
  return apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const adminResetUserPassword = async (userId: string) => {
  return apiFetch<{ message: string }>(`/api/admin/users/${userId}/reset-password`, {
    method: "POST",
  });
};

export const uploadMyAvatar = (file: File) => {
  const formData = new FormData();
  formData.append("avatar", file);
  return apiFetch<ApiUser>("/api/users/me/avatar", {
    method: "POST",
    body: formData,
  });
};

// Currency types
export type Currency = {
  code: string;
  name: string;
  symbol: string;
};

export type Company = {
  id: string;
  name: string;
  plan: string;
  baseCurrency: string;
  createdAt: string;
};

// Currency API functions
export const getSupportedCurrencies = () => {
  return apiFetch<Currency[]>("/api/company/currencies");
};

export const getCompanySettings = () => {
  return apiFetch<Company>("/api/company/me");
};


export const fetchExchangeRate = (from: string, to: string) => {
  const search = new URLSearchParams({ from, to });
  return apiFetch<{ from: string; to: string; rate: number; provider: string; timestamp: string }>(`/api/company/rate?${search.toString()}`);
};

export const updateCompanyBaseCurrency = (baseCurrency: string) => {
  return apiFetch<Company>("/api/company/currency", {
    method: "PATCH",
    body: JSON.stringify({ baseCurrency }),
  });
};

export const updateUserPreferredCurrency = (preferredCurrency: string | null) => {
  return apiFetch<ApiUser>("/api/users/me/currency", {
    method: "PATCH",
    body: JSON.stringify({ preferredCurrency }),
  });
};
