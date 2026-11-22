import { DEMO_USERS } from "./config";

/* ------------------------------------------------------------------ */
/* Deterministic sample data for demo mode                             */
/* ------------------------------------------------------------------ */

export type Row = Record<string, unknown> & { id: string };

export type DemoStore = {
  profiles: Row[];
  divisions: Row[];
  categories: Row[];
  expenses: Row[];
  expense_audit: Row[];
  auditSeq: number;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let idCounter = 0;
export const fakeId = (prefix = "0") =>
  `${prefix.padStart(8, "0").slice(0, 8)}-0000-4000-8000-${(++idCounter).toString(16).padStart(12, "0")}`;

// [name, min, max, avg count per month (or "monthly" = exactly once), titles, payees]
type CatSpec = [string, number, number, number | "monthly", string[], string[]];

const DIVISIONS: {
  slug: string;
  name: string;
  short_name: string;
  description: string;
  color: string;
  locations: string[];
  purposes: string[];
  cats: CatSpec[];
}[] = [
  {
    slug: "emerging-edge",
    name: "Emerging Edge",
    short_name: "Emerging Edge",
    description: "Main company operational expenses",
    color: "#2B4FB8",
    locations: ["Islamabad head office", "Lahore office", "Online", "Rawalpindi"],
    purposes: ["Monthly operations", "Client meeting", "Quarterly planning offsite", "New hire onboarding", "Office upgrade"],
    cats: [
      ["Office Rent", 185000, 185000, "monthly", ["Office rent – Blue Area"], ["Al-Noor Properties"]],
      ["Salaries & Payroll", 640000, 720000, "monthly", ["Monthly payroll – operations team"], ["Staff payroll (HBL)"]],
      ["Utilities", 18000, 46000, 2, ["Electricity bill (IESCO)", "Gas bill (SNGPL)", "Water & sanitation"], ["IESCO", "SNGPL", "CDA"]],
      ["Internet & Telecom", 14500, 22000, "monthly", ["Fiber internet – 100 Mbps", "Office mobile package"], ["Nayatel", "Jazz Business"]],
      ["Software & Subscriptions", 6000, 58000, 2, ["Google Workspace", "Figma team plan", "Slack Pro", "Microsoft 365", "Zoom Business"], ["Google", "Figma", "Slack", "Microsoft", "Zoom"]],
      ["Equipment & Hardware", 18000, 285000, 0.6, ["Dell laptop for new developer", "27\" monitors (x2)", "Office printer", "UPS & batteries"], ["Hafeez Centre – TechZone", "Dell Pakistan", "Galaxy Computers"]],
      ["Travel & Transport", 3500, 68000, 1.6, ["Client visit – Lahore", "Airport transfer", "Fuel reimbursement", "Flight ISB–KHI"], ["Careem", "PIA", "Shell Pakistan", "Daewoo Express"]],
      ["Meals & Entertainment", 4500, 38000, 1.4, ["Team lunch", "Client dinner", "Office refreshments"], ["Monal Restaurant", "Cheezious", "Gloria Jeans"]],
      ["Marketing & Branding", 15000, 120000, 0.7, ["LinkedIn ads", "Company profile printing", "Brand photoshoot"], ["LinkedIn", "Print Hub", "Studio 51"]],
      ["Professional Services", 25000, 150000, 0.5, ["Tax filing & audit", "Legal consultation", "Company secretarial"], ["Ahmed & Co. Chartered Accountants", "Khan Legal Associates"]],
      ["Office Supplies", 2500, 16000, 1.2, ["Stationery restock", "Printer toner", "Pantry supplies"], ["Metro Cash & Carry", "Paper World"]],
      ["Maintenance & Repairs", 4000, 45000, 0.5, ["AC servicing", "Electrical repair", "Furniture repair"], ["CoolTech Services", "Local electrician"]],
      ["Taxes & Government Fees", 12000, 95000, 0.25, ["SECP annual fee", "Professional tax", "Trade license renewal"], ["SECP", "FBR", "ICT Administration"]],
    ],
  },
  {
    slug: "eest",
    name: "Emerging Edge School of Technology",
    short_name: "EEST",
    description: "Educational and academy-related expenses",
    color: "#0E9F6E",
    locations: ["EEST Campus, Islamabad", "Online (Zoom)", "Pearl Continental, Lahore", "NUST auditorium"],
    purposes: ["Web Development Bootcamp – Cohort 7", "AI & Machine Learning Workshop", "Summer Coding Camp", "Graduation ceremony", "Admissions drive", "Monthly academy operations"],
    cats: [
      ["Venue & Rent", 120000, 120000, "monthly", ["Campus rent"], ["Sky Tower Management"]],
      ["Instructor & Trainer Fees", 45000, 180000, 2.2, ["Lead instructor fee", "Guest trainer – Cloud", "Teaching assistant stipend"], ["Ali Raza", "Sana Malik", "Usman Tariq", "Hira Qureshi"]],
      ["Course Materials", 6000, 42000, 1.2, ["Printed course handbooks", "Udemy business seats", "Workbooks"], ["Print Hub", "Udemy", "Saeed Book Bank"]],
      ["Lab Equipment", 25000, 320000, 0.5, ["Lab PCs (x5)", "Raspberry Pi kits", "Projector for Lab 2", "Networking switch"], ["Galaxy Computers", "Hafeez Centre – TechZone", "Electrobot"]],
      ["Events & Workshops", 30000, 260000, 0.8, ["Workshop venue & catering", "Hackathon prizes", "Event banners & standees"], ["Pearl Continental", "Serena Hotel", "Print Hub"]],
      ["Certifications & Exams", 18000, 95000, 0.5, ["AWS exam vouchers", "Google certificate vouchers", "Pearson VUE fees"], ["AWS Training", "Coursera", "Pearson VUE"]],
      ["Student Activities", 5000, 40000, 0.6, ["Student trip", "Coding competition", "Student welcome kit"], ["Daewoo Express", "Merch Studio"]],
      ["Marketing & Admissions", 15000, 140000, 1.4, ["Facebook & Instagram ads", "Admissions brochure", "University seminar booth"], ["Meta", "Print Hub", "TikTok Ads"]],
      ["Software & LMS", 9000, 35000, 1, ["LMS subscription", "GitHub Education org", "Zoom licenses"], ["Teachable", "GitHub", "Zoom"]],
      ["Scholarships", 25000, 90000, 0.3, ["Merit scholarship disbursement", "Need-based fee waiver"], ["Scholarship recipient"]],
      ["Utilities", 15000, 38000, 1.5, ["Campus electricity", "Campus internet"], ["IESCO", "Nayatel"]],
      ["Refreshments", 3000, 22000, 1.6, ["Class refreshments", "Tea & snacks – weekend batch"], ["Metro Cash & Carry", "Bundu Khan", "Tehzeeb Bakers"]],
    ],
  },
  {
    slug: "stylone",
    name: "STYLONE",
    short_name: "STYLONE",
    description: "E-commerce store operations, inventory, marketing and logistics",
    color: "#D9650B",
    locations: ["Karachi warehouse", "Online", "Lahore studio", "Faisalabad (supplier)"],
    purposes: ["Winter Collection launch", "Eid sale campaign", "11.11 mega sale", "Summer lawn drop", "Monthly store operations", "Restock"],
    cats: [
      ["Inventory & Stock Purchase", 120000, 950000, 2.2, ["Fabric purchase – winter stock", "Ready-made stock order", "Accessories restock", "Lawn collection stock"], ["Gul Ahmed Textiles (wholesale)", "Faisalabad Fabrics", "Al-Karam Mills", "Anarkali traders"]],
      ["Packaging", 12000, 85000, 1.3, ["Branded mailer boxes", "Poly bags & tissue", "Thank-you cards"], ["PackPro Karachi", "Print Hub"]],
      ["Shipping & Courier", 25000, 160000, 3, ["Courier charges – weekly", "COD shipments", "Return pickups"], ["TCS", "Leopards Courier", "PostEx", "M&P"]],
      ["Digital Advertising", 40000, 380000, 2.4, ["Meta ads – campaign", "TikTok ads", "Google Shopping ads"], ["Meta", "TikTok Ads", "Google Ads"]],
      ["Influencer Marketing", 30000, 250000, 0.7, ["Influencer collaboration", "UGC video package"], ["@stylebyayesha", "@lahorefashiondiaries", "Creator Hub PK"]],
      ["Photography & Content", 20000, 140000, 0.8, ["Product photoshoot", "Model fees", "Reels editing"], ["Studio 51", "Lens & Light", "Freelance editor"]],
      ["Website & Hosting", 8000, 45000, 1, ["Shopify plan", "Shopify apps", "Domain renewal"], ["Shopify", "Namecheap"]],
      ["Payment Gateway Fees", 6000, 48000, 1, ["Payment gateway charges"], ["PayFast", "Safepay", "JazzCash Business"]],
      ["Marketplace Fees", 10000, 60000, 0.6, ["Daraz commission"], ["Daraz"]],
      ["Returns & Refunds", 5000, 55000, 1.2, ["Customer refunds", "Exchange shipping"], ["Customer refund", "TCS"]],
      ["Warehouse & Storage", 65000, 65000, "monthly", ["Warehouse rent – Korangi"], ["Korangi Storage Co."]],
      ["Staff Salaries", 210000, 240000, "monthly", ["Store & fulfilment staff salaries"], ["Staff payroll (Meezan)"]],
    ],
  },
];

const METHODS_BY_SIZE = (amount: number, r: () => number) => {
  if (amount > 150000) return r() < 0.8 ? "Bank Transfer" : "Cheque";
  if (amount > 30000) return ["Bank Transfer", "Credit/Debit Card", "Online Payment", "JazzCash"][Math.floor(r() * 4)];
  return ["Cash", "Cash", "JazzCash", "Easypaisa", "Credit/Debit Card", "Online Payment"][Math.floor(r() * 6)];
};

const NOTES = [
  "Approved by Sir Shaheen.",
  "Invoice shared on WhatsApp group.",
  "Paid in two installments.",
  "Recurring — renews next month.",
  "Discount negotiated (10%).",
  "Urgent purchase.",
  "",
  "",
  "",
  "",
];

const pad = (n: number) => String(n).padStart(2, "0");

export function buildStore(today: string): DemoStore {
  idCounter = 0;
  const r = mulberry32(20261122);
  const pick = <T,>(arr: readonly T[]) => arr[Math.floor(r() * arr.length)];

  const profiles: Row[] = DEMO_USERS.map((u) => ({ ...u, is_active: true, created_at: "2025-01-01T09:00:00Z" }));
  const divisions: Row[] = [];
  const categories: Row[] = [];
  const expenses: Row[] = [];
  const expense_audit: Row[] = [];
  let auditSeq = 0;

  const ty = Number(today.slice(0, 4));
  const tm = Number(today.slice(5, 7)) - 1;
  const td = Number(today.slice(8, 10));

  DIVISIONS.forEach((d, di) => {
    const divId = fakeId("d1");
    divisions.push({
      id: divId,
      slug: d.slug,
      name: d.name,
      short_name: d.short_name,
      description: d.description,
      color: d.color,
      sort_order: di + 1,
      created_at: "2025-01-01T00:00:00Z",
    });
    const catIds = new Map<string, string>();
    [...d.cats.map((c) => c[0]), "Miscellaneous"].forEach((name) => {
      const id = fakeId("c1");
      catIds.set(name, id);
      categories.push({ id, division_id: divId, name, is_active: true, created_at: "2025-01-01T00:00:00Z" });
    });

    // 14 months of history ending today
    for (let back = 13; back >= 0; back--) {
      let y = ty;
      let m = tm - back;
      while (m < 0) {
        m += 12;
        y -= 1;
      }
      const lastDay = new Date(y, m + 1, 0).getDate();
      const maxDay = back === 0 ? td : lastDay;
      // gentle growth over time + seasonal bumps
      const growth = 0.78 + (13 - back) * 0.025;
      const seasonal = d.slug === "stylone" && (m === 10 || m === 3 || m === 2) ? 1.45 : d.slug === "eest" && (m === 6 || m === 7) ? 1.3 : 1;

      for (const [name, min, max, freq, titles, payees] of d.cats) {
        let count: number;
        if (freq === "monthly") {
          count = back === 0 && td < 5 ? 0 : 1;
        } else {
          const lambda = freq * seasonal * (back === 0 ? maxDay / lastDay : 1);
          count = Math.floor(lambda) + (r() < lambda - Math.floor(lambda) ? 1 : 0);
        }
        for (let i = 0; i < count; i++) {
          const day = freq === "monthly" ? Math.min(maxDay, 1 + Math.floor(r() * 5)) : 1 + Math.floor(r() * maxDay);
          const date = `${y}-${pad(m + 1)}-${pad(day)}`;
          const raw = min === max ? min : min + (max - min) * Math.pow(r(), 1.6);
          const amount = Math.round((raw * (freq === "monthly" ? 1 : growth)) / 50) * 50;
          const creator = pick(DEMO_USERS);
          const createdAt = new Date(`${date}T${pad(9 + Math.floor(r() * 9))}:${pad(Math.floor(r() * 60))}:00+05:00`).toISOString();
          const id = fakeId("e1");
          const hasReceipt = r() < 0.55;
          const row: Row = {
            id,
            division_id: divId,
            category_id: catIds.get(name)!,
            title: pick(titles),
            description: r() < 0.5 ? `${name} for ${d.short_name}.` : null,
            amount,
            currency: "PKR",
            expense_date: date,
            paid_to: pick(payees),
            location: pick(d.locations),
            purpose: freq === "monthly" ? "Monthly operations" : pick(d.purposes),
            payment_method: METHODS_BY_SIZE(amount, r),
            notes: pick(NOTES) || null,
            receipt_path: hasReceipt ? `${d.slug}/${date.slice(0, 7)}/${id}.jpg` : null,
            receipt_name: hasReceipt ? "receipt.jpg" : null,
            created_by: creator.id,
            updated_by: creator.id,
            created_at: createdAt,
            updated_at: createdAt,
          };
          expenses.push(row);
          expense_audit.push({
            id: String(++auditSeq),
            expense_id: id,
            action: "created",
            actor_id: creator.id,
            changed_at: createdAt,
            old_data: null,
            new_data: { ...row },
          });
        }
      }
    }
  });

  return { profiles, divisions, categories, expenses, expense_audit, auditSeq };
}
