-- Atlas OS V0.1 — seed data
-- Real seed data for the founder's actual first ideas, per the V0.1 spec:
-- "Use the system with actual Atlas ideas immediately... Atlas should
-- begin accumulating its own institutional memory from day one."
--
-- Seed opportunities retain whatever status is actually true today — they
-- are not automatically treated as approved or active.

insert into public.principles (title, description, sort_order) values
  ('Protect family control', 'Structure decisions so family control of Atlas and its businesses is preserved, even when outside capital or partners are involved.', 10),
  ('Don''t create complexity before it is economically justified', 'Avoid new legal entities, systems, or processes until the business reality actually requires them.', 20),
  ('Ideas can be captured without becoming commitments', 'Capturing an idea in Atlas creates a record, not an obligation. Commitment is a separate, deliberate decision.', 30),
  ('Build 80% quickly; refine the last 20%', 'Get to a useful version fast. Polish only what has proven worth polishing.', 40),
  ('Atlas should create durable assets', 'Favor work that leaves behind something lasting — a business, a system, a relationship — over one-off effort.', 50),
  ('Founder time is a scarce resource', 'Founder attention is the tightest constraint in the system. Protect it more carefully than capital.', 60),
  ('Capital is scarce', 'Spend deliberately. Prefer the cheapest test that meaningfully reduces uncertainty.', 70),
  ('Early experiments should be inexpensive', 'The first test of an idea should be small enough that failure costs little.', 80),
  ('Avoid unnecessary administrative complexity', 'Do not add process, tooling, or overhead beyond what the current stage of work requires.', 90),
  ('Shared infrastructure should create leverage', 'Systems and capabilities built for one business should be reusable by others in the Atlas ecosystem.', 100),
  ('An idea may be valuable even if it does not become a standalone company', 'Some ideas are worth pursuing as features, partnerships, or contributions to an existing business rather than new ventures.', 110),
  ('Do not confuse activity with progress', 'Busywork on an idea is not the same as learning something that changes a decision.', 120)
on conflict do nothing;

insert into public.opportunities (title, short_description, category, status, attention, source, tags) values
  ('Soapmaking', 'Handmade soap as a small physical-product business.', 'product', 'captured', 'watch', 'founder', array['physical-product','consumer']),
  ('Mushroom cultivation', 'Growing gourmet/medicinal mushrooms for direct sale.', 'business_idea', 'captured', 'watch', 'founder', array['agriculture','physical-product']),
  ('Mushroom cultivation supplies', 'Selling grow kits and supplies to other mushroom growers instead of selling mushrooms directly.', 'product', 'captured', 'watch', 'founder', array['agriculture','supplies','b2c']),
  ('Soy sauce / fermentation', 'Small-batch fermented condiments, starting with soy sauce.', 'product', 'captured', 'watch', 'founder', array['fermentation','food']),
  ('Blue Star', 'Blue Star development opportunity.', 'business_idea', 'captured', 'watch', 'founder', array['development']),
  ('Chapel', 'Chapel — facilities and operations management for St. Francis of Assisi, already in active development in this repository.', 'technology', 'active_project', 'now', 'founder', array['software','existing-build']),
  ('Business acquisition', 'General acquisition lead — evaluating an existing business to buy rather than build.', 'acquisition', 'captured', 'watch', 'founder', array['acquisition'])
on conflict do nothing;

-- Chapel is the one seed opportunity that has actually graduated to a
-- project — the app it sits alongside in this repository.
insert into public.projects (opportunity_id, name, objective, status, next_action)
select id, 'Chapel development', 'Build and operate the facilities/operations system for St. Francis of Assisi.', 'active', 'Continue feature development on the Chapel PWA.'
from public.opportunities
where title = 'Chapel'
on conflict do nothing;

insert into public.decisions (subject, decision, reasoning, opportunity_id, project_id)
select
  'Chapel',
  'Move Chapel from idea to active project.',
  'Chapel already had a working build and a real user (the parish) — the cheapest useful test had already happened, so it graduated straight to an active project instead of sitting in evaluation.',
  o.id,
  p.id
from public.opportunities o
join public.projects p on p.opportunity_id = o.id
where o.title = 'Chapel'
on conflict do nothing;
