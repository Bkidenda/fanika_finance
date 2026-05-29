-- Rename gross_income to net_income on profiles (multi-country, no statutory engine)
ALTER TABLE public.profiles RENAME COLUMN gross_income TO net_income;
-- Drop Kenya-specific statutory fields (no longer used)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS nssf_mode;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_resident;
-- tithe_base now always implicitly "net" (since we removed gross); drop column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS tithe_base;

-- Refresh devotionals with short, verified attributions
DELETE FROM public.devotionals;
INSERT INTO public.devotionals (verse, verse_reference, egw_quote, egw_source, reflection, tag) VALUES
('Honour the Lord with thy substance, and with the firstfruits of all thine increase.', 'Proverbs 3:9 (KJV)', 'Every man is a steward of God.', 'Christ''s Object Lessons, chap. "Talents" (1900, public domain)', 'Stewardship begins with acknowledging that nothing we hold is truly ours — we are managers, not owners.', 'Stewardship'),
('Will a man rob God? Yet ye have robbed me. But ye say, Wherein have we robbed thee? In tithes and offerings.', 'Malachi 3:8 (KJV)', 'Money has great value, because it can do great good.', 'Christ''s Object Lessons, chap. "Talents" (1900, public domain)', 'Money is a tool for kingdom good — returning the tithe trains the heart to hold the rest with open hands.', 'Tithing'),
('The rich ruleth over the poor, and the borrower is servant to the lender.', 'Proverbs 22:7 (KJV)', 'It is a sin to live beyond our means.', 'The Adventist Home, chap. 32 (1952; underlying counsels are public domain)', 'Debt is a quiet master. Living within our means is one of the most spiritual financial disciplines we can practise.', 'Debt'),
('Let your conversation be without covetousness; and be content with such things as ye have.', 'Hebrews 13:5 (KJV)', 'Contentment is great gain.', 'paraphrasing 1 Timothy 6:6 in EGW devotional writings', 'Contentment is not the absence of ambition — it is the discipline of gratitude that prevents money from owning us.', 'Contentment');