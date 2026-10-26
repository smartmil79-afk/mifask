export const CATS = ["Vehicles","Property","Phones & Tablets","Electronics","Fashion","Home & Garden","Services","Animals","Jobs"];
export const STATES = ["Lagos","Abuja (FCT)","Rivers","Oyo","Kano","Enugu","Kaduna","Delta","Ogun","Anambra"];
export const PLANS = {
  basic: { name: "Basic", price: 1000, days: 7, rank: 1, label: "1 week" },
  pro: { name: "Pro", price: 3000, days: 30, rank: 2, label: "1 month" },
  premium: { name: "Premium", price: 5000, days: 60, rank: 3, label: "2 months" },
} as const;
export type PlanKey = keyof typeof PLANS;
export const naira = (n: number) => "₦" + Number(n).toLocaleString("en-NG");
export const TOKEN_COST = { basic: 35, pro: 55, premium: 65 } as const; // keep in sync with supabase/wallet.sql
export const BANKS = ["Access Bank","Zenith Bank","GTBank","First Bank","UBA","Opay","Kuda","Moniepoint","Palmpay","Wema Bank","Sterling Bank","Fidelity Bank","Union Bank","Stanbic IBTC","FCMB","Polaris Bank","Ecobank","Keystone Bank"];
export const CAT_FIELD: Record<string, { label: string; options?: string[]; placeholder?: string }> = {
  Services: { label: "Services rendered", placeholder: "e.g. Plumbing, pipe fitting, installations" },
  Jobs: { label: "Job type", options: ["Full-time", "Part-time", "Contract", "Internship"] },
  Animals: { label: "Age", options: ["Baby", "Young", "Adult"] },
  Property: { label: "Listing type", options: ["For rent", "For sale", "Short let"] },
};
export const condText = (cat: string, cond: string) => {
  const f = CAT_FIELD[cat]; if (!f) return cond;
  return cond === "Brand new" || cond === "Used" ? "" : `${f.label}: ${cond}`;
};
// EDIT THESE before launch: the bank account where customers send transfers.
export const BANK_DETAILS = { bank: "Opay", number: "8121483131", name: "Muammil Akilu Idris" };
export const CAT_ICONS: Record<string, string> = { Vehicles: "🚗", Property: "🏠", "Phones & Tablets": "📱", Electronics: "💻", Fashion: "👗", "Home & Garden": "🛋️", Services: "🔧", Animals: "🐕", Jobs: "💼" };
export const POPULAR = ["iPhone", "Toyota Camry", "Laptop", "Generator", "Plumber", "3 bedroom flat"];
