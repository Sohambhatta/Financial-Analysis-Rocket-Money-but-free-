/**
 * Keyword-based auto-categorization for transaction descriptions.
 * Pure client-side, no network calls.
 */

export const CATEGORIES = [
  'Housing',
  'Food',
  'Transportation',
  'Entertainment',
  'Subscriptions',
  'Insurance',
  'Utilities',
  'Shopping',
  'Health',
  'Income',
  'Miscellaneous',
];

// Ordered so more specific keyword sets are checked before broader ones.
const CATEGORY_KEYWORDS = [
  [
    'Subscriptions',
    [
      'netflix',
      'spotify',
      'hulu',
      'disney+',
      'disney plus',
      'adobe',
      'apple.com/bill',
      'apple music',
      'icloud',
      'google storage',
      'google one',
      'prime video',
      'amazon prime',
      'youtube premium',
      'playstation plus',
      'xbox game pass',
      'patreon',
      'audible',
      'nytimes',
      'hbo',
      'paramount+',
      'peacock',
      'crunchyroll',
      'dropbox',
      'notion',
      'canva',
      'openai',
      'chatgpt',
      'github',
    ],
  ],
  [
    'Housing',
    ['rent', 'mortgage', 'landlord', 'property management', 'apartments', 'hoa fee'],
  ],
  [
    'Utilities',
    [
      'electric',
      'power co',
      'water utility',
      'gas company',
      'comcast',
      'xfinity',
      'spectrum',
      'verizon',
      'at&t',
      'att bill',
      't-mobile',
      'internet bill',
      'utility',
      'waste management',
      'sewer',
    ],
  ],
  [
    'Insurance',
    [
      'insurance',
      'geico',
      'state farm',
      'progressive',
      'allstate',
      'metlife',
      'liberty mutual',
    ],
  ],
  [
    'Transportation',
    [
      'uber',
      'lyft',
      'gas station',
      'shell',
      'chevron',
      'exxon',
      'parking',
      'transit',
      'metro card',
      'dmv',
      'car payment',
      'auto loan',
    ],
  ],
  [
    'Food',
    [
      'mcdonald',
      'trader joe',
      'whole foods',
      'starbucks',
      'chipotle',
      'doordash',
      'grubhub',
      'uber eats',
      'restaurant',
      'grocery',
      'safeway',
      'kroger',
      'cafe',
      'pizza',
      'deli',
    ],
  ],
  [
    'Health',
    ['pharmacy', 'cvs', 'walgreens', 'gym', 'fitness', 'planet fitness', 'peloton', 'doctor', 'dental', 'clinic'],
  ],
  [
    'Entertainment',
    ['movie', 'cinema', 'amc', 'concert', 'ticketmaster', 'steam', 'playstation store', 'nintendo'],
  ],
  [
    'Shopping',
    ['amazon', 'walmart', 'target', 'best buy', 'ebay', 'etsy', 'costco', 'ikea', 'nike', 'apple store'],
  ],
  [
    'Income',
    ['payroll', 'direct deposit', 'salary', 'paycheck', 'employer', 'venmo cashout', 'tax refund'],
  ],
];

/**
 * Suggest a category for a transaction description based on keyword matching.
 * @param {string} description
 * @returns {string} one of CATEGORIES
 */
export function categorize(description) {
  if (!description) return 'Miscellaneous';
  const text = description.toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((kw) => text.includes(kw))) {
      return category;
    }
  }
  return 'Miscellaneous';
}
