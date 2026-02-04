/**
 * Keyword Hyperlinking System
 *
 * Automatically links important financial/economic terms in article content
 * to their relevant topic, industry, or region pages.
 */

// Keyword mappings to internal pages
interface KeywordMapping {
  keywords: string[];
  url: string;
  type: "topic" | "industry" | "region" | "company";
}

// Comprehensive keyword mappings
const keywordMappings: KeywordMapping[] = [
  // Central Banks & Monetary Policy
  {
    keywords: ["SARB", "South African Reserve Bank", "Reserve Bank"],
    url: "/economics/sarb",
    type: "topic",
  },
  {
    keywords: ["CBN", "Central Bank of Nigeria"],
    url: "/economics/cbn",
    type: "topic",
  },
  {
    keywords: ["Federal Reserve", "Fed", "FOMC"],
    url: "/economics/fed",
    type: "topic",
  },
  {
    keywords: ["ECB", "European Central Bank"],
    url: "/economics/ecb",
    type: "topic",
  },
  {
    keywords: ["monetary policy", "interest rate", "repo rate", "policy rate"],
    url: "/topics/central-banks",
    type: "topic",
  },

  // Economic Indicators
  {
    keywords: ["inflation", "CPI", "consumer price index", "price index"],
    url: "/topics/inflation",
    type: "topic",
  },
  {
    keywords: ["GDP", "gross domestic product", "economic growth"],
    url: "/economics/gdp",
    type: "topic",
  },
  {
    keywords: ["unemployment", "employment", "jobless", "jobs data"],
    url: "/economics/employment",
    type: "topic",
  },
  {
    keywords: ["trade balance", "exports", "imports", "trade deficit", "trade surplus"],
    url: "/topics/trade-policy",
    type: "topic",
  },

  // Markets & Trading
  {
    keywords: ["JSE", "Johannesburg Stock Exchange", "JSE All Share"],
    url: "/markets/jse",
    type: "topic",
  },
  {
    keywords: ["NGX", "Nigerian Exchange", "Nigerian Stock Exchange"],
    url: "/markets/ngx",
    type: "topic",
  },
  {
    keywords: ["EGX", "Egyptian Exchange"],
    url: "/markets/egx",
    type: "topic",
  },
  {
    keywords: ["IPO", "initial public offering", "new listing"],
    url: "/topics/ipos",
    type: "topic",
  },
  {
    keywords: ["M&A", "merger", "acquisition", "takeover"],
    url: "/topics/mergers-acquisitions",
    type: "topic",
  },

  // Commodities
  {
    keywords: ["gold price", "gold mining", "gold production"],
    url: "/topics/gold",
    type: "topic",
  },
  {
    keywords: ["platinum", "PGMs", "platinum group metals"],
    url: "/topics/platinum",
    type: "topic",
  },
  {
    keywords: ["oil price", "crude oil", "Brent crude", "WTI"],
    url: "/topics/oil-gas",
    type: "topic",
  },
  {
    keywords: ["copper", "copper price", "copper mining"],
    url: "/topics/copper",
    type: "topic",
  },

  // Technology & Fintech
  {
    keywords: ["fintech", "financial technology", "digital banking"],
    url: "/topics/fintech",
    type: "topic",
  },
  {
    keywords: ["mobile money", "M-Pesa", "mobile payments"],
    url: "/topics/mobile-money",
    type: "topic",
  },
  {
    keywords: ["startup", "venture capital", "funding round", "Series A", "Series B"],
    url: "/topics/startups",
    type: "topic",
  },
  {
    keywords: ["cryptocurrency", "bitcoin", "digital assets", "crypto"],
    url: "/markets/crypto",
    type: "topic",
  },

  // Trade & International
  {
    keywords: ["AfCFTA", "African Continental Free Trade"],
    url: "/topics/afcfta",
    type: "topic",
  },
  {
    keywords: ["FDI", "foreign direct investment", "foreign investment"],
    url: "/topics/foreign-direct-investment",
    type: "topic",
  },

  // Industries
  {
    keywords: ["banking sector", "commercial bank", "retail banking"],
    url: "/industries/banking",
    type: "industry",
  },
  {
    keywords: ["mining sector", "mining industry", "mineral extraction"],
    url: "/industries/mining",
    type: "industry",
  },
  {
    keywords: ["tech sector", "technology sector", "tech industry"],
    url: "/industries/technology",
    type: "industry",
  },
  {
    keywords: ["agriculture sector", "agribusiness", "farming"],
    url: "/industries/agriculture",
    type: "industry",
  },
  {
    keywords: ["infrastructure", "construction sector", "real estate sector"],
    url: "/industries/infrastructure",
    type: "industry",
  },

  // Sustainability
  {
    keywords: ["ESG", "environmental social governance", "sustainable investing"],
    url: "/topics/esg",
    type: "topic",
  },
  {
    keywords: ["green finance", "climate finance", "sustainable finance"],
    url: "/topics/green-finance",
    type: "topic",
  },
  {
    keywords: ["renewable energy", "solar", "wind power", "clean energy"],
    url: "/topics/renewables",
    type: "topic",
  },

  // Regions
  {
    keywords: ["South Africa", "South African economy"],
    url: "/regions/southern-africa",
    type: "region",
  },
  {
    keywords: ["Nigeria", "Nigerian economy", "Lagos"],
    url: "/regions/west-africa",
    type: "region",
  },
  {
    keywords: ["Kenya", "Kenyan economy", "Nairobi"],
    url: "/regions/east-africa",
    type: "region",
  },
  {
    keywords: ["Egypt", "Egyptian economy", "Cairo"],
    url: "/regions/north-africa",
    type: "region",
  },
];

// Sort mappings by keyword length (longest first) to avoid partial matches
const sortedMappings = keywordMappings.map((mapping) => ({
  ...mapping,
  keywords: [...mapping.keywords].sort((a, b) => b.length - a.length),
}));

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Process text content and add hyperlinks to keywords
 * Returns HTML string with links added
 *
 * @param content - The text content to process
 * @param maxLinksPerKeyword - Maximum times to link the same keyword (default: 1)
 */
export function addKeywordLinks(
  content: string,
  maxLinksPerKeyword: number = 1
): string {
  if (!content) return content;

  // Track which keywords we've already linked
  const linkedKeywords = new Map<string, number>();

  let result = content;

  // Process each mapping
  for (const mapping of sortedMappings) {
    for (const keyword of mapping.keywords) {
      const normalizedKeyword = keyword.toLowerCase();

      // Check if we've already linked this keyword enough times
      const linkCount = linkedKeywords.get(normalizedKeyword) || 0;
      if (linkCount >= maxLinksPerKeyword) continue;

      // Create case-insensitive regex with word boundaries
      const regex = new RegExp(
        `\\b(${escapeRegex(keyword)})\\b(?![^<]*>|[^<>]*</)`,
        "gi"
      );

      // Check if keyword exists in content
      if (!regex.test(result)) continue;

      // Reset regex lastIndex
      regex.lastIndex = 0;

      // Replace first occurrence(s) up to max
      let replacements = 0;
      result = result.replace(regex, (match) => {
        if (replacements >= maxLinksPerKeyword - linkCount) {
          return match;
        }
        replacements++;
        return `<a href="${mapping.url}" class="keyword-link" data-type="${mapping.type}">${match}</a>`;
      });

      // Update count
      linkedKeywords.set(normalizedKeyword, linkCount + replacements);
    }
  }

  return result;
}

/**
 * Process HTML content and add hyperlinks to keywords
 * This version is safer for HTML content as it only processes text nodes
 *
 * @param html - The HTML content to process
 * @param maxLinksPerKeyword - Maximum times to link the same keyword (default: 1)
 */
export function addKeywordLinksToHtml(
  html: string,
  maxLinksPerKeyword: number = 1
): string {
  if (!html || typeof window === "undefined") {
    // For SSR, fall back to simple text processing
    return addKeywordLinks(html, maxLinksPerKeyword);
  }

  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Track which keywords we've already linked
  const linkedKeywords = new Map<string, number>();

  // Get all text nodes
  const walker = document.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip text inside links, scripts, styles
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tagName = parent.tagName.toLowerCase();
        if (["a", "script", "style", "code", "pre"].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    }
  );

  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode())) {
    textNodes.push(node as Text);
  }

  // Process each text node
  for (const textNode of textNodes) {
    let text = textNode.textContent || "";
    let modified = false;

    for (const mapping of sortedMappings) {
      for (const keyword of mapping.keywords) {
        const normalizedKeyword = keyword.toLowerCase();
        const linkCount = linkedKeywords.get(normalizedKeyword) || 0;

        if (linkCount >= maxLinksPerKeyword) continue;

        const regex = new RegExp(`\\b(${escapeRegex(keyword)})\\b`, "gi");

        if (regex.test(text)) {
          regex.lastIndex = 0;
          let replacements = 0;

          text = text.replace(regex, (match) => {
            if (replacements >= maxLinksPerKeyword - linkCount) {
              return match;
            }
            replacements++;
            modified = true;
            return `<a href="${mapping.url}" class="keyword-link" data-type="${mapping.type}">${match}</a>`;
          });

          linkedKeywords.set(normalizedKeyword, linkCount + replacements);
        }
      }
    }

    if (modified) {
      // Replace text node with HTML
      const span = doc.createElement("span");
      span.innerHTML = text;
      textNode.parentNode?.replaceChild(span, textNode);
    }
  }

  return doc.body.innerHTML;
}

/**
 * Get all available keywords for highlighting/autocomplete
 */
export function getAllKeywords(): { keyword: string; url: string; type: string }[] {
  const keywords: { keyword: string; url: string; type: string }[] = [];

  for (const mapping of keywordMappings) {
    for (const keyword of mapping.keywords) {
      keywords.push({
        keyword,
        url: mapping.url,
        type: mapping.type,
      });
    }
  }

  return keywords.sort((a, b) => a.keyword.localeCompare(b.keyword));
}
