-- Create or replace the RPC that returns museums within a given radius and the calculated distance.
-- Adjust the latitude/longitude column names if your schema differs.
create or replace function public.musea_within_radius(
  lat double precision,
  lng double precision,
  radius_meters double precision
)
returns table (
  id uuid,
  naam text,
  stad text,
  provincie text,
  slug text,
  gratis_toegankelijk boolean,
  ticket_affiliate_url text,
  website_url text,
  kindvriendelijk boolean,
  afstand_meter double precision
)
as
$$
  with origin as (
    select ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography as geom
  )
  select
    m.id,
    m.naam,
    m.stad,
    m.provincie,
    m.slug,
    m.gratis_toegankelijk,
    m.ticket_affiliate_url,
    m.website_url,
    m.kindvriendelijk,
    ST_Distance(
      origin.geom,
      ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography
    ) as afstand_meter
  from musea m
  cross join origin
  where ST_DWithin(
    origin.geom,
    ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
    radius_meters
  )
  order by afstand_meter asc, lower(m.naam);
$$
language sql
stable;
