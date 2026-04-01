// ================================================
// GASCLUB247 — Full Product Catalog + Commerce Data
// ================================================

export type StockStatus = "in-stock" | "low-stock" | "sold-out";

export interface BulkTier {
  label: string;
  qty: string;
  price: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: StockStatus;
  image: string;
  images: string[];
  description: string;
  tags: string[];
  featured?: boolean;
  bulk?: BulkTier[];
  viewers?: number;
  recentOrders?: number;
}

export interface Post {
  id: string;
  type: "announcement" | "drop" | "update" | "media" | "review" | "promo";
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  timestamp: string;
  pinned: boolean;
  image?: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "member";
  status: "active" | "pending" | "suspended";
  joinedAt: string;
  avatar: string;
}

export interface OrderRequest {
  id: string;
  memberId: string;
  memberName: string;
  items: { productId: string; sku: string; qty: number; price: number }[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "completed";
  notes: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  text: string;
  name: string;
  role: string;
  avatar: string;
  timestamp?: string;
}

// Bulk pricing template
const standardBulk: BulkTier[] = [
  { label: "QP", qty: "1/4 LB", price: 350 },
  { label: "HP", qty: "1/2 LB", price: 650 },
  { label: "LB", qty: "1 LB", price: 1200 },
];

const premiumBulk: BulkTier[] = [
  { label: "QP", qty: "1/4 LB", price: 400 },
  { label: "HP", qty: "1/2 LB", price: 750 },
  { label: "LB", qty: "1 LB", price: 1400 },
];

function rand(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// ---- PRODUCTS ----
export const products: Product[] = [
  // ⭐ FEATURED / TOP SELLERS
  {
    id: "p1", sku: "TC-PLC-01", name: "PLATINUM LEMON CHERRY", category: "featured",
    price: 120, stock: 42, status: "in-stock", featured: true,
    image: "/products/platinum-cherry-hero.jpg",
    images: ["/products/platinum-cherry-hero.jpg", "/products/platinum-cherry-alt.jpg"],
    description: "Bold cherry-forward indoor flower with premium bag appeal. Dense nugs, rich terpene profile. Our #1 seller.",
    tags: ["indoor", "premium", "cherry", "top-seller"],
    bulk: premiumBulk, viewers: rand(8, 24), recentOrders: rand(2, 6),
  },
  {
    id: "p2", sku: "TC-PP-01", name: "PINK PANTHER", category: "featured",
    price: 110, stock: 6, status: "low-stock", featured: true,
    image: "/products/pink-panther-hero.jpg",
    images: ["/products/pink-panther-hero.jpg", "/products/pink-panther-bag.jpg"],
    description: "Smooth fruity profile, premium boutique drop. Limited batch with standout aroma and clean finish.",
    tags: ["boutique", "fruity", "limited"],
    bulk: standardBulk, viewers: rand(12, 30), recentOrders: rand(3, 8),
  },
  {
    id: "p3", sku: "TC-US-01", name: "UNCLE SNOOP", category: "featured",
    price: 115, stock: 28, status: "in-stock", featured: true,
    image: "/products/uncle-snoop-hero.jpg",
    images: ["/products/uncle-snoop-hero.jpg"],
    description: "Heavy-hitting classic profile with limited batch feel. OG lineage, strong nose, smooth pull.",
    tags: ["classic", "og", "heavy"],
    bulk: standardBulk, viewers: rand(6, 18), recentOrders: rand(1, 5),
  },
  {
    id: "p4", sku: "TC-LDR-01", name: "LEMON DIOR RUNTZ", category: "featured",
    price: 125, stock: 18, status: "in-stock", featured: true,
    image: "", images: [],
    description: "Exotic lemon-forward profile with Runtz genetics. Premium indoor, dense structure, loud nose.",
    tags: ["exotic", "runtz", "lemon"],
    bulk: premiumBulk, viewers: rand(10, 20), recentOrders: rand(2, 7),
  },
  {
    id: "p5", sku: "TC-WH-01", name: "WARHEADZ", category: "featured",
    price: 118, stock: 14, status: "in-stock", featured: true,
    image: "", images: [],
    description: "Sour and pungent gas profile. Heavy hitting, fast onset. Named for the candy-sour terpene punch.",
    tags: ["gas", "sour", "heavy"],
    bulk: standardBulk, viewers: rand(5, 15), recentOrders: rand(1, 4),
  },
  {
    id: "p6", sku: "TC-BR-01", name: "BLACK RUNTZ", category: "featured",
    price: 115, stock: 22, status: "in-stock", featured: true,
    image: "", images: [],
    description: "Dark purple hues with sweet candy finish. Runtz phenotype with deeper, more sedative effects.",
    tags: ["runtz", "purple", "sweet"],
    bulk: standardBulk, viewers: rand(8, 22), recentOrders: rand(2, 5),
  },
  {
    id: "p7", sku: "TC-BN-01", name: "BLUE NERDS", category: "featured",
    price: 112, stock: 30, status: "in-stock", featured: true,
    image: "", images: [],
    description: "Sweet blue candy profile with balanced hybrid effects. Colorful bag appeal, smooth smoke.",
    tags: ["candy", "hybrid", "sweet"],
    bulk: standardBulk, viewers: rand(6, 16), recentOrders: rand(1, 3),
  },
  {
    id: "p8", sku: "TC-WC-01", name: "WEDDING CAKE", category: "featured",
    price: 120, stock: 16, status: "in-stock", featured: true,
    image: "", images: [],
    description: "Rich vanilla and earthy undertones. Dense trichome-coated buds. Premium indoor cultivation.",
    tags: ["premium", "indoor", "vanilla"],
    bulk: premiumBulk, viewers: rand(10, 25), recentOrders: rand(3, 7),
  },

  // 🍭 EXOTIC LINE
  {
    id: "p9", sku: "TC-CL-01", name: "CURELATO", category: "exotic",
    price: 130, stock: 10, status: "low-stock",
    image: "", images: [],
    description: "Gelato cross with enhanced cure. Creamy, gassy, and potent. Small batch exotic.",
    tags: ["gelato", "exotic", "creamy"],
    bulk: premiumBulk, viewers: rand(8, 20), recentOrders: rand(2, 5),
  },
  {
    id: "p10", sku: "TC-DC-01", name: "DIVORCE CAKE", category: "exotic",
    price: 125, stock: 12, status: "in-stock",
    image: "", images: [],
    description: "Wedding Cake x White Widow cross. Heavy indica effects with sweet doughy flavor.",
    tags: ["indica", "cake", "potent"],
    bulk: premiumBulk, viewers: rand(5, 15), recentOrders: rand(1, 4),
  },
  {
    id: "p11", sku: "TC-TR-01", name: "TRUMP RUNTZ", category: "exotic",
    price: 128, stock: 8, status: "low-stock",
    image: "", images: [],
    description: "Loud and unapologetic. Dense nugs with candy-gas profile. Limited exotic batch.",
    tags: ["runtz", "limited", "loud"],
    bulk: premiumBulk, viewers: rand(14, 28), recentOrders: rand(3, 8),
  },
  {
    id: "p12", sku: "TC-SL-01", name: "SUPREME LATTO", category: "exotic",
    price: 130, stock: 9, status: "low-stock",
    image: "", images: [],
    description: "Rare exotic with sweet pastry undertones. Supreme tier flower, hand-trimmed.",
    tags: ["exotic", "rare", "pastry"],
    bulk: premiumBulk, viewers: rand(10, 22), recentOrders: rand(2, 6),
  },
  {
    id: "p13", sku: "TC-BI-01", name: "BISCANTE", category: "exotic",
    price: 135, stock: 7, status: "low-stock",
    image: "", images: [],
    description: "Gelato x Biscotti cross. Sweet, earthy, with a gas finish. Ultra-premium indoor.",
    tags: ["gelato", "biscotti", "indoor"],
    bulk: premiumBulk, viewers: rand(8, 18), recentOrders: rand(2, 4),
  },
  {
    id: "p14", sku: "TC-II-01", name: "ITALIAN ICE", category: "exotic",
    price: 125, stock: 14, status: "in-stock",
    image: "", images: [],
    description: "Cool menthol-sweet profile with fruity exhale. Refreshing smoke, premium cure.",
    tags: ["menthol", "sweet", "fruity"],
    bulk: premiumBulk, viewers: rand(6, 16), recentOrders: rand(1, 3),
  },
  {
    id: "p15", sku: "TC-VG-01", name: "VENOM GAS", category: "exotic",
    price: 122, stock: 20, status: "in-stock",
    image: "", images: [],
    description: "Pure gas. Pungent, loud, aggressive terpene profile. Not for the faint of heart.",
    tags: ["gas", "pungent", "heavy"],
    bulk: standardBulk, viewers: rand(5, 14), recentOrders: rand(1, 3),
  },
  {
    id: "p16", sku: "TC-SK-01", name: "SKITTLES", category: "exotic",
    price: 115, stock: 25, status: "in-stock",
    image: "", images: [],
    description: "Rainbow candy terpenes. Sweet, fruit-forward, and balanced. Fan favorite strain.",
    tags: ["candy", "sweet", "balanced"],
    bulk: standardBulk, viewers: rand(10, 25), recentOrders: rand(3, 7),
  },
  {
    id: "p17", sku: "TC-DSO-01", name: "DOUBLE STUFF OREOS", category: "exotic",
    price: 128, stock: 11, status: "in-stock",
    image: "", images: [],
    description: "Cookies phenotype with doubled-down dough and cream flavor. Dense and frosty.",
    tags: ["cookies", "creamy", "frosty"],
    bulk: premiumBulk, viewers: rand(7, 18), recentOrders: rand(2, 5),
  },
  {
    id: "p18", sku: "TC-CM-01", name: "CEREAL MILK", category: "exotic",
    price: 120, stock: 18, status: "in-stock",
    image: "", images: [],
    description: "Sweet creamy cereal flavor. Cookies Fam genetics. Smooth smoke with uplifting effects.",
    tags: ["cookies", "sweet", "creamy"],
    bulk: standardBulk, viewers: rand(8, 20), recentOrders: rand(2, 6),
  },
  {
    id: "p19", sku: "TC-G34-01", name: "GELATO 34", category: "exotic",
    price: 125, stock: 15, status: "in-stock",
    image: "", images: [],
    description: "Classic Gelato phenotype. Sherbert and Thin Mint cross. Sweet, potent, top-shelf.",
    tags: ["gelato", "classic", "sweet"],
    bulk: premiumBulk, viewers: rand(9, 22), recentOrders: rand(3, 7),
  },

  // 🍬 CANDY / FRUITY
  {
    id: "p20", sku: "TC-CR-01", name: "CANDY RUNTZ", category: "candy",
    price: 112, stock: 22, status: "in-stock",
    image: "", images: [],
    description: "Ultra-sweet candy profile. Runtz genetics with loud colors and sugar-cookie terps.",
    tags: ["candy", "runtz", "sweet"],
    bulk: standardBulk, viewers: rand(6, 16), recentOrders: rand(1, 4),
  },
  {
    id: "p21", sku: "TC-CC-01", name: "COTTON CANDY", category: "candy",
    price: 108, stock: 28, status: "in-stock",
    image: "", images: [],
    description: "Light, airy, sweet smoke. Perfect for daytime. Mellow effects, great flavor.",
    tags: ["sweet", "light", "daytime"],
    bulk: standardBulk, viewers: rand(4, 12), recentOrders: rand(1, 3),
  },
  {
    id: "p22", sku: "TC-BP-01", name: "BERRY POP", category: "candy",
    price: 110, stock: 20, status: "in-stock",
    image: "", images: [],
    description: "Mixed berry terpene explosion. Sweet, tart, fruity. Eye-catching purple hues.",
    tags: ["berry", "fruity", "purple"],
    bulk: standardBulk, viewers: rand(5, 14), recentOrders: rand(1, 3),
  },
  {
    id: "p23", sku: "TC-PS-01", name: "PINK STARBURST", category: "candy",
    price: 115, stock: 16, status: "in-stock",
    image: "", images: [],
    description: "Tastes exactly like the pink candy. Sweet strawberry-citrus with smooth exhale.",
    tags: ["strawberry", "citrus", "sweet"],
    bulk: standardBulk, viewers: rand(8, 20), recentOrders: rand(2, 5),
  },
  {
    id: "p24", sku: "TC-SG-01", name: "STRAWBERRY GELATO", category: "candy",
    price: 118, stock: 14, status: "in-stock",
    image: "", images: [],
    description: "Gelato cross with strawberry phenotype. Creamy, fruity, and potent. Beautiful buds.",
    tags: ["gelato", "strawberry", "creamy"],
    bulk: standardBulk, viewers: rand(6, 15), recentOrders: rand(1, 4),
  },
  {
    id: "p25", sku: "TC-MM-01", name: "MANGO MINTZ", category: "candy",
    price: 116, stock: 18, status: "in-stock",
    image: "", images: [],
    description: "Tropical mango nose with cool minty finish. Refreshing and euphoric.",
    tags: ["tropical", "minty", "fruity"],
    bulk: standardBulk, viewers: rand(5, 12), recentOrders: rand(1, 3),
  },

  // ⛽ GAS / HEAVY HITTERS
  {
    id: "p26", sku: "TC-GG4-01", name: "GG4 (GORILLA GLUE #4)", category: "gas",
    price: 115, stock: 20, status: "in-stock",
    image: "", images: [],
    description: "The original heavy-hitter. Pungent diesel with earthy pine. Locks you to the couch.",
    tags: ["indica", "diesel", "classic"],
    bulk: standardBulk, viewers: rand(10, 25), recentOrders: rand(3, 8),
  },
  {
    id: "p27", sku: "TC-MB-01", name: "MOTOR BREATH", category: "gas",
    price: 120, stock: 12, status: "in-stock",
    image: "", images: [],
    description: "Fuel-forward with garlic undertones. Chemdog lineage. Strong, sedative, for experienced users.",
    tags: ["fuel", "garlic", "heavy"],
    bulk: standardBulk, viewers: rand(7, 18), recentOrders: rand(2, 5),
  },
  {
    id: "p28", sku: "TC-GF-01", name: "GAS FACE", category: "gas",
    price: 118, stock: 15, status: "in-stock",
    image: "", images: [],
    description: "Face Off OG x Cherry Pie x Biscotti. Triple-cross gas monster. Loud and potent.",
    tags: ["gas", "biscotti", "potent"],
    bulk: standardBulk, viewers: rand(6, 14), recentOrders: rand(1, 4),
  },
  {
    id: "p29", sku: "TC-JFG-01", name: "JET FUEL GELATO", category: "gas",
    price: 122, stock: 10, status: "low-stock",
    image: "", images: [],
    description: "Gelato x High Octane. Fuel-forward with sweet gelato finish. Rare cross.",
    tags: ["gelato", "fuel", "rare"],
    bulk: premiumBulk, viewers: rand(12, 28), recentOrders: rand(3, 7),
  },
  {
    id: "p30", sku: "TC-OK-01", name: "OG KRYPTONITE", category: "gas",
    price: 115, stock: 18, status: "in-stock",
    image: "", images: [],
    description: "Pure OG genetics. Earthy, piney, with a knockout punch. West coast classic.",
    tags: ["og", "earthy", "classic"],
    bulk: standardBulk, viewers: rand(5, 15), recentOrders: rand(1, 3),
  },

  // 🧊 PREMIUM / INDOOR
  {
    id: "p31", sku: "TC-LCG-01", name: "LEMON CHERRY GELATO", category: "premium",
    price: 130, stock: 8, status: "low-stock",
    image: "", images: [],
    description: "Top 3 exotics nationwide. Lemon, cherry, and gelato cross. Dense, frosty, ultra-premium.",
    tags: ["exotic", "gelato", "premium"],
    bulk: premiumBulk, viewers: rand(15, 35), recentOrders: rand(4, 10),
  },
  {
    id: "p32", sku: "TC-ICC-01", name: "ICE CREAM CAKE", category: "premium",
    price: 125, stock: 12, status: "in-stock",
    image: "", images: [],
    description: "Wedding Cake x Gelato #33. Rich, creamy, vanilla with doughy sweetness.",
    tags: ["cake", "gelato", "creamy"],
    bulk: premiumBulk, viewers: rand(8, 22), recentOrders: rand(2, 6),
  },
  {
    id: "p33", sku: "TC-SC-01", name: "SNOW CAPS", category: "premium",
    price: 128, stock: 10, status: "in-stock",
    image: "", images: [],
    description: "Frosty white trichomes coat every surface. Minty-sweet with potent hybrid effects.",
    tags: ["frosty", "minty", "hybrid"],
    bulk: premiumBulk, viewers: rand(10, 24), recentOrders: rand(3, 7),
  },
];

// ---- CATEGORIES ----
export const categories = [
  { id: "all", label: "ALL", emoji: "" },
  { id: "featured", label: "TOP SELLERS", emoji: "⭐" },
  { id: "exotic", label: "EXOTIC", emoji: "🍭" },
  { id: "candy", label: "CANDY / FRUITY", emoji: "🍬" },
  { id: "gas", label: "GAS / HEAVY", emoji: "⛽" },
  { id: "premium", label: "PREMIUM", emoji: "🧊" },
];

// ---- SHIPPING ----
export const shippingOptions = [
  { id: "standard", label: "STANDARD SHIPPING", price: 8, est: "5-7 business days" },
  { id: "priority", label: "PRIORITY SHIPPING", price: 15, est: "2-3 business days" },
  { id: "bulk", label: "BULK / SPECIAL HANDLING", price: 25, est: "Contact for ETA" },
];

// ---- POSTS / FEED ----
export const posts: Post[] = [
  {
    id: "post1", type: "drop", pinned: true,
    title: "PLATINUM LEMON CHERRY — NOW LIVE",
    content: "Premium indoor flower loaded into inventory. Bold cherry-forward profile with top-shelf bag appeal. Members-first access, limited quantities.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-24T14:00:00Z",
    image: "/products/platinum-cherry-hero.jpg",
  },
  {
    id: "post2", type: "promo", pinned: true,
    title: "⚡ WEEKEND PROMO ACTIVE",
    content: "Use code PROMO1 for 25% off your first order. One-time use per account. Valid this weekend only.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-24T12:00:00Z",
  },
  {
    id: "post3", type: "drop", pinned: false,
    title: "PINK PANTHER — LOW STOCK",
    content: "Boutique drop running low. 6 units remaining. Smooth fruity profile, grab before it's gone.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-24T10:00:00Z",
    image: "/products/pink-panther-hero.jpg",
  },
  {
    id: "post4", type: "drop", pinned: false,
    title: "UNCLE SNOOP — RESTOCKED",
    content: "Classic profile back in inventory. Heavy-hitting OG lineage. Bulk buyers DM or request through the club.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-23T20:00:00Z",
    image: "/products/uncle-snoop-hero.jpg",
  },
  {
    id: "post5", type: "update", pinned: false,
    title: "OWNER UPDATE — 33 STRAINS LIVE",
    content: "Full catalog loaded. Featured sellers, exotic line, candy profiles, gas strains, premium indoor — all live with bulk pricing. Private inventory. Direct access. No middlemen.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-23T16:00:00Z",
    image: "/products/vault-lifestyle-1.jpg",
  },
  {
    id: "post6", type: "review", pinned: false,
    title: "MEMBER REVIEW — PLATINUM CHERRY",
    content: "\"Just got mine in, smell is crazy. The bag appeal on this one is next level. Already reordering.\"",
    author: "D. CARTER", authorAvatar: "https://randomuser.me/api/portraits/men/67.jpg",
    timestamp: "2026-03-23T12:00:00Z",
  },
  {
    id: "post7", type: "promo", pinned: false,
    title: "BULK BUYERS — QP / HP / LB PRICING",
    content: "Every strain now has bulk tiers. Quarter pound, half pound, full pound. Wholesale pricing built into each product. Submit bulk orders through the club.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-22T18:00:00Z",
    image: "/products/vault-lifestyle-3.jpg",
  },
  {
    id: "post8", type: "review", pinned: false,
    title: "MEMBER REVIEW — PINK PANTHER",
    content: "\"Pink panther was clean, definitely grabbing more. Smooth smoke, great flavor profile.\"",
    author: "K. TANAKA", authorAvatar: "https://randomuser.me/api/portraits/men/12.jpg",
    timestamp: "2026-03-22T14:00:00Z",
  },
  {
    id: "post9", type: "media", pinned: false,
    title: "BEHIND THE PRODUCT",
    content: "Quality control process and packaging walkthrough. Every unit inspected before shipping.",
    author: "GASCLUB247", authorAvatar: "https://randomuser.me/api/portraits/men/32.jpg",
    timestamp: "2026-03-22T10:00:00Z",
    image: "/products/vault-lifestyle-4.jpg",
  },
];

// ---- MEMBERS ----
export const members: Member[] = [
  { id: "m1", name: "Leon Benefield", email: "leon@lovoson.com", role: "owner", status: "active", joinedAt: "2025-01-01", avatar: "https://randomuser.me/api/portraits/men/32.jpg" },
  { id: "m2", name: "Marcus Chen", email: "marcus@vault.co", role: "admin", status: "active", joinedAt: "2025-02-15", avatar: "https://randomuser.me/api/portraits/men/45.jpg" },
  { id: "m3", name: "Aisha Williams", email: "aisha@vault.co", role: "member", status: "active", joinedAt: "2025-03-01", avatar: "https://randomuser.me/api/portraits/women/22.jpg" },
  { id: "m4", name: "Damon Carter", email: "damon@vault.co", role: "member", status: "active", joinedAt: "2025-04-10", avatar: "https://randomuser.me/api/portraits/men/67.jpg" },
  { id: "m5", name: "Nina Rossi", email: "nina@vault.co", role: "member", status: "pending", joinedAt: "2025-05-20", avatar: "https://randomuser.me/api/portraits/women/44.jpg" },
  { id: "m6", name: "Kai Tanaka", email: "kai@vault.co", role: "member", status: "active", joinedAt: "2025-06-08", avatar: "https://randomuser.me/api/portraits/men/12.jpg" },
];

// ---- ORDERS ----
export const orders: OrderRequest[] = [
  { id: "o1", memberId: "m3", memberName: "Aisha Williams", items: [{ productId: "p1", sku: "TC-PLC-01", qty: 2, price: 120 }], total: 240, status: "confirmed", notes: "", createdAt: "2026-03-23T12:00:00Z" },
  { id: "o2", memberId: "m4", memberName: "Damon Carter", items: [{ productId: "p1", sku: "TC-PLC-01", qty: 5, price: 120 }, { productId: "p3", sku: "TC-US-01", qty: 3, price: 115 }], total: 945, status: "pending", notes: "Bulk order for distribution.", createdAt: "2026-03-24T08:00:00Z" },
  { id: "o3", memberId: "m6", memberName: "Kai Tanaka", items: [{ productId: "p2", sku: "TC-PP-01", qty: 1, price: 110 }], total: 110, status: "shipped", notes: "Priority shipping requested.", createdAt: "2026-03-20T15:00:00Z" },
];

// ---- COMMUNITY FEEDBACK ----
export const feedbackData: Feedback[] = [
  { id: "f1", text: "just got mine in, smell is crazy. platinum cherry is top tier.", name: "D. Carter", role: "Verified Buyer", avatar: "https://randomuser.me/api/portraits/men/67.jpg", timestamp: "2h ago" },
  { id: "f2", text: "shipping was quick and product was on point. will be back.", name: "Aisha W.", role: "Member", avatar: "https://randomuser.me/api/portraits/women/22.jpg", timestamp: "5h ago" },
  { id: "f3", text: "pink panther was clean, definitely grabbing more before it sells out.", name: "Kai T.", role: "Member", avatar: "https://randomuser.me/api/portraits/men/12.jpg", timestamp: "Yesterday" },
  { id: "f4", text: "inventory updates make it way easier to keep up with drops. no more guessing.", name: "Marcus C.", role: "Admin", avatar: "https://randomuser.me/api/portraits/men/45.jpg", timestamp: "Yesterday" },
  { id: "f5", text: "this setup is way smoother than dealing with normal storefronts. private and easy.", name: "Nina R.", role: "Member", avatar: "https://randomuser.me/api/portraits/women/44.jpg", timestamp: "2d ago" },
  { id: "f6", text: "uncle snoop hits different. OG profile, strong nose, clean pull every time.", name: "Jay M.", role: "Verified Buyer", avatar: "https://randomuser.me/api/portraits/men/28.jpg", timestamp: "2d ago" },
  { id: "f7", text: "ordered bulk through the vault system and it was seamless. wholesale pricing is competitive.", name: "Priya S.", role: "Verified Buyer", avatar: "https://randomuser.me/api/portraits/women/36.jpg", timestamp: "3d ago" },
  { id: "f8", text: "bag appeal on platinum cherry is insane. dense nugs, perfect cure.", name: "Leon B.", role: "Owner", avatar: "https://randomuser.me/api/portraits/men/32.jpg", timestamp: "3d ago" },
  { id: "f9", text: "never had a bad order through this. consistent quality every time.", name: "Sam K.", role: "Verified Buyer", avatar: "https://randomuser.me/api/portraits/men/55.jpg", timestamp: "4d ago" },
  { id: "f10", text: "the promo code actually worked and saved me a lot. PROMO1 is legit.", name: "T. Jordan", role: "New Member", avatar: "https://randomuser.me/api/portraits/men/71.jpg", timestamp: "4d ago" },
  { id: "f11", text: "got the pink panther last drop. flavor is smooth, burns clean. certified.", name: "Lisa N.", role: "Member", avatar: "https://randomuser.me/api/portraits/women/63.jpg", timestamp: "5d ago" },
  { id: "f12", text: "private access model is the move. no randoms, just quality product and real people.", name: "R. Davis", role: "Verified Buyer", avatar: "https://randomuser.me/api/portraits/men/41.jpg", timestamp: "1w ago" },
];

// ---- PASSKEY ----
export const GASCLUB_PASSKEY = "GASCLUB247";
