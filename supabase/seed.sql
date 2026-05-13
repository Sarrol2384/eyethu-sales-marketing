-- ============================================================================
-- Seed data for local development
--
-- NOTE: the admin user is NOT created here because Supabase Auth needs hashed
-- passwords with proper crypto setup. Create your admin user from the local
-- Supabase Studio (http://127.0.0.1:54323 -> Authentication -> Users -> Add user
-- -> Email: admin@eyethu.local, Password: admin1234, Auto-confirm: yes), or via:
--   npx supabase auth signup --email admin@eyethu.local --password admin1234
-- ============================================================================

-- One demo property so /property/<slug> and / have something to render.
insert into public.properties (
  title, slug, status, property_type, listing_type, price,
  address, suburb, city, province,
  is_gated_community, gated_community_name,
  bedrooms, bathrooms, garages, parking_spaces,
  floor_size_sqm, erf_size_sqm, year_built,
  features,
  manual_description,
  ai_description,
  ai_seo_title,
  ai_seo_description,
  ai_neighbourhood_summary,
  ai_headline,
  ai_cta,
  agent_name, agent_phone, agent_email,
  published_at
)
values (
  '3 Bedroom Family Home',
  '3-bedroom-family-home-blue-downs',
  'published',
  'house',
  'sale',
  899000,
  '12 Erica Street',
  'Blue Downs',
  'Cape Town',
  'Western Cape',
  true,
  'Eersterivier Gardens Estate',
  3, 2, 1, 1,
  98.5, 280, 2018,
  array['alarm system', 'prepaid electricity', 'boundary wall', 'fibre ready', 'tiled throughout'],
  'A lovely 3-bedroom family home in a secure estate, perfect for first-time buyers.',
  'Step into this warm, sun-filled 3-bedroom family home in Eersterivier Gardens Estate, Blue Downs. With 98 m² of comfortable living space, an open-plan lounge and kitchen, a private garden and a single garage, this home is ready for a young family to make their own. The estate has 24-hour security, a boundary wall and prepaid electricity, giving you peace of mind from day one. At R 899 000 it fits comfortably within FLISP-eligible budgets and offers great value for first-time buyers entering the Western Cape market.',
  '3 Bedroom Family Home for Sale in Blue Downs — R 899 000 | Eyethu PG',
  'Affordable 3-bedroom family home in secure Eersterivier Gardens Estate, Blue Downs. Perfect for first-time buyers. FLISP eligible. R 899 000.',
  'Blue Downs is a friendly, established suburb on the eastern edge of Cape Town, well-connected to the N2 and only 30 minutes from the city centre. The area offers schools, shopping at Blue Downs Centre, and easy access to the train line for commuters.',
  'Your first home, your fresh start',
  'Book a viewing today',
  'Thandi Mokoena',
  '+27 82 555 0123',
  'thandi@eyethu.example',
  now()
)
on conflict (slug) do nothing;

insert into public.property_images (property_id, image_url, alt_text, is_primary, display_order)
select
  p.id,
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1600&q=80',
  '3 Bedroom Family Home in Blue Downs',
  true,
  0
from public.properties p
where p.slug = '3-bedroom-family-home-blue-downs'
  and not exists (
    select 1 from public.property_images i
    where i.property_id = p.id
  );
