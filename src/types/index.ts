export type UserRole = 'admin' | 'staff';
export type UserStatus = 'active' | 'pending' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  designation?: string;
  employeeId: string;
  phoneNumber?: string;
  createdAt: any;
  updatedAt: any;
  bankName?: string;
  accountNumber?: string;
  baseSalary: number;
  isOnline?: boolean;
  lastActive?: any;
}

export interface Payslip {
  id: string;
  userId: string;
  userName: string;
  employeeId: string;
  month: string; // e.g., "2024-03"
  year: number;
  baseSalary: number;
  allowances: {
    housing: number;
    transport: number;
    medical: number;
    other: number;
  };
  deductions: {
    tax: number;
    pension: number;
    loan: number;
    other: number;
  };
  netSalary: number;
  grossSalary: number;
  status: 'paid' | 'pending';
  createdAt: any;
  createdBy: string;
}

export interface StaffQuery {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  response?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Promotion {
  id: string;
  userId: string;
  userName: string;
  oldDesignation: string;
  newDesignation: string;
  oldSalary: number;
  newSalary: number;
  effectiveDate: any;
  createdAt: any;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  type: 'payslip' | 'promotion' | 'query' | 'system';
  createdAt: any;
}

export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  performedByName: string;
  createdAt: any;
}
