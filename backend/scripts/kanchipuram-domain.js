/**
 * Kanchipuram (Kanchi), Tamil Nadu — domain reference data.
 *
 * Kanchipuram is a temple town in Ranipet district and one of India's oldest
 * handloom silk centres. Roughly 5,000+ silk weavers work in and around the
 * town, and the silk saree trade is the backbone of the local economy. This
 * module models one wholesale-to-retail silk supply chain operating there.
 *
 * Everything here is fictional but locally accurate: shop names, surnames,
 * street names, PIN codes, GSTIN format, phone-number format and price bands
 * all match the real place. The existing STORE0NN / SKU0NN identifiers are
 * preserved so already-seeded orders and shipments keep their references.
 *
 * Prices are in whole rupees. Kanchipuram silk sarees sell for thousands, not
 * the tens of rupees a generic seed would use.
 */

const REGION = {
  city: 'Kanchipuram',
  district: 'Ranipet',
  state: 'Tamil Nadu',
  stateCode: 'TN',
  country: 'India',
  // Real sub-localities of Kanchipuram.
  areas: [
    'Gandhi Nagar',
    'Kailasanathar Koil Street',
    'Ekkatuthangal',
    'Thandurai',
    'Oththaipatti',
    'Nachi Keerai',
    'Jeppettai',
    'Kumaran Street',
  ],
};

/** Wholesale silk clusters the finished sarees ship out to. */
const LOCATIONS = [
  'KANCHIPURAM',
  'CHENNAI',
  'COIMBATORE',
  'MADURAI',
  'TRICHY',
  'SALEM',
  'BENGALURU',
  'HYDERABAD',
  'KOLKATA',
  'MUMBAI',
];

/**
 * The eight retail houses. `storeId` is preserved from the previous seed so
 * existing orders/inventory still resolve.
 */
const STORES = [
  {
    storeId: 'STORE001',
    name: 'Sri Kanchi Silks',
    owner: 'R. Meenakshi',
    username: 'shopkeeper_001',
    gstin: '33AABCS1429B1Z2',
    phone: '+91 98765 43210',
    area: 'Gandhi Nagar',
    pincode: '631501',
    established: 1994,
    planCode: 'enterprise',
    employees: 24,
  },
  {
    storeId: 'STORE002',
    name: 'Kumaran Textiles',
    owner: 'K. Ramanathan',
    username: 'shopkeeper_002',
    gstin: '33AAGCK8817Q1ZP',
    phone: '+91 98401 55672',
    area: 'Kumaran Street',
    pincode: '631502',
    established: 1987,
    planCode: 'growth',
    employees: 16,
  },
  {
    storeId: 'STORE003',
    name: 'Annam Silks & Sarees',
    owner: 'A. Sridevi',
    username: 'shopkeeper_003',
    gstin: '33AACCA2456L1ZK',
    phone: '+91 97821 33094',
    area: 'Ekkatuthangal',
    pincode: '631501',
    established: 2001,
    planCode: 'growth',
    employees: 12,
  },
  {
    storeId: 'STORE004',
    name: 'Padmavathy Handloom',
    owner: 'P. Venkatesh',
    username: 'shopkeeper_004',
    gstin: '33AAECP7734M1ZQ',
    phone: '+91 99407 81233',
    area: 'Kailasanathar Koil Street',
    pincode: '631502',
    established: 1976,
    planCode: 'enterprise',
    employees: 31,
  },
  {
    storeId: 'STORE005',
    name: 'Gowri Saree Emporium',
    owner: 'G. Lakshmi',
    username: 'shopkeeper_005',
    gstin: '33AADCG3390R1Z8',
    phone: '+91 96777 12045',
    area: 'Thandurai',
    pincode: '631503',
    established: 1999,
    planCode: 'starter',
    employees: 7,
  },
  {
    storeId: 'STORE006',
    name: 'Lakshmi Mills Outlet',
    owner: 'L. Narayanan',
    username: 'shopkeeper_006',
    gstin: '33AAECL6621T1ZN',
    phone: '+91 98422 67803',
    area: 'Nachi Keerai',
    pincode: '631503',
    established: 2005,
    planCode: 'starter',
    employees: 5,
  },
  {
    storeId: 'STORE007',
    name: 'Vasanthi Weaves',
    owner: 'V. Kavitha',
    username: 'shopkeeper_007',
    gstin: '33ABFCV1187N1ZW',
    phone: '+91 90031 44526',
    area: 'Oththaipatti',
    pincode: '631505',
    established: 2010,
    planCode: 'free',
    employees: 3,
  },
  {
    storeId: 'STORE008',
    name: 'Kovil Fashion House',
    owner: 'S. Balaji',
    username: 'shopkeeper_008',
    gstin: '33AAGCS9044W1ZE',
    phone: '+91 93802 77190',
    area: 'Jeppettai',
    pincode: '631504',
    established: 2008,
    planCode: 'growth',
    employees: 14,
  },
];

/**
 * Silk saree catalogue. `sku` is preserved from the previous seed; the five
 * core SKUs carry the bulk of volume and further lines are catalogue-only
 * until a future order references them.
 *
 * cost = what the house pays the weaver cooperative; price = retail.
 */
const PRODUCTS = [
  {
    sku: 'SKU001',
    name: 'Kanjivaram Pure Mulberry Silk Saree',
    category: 'silk_saree',
    weave: 'korvai',
    cost: 4200,
    price: 9850,
    unit: 'piece',
  },
  {
    sku: 'SKU002',
    name: 'Tussar Silk Saree with Zari Border',
    category: 'silk_saree',
    weave: 'tussar',
    cost: 1850,
    price: 4600,
    unit: 'piece',
  },
  {
    sku: 'SKU003',
    name: 'Soft Cotton Saree (Kanchi Cotton)',
    category: 'cotton_saree',
    weave: 'jamdani',
    cost: 620,
    price: 1650,
    unit: 'piece',
  },
  {
    sku: 'SKU004',
    name: 'Bridal Kanjivaram with Temple Border',
    category: 'bridal',
    weave: 'korvai',
    cost: 11800,
    price: 27500,
    unit: 'piece',
  },
  {
    sku: 'SKU005',
    name: 'Silk Dupatta with Contrast Border',
    category: 'silk_dupatta',
    weave: 'kanji',
    cost: 980,
    price: 2450,
    unit: 'piece',
  },
  // Catalogue expansion.
  { sku: 'SKU006', name: 'Mysore Silk Frock (3 pcs)', category: 'readywear', weave: 'mysore', cost: 890, price: 2100, unit: 'set' },
  { sku: 'SKU007', name: 'Men Handloom Shirt', category: 'menswear', weave: 'dobby', cost: 740, price: 1850, unit: 'piece' },
  { sku: 'SKU008', name: 'Silk Kurta Set', category: 'readywear', weave: 'organza', cost: 1120, price: 2750, unit: 'set' },
  { sku: 'SKU009', name: 'Zari Thread Cone (Gold)', category: 'consumable', weave: 'zari', cost: 310, price: 620, unit: 'cone' },
  { sku: 'SKU010', name: 'Kanchipuram Blouse Fabric (2 m)', category: 'fabric', weave: 'kanji', cost: 540, price: 1350, unit: 'meter' },
];

/** Wholesalers who buy in bulk from the weaving clusters. */
const WHOLESALERS = [
  { username: 'wholesaler_001', shop: 'Chennai Silks Depot', owner: 'M. Balaji', gstin: '33AAACM5522H1ZN', phone: '+91 98401 22774', base: 'CHENNAI' },
  { username: 'wholesaler_002', shop: 'Coimbatore Textile Mart', owner: 'S. Prabha', gstin: '33AACCS7788J1ZK', phone: '+91 94422 91038', base: 'COIMBATORE' },
  { username: 'wholesaler_003', shop: 'Madurai Handloom Agency', owner: 'K. Alagarswamy', gstin: '33AABCK1907P1ZF', phone: '+91 93844 66321', base: 'MADURAI' },
  { username: 'wholesaler_004', shop: 'Trichy Silk Traders', owner: 'R. Anitha', gstin: '33AAACR3345M1ZQ', phone: '+91 97906 55420', base: 'TRICHY' },
  { username: 'wholesaler_005', shop: 'Salem Fashion Wholesale', owner: 'T. Durairaj', gstin: '33AADCT6612L1ZN', phone: '+91 96779 88306', base: 'SALEM' },
];

/** Transporters running Kanchipuram → metro-warehouse lanes. */
const TRANSPORTERS = [
  { username: 'transporter_001', name: 'Kanchi Roadways', owner: 'N. Sekhar', vehicle: 'Container 14ft', phone: '+91 98405 11742', capacity: 120 },
  { username: 'transporter_002', name: 'Sri Andal Transport', owner: 'A. Mohana', vehicle: 'Container 20ft', phone: '+91 90033 22618', capacity: 220 },
  { username: 'transporter_003', name: 'Velan Logistics', owner: 'V. Senthil', vehicle: 'Open Body 10ft', phone: '+91 93821 77459', capacity: 90 },
  { username: 'transporter_004', name: 'Meenakshi Carriers', owner: 'M. Ravi', vehicle: 'Container 20ft', phone: '+91 98431 90883', capacity: 200 },
  { username: 'transporter_005', name: 'Kaveri Freight Lines', owner: 'K. Sivaraj', vehicle: 'Open Body 14ft', phone: '+91 94440 33217', capacity: 140 },
  { username: 'transporter_006', name: 'Ganga Express Transport', owner: 'G. Srinivasan', vehicle: 'Container 20ft', phone: '+91 96777 11504', capacity: 210 },
  { username: 'transporter_007', name: 'Sriranga Road Carrier', owner: 'S. Hariharan', vehicle: 'Open Body 10ft', phone: '+91 93855 66230', capacity: 85 },
  { username: 'transporter_008', name: 'Thamarai Logistics', owner: 'T. Umashankar', vehicle: 'Container 14ft', phone: '+91 90087 44321', capacity: 130 },
];

/**
 * SaaS plan catalogue. `takeRateBps` is commission on GMV in basis points.
 * Prices are monthly INR per retail house.
 */
const PLANS = [
  {
    code: 'free',
    name: 'Starter',
    monthlyPrice: 0,
    takeRateBps: 100,
    maxStores: 1,
    description: 'Single outlet, 1 user, basic order tracking.',
  },
  {
    code: 'starter',
    name: 'Growth',
    monthlyPrice: 2499,
    takeRateBps: 150,
    maxStores: 1,
    description: 'Up to 5 users, inventory + shipment tracking, email support.',
  },
  {
    code: 'growth',
    name: 'Business',
    monthlyPrice: 7999,
    takeRateBps: 200,
    maxStores: 3,
    description: 'Multi-outlet, AI demand forecasting, priority support.',
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: 19999,
    takeRateBps: 250,
    maxStores: 10,
    description: 'Unlimited SKUs, dedicated success manager, SLA + API access.',
  },
];

const PLAN_BY_CODE = Object.fromEntries(PLANS.map((p) => [p.code, p]));
const STORE_BY_ID = Object.fromEntries(STORES.map((s) => [s.storeId, s]));
const PRODUCT_BY_SKU = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p]));

module.exports = {
  REGION,
  LOCATIONS,
  STORES,
  PRODUCTS,
  WHOLESALERS,
  TRANSPORTERS,
  PLANS,
  PLAN_BY_CODE,
  STORE_BY_ID,
  PRODUCT_BY_SKU,
};
