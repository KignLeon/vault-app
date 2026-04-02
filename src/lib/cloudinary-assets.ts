// ================================================
// GASCLUB247 — Cloudinary Asset Registry
// Maps all Website Pictures assets to products
// ================================================

const CLOUD = "ddnhp0hzd";

/**
 * Build an optimized Cloudinary URL.
 * @param publicId  The Cloudinary public_id (no extension)
 * @param opts      width, height, crop, gravity, etc.
 */
export function cdnUrl(
  publicId: string,
  opts: {
    w?: number;
    h?: number;
    crop?: "fill" | "fit" | "limit" | "thumb" | "scale";
    gravity?: "auto" | "face" | "center";
    aspect?: string;
    quality?: string;
  } = {}
): string {
  const transforms: string[] = ["f_auto", opts.quality || "q_auto"];

  if (opts.w) transforms.push(`w_${opts.w}`);
  if (opts.h) transforms.push(`h_${opts.h}`);
  if (opts.crop) transforms.push(`c_${opts.crop}`);
  if (opts.gravity) transforms.push(`g_${opts.gravity}`);
  if (opts.aspect) transforms.push(`ar_${opts.aspect}`);

  return `https://res.cloudinary.com/${CLOUD}/image/upload/${transforms.join(",")}/${publicId}`;
}

/** Quick helper: optimized product card image (800px square) */
export function productCardUrl(publicId: string): string {
  return cdnUrl(publicId, { w: 800, h: 800, crop: "fill", gravity: "auto" });
}

/** Quick helper: product thumbnail for ticker (100px square) */
export function thumbnailUrl(publicId: string): string {
  return cdnUrl(publicId, { w: 100, h: 100, crop: "fill", gravity: "auto" });
}

/** Quick helper: hero banner image (1200px wide, 16:9) */
export function heroUrl(publicId: string): string {
  return cdnUrl(publicId, { w: 1200, crop: "fill", aspect: "16:9", gravity: "auto" });
}

/** Quick helper: detail modal image (full quality, scaled to 1200px) */
export function detailUrl(publicId: string): string {
  return cdnUrl(publicId, { w: 1200, crop: "limit" });
}

// ================================================
// PRODUCT IMAGE MAP
// Maps product names to their Cloudinary public_ids
// from the gasclub247/Website Pictures folder
// ================================================

export interface ProductImages {
  /** Primary image (best square/portrait for card display) */
  primary: string;
  /** All available angles/variants */
  gallery: string[];
}

/**
 * Product image registry.
 * Key = product name (UPPERCASE, matches data.ts)
 * Uses the new Website Pictures assets with multiple angles.
 */
export const PRODUCT_IMAGES: Record<string, ProductImages> = {
  // ══════════════════════════════════════════════════
  // GREENHOUSE / NAMED PRODUCTS (with branded photos)
  // ══════════════════════════════════════════════════

  "67 RUNTZ": {
    primary: "67RUNTZ3_edra03",       // square JPG — best for cards
    gallery: [
      "67RUNTZ3_edra03",              // square
      "67RUNTZ_riecz7",               // portrait
      "67RUNTZ_1_menraz",             // portrait alt angle
      "67RUNTZ_nvrxlj",              // portrait
      "67RUNTZ_1_jz34kj",            // portrait
    ],
  },

  "CANDY RUNTZ": {
    primary: "CANDYRUNTZ3_i5jddr",    // square JPG
    gallery: [
      "CANDYRUNTZ3_i5jddr",
      "CANDYRUNTZ_snwvim",
      "CANDYRUNTZ2_mue15g",
      "CANDYRUNTZ_br8yay",
      "CANDYRUNTZ2_hrp1ko",
    ],
  },

  "GALACTIC GUMMIES": {
    primary: "GALACTICGUMMIES3_kyqvnd", // square JPG
    gallery: [
      "GALACTICGUMMIES3_kyqvnd",
      "GALACITCGUMMIES_he0qpk",
      "GALACTICGUMMIES2_jykslc",
      "GALACITCGUMMIES_pcqg4h",
      "GALACTICGUMMIES2_hvnzsd",
    ],
  },

  "GUMBO": {
    primary: "GUMBO3_pawehp",         // square JPG
    gallery: [
      "GUMBO3_pawehp",
      "GUMBO_govxwj",
      "GUMBO2_wbmsdl",
      "GUMBO_i7fb83",
      "GUMBO2_ll1ahv",
    ],
  },

  "WHITE GUMMIES": {
    primary: "WHITEGUMMIES3_vynwz6",  // square JPG
    gallery: [
      "WHITEGUMMIES3_vynwz6",
      "WHITEGUMMIES_apca2k",
      "WHITEGUMMIES2_jo2d2s",
    ],
  },

  "ZALATO": {
    primary: "ZALATO3_zvfpqw",        // square JPG
    gallery: [
      "ZALATO3_zvfpqw",
      "ZALATO_cce8n5",
      "ZALATO2_oj7vfz",
    ],
  },

  // ══════════════════════════════════════════════════
  // INDOOR PRODUCTS (named assets)
  // ══════════════════════════════════════════════════

  "BLUE JAM": {
    primary: "BLUEJAM3_ny9zbd",       // square JPG
    gallery: [
      "BLUEJAM3_ny9zbd",
      "BLUEJAM_elmyhf",
      "BLUEJAM2_uumc45",
      "BLUEJAM_v6em1m",
      "BLUEJAM2_eckqlc",
      "BLUEJAM_qwdfo9",
      "BLUEJAM2_bpiiec",
      "BLUEJAM_u7nkni",
      "BLUEJAM2_eg0muo",
    ],
  },

  "LEMON BERRY GELATO": {
    primary: "LEMONBERRYGELATO3_hd5aed", // square JPG
    gallery: [
      "LEMONBERRYGELATO3_hd5aed",
      "LEMONBERRYGELATO_gdnpj6",
      "LEMONBERRYGELATO2_bwbbok",
      "LEMONBERRYGELATO_mk2t1s",
      "LEMONBERRYGELATO2_gxrz9e",
    ],
  },

  "RAINBOW BELTS": {
    primary: "RAINBOWBELTS3_mqv2i7",  // square JPG
    gallery: [
      "RAINBOWBELTS3_mqv2i7",
      "RAINBOWBELTS_bhuja2",
      "RAINBOWBELTS2_wnlo1y",
      "RAINBOWBELTS_inodbv",
      "RAINBOWBELTS2_wvjuob",
    ],
  },

  // ══════════════════════════════════════════════════
  // PRE-ROLLS (HEIC — Cloudinary f_auto converts them)
  // ══════════════════════════════════════════════════

  "WARHEADZ PRE-ROLL": {
    primary: "Warheadz_Preroll_xndl7l",
    gallery: ["Warheadz_Preroll_xndl7l", "Warheadz_Preroll_nhmzus"],
  },
  "SUPREME LATTO PRE-ROLL": {
    primary: "Supreme_Latto_Pre_Roll_mivpuc",
    gallery: ["Supreme_Latto_Pre_Roll_mivpuc", "Supreme_Latto_Pre_Roll_nfegvm"],
  },
  "PINK PANTHER PRE-ROLL": {
    primary: "Pink_Panther_Preroll_vbago1",
    gallery: ["Pink_Panther_Preroll_vbago1", "Pink_Panther_Preroll_osvswa"],
  },
  "LEMON DIOR RUNTZ PRE-ROLL": {
    primary: "LemondiorRuntz_Pre_roll_cqnguo",
    gallery: ["LemondiorRuntz_Pre_roll_cqnguo", "LemondiorRuntz_Pre_roll_ovhtxt"],
  },
  "BERRY POP PRE-ROLL": {
    primary: "Berry_Pop_Pre_roll_joeiea",
    gallery: ["Berry_Pop_Pre_roll_joeiea", "Berry_Pop_Pre_roll_fotkpv"],
  },

  // ══════════════════════════════════════════════════
  // PRODUCTS WITH PREROLL IMAGES (flower versions)
  // Use preroll photos as secondary; primary from IMG_ series
  // ══════════════════════════════════════════════════

  "WARHEADZ": {
    primary: "Warheadz_Preroll_xndl7l",
    gallery: ["Warheadz_Preroll_xndl7l", "Warheadz_Preroll_nhmzus"],
  },
  "SUPREME LATTO": {
    primary: "Supreme_Latto_Pre_Roll_mivpuc",
    gallery: ["Supreme_Latto_Pre_Roll_mivpuc", "Supreme_Latto_Pre_Roll_nfegvm"],
  },
  "PINK PANTHER": {
    primary: "Pink_Panther_Preroll_vbago1",
    gallery: ["Pink_Panther_Preroll_vbago1", "Pink_Panther_Preroll_osvswa"],
  },
  "LEMON DIOR RUNTZ": {
    primary: "LemondiorRuntz_Pre_roll_cqnguo",
    gallery: ["LemondiorRuntz_Pre_roll_cqnguo", "LemondiorRuntz_Pre_roll_ovhtxt"],
  },
  "BERRY POP": {
    primary: "Berry_Pop_Pre_roll_joeiea",
    gallery: ["Berry_Pop_Pre_roll_joeiea", "Berry_Pop_Pre_roll_fotkpv"],
  },

  // ══════════════════════════════════════════════════
  // FEATURED / HERO PRODUCTS (from named + IMG_ series)
  // Using best IMG_ lifestyle shots for products without
  // dedicated named assets
  // ══════════════════════════════════════════════════

  "PLATINUM LEMON CHERRY": {
    primary: "IMG_2506_iyhfil",     // premium indoor shot
    gallery: ["IMG_2506_iyhfil", "IMG_2506_1_dctbw9", "IMG_2507_wiqsbl", "IMG_2508_qxghdk"],
  },

  "UNCLE SNOOP": {
    primary: "IMG_2514_gg5ru4",
    gallery: ["IMG_2514_gg5ru4", "IMG_2514_1_vdmams", "IMG_2515_kzly6h"],
  },

  "BLACK RUNTZ": {
    primary: "IMG_2523_kkl9c4",
    gallery: ["IMG_2523_kkl9c4", "IMG_2523_1_kmegcv", "IMG_2524_kz8tei"],
  },

  "BLUE NERDS": {
    primary: "IMG_2525_ua1h4h",
    gallery: ["IMG_2525_ua1h4h", "IMG_2526_ufvdtq"],
  },

  "WEDDING CAKE": {
    primary: "IMG_2529_gxtshu",
    gallery: ["IMG_2529_gxtshu", "IMG_2530_msr84y", "IMG_2530_1_bx2c9b"],
  },

  "CURELATO": {
    primary: "IMG_2531_igmur9",
    gallery: ["IMG_2531_igmur9", "IMG_2532_euxzy6"],
  },

  "DIVORCE CAKE": {
    primary: "IMG_2537_eds0wr",
    gallery: ["IMG_2537_eds0wr", "IMG_2538_rvqjms"],
  },

  "TRUMP RUNTZ": {
    primary: "IMG_2538_1_uc5yfx",
    gallery: ["IMG_2538_1_uc5yfx", "IMG_2539_fgzw5i"],
  },

  "BISCANTE": {
    primary: "IMG_2540_vznm8g",
    gallery: ["IMG_2540_vznm8g", "IMG_2541_wdfb1a"],
  },

  "ITALIAN ICE": {
    primary: "IMG_2544_tgabne",
    gallery: ["IMG_2544_tgabne", "IMG_2545_o3kotr"],
  },

  "VENOM GAS": {
    primary: "IMG_2545_1_uaypki",
    gallery: ["IMG_2545_1_uaypki", "IMG_2546_emoynr"],
  },

  "SKITTLES": {
    primary: "IMG_2547_dc3swv",
    gallery: ["IMG_2547_dc3swv", "IMG_2548_rhuxrj"],
  },

  "DOUBLE STUFF OREOS": {
    primary: "IMG_2480_ntsiib",
    gallery: ["IMG_2480_ntsiib", "IMG_2482_mdbkpv"],
  },

  "CEREAL MILK": {
    primary: "IMG_2482_1_gyhhno",
    gallery: ["IMG_2482_1_gyhhno", "IMG_2483_i1mksx"],
  },

  "GELATO 34": {
    primary: "IMG_2484_zibeqi",
    gallery: ["IMG_2484_zibeqi", "IMG_2485_mzinve"],
  },

  "COTTON CANDY": {
    primary: "IMG_2491_sjyjjy",
    gallery: ["IMG_2491_sjyjjy", "IMG_2492_lqgpyk"],
  },

  "PINK STARBURST": {
    primary: "IMG_2492_1_zabdnw",
    gallery: ["IMG_2492_1_zabdnw", "IMG_2493_tom7f4"],
  },

  "STRAWBERRY GELATO": {
    primary: "IMG_2494_owgn8b",
    gallery: ["IMG_2494_owgn8b", "IMG_2495_sxcqmv"],
  },

  "MANGO MINTZ": {
    primary: "IMG_2498_s2hv71",
    gallery: ["IMG_2498_s2hv71", "IMG_2499_yqoake"],
  },

  "GG4 (GORILLA GLUE #4)": {
    primary: "IMG_2499_1_xhxlxc",
    gallery: ["IMG_2499_1_xhxlxc", "IMG_2500_vgtadf"],
  },

  "MOTOR BREATH": {
    primary: "IMG_2501_bqicig",
    gallery: ["IMG_2501_bqicig", "IMG_2502_ocvp7d"],
  },

  "GAS FACE": {
    primary: "IMG_2505_xvsriu",
    gallery: ["IMG_2505_xvsriu"],
  },

  "JET FUEL GELATO": {
    primary: "IMG_2241_gtffey",
    gallery: ["IMG_2241_gtffey", "IMG_2242_ynt8uf"],
  },

  "OG KRYPTONITE": {
    primary: "IMG_2243_n7rfl5",
    gallery: ["IMG_2243_n7rfl5", "IMG_2248_tew6va"],
  },

  "LEMON CHERRY GELATO": {
    primary: "IMG_2249_po8fq9",
    gallery: ["IMG_2249_po8fq9", "IMG_2249_1_evvagp", "IMG_2251_gvlnfp"],
  },

  "ICE CREAM CAKE": {
    primary: "IMG_2252_vhloqn",
    gallery: ["IMG_2252_vhloqn", "IMG_2253_yqrsqb"],
  },

  "SNOW CAPS": {
    primary: "IMG_2255_sa1hnc",
    gallery: ["IMG_2255_sa1hnc", "IMG_2256_gjx4jq"],
  },

  // EXOTIC SMALLS
  "RAINBOW KANDY": {
    primary: "IMG_2258_cdfxup",
    gallery: ["IMG_2258_cdfxup", "IMG_2259_d6xecz"],
  },

  "GASTOPIA": {
    primary: "IMG_2260_jaakqk",
    gallery: ["IMG_2260_jaakqk"],
  },

  "LCG 85": {
    primary: "IMG_2383_h2aohr",
    gallery: ["IMG_2383_h2aohr", "IMG_2385_wfrdyj"],
  },

  "CANDY DROP": {
    primary: "IMG_2385_1_qdroon",
    gallery: ["IMG_2385_1_qdroon", "IMG_2387_tfjl5i"],
  },

  "ZALATO SMALLS": {
    primary: "IMG_2388_oobdut",
    gallery: ["IMG_2388_oobdut", "IMG_2389_fr9n3z"],
  },

  "BLUE JAM SMALLS": {
    primary: "IMG_2393_jzuj1q",
    gallery: ["IMG_2393_jzuj1q", "IMG_2394_qbwert"],
  },

  // PREMIUM LINE
  "MONCLER RUNTZ": {
    primary: "IMG_2394_1_gpdh3j",
    gallery: ["IMG_2394_1_gpdh3j", "IMG_2396_l9noir"],
  },

  "VERSACE": {
    primary: "IMG_2397_lh0swx",
    gallery: ["IMG_2397_lh0swx", "IMG_2398_e4ypyr"],
  },

  "PURPLE NERDS": {
    primary: "IMG_2401_dg0afa",
    gallery: ["IMG_2401_dg0afa", "IMG_2401_1_hfepmi"],
  },

  "LEMON CHERRY SHERBET": {
    primary: "IMG_2403_aseois",
    gallery: ["IMG_2403_aseois", "IMG_2404_nbst5s"],
  },
};

// ══════════════════════════════════════════════════
// HERO / LIFESTYLE IMAGES
// Best scene shots for hero banner, CTA, backgrounds
// ══════════════════════════════════════════════════

export const HERO_IMAGES: string[] = [
  // High-impact lifestyle / product scene shots
  "IMG_2200_ffrtyy",   // square close-up, dramatic
  "IMG_2203_g3r0q3",   // square indoor scene
  "IMG_2237_qbve5r",   // landscape indoor
  "IMG_2197_iektqz",   // landscape wide
  "IMG_2201_xny2to",   // portrait premium
  "IMG_2239_ifqjcq",   // close-up detail
  "RAINBOWBELTS_bhuja2", // named product hero
  "LEMONBERRYGELATO_gdnpj6", // named product hero
];

// ══════════════════════════════════════════════════
// SCENE / LIFESTYLE GALLERY
// For community feed fallbacks, backgrounds, accents
// ══════════════════════════════════════════════════

export const LIFESTYLE_IMAGES: string[] = [
  "IMG_2405_gc2pjz",
  "IMG_2413_lmdazm",
  "IMG_2414_a47bmh",
  "IMG_2416_oqnk7p",
  "IMG_2417_yv7phy",
  "IMG_2418_lsf8qo",
  "IMG_2421_fccidt",
  "IMG_2423_u1v7rl",
  "IMG_2425_klbcla",
  "IMG_2426_od0zjl",
  "IMG_2427_atibsq",
  "IMG_2430_syn4ih",
  "IMG_2431_sebsdf",
  "IMG_2433_sc3hno",
  "IMG_2434_wrnqxu",
  "IMG_2435_jb9f1e",
  "IMG_2445_yif84k",
  "IMG_2446_h9k5df",
  "IMG_2448_khyxwa",
  "IMG_2449_j47xrj",
  "IMG_2450_g2z9ag",
];

/**
 * Get product images (with fallback).
 * Returns the product's registered images or a generated placeholder URL.
 */
export function getProductImages(productName: string): ProductImages {
  const key = productName.toUpperCase();
  const match = PRODUCT_IMAGES[key];
  if (match) return match;

  // Try partial match (for products like "ZALATO SMALLS" matching "ZALATO")
  for (const [name, images] of Object.entries(PRODUCT_IMAGES)) {
    if (key.includes(name) || name.includes(key)) {
      return images;
    }
  }

  // If no match, return empty (UI will show logo placeholder)
  return { primary: "", gallery: [] };
}

/**
 * Get a Cloudinary-optimized product card URL from product name.
 */
export function getProductCardImage(productName: string): string {
  const images = getProductImages(productName);
  if (!images.primary) return "";
  return productCardUrl(images.primary);
}

/**
 * Get all gallery URLs for a product (detail modal).
 */
export function getProductGalleryImages(productName: string): string[] {
  const images = getProductImages(productName);
  if (images.gallery.length === 0) return [];
  return images.gallery.map((id) => detailUrl(id));
}
