export type Referral = {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  tags: string[];
  image: string;
  votes: number;
  clicks: number;
  createdAt: number;
  authorId?: string;
  authorName?: string;
  sponsored?: boolean;
  boosted?: boolean;
};

export type UserProfile = {
  id: string;
  email: string;
  displayName: string;
  points: number;
  rank: number;
  premium: boolean;
  badges: string[];
  createdAt: number;
};

export type BlogArticle = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  keywords: string[];
  sections: { heading: string; body: string[] }[];
  embeds?: { label: string; href: string }[];
};
