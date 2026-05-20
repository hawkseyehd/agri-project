import { StatusBadge } from "@/components/ui/dashboard";

export const farms = [
  ["Green Valley Farm", "Faisalabad, Punjab", "120 Acres", "Ali Raza", <StatusBadge key="active">Active</StatusBadge>],
  ["Sunrise Farm", "Sargodha, Punjab", "85 Acres", "Usman Khan", <StatusBadge key="active">Active</StatusBadge>]
];

export const landBlocks = [
  ["Block A", "10 Acres", "Owned", "Loam", "Canal", "Wheat", <StatusBadge key="active">Active</StatusBadge>],
  ["Block B", "8 Acres", "Rented", "Clay Loam", "Tube Well", "Rice", <StatusBadge key="active">Active</StatusBadge>],
  ["Block C", "12 Acres", "Owned", "Sandy Loam", "Canal", "Fallow", <StatusBadge key="idle" tone="amber">Idle</StatusBadge>]
];

export const cropSeasons = [
  ["Wheat 2026", "Green Valley", "Block A", "Wheat", "FSD 2008", "15 Nov 2025", "20 Apr 2026", <StatusBadge key="active">Active</StatusBadge>],
  ["Rice 2026", "Green Valley", "Block B", "Rice", "Basmati", "10 Jun 2026", "20 Oct 2026", <StatusBadge key="planned" tone="blue">Planned</StatusBadge>],
  ["Mango 2026", "Orchard Farm", "Block C", "Mango", "Sindhri", "01 Jan 2026", "15 Jun 2026", <StatusBadge key="active">Active</StatusBadge>]
];

export const dailyReports = [
  ["26 Apr 2026", "Green Valley", "Block A", "Wheat", "Irrigation", <StatusBadge key="submitted">Submitted</StatusBadge>],
  ["25 Apr 2026", "Green Valley", "Block B", "Rice", "Land prep", <StatusBadge key="pending" tone="amber">Pending</StatusBadge>],
  ["24 Apr 2026", "Sunrise Farm", "Block C", "Mango", "Pesticide", <StatusBadge key="review" tone="blue">Review</StatusBadge>]
];

export const workers = [
  ["Ahmed Ali", "Daily Wage", "General", "PKR 1,300", "03xx-xxxxxxx", <StatusBadge key="active">Active</StatusBadge>],
  ["Bilal Khan", "Daily Wage", "Irrigation", "PKR 1,200", "03xx-xxxxxxx", <StatusBadge key="active">Active</StatusBadge>],
  ["Imran Jutt", "Machine", "Tractor Operator", "PKR 1,800", "03xx-xxxxxxx", <StatusBadge key="active">Active</StatusBadge>]
];

export const expenses = [
  ["26 Apr 2026", "Diesel", "Block A", "Diesel 50 Ltr", "PKR 7,350", "Shell Pump", "Yes"],
  ["25 Apr 2026", "Labor", "Block A", "Labor wages", "PKR 4,200", "Cash", "Yes"],
  ["25 Apr 2026", "Fertilizer", "Block A", "Urea 3 bags", "PKR 8,000", "Agri Store", "No"],
  ["24 Apr 2026", "Irrigation", "Block A", "Canal water", "PKR 1,500", "Canal Dept", "Yes"]
];

export const inventory = [
  ["Urea", "Fertilizer", "Bag", "3", "5", <StatusBadge key="low" tone="red">Low</StatusBadge>],
  ["DAP", "Fertilizer", "Bag", "15", "5", <StatusBadge key="good">Good</StatusBadge>],
  ["Diesel", "Fuel", "Ltr", "130", "50", <StatusBadge key="medium" tone="amber">Medium</StatusBadge>],
  ["Pesticide X", "Pesticide", "Bottle", "8", "4", <StatusBadge key="good">Good</StatusBadge>]
];

export const harvestSales = [
  ["20 Apr 2026", "Wheat", "Block A", "500", "Maund", "A Grade", "Store 1"],
  ["22 Apr 2026", "Wheat", "Block A", "200", "Maund", "A Grade", "Sold"]
];

export const salesRecords = [
  ["22 Apr 2026", "Abdullah Traders", "Wheat", "200 Maund", "4,000", "PKR 800,000", "PKR 400,000", "PKR 400,000"]
];

export const settingsUsers = [
  ["Ali Raza", "Owner", "All Farms", <StatusBadge key="active">Active</StatusBadge>],
  ["Usman Khan", "Manager", "Green Valley Farm", <StatusBadge key="active">Active</StatusBadge>],
  ["Noman Ahmed", "Manager", "Sunrise Farm", <StatusBadge key="active">Active</StatusBadge>]
];
