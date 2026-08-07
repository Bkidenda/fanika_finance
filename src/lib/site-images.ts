// Editorial photography for the marketing site (Unsplash, stable photo IDs).
const U = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroLedger: U("photo-1460925895917-afdab827c52f", 1800),
  dashboard: U("photo-1551288049-bebda4e38f71"),
  planning: U("photo-1450101499163-c8848c66ca85"),
  desk: U("photo-1554260570-9140fd3b7614"),
  charts: U("photo-1543286386-713bdd548da4"),
  receipts: U("photo-1554260570-9140fd3b7614"),
  growth: U("photo-1611348586804-61bf6c080437"),
  team: U("photo-1522071820081-009f0129c71c"),
  meeting: U("photo-1600880292203-757bb62b4baf"),
  savings: U("photo-1591696205602-2f950c417cb9"),
  reports: U("photo-1526304640581-d334cdbbf45e"),
  laptop: U("photo-1563986768609-322da13575f3"),
  family: U("photo-1517245386807-bb43f82c33c4"),
  calm: U("photo-1611974789855-9c2a0a7236a3"),
  phone: U("photo-1556742049-0cfed4f6a45d"),
} as const;
