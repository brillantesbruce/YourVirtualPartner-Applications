import React, { useState, useEffect, useRef } from "react";
import {
  Clock, CheckCircle2, XCircle, Users, LayoutGrid, ClipboardList,
  FileText, ChevronRight, Circle, CheckCircle,
} from "lucide-react";

const C = {
  navyDeep: "#091327",
  navy: "#16294B",
  navyMid: "#0E1B33",
  gold: "#B8902E",
  goldLight: "#E3C57D",
  bg: "#F7F5F1",
  panel: "#FFFFFF",
  ink: "#16294B",
  sub: "#6B7280",
  border: "#E4DFD3",
  success: "#2E7D5B",
  successBg: "#EAF4EE",
  error: "#B3402F",
  errorBg: "#FBEDE9",
};

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
* { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
.mono { font-family: 'IBM Plex Mono', monospace; }
::placeholder { color: #B7AF9E; }
.fade-in { animation: fadeIn .3s ease; }
@keyframes fadeIn { from { opacity:0; transform: translateY(6px);} to {opacity:1; transform:none;} }
.pulse-dot { animation: pulse 1.6s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.35;} }
input:focus, select:focus, textarea:focus { outline: 2px solid ${C.gold}; outline-offset: 1px; }
`;

/* ---------------------------------------------------------------------
   APPLICATION FORM SCHEMA — mirrors a full broker CRM application:
   Personal, Employment, Assets & Liabilities, Living Expenses,
   New Loan & Purpose, Product & Comparison, BID, Referrer, Notes
--------------------------------------------------------------------- */
const TABS = [
  {
    id: "personal", title: "Personal",
    fields: [
      { id: "title", label: "Title", type: "select", options: ["Mr", "Mrs", "Ms", "Dr"] },
      { id: "firstName", label: "First Name", type: "text" },
      { id: "lastName", label: "Last Name", type: "text" },
      { id: "dob", label: "Date of Birth", type: "text", placeholder: "DD/MM/YYYY" },
      { id: "mobile", label: "Mobile Number", type: "text" },
      { id: "email", label: "Email Address", type: "text" },
      { id: "maritalStatus", label: "Marital Status", type: "select", options: ["Single", "Married", "De Facto", "Divorced"] },
      { id: "dependents", label: "Dependents", type: "number" },
      { id: "residencyStatus", label: "Residency Status", type: "select", options: ["Australian Citizen", "Permanent Resident", "Visa Holder"] },
      { id: "currentAddress", label: "Current Address", type: "text" },
      { id: "timeAtAddress", label: "Time at Address", type: "text" },
    ],
  },
  {
    id: "employment", title: "Employment",
    fields: [
      { id: "employmentType", label: "Employment Type", type: "select", options: ["PAYG Full-Time", "PAYG Part-Time", "Self-Employed", "Contract"] },
      { id: "employer", label: "Employer / Business Name", type: "text" },
      { id: "employerAddress", label: "Employer Address", type: "text" },
      { id: "occupation", label: "Occupation", type: "text" },
      { id: "industry", label: "Industry", type: "text" },
      { id: "yearsInRole", label: "Years in Current Role", type: "text" },
      { id: "baseIncome", label: "Base Annual Income ($)", type: "currency" },
      { id: "otherIncomeDesc", label: "Other Income — Description", type: "text" },
      { id: "otherIncomeAmount", label: "Other Income — Amount ($)", type: "currency" },
      { id: "incomeFrequency", label: "Income Frequency", type: "select", options: ["Weekly", "Fortnightly", "Monthly", "Annually"] },
    ],
  },
  {
    id: "assets", title: "Assets & Liabilities",
    groups: [
      { title: "Assets", fields: [
        { id: "assetSavings", label: "Savings / Cash ($)", type: "currency" },
        { id: "assetSuper", label: "Superannuation ($)", type: "currency" },
        { id: "assetVehicle", label: "Motor Vehicle ($)", type: "currency" },
        { id: "assetProperty", label: "Existing Property ($)", type: "currency" },
      ]},
      { title: "Liabilities", fields: [
        { id: "liabCreditCard", label: "Credit Card — Limit ($)", type: "currency" },
        { id: "liabPersonalLoan", label: "Personal Loan — Balance ($)", type: "currency" },
        { id: "liabExistingMortgage", label: "Existing Mortgage — Balance ($)", type: "currency" },
        { id: "liabBNPL", label: "Buy Now Pay Later — Balance ($)", type: "currency" },
      ]},
    ],
  },
  {
    id: "expenses", title: "Living Expenses",
    fields: [
      { id: "expGeneralLiving", label: "General Living (monthly $)", type: "currency" },
      { id: "expInsurance", label: "Insurance (monthly $)", type: "currency" },
      { id: "expEducation", label: "Education / Childcare (monthly $)", type: "currency" },
      { id: "expTelco", label: "Telephone / Internet / Media (monthly $)", type: "currency" },
      { id: "expTransport", label: "Transport / Motor Vehicle (monthly $)", type: "currency" },
      { id: "expRecreation", label: "Recreation / Entertainment (monthly $)", type: "currency" },
    ],
  },
  {
    id: "loan", title: "New Loan & Purpose",
    fields: [
      { id: "loanPurpose", label: "Loan Purpose", type: "select", options: ["Purchase", "Refinance", "Investment Purchase", "Construction"] },
      { id: "propertyUse", label: "Property Use", type: "select", options: ["Owner Occupied", "Investment"] },
      { id: "propertyAddress", label: "Property Address", type: "text" },
      { id: "propertyType", label: "Property Type", type: "select", options: ["House", "Apartment/Unit", "Townhouse", "Vacant Land"] },
      { id: "propertyValue", label: "Property Value / Purchase Price ($)", type: "currency" },
      { id: "loanAmount", label: "Loan Amount ($)", type: "currency" },
      { id: "deposit", label: "Deposit / Equity ($)", type: "currency" },
      { id: "depositSource", label: "Deposit Source", type: "select", options: ["Savings", "Gift", "Sale of Existing Property", "Equity"] },
      { id: "settlementTimeframe", label: "Settlement Timeframe", type: "text" },
      { id: "repaymentType", label: "Repayment Type", type: "select", options: ["Principal & Interest", "Interest Only"] },
      { id: "loanTerm", label: "Loan Term (years)", type: "number" },
    ],
  },
  {
    id: "product", title: "Product & Comparison",
    groups: [
      { title: "Recommended Product", fields: [
        { id: "lender", label: "Lender", type: "text" },
        { id: "loanProduct", label: "Loan Product", type: "text" },
        { id: "interestRate", label: "Interest Rate (%)", type: "text" },
        { id: "comparisonRate", label: "Comparison Rate (%)", type: "text" },
        { id: "annualFee", label: "Annual Fee ($)", type: "currency" },
        { id: "offsetAccount", label: "Offset Account", type: "select", options: ["Yes", "No"] },
      ]},
      { title: "Alternative Considered", fields: [
        { id: "altLender", label: "Lender", type: "text" },
        { id: "altProduct", label: "Loan Product", type: "text" },
        { id: "altRate", label: "Interest Rate (%)", type: "text" },
        { id: "altComparisonRate", label: "Comparison Rate (%)", type: "text" },
      ]},
    ],
  },
  {
    id: "bid", title: "Best Interests Duty (BID)",
    fields: [
      { id: "needsObjectives", label: "Client's Needs & Objectives", type: "textarea-key" },
      { id: "whyRecommended", label: "Why This Product Is Recommended", type: "textarea-key" },
      { id: "alternativesConsidered", label: "Alternatives Considered & Why Not Chosen", type: "textarea-key" },
      { id: "feesDisclosed", label: "Fees & Charges Disclosed to Client", type: "select", options: ["Yes", "No"] },
      { id: "conflictsDeclared", label: "Conflicts of Interest Declared", type: "select", options: ["Yes", "No"] },
    ],
  },
  {
    id: "compliance", title: "Referrer & Compliance",
    fields: [
      { id: "referrerName", label: "Referrer Name", type: "text" },
      { id: "referralSource", label: "Referral Source", type: "select", options: ["Existing Client", "Real Estate Agent", "Accountant Partner", "Online Enquiry", "Social Media"] },
      { id: "brokerAssigned", label: "Broker Assigned", type: "text" },
      { id: "socaCompleted", label: "SOCA Completed", type: "select", options: ["Yes", "No", "Pending"] },
    ],
  },
  {
    id: "notes", title: "Notes",
    fields: [
      { id: "caseNotes", label: "Case Notes (free text — not scored)", type: "textarea", graded: false },
    ],
  },
];

function tabFields(tab) {
  return tab.fields ? tab.fields : tab.groups.flatMap((g) => g.fields);
}
const ALL_FIELDS = TABS.flatMap(tabFields);
const GRADED_FIELDS = ALL_FIELDS.filter((f) => f.graded !== false);
const FIELD_TAB_TITLE = {};
TABS.forEach((t) => tabFields(t).forEach((f) => { FIELD_TAB_TITLE[f.id] = t.title; }));

/* ---------------------------------------------------------------------
   CASE DATA — three referral files of increasing complexity
--------------------------------------------------------------------- */
const CASES = [
  {
    id: "case1",
    title: "Standard Owner-Occupied Purchase",
    difficulty: "Beginner",
    scenario: "First home buyer purchasing an apartment. PAYG employment, one product comparison, straightforward BID.",
    sourceDoc: [
      "REFERRAL INTAKE — New Enquiry", "Referred by: Sarah Coleman (Real Estate Agent)", "---",
      "PERSONAL", "Client: Mr James Mitchell", "DOB: 14/03/1989", "Ph: 0412 345 678",
      "Email: james.mitchell@email.com", "Status: Single, 0 dependants", "Residency: Australian Citizen",
      "Current address: 4/10 Sydney Road, Manly NSW 2095 (3 yrs)", "---",
      "EMPLOYMENT", "Employer: Bunnings Warehouse Pty Ltd, 1 Bunnings Way, Alexandria NSW 2015",
      "Role: Store Manager — Retail industry", "Basis: PAYG Full-Time, 4 years in role",
      "Base income: $98,000 p.a.", "Other income: None", "---",
      "ASSETS", "Savings: $45,000  |  Super: $62,000  |  Vehicle: $18,000  |  Existing property: none", "---",
      "LIABILITIES", "Credit card limit: $8,000  |  Personal loan: nil  |  Existing mortgage: nil  |  BNPL: $1,200", "---",
      "LIVING EXPENSES (monthly)", "General living $1,800, Insurance $220, Education $0, Telco/media $150, Transport $350, Recreation $300", "---",
      "NEW LOAN", "Purpose: Purchase — Owner Occupied",
      "Security: 12/45 Harbord Road, Freshwater NSW 2096 (Apartment/Unit)",
      "Purchase price: $850,000.00  |  Loan required: $680,000  |  Deposit: $170,000 (from savings)",
      "Settlement: 60 days  |  Repayments: Principal & Interest  |  Term: 30 yrs", "---",
      "PRODUCT REVIEWED", "Recommending ANZ Simplicity PLUS Variable — rate 6.24%, comparison rate 6.30%, no annual fee, no offset",
      "Also reviewed CBA Standard Variable — rate 6.49%, comparison rate 6.83%, carries an annual fee — not proceeding", "---",
      "BROKER FILE NOTES",
      "Client's main goal is to get into the market as a first home buyer, wants an owner-occupied loan with low ongoing fees. Eligible for the First Home Buyer Guarantee (FHBG), so no LMI required.",
      "ANZ recommended over CBA as it carries a lower rate and no annual fee — better fits the client's low-fee objective.",
      "All fees and charges were disclosed to the client. No conflicts of interest to declare.", "---",
      "Broker assigned: Michael Fenech", "SOCA: Pending",
    ],
    expected: {
      title: "Mr", firstName: "James", lastName: "Mitchell", dob: "14/03/1989", mobile: "0412 345 678",
      email: "james.mitchell@email.com", maritalStatus: "Single", dependents: "0", residencyStatus: "Australian Citizen",
      currentAddress: "4/10 Sydney Road, Manly NSW 2095", timeAtAddress: "3 years",
      employmentType: "PAYG Full-Time", employer: "Bunnings Warehouse Pty Ltd", employerAddress: "1 Bunnings Way, Alexandria NSW 2015",
      occupation: "Store Manager", industry: "Retail", yearsInRole: "4 years", baseIncome: "98000",
      otherIncomeDesc: "None", otherIncomeAmount: "0", incomeFrequency: "Annually",
      assetSavings: "45000", assetSuper: "62000", assetVehicle: "18000", assetProperty: "0",
      liabCreditCard: "8000", liabPersonalLoan: "0", liabExistingMortgage: "0", liabBNPL: "1200",
      expGeneralLiving: "1800", expInsurance: "220", expEducation: "0", expTelco: "150", expTransport: "350", expRecreation: "300",
      loanPurpose: "Purchase", propertyUse: "Owner Occupied", propertyAddress: "12/45 Harbord Road, Freshwater NSW 2096",
      propertyType: "Apartment/Unit", propertyValue: "850000", loanAmount: "680000", deposit: "170000",
      depositSource: "Savings", settlementTimeframe: "60 days", repaymentType: "Principal & Interest", loanTerm: "30",
      lender: "ANZ", loanProduct: "Simplicity PLUS Variable", interestRate: "6.24", comparisonRate: "6.30",
      annualFee: "0", offsetAccount: "No", altLender: "Commonwealth Bank", altProduct: "Standard Variable",
      altRate: "6.49", altComparisonRate: "6.83",
      needsObjectives: ["first home", "owner-occupied", "low fees"],
      whyRecommended: ["lower rate", "no annual fee", "fhbg"],
      alternativesConsidered: ["cba", "higher rate", "annual fee"],
      feesDisclosed: "Yes", conflictsDeclared: "No",
      referrerName: "Sarah Coleman", referralSource: "Real Estate Agent", brokerAssigned: "Michael Fenech", socaCompleted: "Pending",
    },
  },
  {
    id: "case2",
    title: "Self-Employed Refinance",
    difficulty: "Intermediate",
    scenario: "Homeowner refinancing away from an existing lender. Self-employed income, dependants, equity-based deposit.",
    sourceDoc: [
      "REFERRAL INTAKE — New Enquiry", "Referred by: David Tran (Accountant Partner)", "---",
      "PERSONAL", "Client: Ms Priya Nair", "DOB: 02/11/1985", "Ph: 0433 897 210",
      "Email: priya.nair@nairconsulting.com.au", "Status: Married, 2 dependants", "Residency: Australian Citizen",
      "Current address: 8 Wattle Crescent, Castle Hill NSW 2154 (7 yrs)", "---",
      "EMPLOYMENT", "Business: Nair Consulting Pty Ltd, Suite 4, 220 Pennant Hills Road, Carlingford NSW 2118",
      "Role: Management Consultant — Professional Services", "Basis: Self-Employed, 6 years trading",
      "Base income: $145,000 p.a.  |  Other income: Dividend income $12,000 p.a.", "---",
      "ASSETS", "Savings: $38,000  |  Super: $210,000  |  Vehicle: $32,000  |  Existing property (subject security): $1,250,000", "---",
      "LIABILITIES", "Credit card limit: $15,000  |  Personal loan: $9,000  |  Existing mortgage (to be refinanced): $560,000  |  BNPL: nil", "---",
      "LIVING EXPENSES (monthly)", "General living $2,600, Insurance $380, Education/childcare $900, Telco/media $220, Transport $450, Recreation $400", "---",
      "NEW LOAN", "Purpose: Refinance — Owner Occupied",
      "Security: 8 Wattle Crescent, Castle Hill NSW 2154 (House), value $1,250,000",
      "Loan required: $720,000  |  Equity: $530,000 (deposit source: equity)",
      "Settlement: 45 days  |  Repayments: Principal & Interest  |  Term: 25 yrs", "---",
      "PRODUCT REVIEWED", "Recommending Macquarie Bank Offset Home Loan — rate 6.09%, comparison rate 6.15%, $395 annual fee, offset account included",
      "Existing lender CBA Wealth Package Variable reviewed as the status-quo alternative — rate 6.55%, comparison rate 6.88%, higher ongoing cost — not proceeding", "---",
      "BROKER FILE NOTES",
      "Client wants to refinance away from her existing lender to reduce her rate and get access to an offset account against her savings. Objective is lower repayments and better use of surplus cash.",
      "Macquarie recommended over staying with CBA — lower rate and an offset facility gives meaningful interest savings versus the existing lender.",
      "Fees and charges disclosed to client. No conflicts of interest to declare.", "---",
      "Broker assigned: Glenda Ng", "SOCA: Yes",
    ],
    expected: {
      title: "Ms", firstName: "Priya", lastName: "Nair", dob: "02/11/1985", mobile: "0433 897 210",
      email: "priya.nair@nairconsulting.com.au", maritalStatus: "Married", dependents: "2", residencyStatus: "Australian Citizen",
      currentAddress: "8 Wattle Crescent, Castle Hill NSW 2154", timeAtAddress: "7 years",
      employmentType: "Self-Employed", employer: "Nair Consulting Pty Ltd", employerAddress: "Suite 4, 220 Pennant Hills Road, Carlingford NSW 2118",
      occupation: "Management Consultant", industry: "Professional Services", yearsInRole: "6 years", baseIncome: "145000",
      otherIncomeDesc: "Dividend income", otherIncomeAmount: "12000", incomeFrequency: "Annually",
      assetSavings: "38000", assetSuper: "210000", assetVehicle: "32000", assetProperty: "1250000",
      liabCreditCard: "15000", liabPersonalLoan: "9000", liabExistingMortgage: "560000", liabBNPL: "0",
      expGeneralLiving: "2600", expInsurance: "380", expEducation: "900", expTelco: "220", expTransport: "450", expRecreation: "400",
      loanPurpose: "Refinance", propertyUse: "Owner Occupied", propertyAddress: "8 Wattle Crescent, Castle Hill NSW 2154",
      propertyType: "House", propertyValue: "1250000", loanAmount: "720000", deposit: "530000",
      depositSource: "Equity", settlementTimeframe: "45 days", repaymentType: "Principal & Interest", loanTerm: "25",
      lender: "Macquarie Bank", loanProduct: "Offset Home Loan", interestRate: "6.09", comparisonRate: "6.15",
      annualFee: "395", offsetAccount: "Yes", altLender: "Commonwealth Bank", altProduct: "Wealth Package Variable",
      altRate: "6.55", altComparisonRate: "6.88",
      needsObjectives: ["refinance", "lower rate", "offset"],
      whyRecommended: ["lower rate", "offset", "savings"],
      alternativesConsidered: ["cba", "existing lender", "higher"],
      feesDisclosed: "Yes", conflictsDeclared: "No",
      referrerName: "David Tran", referralSource: "Accountant Partner", brokerAssigned: "Glenda Ng", socaCompleted: "Yes",
    },
  },
  {
    id: "case3",
    title: "Investment Purchase — Contract Income",
    difficulty: "Advanced",
    scenario: "Investment purchase for a contractor, interest-only structure. Tests attention to file notes and BID reasoning.",
    sourceDoc: [
      "REFERRAL INTAKE — New Enquiry", "Referred by: Online Enquiry Form (Website)", "---",
      "PERSONAL", "Client: Mr Daniel Wu", "DOB: 27/07/1993", "Ph: 0401 556 789",
      "Email: daniel.wu88@gmail.com", "Status: De Facto, 0 dependants", "Residency: Australian Citizen",
      "Current address: 14 Gardiner Street, Rozelle NSW 2039 (2 yrs)", "---",
      "EMPLOYMENT", "Employer: Cognizant Technology Solutions, Level 12, 100 George Street, Parramatta NSW 2150",
      "Role: Software Engineer — Information Technology", "Basis: Contract, 1.5 years in role (renews annually)",
      "Base income: $132,000 p.a.  |  Other income: None", "---",
      "ASSETS", "Savings: $52,000  |  Super: $48,000  |  Vehicle: $22,000  |  Existing property: none", "---",
      "LIABILITIES", "Credit card limit: $12,000  |  Personal loan: nil  |  Existing mortgage: nil  |  BNPL: $2,400", "---",
      "LIVING EXPENSES (monthly)", "General living $1,600, Insurance $180, Education $0, Telco/media $140, Transport $260, Recreation $350", "---",
      "NEW LOAN", "Purpose: Investment Purchase",
      "Security: 3/21 Bay Street, Botany NSW 2019 (Townhouse)",
      "Purchase price: $690,000  |  Loan required: $552,000  |  Deposit: $138,000 (from savings)",
      "Settlement: 42 days  |  Repayments: Interest Only  |  Term: 30 yrs", "---",
      "PRODUCT REVIEWED", "Recommending ING Mortgage Simplifier — rate 6.34%, comparison rate 6.38%, no annual fee, no offset",
      "Also reviewed ANZ Investment Variable — rate 6.60%, comparison rate 6.65%, higher cost — not proceeding", "---",
      "BROKER FILE NOTES",
      "Client's objective is to build an investment property portfolio while keeping repayments low to maximise cash flow — hence the interest-only structure requested.",
      "ING recommended over ANZ as it offers a lower rate with no ongoing fee, improving cash flow for the investment strategy.",
      "Fees and charges disclosed to client. No conflicts of interest to declare.", "---",
      "Broker assigned: Michael Fenech", "SOCA: Pending",
      "Note: contract renews annually — obtain employment verification letter confirming likelihood of renewal before submission.",
    ],
    expected: {
      title: "Mr", firstName: "Daniel", lastName: "Wu", dob: "27/07/1993", mobile: "0401 556 789",
      email: "daniel.wu88@gmail.com", maritalStatus: "De Facto", dependents: "0", residencyStatus: "Australian Citizen",
      currentAddress: "14 Gardiner Street, Rozelle NSW 2039", timeAtAddress: "2 years",
      employmentType: "Contract", employer: "Cognizant Technology Solutions", employerAddress: "Level 12, 100 George Street, Parramatta NSW 2150",
      occupation: "Software Engineer", industry: "Information Technology", yearsInRole: "1.5 years", baseIncome: "132000",
      otherIncomeDesc: "None", otherIncomeAmount: "0", incomeFrequency: "Annually",
      assetSavings: "52000", assetSuper: "48000", assetVehicle: "22000", assetProperty: "0",
      liabCreditCard: "12000", liabPersonalLoan: "0", liabExistingMortgage: "0", liabBNPL: "2400",
      expGeneralLiving: "1600", expInsurance: "180", expEducation: "0", expTelco: "140", expTransport: "260", expRecreation: "350",
      loanPurpose: "Investment Purchase", propertyUse: "Investment", propertyAddress: "3/21 Bay Street, Botany NSW 2019",
      propertyType: "Townhouse", propertyValue: "690000", loanAmount: "552000", deposit: "138000",
      depositSource: "Savings", settlementTimeframe: "42 days", repaymentType: "Interest Only", loanTerm: "30",
      lender: "ING", loanProduct: "Mortgage Simplifier", interestRate: "6.34", comparisonRate: "6.38",
      annualFee: "0", offsetAccount: "No", altLender: "ANZ", altProduct: "Investment Variable",
      altRate: "6.60", altComparisonRate: "6.65",
      needsObjectives: ["investment", "cash flow", "interest only"],
      whyRecommended: ["lower rate", "no fee", "cash flow"],
      alternativesConsidered: ["anz", "higher"],
      feesDisclosed: "Yes", conflictsDeclared: "No",
      referrerName: "Online Enquiry Form", referralSource: "Online Enquiry", brokerAssigned: "Michael Fenech", socaCompleted: "Pending",
    },
  },
];

const PIPELINE_STAGES = ["New Lead", "Fact Find", "Submitted to Lender", "Conditional Approval", "Unconditional Approval", "Settled"];
const SAMPLE_DEALS = [
  { name: "R. Alvarez", stage: "New Lead", amount: "$430,000" },
  { name: "T. Nguyen", stage: "Fact Find", amount: "$610,000" },
  { name: "K. O'Brien", stage: "Fact Find", amount: "$385,000" },
  { name: "S. Petrov", stage: "Submitted to Lender", amount: "$720,000" },
  { name: "M. Habib", stage: "Conditional Approval", amount: "$540,000" },
  { name: "L. Chen", stage: "Conditional Approval", amount: "$890,000" },
  { name: "J. Fitzgerald", stage: "Unconditional Approval", amount: "$505,000" },
  { name: "A. Kowalski", stage: "Settled", amount: "$675,000" },
  { name: "P. Singh", stage: "Settled", amount: "$412,000" },
];

/* --------------------------------- helpers --------------------------------- */
function normalizeText(v) { return String(v || "").trim().toLowerCase().replace(/\s+/g, " "); }
function normalizeNumber(v) {
  const stripped = String(v || "").replace(/[^0-9.]/g, "");
  const n = parseFloat(stripped);
  return isNaN(n) ? null : n;
}
function fieldMatches(field, entered, expected) {
  if (field.type === "currency" || field.type === "number") {
    const a = normalizeNumber(entered), b = normalizeNumber(expected);
    return a !== null && b !== null && a === b;
  }
  if (field.type === "textarea-key") {
    const text = normalizeText(entered);
    if (!text) return false;
    const keywords = expected || [];
    const hit = keywords.filter((k) => text.includes(k.toLowerCase())).length;
    return keywords.length > 0 && hit / keywords.length >= 0.6;
  }
  return normalizeText(entered) === normalizeText(expected);
}
function formatElapsed(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* --------------------------------- layout --------------------------------- */
function Sidebar({ view, setView }) {
  const items = [
    { id: "practice", label: "Data Entry Practice", icon: ClipboardList },
    { id: "pipeline", label: "Pipeline (view only)", icon: LayoutGrid },
  ];
  return (
    <div style={{ background: `linear-gradient(180deg, ${C.navy}, ${C.navyDeep})`, width: 230, minWidth: 230, color: "white", padding: "20px 14px" }}>
      <div style={{ padding: "0 8px 20px 8px", borderBottom: `1px solid rgba(255,255,255,0.12)`, marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 11, color: C.goldLight, letterSpacing: 1 }}>TRAINING SANDBOX</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginTop: 4 }}>BrokerFlow CRM</div>
        <div style={{ fontSize: 11, color: "#B9C2D6", marginTop: 2 }}>Broker Support Onboarding</div>
      </div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = view === it.id;
        return (
          <button key={it.id} onClick={() => setView(it.id)} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
            padding: "10px 10px", borderRadius: 8, marginBottom: 4, border: "none", cursor: "pointer",
            background: active ? "rgba(184,144,46,0.18)" : "transparent",
            color: active ? C.goldLight : "#D9DEEB", fontSize: 13.5, fontWeight: active ? 600 : 500,
          }}>
            <Icon size={16} />{it.label}
          </button>
        );
      })}
      <div style={{ marginTop: 24, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.05)" }}>
        <div className="mono" style={{ fontSize: 10.5, color: "#9AA6C0", lineHeight: 1.5 }}>
          Sandbox environment. No real client data is stored or transmitted here — for internal onboarding and QA testing only.
        </div>
      </div>
    </div>
  );
}

function TopBar({ trainee, setTrainee, timerActive, elapsed, nameError, attemptStarted }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 26px", borderBottom: `1px solid ${C.border}`, background: C.panel }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 12.5, color: C.sub }}>Trainee name</span>
        <input value={trainee} onChange={(e) => setTrainee(e.target.value)} placeholder="Enter your name"
          required maxLength={80} aria-invalid={nameError} disabled={timerActive || attemptStarted}
          style={{ border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px", fontSize: 13, width: 180 }} />
        {nameError && <span role="alert" style={{ color: C.error, fontSize: 12 }}>Enter your name before starting a case.</span>}
      </div>
      {timerActive && (
        <div className="mono fade-in" style={{ display: "flex", alignItems: "center", gap: 8, background: C.navy, color: C.goldLight, padding: "6px 14px", borderRadius: 20, fontSize: 14, fontWeight: 600 }}>
          <Clock size={15} className="pulse-dot" />{formatElapsed(elapsed)}
        </div>
      )}
    </div>
  );
}

function CaseSelect({ onPick }) {
  return (
    <div style={{ padding: 30, maxWidth: 940 }} className="fade-in">
      <h1 style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Data Entry Practice</h1>
      <p style={{ color: C.sub, fontSize: 13.5, marginBottom: 22, lineHeight: 1.6 }}>
        Pick a referral case below. You'll see a source intake document on the left — key it into a full CRM
        application on the right: Personal, Employment, Assets &amp; Liabilities, Living Expenses, New Loan &amp;
        Purpose, Product &amp; Comparison, Best Interests Duty (BID), Referrer/Compliance, and Notes. The clock
        starts as soon as you open a case, and accuracy is scored field-by-field on submit.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
        {CASES.map((c) => (
          <button key={c.id} onClick={() => onPick(c)} style={{
            textAlign: "left", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12,
            padding: 18, cursor: "pointer", boxShadow: "0 1px 2px rgba(22,41,75,0.06)",
          }}>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: 0.5, color: C.gold, fontWeight: 600, marginBottom: 8 }}>
              {c.difficulty.toUpperCase()}
            </div>
            <div style={{ fontWeight: 600, fontSize: 15, color: C.ink, marginBottom: 6 }}>{c.title}</div>
            <div style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.5, marginBottom: 14 }}>{c.scenario}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, color: C.navy, fontSize: 12.5, fontWeight: 600 }}>
              Start case <ChevronRight size={14} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function CompletionMeter({ pct }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 90, height: 6, background: C.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: C.gold, transition: "width .2s" }} />
      </div>
      <span className="mono" style={{ fontSize: 11, color: C.sub }}>{pct}% filled</span>
    </div>
  );
}

function FieldInput({ f, value, onChange }) {
  const base = { width: "100%", border: `1px solid ${C.border}`, borderRadius: 6, padding: "8px 10px", fontSize: 13 };
  if (f.type === "select") {
    return (
      <select value={value || ""} onChange={(e) => onChange(e.target.value)} style={{ ...base, background: "white" }}>
        <option value="">Select...</option>
        {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (f.type === "textarea" || f.type === "textarea-key") {
    return <textarea value={value || ""} onChange={(e) => onChange(e.target.value)} rows={f.type === "textarea-key" ? 3 : 3} style={{ ...base, resize: "vertical" }} />;
  }
  return <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={f.placeholder || ""} style={base} />;
}

function FieldGrid({ fields, formData, update }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      {fields.map((f) => (
        <div key={f.id} style={{ gridColumn: f.type === "textarea" || f.type === "textarea-key" ? "1 / span 2" : "auto" }}>
          <label style={{ display: "block", fontSize: 12, color: C.sub, marginBottom: 4 }}>{f.label}</label>
          <FieldInput f={f} value={formData[f.id]} onChange={(v) => update(f.id, v)} />
        </div>
      ))}
    </div>
  );
}

function CaseForm({ activeCase, formData, setFormData, onSubmit }) {
  const [activeTabId, setActiveTabId] = useState(TABS[0].id);
  const filled = ALL_FIELDS.filter((f) => (formData[f.id] || "").toString().trim() !== "").length;
  const pct = Math.round((filled / ALL_FIELDS.length) * 100);
  const update = (id, val) => setFormData((prev) => ({ ...prev, [id]: val }));
  const currentTab = TABS.find((t) => t.id === activeTabId);

  return (
    <div style={{ display: "flex", gap: 20, padding: 24, alignItems: "flex-start" }} className="fade-in">
      <div style={{ width: 300, minWidth: 300, background: C.navy, borderRadius: 12, padding: 18, color: "white", position: "sticky", top: 20, maxHeight: "calc(100vh - 140px)", overflowY: "auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <FileText size={15} color={C.goldLight} />
          <span className="mono" style={{ fontSize: 11, color: C.goldLight, letterSpacing: 0.5 }}>SOURCE DOCUMENT</span>
        </div>
        <div className="mono" style={{ fontSize: 11.5, lineHeight: 1.7, color: "#DCE2EF", whiteSpace: "pre-wrap" }}>
          {activeCase.sourceDoc.join("\n")}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.ink }}>{activeCase.title}</div>
            <div style={{ fontSize: 12, color: C.sub }}>New Application — enter every field from the source document</div>
          </div>
          <CompletionMeter pct={pct} />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
          {TABS.map((t) => {
            const fs = tabFields(t);
            const tabFilled = fs.every((f) => (formData[f.id] || "").toString().trim() !== "");
            const active = t.id === activeTabId;
            return (
              <button key={t.id} onClick={() => setActiveTabId(t.id)} style={{
                display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 20,
                border: `1px solid ${active ? C.navy : C.border}`, background: active ? C.navy : "white",
                color: active ? "white" : C.ink, fontSize: 12.5, fontWeight: active ? 600 : 500, cursor: "pointer",
              }}>
                {tabFilled ? <CheckCircle size={13} color={active ? C.goldLight : C.success} /> : <Circle size={13} color={active ? "#B9C2D6" : C.border} />}
                {t.title}
              </button>
            );
          })}
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10, padding: 18, marginBottom: 16 }}>
          {currentTab.fields ? (
            <FieldGrid fields={currentTab.fields} formData={formData} update={update} />
          ) : (
            currentTab.groups.map((g) => (
              <div key={g.title} style={{ marginBottom: 18 }}>
                <div className="mono" style={{ fontSize: 11, color: C.gold, fontWeight: 600, letterSpacing: 0.5, marginBottom: 10 }}>
                  {g.title.toUpperCase()}
                </div>
                <FieldGrid fields={g.fields} formData={formData} update={update} />
              </div>
            ))
          )}
        </div>

        <button onClick={onSubmit} style={{ background: C.gold, color: "white", border: "none", borderRadius: 45, padding: "12px 28px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          Submit Application
        </button>
      </div>
    </div>
  );
}

function ResultView({ activeCase, result, saveError }) {
  const grouped = {};
  result.fieldResults.forEach((r) => {
    const t = FIELD_TAB_TITLE[r.id] || "Other";
    if (!grouped[t]) grouped[t] = [];
    grouped[t].push(r);
  });

  return (
    <div style={{ padding: 26, maxWidth: 820 }} className="fade-in">
      <div style={{ display: "flex", gap: 14, marginBottom: 20 }}>
        <div style={{ flex: 1, background: C.navy, borderRadius: 12, padding: 20, color: "white" }}>
          <div className="mono" style={{ fontSize: 11, color: C.goldLight }}>ACCURACY</div>
          <div style={{ fontSize: 30, fontWeight: 700 }}>{result.accuracyPct}%</div>
          <div style={{ fontSize: 12, color: "#B9C2D6" }}>{result.correctCount} / {GRADED_FIELDS.length} fields matched</div>
        </div>
        <div style={{ flex: 1, background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, padding: 20 }}>
          <div className="mono" style={{ fontSize: 11, color: C.gold }}>TIME TO COMPLETE</div>
          <div className="mono" style={{ fontSize: 30, fontWeight: 700, color: C.ink }}>{formatElapsed(result.timeSeconds)}</div>
          <div style={{ fontSize: 12, color: C.sub }}>{activeCase.title}</div>
        </div>
      </div>

      {Object.keys(grouped).map((tabTitle) => (
        <div key={tabTitle} style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
          <div style={{ padding: "10px 18px", borderBottom: `1px solid ${C.border}`, fontWeight: 600, fontSize: 12.5, color: C.ink, background: "#FAF8F3" }}>
            {tabTitle}
          </div>
          {grouped[tabTitle].map((r) => (
            <div key={r.id} style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "9px 18px", borderBottom: `1px solid ${C.border}`, background: r.match ? "white" : C.errorBg, gap: 10 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, color: C.ink, fontWeight: 500 }}>{r.label}</div>
                {!r.match && (
                  <div className="mono" style={{ fontSize: 11.3, color: C.error, marginTop: 2 }}>
                    You entered: "{r.entered || "(blank)"}" — {r.expectedIsKeywords ? `should mention: ${r.expectedDisplay}` : `expected: "${r.expectedDisplay}"`}
                  </div>
                )}
              </div>
              {r.match ? <CheckCircle2 size={17} color={C.success} style={{ flexShrink: 0 }} /> : <XCircle size={17} color={C.error} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      ))}

      {saveError && (
        <div style={{ marginTop: 14, padding: "10px 14px", borderRadius: 8, background: C.errorBg, color: C.error, fontSize: 12.5 }}>
          {saveError}
        </div>
      )}
    </div>
  );
}

function PipelineView() {
  return (
    <div style={{ padding: 26 }} className="fade-in">
      <h1 style={{ fontSize: 20, fontWeight: 700, color: C.ink, marginBottom: 4 }}>Pipeline</h1>
      <p style={{ fontSize: 13, color: C.sub, marginBottom: 18 }}>Sample deal board for familiarization with the stage workflow. Not connected to the practice exercises.</p>
      <div style={{ display: "flex", gap: 12, overflowX: "auto" }}>
        {PIPELINE_STAGES.map((stage) => (
          <div key={stage} style={{ minWidth: 190, background: "#F1EEE5", borderRadius: 10, padding: 10 }}>
            <div className="mono" style={{ fontSize: 10.5, color: C.navy, fontWeight: 600, marginBottom: 8, letterSpacing: 0.3 }}>{stage.toUpperCase()}</div>
            {SAMPLE_DEALS.filter((d) => d.stage === stage).map((d) => (
              <div key={d.name} style={{ background: "white", borderRadius: 8, padding: 10, marginBottom: 8, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{d.name}</div>
                <div className="mono" style={{ fontSize: 11.5, color: C.gold }}>{d.amount}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState("practice");
  const [trainee, setTrainee] = useState("");
  const [nameError, setNameError] = useState(false);
  const [attemptStarted, setAttemptStarted] = useState(() => window.YVPAttemptSession.hasStarted("training-sandbox"));
  const [activeCase, setActiveCase] = useState(null);
  const [formData, setFormData] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState(null);
  const [saveError, setSaveError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    if (activeCase && !result) {
      intervalRef.current = setInterval(() => setElapsed((Date.now() - startTime) / 1000), 250);
      return () => clearInterval(intervalRef.current);
    }
    clearInterval(intervalRef.current);
  }, [activeCase, result, startTime]);

  const pickCase = (c) => {
    if (!trainee.trim()) {
      setNameError(true);
      return;
    }
    const sessionId = window.YVPAttemptSession.start("training-sandbox");
    if (!sessionId) {
      setAttemptStarted(true);
      return;
    }
    setNameError(false);
    setAttemptStarted(true);
    setActiveCase(c);
    setFormData({});
    setStartTime(Date.now());
    setElapsed(0);
    setResult(null);
  };

  const submit = async () => {
    const timeSeconds = (Date.now() - startTime) / 1000;
    const fieldResults = GRADED_FIELDS.map((f) => {
      const entered = formData[f.id] || "";
      const expectedRaw = activeCase.expected[f.id];
      const isKeywords = Array.isArray(expectedRaw);
      return {
        id: f.id, label: f.label, entered,
        expectedDisplay: isKeywords ? expectedRaw.join(", ") : expectedRaw,
        expectedIsKeywords: isKeywords,
        match: fieldMatches(f, entered, expectedRaw),
      };
    });
    const correctCount = fieldResults.filter((r) => r.match).length;
    const accuracyPct = Math.round((correctCount / GRADED_FIELDS.length) * 100);
    const res = { fieldResults, correctCount, accuracyPct, timeSeconds };
    setResult(res);

    setSaveError("");
    try {
      const response = await fetch("/.netlify/functions/submit-result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: "training-sandbox",
          result: {
            trainee_name: trainee.trim(),
            session_id: window.YVPAttemptSession.getId("training-sandbox"),
            case_id: activeCase.id,
            case_title: activeCase.title,
            accuracy_pct: accuracyPct,
            time_seconds: Number(timeSeconds.toFixed(2)),
          },
        }),
      });
      if (response.status === 409) throw new Error("You have already submitted an assessment.");
      if (!response.ok) throw new Error(`Submission failed with status ${response.status}.`);
    } catch (error) {
      console.error("Failed to save practice result:", error);
      setSaveError("This result was scored, but it could not be saved to shared results.");
    }
  };

  let body;
  if (view === "pipeline") body = <PipelineView />;
  else if (!activeCase && attemptStarted) body = (
    <div role="alert" style={{ padding: 30, maxWidth: 760, color: C.ink }}>
      You have already used your Training Sandbox attempt.
    </div>
  );
  else if (!activeCase) body = <CaseSelect onPick={pickCase} />;
  else if (result) body = <ResultView activeCase={activeCase} result={result} saveError={saveError} />;
  else body = <CaseForm key={activeCase.id} activeCase={activeCase} formData={formData} setFormData={setFormData} onSubmit={submit} />;

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 640, background: C.bg }}>
      <style>{FONT_IMPORT}</style>
      <Sidebar view={view} setView={(v) => { setActiveCase(null); setResult(null); setView(v); }} />
      <div style={{ flex: 1, overflowY: "auto" }}>
        <TopBar trainee={trainee} setTrainee={(value) => { setTrainee(value); if (value.trim()) setNameError(false); }}
          timerActive={!!activeCase && !result} elapsed={elapsed} nameError={nameError} attemptStarted={attemptStarted} />
        {body}
      </div>
    </div>
  );
}