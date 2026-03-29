"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AppLanguage = "en" | "ar";

type TranslationValue = string | ((params?: Record<string, string | number>) => string);

const LANGUAGE_STORAGE_KEY = "arcetis_language";

const translations = {
  en: {
    navHome: "Home",
    navTasks: "Tasks",
    navSpin: "Spin",
    navRewards: "Products",
    navReferrals: "Referrals",
    menuDashboard: "Dashboard",
    menuProfile: "Profile",
    menuRequests: "My orders",
    menuLogout: "Logout",
    menuPoints: "Points",
    menuXp: "XP",
    menuStreak: "Streak",
    rewardsTitle: "Products",
    rewardsSubtitle: "Compare product plans, get items with points, or open DT buying instructions",
    rewardCooldown: "1 product request every 48h",
    balance: "Balance",
    level: "Level",
    searchProducts: "Search products by name or description",
    nextAffordableProduct: "Next product to unlock",
    viewTarget: "View product",
    from: "From",
    plans: "Plans",
    productsUnavailable: "No products are available right now.",
    results: (params) => `${params?.count ?? 0} result${params?.count === 1 ? "" : "s"}`,
    pageOf: (params) => `Page ${params?.page ?? 1} / ${params?.total ?? 1}`,
    startingAtPoints: (params) => `From ${params?.points ?? 0} points`,
    minimumLevel: (params) => `Level ${params?.level ?? 1}+`,
    accountAgeDays: (params) => `${params?.days ?? 0} day account age`,
    infoFields: (params) => `${params?.count ?? 0} info field${params?.count === 1 ? "" : "s"}`,
    getProduct: "Get product",
    unavailableDt: "DT unavailable",
    buyWithDt: "Buy with DT",
    choosePlan: "Choose plan",
    informationNeeded: "Information needed after purchase",
    fillExactInfo: "Fill the exact delivery info for this selected plan.",
    description: "Description",
    backToProducts: "Back to products",
    rewardDetailsFallback: "Product details",
    rewardDetailsSubtitle: "Choose a plan, fill the required info, and request your product with points or buy in DT",
    outOfStock: "Out of stock",
    remaining: "Remaining",
    makeSureInfoMatches: "Make sure your points, level, and required info all match this plan before continuing.",
    deliveryInputs: "Needed info",
    sensitiveInfoStored: "Sensitive info is stored securely and can be removed automatically after review.",
    requestCreated: "Order created",
    requestPageReady: "Your product request page is ready.",
    requestFailed: "Could not create your order",
    requestHistoryTitle: "My orders",
    requestHistorySubtitle: "Check your order status, reopen details, and recover your Instagram code any time.",
    browseProducts: "Browse products",
    searchRequests: "Search by product name, plan, or code",
    all: "All",
    pending: "Pending",
    delivered: "Delivered",
    refunded: "Refunded",
    expired: "Expired",
    waitingForDelivery: "Waiting for delivery",
    rejectedRefunded: "Rejected + refunded",
    expiredRefunded: "Expired + refunded",
    requestCode: "Request code",
    codeCopied: "Code copied",
    pointsSpent: "Points spent",
    openDetails: "Open details",
    noRequestsMatch: "No orders match the current filters.",
    requestHistoryUnavailable: "Your order history is not available right now.",
    requestDetailsFallback: "Order details",
    requestDetailsSubtitle: "Use this page to copy your code, follow the Instagram steps, and track your order status.",
    backToRequests: "Back to orders",
    whatToDo: "What to do",
    followSteps: "Follow these steps so the team can find your order quickly.",
    stepCopyCode: "1. Copy your order code",
    stepCopyCodeHint: "Use the code shown on the right side of this page.",
    stepSendCode: "2. Send only the code on Instagram",
    stepSendCodeHint: "Send it to the official Arcetis Instagram account so the team can open your order quickly.",
    warningKeepCodeSafe: "Do not give this code to anyone except the official Arcetis Instagram account.",
    stepWait: "3. Wait for the app notification",
    stepWaitHint: "If your product is delivered, you will be notified here. If the order is rejected or expires, your points are refunded automatically.",
    submittedInfo: "Your submitted info",
    submittedInfoHint: "This is what the team will see after opening your code.",
    yourCode: "Your code",
    yourCodeHint: "Copy this and send it to Arcetis on Instagram.",
    copied: "Copied",
    copyCode: "Copy code",
    openInstagram: "Open Instagram",
    status: "Status",
    created: "Created",
    processed: "Processed",
    requestNotFound: "Order not found or no longer available.",
    confirmRequest: "Confirm order",
    spendPointsForProduct: "Spend points for this product?",
    plan: "Plan",
    confirmSpendWarning: "This creates your order and deducts the points now. If the team rejects it later, your refund happens automatically.",
    noCancel: "No, cancel",
    yesContinue: "Yes, continue",
    processing: "Processing...",
    languageEnglish: "English",
    languageArabic: "Arabic",
    switchLanguage: "Language"
  },
  ar: {
    navHome: "الرئيسية",
    navTasks: "المهام",
    navSpin: "العجلة",
    navRewards: "المنتجات",
    navReferrals: "الإحالات",
    menuDashboard: "لوحة الحساب",
    menuProfile: "الملف الشخصي",
    menuRequests: "طلباتي",
    menuLogout: "تسجيل الخروج",
    menuPoints: "النقاط",
    menuXp: "الخبرة",
    menuStreak: "الاستمرار",
    rewardsTitle: "المنتجات",
    rewardsSubtitle: "قارن بين الخطط، اطلب المنتج بالنقاط، أو افتح تعليمات الشراء بالدينار",
    rewardCooldown: "طلب منتج واحد كل 48 ساعة",
    balance: "الرصيد",
    level: "المستوى",
    searchProducts: "ابحث عن المنتجات بالاسم أو الوصف",
    nextAffordableProduct: "أقرب منتج يمكنك الحصول عليه",
    viewTarget: "عرض المنتج",
    from: "يبدأ من",
    plans: "الخطط",
    productsUnavailable: "لا توجد منتجات متاحة الآن.",
    results: (params) => `${params?.count ?? 0} نتيجة`,
    pageOf: (params) => `الصفحة ${params?.page ?? 1} / ${params?.total ?? 1}`,
    startingAtPoints: (params) => `يبدأ من ${params?.points ?? 0} نقطة`,
    minimumLevel: (params) => `المستوى ${params?.level ?? 1}+`,
    accountAgeDays: (params) => `عمر الحساب ${params?.days ?? 0} يوم`,
    infoFields: (params) => `${params?.count ?? 0} خانة معلومات`,
    getProduct: "احصل على المنتج",
    unavailableDt: "السعر غير متاح",
    buyWithDt: "اشترِ بالدينار",
    choosePlan: "اختر الخطة",
    informationNeeded: "المعلومات المطلوبة بعد الشراء",
    fillExactInfo: "اكتب المعلومات المطلوبة بدقة لهذه الخطة.",
    description: "الوصف",
    backToProducts: "الرجوع إلى المنتجات",
    rewardDetailsFallback: "تفاصيل المنتج",
    rewardDetailsSubtitle: "اختر الخطة، املأ المعلومات المطلوبة، واطلب منتجك بالنقاط أو اشترِه بالدينار",
    outOfStock: "غير متوفر",
    remaining: "المتبقي",
    makeSureInfoMatches: "تأكد أن نقاطك ومستواك والمعلومات المطلوبة كلها مناسبة قبل المتابعة.",
    deliveryInputs: "المعلومات المطلوبة",
    sensitiveInfoStored: "المعلومات الحساسة تُحفظ بشكل آمن ويمكن حذفها تلقائيًا بعد المراجعة.",
    requestCreated: "تم إنشاء الطلب",
    requestPageReady: "صفحة طلب المنتج جاهزة.",
    requestFailed: "تعذر إنشاء الطلب",
    requestHistoryTitle: "طلباتي",
    requestHistorySubtitle: "تابع حالة الطلب، وافتح التفاصيل من جديد، واسترجع كود إنستغرام في أي وقت.",
    browseProducts: "تصفح المنتجات",
    searchRequests: "ابحث باسم المنتج أو الخطة أو الكود",
    all: "الكل",
    pending: "قيد الانتظار",
    delivered: "تم التسليم",
    refunded: "تم الاسترجاع",
    expired: "منتهي",
    waitingForDelivery: "بانتظار التسليم",
    rejectedRefunded: "مرفوض + تم الاسترجاع",
    expiredRefunded: "انتهى + تم الاسترجاع",
    requestCode: "كود الطلب",
    codeCopied: "تم نسخ الكود",
    pointsSpent: "النقاط المصروفة",
    openDetails: "فتح التفاصيل",
    noRequestsMatch: "لا توجد طلبات تطابق الفلاتر الحالية.",
    requestHistoryUnavailable: "سجل الطلبات غير متاح الآن.",
    requestDetailsFallback: "تفاصيل الطلب",
    requestDetailsSubtitle: "استخدم هذه الصفحة لنسخ الكود، واتباع خطوات إنستغرام، ومتابعة حالة الطلب.",
    backToRequests: "الرجوع إلى الطلبات",
    whatToDo: "ماذا تفعل",
    followSteps: "اتبع هذه الخطوات ليصل الفريق إلى طلبك بسرعة.",
    stepCopyCode: "1. انسخ كود الطلب",
    stepCopyCodeHint: "استخدم الكود الظاهر في الجهة اليمنى من هذه الصفحة.",
    stepSendCode: "2. أرسل الكود فقط على إنستغرام",
    stepSendCodeHint: "أرسله إلى حساب Arcetis الرسمي على إنستغرام ليتم فتح طلبك بسرعة.",
    warningKeepCodeSafe: "لا تعطِ هذا الكود لأي شخص غير حساب Arcetis الرسمي على إنستغرام.",
    stepWait: "3. انتظر إشعار التطبيق",
    stepWaitHint: "إذا تم تسليم المنتج ستصلك إشعارات هنا، وإذا رُفض الطلب أو انتهت مدته ستعود نقاطك تلقائيًا.",
    submittedInfo: "المعلومات التي أرسلتها",
    submittedInfoHint: "هذه هي المعلومات التي يراها الفريق بعد فتح الكود.",
    yourCode: "الكود الخاص بك",
    yourCodeHint: "انسخه وأرسله إلى Arcetis على إنستغرام.",
    copied: "تم النسخ",
    copyCode: "نسخ الكود",
    openInstagram: "فتح إنستغرام",
    status: "الحالة",
    created: "تم الإنشاء",
    processed: "تمت المعالجة",
    requestNotFound: "الطلب غير موجود أو لم يعد متاحًا.",
    confirmRequest: "تأكيد الطلب",
    spendPointsForProduct: "هل تريد صرف النقاط لهذا المنتج؟",
    plan: "الخطة",
    confirmSpendWarning: "سيتم إنشاء طلبك وخصم النقاط الآن. إذا رفضه الفريق لاحقًا سيتم رد النقاط تلقائيًا.",
    noCancel: "لا، إلغاء",
    yesContinue: "نعم، متابعة",
    processing: "جارٍ التنفيذ...",
    languageEnglish: "English",
    languageArabic: "العربية",
    switchLanguage: "اللغة"
  }
} satisfies Record<AppLanguage, Record<string, TranslationValue>>;

type LanguageContextValue = {
  language: AppLanguage;
  setLanguage: (language: AppLanguage) => void;
  dir: "ltr" | "rtl";
  t: (key: keyof typeof translations.en, params?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language] = useState<AppLanguage>("en");

  useEffect(() => {
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    return {
      language: "en",
      setLanguage: () => {},
      dir: "ltr",
      t: (key, params) => {
        const entry = translations.en[key];
        return typeof entry === "function" ? entry(params) : entry;
      }
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
