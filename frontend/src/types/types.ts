// ===== UPI Mini Gateway v2.0 RBAC Types =====

// Role-based Access Control
export type UserRole = "superadmin" | "merchant" | "user";

// User-related interfaces
export interface UserReference {
  _id: string;
  username: string;
  role: UserRole;
}

export interface User {
  _id: string;
  username: string;
  role: UserRole;
  parent?: UserReference;
  createdBy?: UserReference;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  orderStats?: {
    total: number;
    pending: number;
    completed: number;
    verified: number;
  };
}

// Authentication interfaces
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
  expiresIn?: string;
  code?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

// Order-related interfaces
export interface OrderPublic {
    orderId: string;
    amount: number;
    merchantName?: string;
    maskedVpa: string;
    upiLink?: string;
    status: string;
    expiresAt?: string;
}

export interface OrderEnhanced extends OrderPublic {
  _id: string;
  vpa: string;
  note?: string;
  utr?: string;
  user?: UserReference;
  merchant?: UserReference;
  createdBy?: UserReference;
  invalidatedBy?: UserReference;
  invalidationReason?: string;
  createdAt: string;
  updatedAt?: string;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    platform?: string;
    device?: string;
  };
}

export interface CreateOrderResp {
    orderId: string;
    payPageUrl: string;
    upiLink: string;
}

export interface CreateOrderRequest {
  amount: number;
  vpa: string;
  merchantName: string;
  note?: string;
  expiresInSec?: number;
}

// Dashboard & Analytics interfaces
export interface DashboardStats {
  totalUsers?: number;
  totalMerchants?: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
  todayOrders: number;
  pendingOrders: number;
  verifiedOrders: number;
  completedOrders?: number;
  totalSpent?: number; // For user dashboard
}

export interface RecentActivity {
  type: "order_created" | "order_verified" | "user_created" | "order_invalidated";
  user: string;
  amount?: number;
  orderId?: string;
  timestamp: string;
  description?: string;
}

export interface ChartData {
  dailyRevenue?: Array<{ date: string; revenue: number }>;
  ordersByStatus?: Array<{ status: string; count: number }>;
  userGrowth?: Array<{ date: string; users: number }>;
  merchantPerformance?: Array<{ merchant: string; orders: number; revenue: number }>;
}

export interface DashboardData {
  stats: DashboardStats;
  recentActivity: RecentActivity[];
  chartData: ChartData;
}

// User Management interfaces
export interface UserCreateRequest {
  username: string;
  password: string;
  role: UserRole;
  parentId?: string; // For superadmin creating users under specific merchants
}

export interface UserUpdateRequest {
  username?: string;
  isActive?: boolean;
  role?: UserRole;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Order Management interfaces
export interface OrderListResponse {
  orders: OrderEnhanced[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalOrders: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface OrderInvalidateRequest {
  reason: string;
}

// Permission & Route Protection interfaces
export interface PermissionGateProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
  allowSelf?: boolean; // For user profile access
  resourceOwnerId?: string; // For checking resource ownership
}

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredRoles?: UserRole[];
  fallback?: React.ReactNode;
}

// Component Props interfaces
export interface RoleBadgeProps {
  role: UserRole;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline" | "subtle";
}

export interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
  onToggleStatus?: (user: User) => void;
  showActions?: boolean;
  compact?: boolean;
}

export interface OrderCardProps {
  order: OrderEnhanced;
  onInvalidate?: (order: OrderEnhanced) => void;
  onVerify?: (order: OrderEnhanced) => void;
  showActions?: boolean;
  showMerchantInfo?: boolean;
  showUserInfo?: boolean;
}

// API Response interfaces
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
  requestId?: string;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
  requestId?: string;
}

// Form interfaces
export interface LoginFormData {
  username: string;
  password: string;
}

export interface UserFormData {
  username: string;
  password: string;
  role: UserRole;
  parentId?: string;
}

export interface OrderFormData {
  amount: number;
  vpa: string;
  merchantName: string;
  note?: string;
  expiresInSec?: number;
}

// Utility types
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastUpdated?: string;
}

// Navigation interfaces
export interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<any>;
  requiredRoles?: UserRole[];
  exact?: boolean;
}

// Search & Filter interfaces
export interface UserFilters {
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  parentId?: string;
  page?: number;
  limit?: number;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  userId?: string;
  merchantId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}
