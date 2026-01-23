const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

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
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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

    if (response.status === 401) {
      // Clear token and trigger logout
      clearAuthToken();
      if (onUnauthorized) {
        onUnauthorized();
      }
      throw new Error("Session expired. Please login again.");
    }

    let payload: any = null;
    try {
      payload = await response.json();
    } catch (error) {
      payload = null;
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
  currency?: string;
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

export type MonthlyTotal = {
  month: string;
  total: number;
};

export type CategoryTotal = {
  category: string;
  total: number;
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

export const createExpense = (payload: {
  description: string;
  category: string;
  amount: number;
  currency?: string;
  receiptUrl?: string | null;
  expenseDate?: string;
}) => {
  return apiFetch<Expense>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const updateExpense = (id: string, payload: Partial<Expense>) => {
  return apiFetch<Expense>(`/api/expenses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
};

export const deleteExpense = (id: string) => {
  return apiFetch<{ id: string }>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
};

export const fetchMonthlyTotals = (year?: number) => {
  const query = year ? `?year=${year}` : "";
  return apiFetch<MonthlyTotal[]>(`/api/analytics/monthly${query}`);
};

export const fetchCategoryTotals = (from?: string, to?: string) => {
  const search = new URLSearchParams();
  if (from) search.append("from", from);
  if (to) search.append("to", to);
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
export const exportToExcel = async (startDate: string, endDate: string): Promise<Blob> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const search = new URLSearchParams();
  search.append("startDate", startDate);
  search.append("endDate", endDate);

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

export const exportToPDF = async (startDate: string, endDate: string): Promise<Blob> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const search = new URLSearchParams();
  search.append("startDate", startDate);
  search.append("endDate", endDate);

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
