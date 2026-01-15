import { subDays } from "date-fns";

export type Role = "admin" | "manager" | "employee";

export const USERS = {
  admin: {
    name: "Alice Admin",
    role: "admin" as Role,
    avatar: "https://i.pravatar.cc/150?u=admin",
    email: "alice@company.com"
  },
  manager: {
    name: "Bob Manager",
    role: "manager" as Role,
    avatar: "https://i.pravatar.cc/150?u=manager",
    email: "bob@company.com"
  },
  employee: {
    name: "Charlie Employee",
    role: "employee" as Role,
    avatar: "https://i.pravatar.cc/150?u=employee",
    email: "charlie@company.com"
  }
};

export const EXPENSES = [
  {
    id: "EXP-001",
    description: "Q4 Marketing Campaign Assets",
    category: "Marketing",
    amount: 2400.00,
    date: subDays(new Date(), 2).toISOString(),
    status: "approved",
    user: "Charlie Employee",
    receipt: true
  },
  {
    id: "EXP-002",
    description: "Team Lunch - Project Kickoff",
    category: "Meals",
    amount: 145.50,
    date: subDays(new Date(), 5).toISOString(),
    status: "pending",
    user: "Charlie Employee",
    receipt: true
  },
  {
    id: "EXP-003",
    description: "Software License (Figma)",
    category: "Software",
    amount: 144.00,
    date: subDays(new Date(), 10).toISOString(),
    status: "approved",
    user: "Sarah Designer",
    receipt: true
  },
  {
    id: "EXP-004",
    description: "Client Travel - NYC",
    category: "Travel",
    amount: 850.25,
    date: subDays(new Date(), 1).toISOString(),
    status: "pending",
    user: "Bob Manager",
    receipt: false
  },
  {
    id: "EXP-005",
    description: "Office Supplies",
    category: "Office",
    amount: 89.99,
    date: subDays(new Date(), 12).toISOString(),
    status: "rejected",
    user: "David Intern",
    receipt: true
  },
  {
    id: "EXP-006",
    description: "AWS Server Costs",
    category: "Software",
    amount: 1250.00,
    date: subDays(new Date(), 3).toISOString(),
    status: "approved",
    user: "Alice Admin",
    receipt: true
  },
  {
    id: "EXP-007",
    description: "Uber to Airport",
    category: "Travel",
    amount: 45.00,
    date: subDays(new Date(), 1).toISOString(),
    status: "pending",
    user: "Charlie Employee",
    receipt: true
  }
];

export const STATS = {
  totalSpend: 45234.50,
  pendingApprovals: 12,
  activeEmployees: 48,
  monthlyAverage: 12500.00,
  budgetUtilization: 78
};

export const CHART_DATA = {
  monthly: [
    { name: 'Jan', value: 8500 },
    { name: 'Feb', value: 9200 },
    { name: 'Mar', value: 12500 },
    { name: 'Apr', value: 11000 },
    { name: 'May', value: 14500 },
    { name: 'Jun', value: 13200 },
  ],
  categories: [
    { name: 'Software', value: 45 },
    { name: 'Travel', value: 25 },
    { name: 'Marketing', value: 20 },
    { name: 'Office', value: 10 },
  ]
};
