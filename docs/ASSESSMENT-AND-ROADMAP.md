# Chapel assessment and roadmap

Date: 28 October 2026. This is a read of the `jasonsnoreck/chapel` repository as it sits on `main` (`bef5268`, 22 September 2026). No application code was changed. Nothing here should merge until the owner has read it.

The house server was off, and its database is not in git, so live parish data and any admin-UI edits made on that machine could not be inspected. What follows is the code, the migrations, and a throwaway empty database created only to check those migrations. That database was deleted.

## The short version

Chapel today is a single-parish facilities app plus a manual supply catalog. Both are large HTML files talking to PocketBase. The maintenance dashboard, work orders, schedules, checklists, equipment list, calendar, parish reports, and Chapel Supply ordering screens are built and, with a database behind them, are usable. Several writes do not stick, a few screens will throw once real records exist, and there is no job that runs by itself.

There is no 3D building map in this repository, in its history, or in the owner's other public GitHub repo. If that work lived only on the house server, it was never committed.

The three target features are mostly ahead of the code. Equipment is a flat list. Chapel Supply is a shopping cart a person drives by hand. A sales-demo map can be added on top of the current stack without a rewrite, using three.js, a floor-plan image or a GLB, and pins stored on the equipment rows that already exist.

The serious problem is access control. On a fresh database built from the migrations in git, almost every collection is world-readable and world-writable, while the site list the app needs at startup is locked to the PocketBase superuser. The GitHub repo is public. Do the sales demo on a separate sample database, and lock the API before this is reachable from the internet again.

## What is in the repo

| Path | What it is |
| --- | --- |
| `index.html` | Chapel facilities app, about 2,200 lines. HTML, CSS, and JavaScript in one file. UI calls itself v5.0. |
| `supply.html` | Chapel Supply, about 1,100 lines. Same approach. UI calls itself v1.0. |
| `sw.js` | Service worker. Network-first cache. API calls are not cached. |
| `pocketbase/pocketbase` | PocketBase **0.22.27**, Linux x86-64, about 40 MB, committed as a binary. |
| `pocketbase/pb_migrations/` | 33 JavaScript migrations. These are the data model. |
| `pocketbase/CHANGELOG.md`, `LICENSE.md` | Upstream PocketBase files, not Chapel documentation. |
| `ATLAS.md` | One line pointing at `https://github.com/jasonsnoreck/atlas`. |
| `.gitignore` | Ignores `pocketbase/pb_data/` and `pocketbase/*.zip`. |

There is no README, no `package.json`, no Docker file, no nginx or systemd unit, no tests, no CI, no seed data, and no `pb_hooks/` directory. `manifest.json` and `icon-192.png` are referenced and are not in the tree. There is no `pb_public/` directory.

Git history is seven commits. The initial commit is the facilities app. Four later commits added Atlas OS (a Next.js and Supabase idea and capital tracker) beside it. Commit `bef5268` removed Atlas and left `ATLAS.md`. Atlas is a different product. Its file list is businesses, investors, and opportunities. It is not a building viewer.

The owner's public GitHub account, checked the same day, has this repo and `jasonsnoreck/jasonsnoreck.github.io` (a pages stub). No map project is published there.

## Stack

The browser is the application. There is no React, no build step, and no bundler. Pages render by writing HTML strings into the page. PocketBase is the database, the login system, and the file server.

Login uses an auth collection named `chapel_auth` (email and password, minimum 8 characters, email verification not required). A second collection, `user_profiles`, holds the display name, a role of `admin`, `staff`, or `readonly`, a phone, and `site_access` as a comma-separated text field such as `SFA`. A third collection, `chapel_users`, has a similar shape and is not used by either page. PocketBase also creates its own default `users` collection, which this app does not use.

The facilities page and the supply page keep separate tokens (`chapel_token` and `chapel_supply_token`). Opening Supply copies the facilities token across if Supply has none.

Roles are enforced in the browser. The API rules below do not look at `user_profiles.role`. Turning a user "Off" sets `user_profiles.active` to false and leaves the auth account able to log in. The login code never reads `active`.

## Data model today

Operational records point at `sites` with a relation. Supply records point at a site with a text code (`SFA`, `SAPS`) and are not tied to the `sites` row.

**sites.** Name, short name, code, address, city, pastor name, pastor email, color, active.

**buildings.** Site, name, short name, type (`church`, `school`, `offices`, `rectory`, `gym`, `grounds`, `other`), active.

**work_orders.** Site, title, location (text), priority `P1`–`P4`, status `Open` or `Closed`, category (HVAC, plumbing, electrical, fire, security, elevator, roofing, grounds, kitchen, AV / organ, general), reporter, assignee (text), vendor name (text), date reported, date closed, notes, cost, building name (text). There is no equipment link and no scheduled date in the schema. The form sends `scheduled_date` anyway. PocketBase 0.22 drops unknown fields, which was confirmed on the throwaway database: the create succeeded and `scheduled_date` was gone.

**queue_items.** A holding pen for schedule items. Status `Pending`, `Released`, or `Dismissed`. Releasing one creates a work order. A person clicks the button.

**recurring_schedules.** Title, category, building scope (text), priority, vendor name, interval (`Daily` through `Annual`), next due, notes, active. Nothing links a schedule to a piece of equipment or a part. Nothing runs on a timer. "Add to Queue" is a button, and it then pushes `next_due` forward in the browser.

**checklists.** Title, building scope, due date, status `Upcoming` or `Completed`, items (a JSON list), completed by, completed date.

**events.** Title, date, type (`Service`, `Inspection`, `Internal`, `Contractor Visit`), building scope, vendor name, notes. This is the calendar. It is not a technician's day.

**inventory.** This is the equipment list, under a misleading name. Site, name, category, building name (text), location, make, model, serial, installed date, last service, next service, vendor name, notes. The add form fills name, category, building name, make, model, serial, vendor, next service, and notes. Location, installed date, and last service exist and the form never sets them.

**log_entries.** A maintenance log: date, who, vendor, building name, location, equipment name (free text), category, description, cost, invoice number, invoice URL, next-service note, work order id (text). Closing a work order drafts one of these in the browser. The user still has to save it. The draft is not linked to the inventory row.

**vendors.** Per site: trade, company, contact, phone, email, web, notes, active. The facilities UI lists them and has no add form.

**chapel_auth, user_profiles, chapel_users.** Described above.

**products.** Chapel Supply catalog. Name, SKU, category (janitorial, HVAC, electrical, plumbing, grounds, general maintenance, safety), description, unit, unit label, unit cost, markup percent, sale price, stock quantity, reorder point, active, notes, image URL. The image field is never shown. `reorder_point` is one number for the warehouse, not a par level at a church.

**supply_orders.** Site code, site name, status (`Pending`, `Confirmed`, `Fulfilling`, `Delivered`, `Cancelled`), building name (text), delivery notes, ordered by, order date, needed by, delivered date, total cost, total price, fulfilled by, notes, order number. Order numbers are a random `ORD-` plus four digits.

**order_items.** Order, product, copied name and SKU, category, unit, qty, unit cost, unit price, line total, a text `work_order_id` the UI never fills, notes.

**supply_inventory.** A stock movement log: product, type (`Received`, `Sold`, `Adjustment`, `Return`, `Damaged`), qty change, qty after, reference, notes, date, recorded by. Placing an order writes a `Sold` row and decrements `products.stock_qty` immediately, before anyone picks or delivers it. Restock is a manual form.

Lists stop at 200 rows (`perPage=200`) and do not ask for the next page. A busy site will silently lose older work orders in every screen and every report.

## What is actually built

These screens exist and round-trip through PocketBase when the collection rules allow the call and the payload matches the schema.

Facilities (`index.html`):

- Login, site switcher, desktop sidebar, mobile nav.
- Dashboard: open work orders, pending queue, closed this month, overdue equipment, a month summary, and three printable reports (pastor, finance council, parish administrator). The finance report hardcodes calendar years 2025 and 2026.
- Work orders: filter, create, detail, close, reopen. Closing prepares a log draft.
- Queue: release as a work order, or dismiss.
- Schedules: create, pause, and manually push the next one into the queue. Intervals are daily, weekly, monthly, quarterly, semi-annual, and annual.
- Checklists: list, tick items, mark complete.
- Maintenance log: search, add, detail, invoice link.
- Inventory: list equipment, add, detail, overdue and due-within-30-days.
- Calendar of `events`, with Google, Outlook, and `.ics` links. Work orders, schedules, and equipment can also export an `.ics` file.
- Vendor cards.
- "Report an issue," which creates a work order.
- Settings: system info, and for a browser-side admin a user list, add, edit, deactivate. See the broken pieces below. Creating the auth account is rejected for anyone who is not a PocketBase superuser.

Chapel Supply (`supply.html`):

- Catalog with search, categories, prices, and a stock warning.
- Cart in `localStorage`, delivery building chosen from five hardcoded names, submit.
- My Orders, with line items.
- Admin-only in the browser: fulfillment (confirm, start fulfilling, mark delivered, cancel), warehouse inventory with low-stock banners, restock, and product create/edit with a markup calculator.

Both pages are laid out for a phone. The facilities page has a real mobile menu. Supply collapses its sidebar.

## Half-built and broken

Confirmed against PocketBase 0.22.27 and the migrations, not guessed.

1. **A fresh database cannot get past login.** `initApp` loads `sites`. That collection's rules are superuser-only, so the call returns 403. On a first login the error is shown on the login card. On a saved session the startup handler clears `localStorage` and the login screen comes back. The house database may have had this rule opened in the admin UI later. That edit would live in `pb_data`, which is not in git. A new machine built from this repo does not have it.

2. **`scheduled_date` is not stored.** The new-work-order form sends it. The API drops it. The detail screen's "Scheduled" cell and its calendar buttons stay empty for orders created by the app.

3. **"Issues by building" does not count.** The dashboard, the pastor report, and the admin report match `work_order.building` to a building id. The schema has `building_name` (text) and no `building` relation. The new-order form writes the name. The issue form sends `building` (the id) and does not send `building_name`, so that id is dropped too. With the schema in git, those building totals stay at zero. The same dead `building` field is used as a filter on the log and on equipment, so choosing a building there yields an empty list.

4. **Assignee dropdown is empty.** Users are loaded with `Promise.resolve([])`. The log form offers three hardcoded names, the first of which is the owner.

5. **Checklist detail will throw on real items.** The API returns `items` as an array (`["Walk the roof", "Check filters"]` on the throwaway server). The page runs `JSON.parse` on that array, which throws. The list screen can still render. Opening a checklist breaks it.

6. **Dates display wrong.** PocketBase returns dates like `2026-11-01 00:00:00.000Z`. `fmtDate` splits on `T` and then on `-`, so the day portion keeps the time attached.

7. **Settings cannot create a login.** `chapel_auth` is superuser-only. Posting a new auth user without the superuser token returns 403. Profile rows can be created by anyone, because that collection is public. A profile with `role: admin` does not by itself create a password.

8. **Deactivate does not deactivate.** It flips a flag the login code ignores, and it does not disable the auth record.

9. **Queue and schedules are manual.** The UI copy says "auto-generated." The only generator is a button. There is no cron and no `pb_hooks` file. Overdue schedules sit until someone opens the page and clicks.

10. **Supply is a catalog, not a loop.** Delivery buildings are five fixed strings, not the site's buildings. Site names are hardcoded for St. Francis and Sts. Alphonsus & Patrick. Stock drops when the order is submitted, not when it ships. Marking an order delivered stores a date and does nothing else. `order_items.work_order_id` is unused. Low stock is a red banner. Nobody is tasked to change a filter.

11. **Reports and the dashboard assume one parish.** Titles, the default calendar location, the report signature, and the sidebar phone are written into the HTML. The year-over-year report is labeled 2025 and 2026.

12. **Service worker and PWA shell are incomplete.** `sw.js` precaches `/manifest.json`. With PocketBase's static fallback, that URL returns `index.html` with status 200, so the worker can cache the app HTML under the manifest name. The icon file is missing. Install-to-home-screen is not actually set up.

13. **Stored HTML injection.** Record titles, notes, and names are inserted as HTML. Combined with public create rules, anyone who can reach the API can store markup that runs when a staff member opens the page.

14. **Time zones.** "Today" is `toISOString()`, which is UTC. In the evening in Illinois that is already tomorrow. A "schedule it for the next day" feature will land on the wrong day if it copies this.

## The 3D map

Searched: every HTML, JS, and Markdown file in the repo; `git log -S` across all commits for three.js, glTF, LiDAR, floor plan, and building map; the Atlas tree that used to live in this repo; the owner's other public repo. Nothing. No model files, no pin coordinates, no floor-plan canvas, no Matterport or Polycam notes.

The closest existing pieces are `buildings` (a name and a type) and `inventory` (a name, a building name, and a location string). There is nowhere to store an x, y, z, a floor, or a model file.

If a prototype exists, it is on the house disk outside this repo, or it was never saved. Do not plan as though a half-finished viewer is waiting in the code. It is a new screen.

## How it is hosted and run

The code assumes a reverse proxy. `index.html` says nginx proxies `/api` and `/_/` and then calls `/api` on the same origin. `/_/` is the PocketBase admin UI, so that comment means the admin UI was meant to be on the same public host as the app.

The binary's own defaults, from `pocketbase serve --help`:

- With no domain: listen on `127.0.0.1:8090` only. Not reachable from other machines.
- With a domain argument: listen on `0.0.0.0:80` and `0.0.0.0:443`. That is every interface, with the admin UI on 443.
- CORS defaults to `*`.
- Static files default to `pocketbase/pb_public`, which does not exist. The HTML files are at the repo root. Serving them with PocketBase requires `--publicDir` pointed at the repo root (or a copy). Migrations are in `pocketbase/pb_migrations`, and a serve started from the repo root does not find them unless `--migrationsDir` is set. Both of those were required to boot a clean database during this read.

There is no checked-in nginx config, TLS certificate, port map, or service unit. The real bind address, firewall, and hostname live on the house machine. A Google Search Console verification tag in `index.html` means some hostname for this app was submitted to Google, so it was aimed at the public internet at least once.

`pb_data` is gitignored. Users, sites, work orders, and prices on the house server are only on that disk. This repo cannot restore them. Before any future migration, copy that directory off the machine. PocketBase 0.22 to a newer major is a separate project: the demo does not need it, and an upgrade should follow a backup, not ride along with a map.

A local boot that matches this repo is:

```text
./pocketbase/pocketbase serve \
  --http=127.0.0.1:8090 \
  --dir=/path/to/a-data-directory \
  --migrationsDir=./pocketbase/pb_migrations \
  --publicDir=.
```

Then create a superuser (`./pocketbase/pocketbase admin create ...` with the same `--dir` and `--migrationsDir`), create a site in the admin UI, and open the `sites` list/view rules to signed-in users or the app will bounce login. Use a new data directory for development. Do not point experiments at a copy of parish data until the rules are fixed.

## Security

No passwords, API keys, or private keys are committed. `.gitignore` correctly excludes `pb_data`. That is the good news.

The bad news was checked by applying the migrations to an empty database and calling the API with no token.

PocketBase treats a rule of `null` as superuser-only and a rule of `""` as public. The second migration on each of these collections sets every rule (list, view, create, update, delete) to public:

`buildings`, `work_orders`, `inventory`, `log_entries`, `queue_items`, `recurring_schedules`, `checklists`, `events`, `vendors`, `user_profiles`, `products`, `supply_orders`, `order_items`, `supply_inventory`.

Confirmed with no login:

- List work orders, including notes. The site id is on each row. With that id, an anonymous client can create more work orders. Creating the first one also works for anyone who already knows a site id.
- Create a `user_profiles` row with `role` set to `admin`.
- Create a product, which returns `unit_cost`, `markup_pct`, and `sale_price`.
- Create a quarterly recurring schedule.

Still superuser-only: `sites`, `chapel_users`, `chapel_auth`. So anonymous clients cannot list sites or mint a password, and they can do almost everything else. CORS is `*`, so a web page on any origin can make those calls if the API is reachable.

The app's role checks do not change this. A `readonly` user, and a logged-out client, have the same API power whenever those rules are what is deployed. If the house server's admin UI tightened the rules later, that tightening is not in git and will not come back on a reinstall. If it did not, and the proxy is up, parish maintenance records and Chapel Supply costs are on the open internet. The repo being public means the shape of that API is already visible. `gh repo view` reports `jasonsnoreck/chapel` as public.

Other exposure, short of secrets:

- Personal data is hardcoded in the client everyone downloads: the owner's name, the phone number `(708) 269-7148`, the street address `15050 S. Wolf Rd., Orland Park, IL`, the parish name, and a bishop's name on the pastor report. The sidebar phone is static HTML. Login does not replace it. Reports sign every copy with that name and number.
- The nginx comment proxies `/_/`. That publishes the admin UI. On 0.22.27 that is an old admin surface. Keep it off the internet. Upgrade only after a backup, as its own change.
- `serve some.domain` binds all interfaces on 80 and 443. `serve` with no domain stays on localhost port 8090. The risky configuration is the domain form, or a proxy that forwards 8090, or a port forward of 8090 onto the router. None of those configs are in git, so the house router has to be checked when the machine is back on.
- Profile lookup builds a filter by concatenating the email address. Harmless while the collection is public. It becomes a real bug the day the rules are tightened.
- The service worker caches successful GETs other than `/api` and `/_/`. It will not cache the database. It will cache stale HTML.

A sales demo should use a fictional site in its own data directory. Do not demo against St. Francis data, and do not put the demo on a public host until list/create/update/delete require a logged-in user whose profile is allowed to see that site. That lock is a small migration. It is the first code change worth making, and it is not part of this pull request.

## Gap against the three features

### 1. Clickable 3D building map, tied to work orders

Nothing to extend. Buildings are names. Equipment has a text location. Work orders do not point at equipment. A showpiece can still be fast, because the dashboard and the work-order screen already exist and a pin only has to open them.

Usable inputs, once a viewer exists:

- An old blueprint: export a PNG or PDF page and lay it flat in the scene. This is the fastest honest demo.
- Polycam: GLB/glTF is the format to standardize on. three.js loads it directly.
- magicplan: floor-plan image, or OBJ. Convert OBJ to GLB in Blender once. three.js can load OBJ, and one format is enough to support.
- USDZ (Apple, some magicplan and Polycam exports): convert to GLB. three.js does not load USDZ in any dependable way.
- Matterport: their dollhouse stays on Matterport's site and does not become a Chapel work-order pin. Use a floor-plan export, or a mesh export (OBJ or similar) converted to GLB, if the subscription includes it. Do not build the product on their viewer.

### 2. Per-equipment records

`inventory` is a start: name, category, make, model, serial, location, install date, last and next service, vendor, notes. The detail page shows those and can download a calendar reminder.

Missing for the record the owner described:

- A history that is actually this machine's work orders and log entries. Today the log stores an equipment name typed by hand, and work orders do not store one at all.
- Nameplate and documents. There are no file fields. An invoice is a URL typed into the log.
- Specs beyond make, model, and serial. No tonnage, voltage, refrigerant, filter size, or capacity.
- Expected remaining life. Install date is in the schema and not on the form. There is no design life, so there is nothing to subtract.
- A schedule that belongs to the machine. Schedules are their own list, scoped to a building name, and a person releases them.

### 3. Automatic Chapel Supply ordering, then a task on the tech's day

The catalog, cart, order, fulfillment steps, warehouse quantity, and reorder point are real. A person at a site can order filters. A person marked admin in the browser can mark that order delivered.

Missing:

- A consumable tied to a machine ("these filters, this air handler, every 3 months").
- A job that creates the supply order when the interval is due.
- Par stock at a site ("12 bulbs in the closet"). Using one does not decrement a site bin, and there is no site bin. The only quantity is the warehouse.
- On delivery, a work order such as "change filters," assigned to a technician, dated the next day. Delivery only sets `delivered_date` and `fulfilled_by`.
- A technician. Assignee is a text field. There is no tech, no route, and no day board. The calendar is parish events.
- Any notion of Chapel companies. Sites are customer locations. Chapel HVAC, backflow, and Chapel Supply are not records. Supply is a second HTML file, not a company with customers.

"Automatic" in a first real version means the app creates the Chapel Supply order and, after a person marks it delivered, creates the work order. It does not mean the app checks out on a wholesaler's website. External replenishment (warehouse quantity hits reorder point, a purchase order to Grainger or the like appears) is a later slice. The red low-stock banner is what exists for that today.

## Roadmap

Estimates are focused working time for one person who already has this repo open. They are not a calendar commitment. They assume the demo uses sample data, and that parish data on the house server is backed up before any migration is applied to it.

### Before the demo

About a day, and it should happen before the map if the demo machine will be on a network.

- Copy `pb_data` off the house server the day it powers on. Keep that copy offline.
- Development and the sales demo get a new data directory with fictional buildings.
- Add a migration that sets API rules to "logged in, and the profile may see this site" on every public collection. Until that lands, run the demo on localhost only.
- Leave the PocketBase upgrade and the nginx cleanup for after the demo. Write down, on the house machine, whether 80, 443, or 8090 are forwarded.

### Phase 1. Sales-demo map with sample equipment and work orders

About 4 to 8 focused days once a picture of a building exists. A hand-built stand-in (a simple church massing, or a photographed blueprint) is enough to start, and a Polycam GLB can replace the file later without a schema change. Scanning and Blender cleanup are content time on top of this, anywhere from an hour for a clean Polycam GLB to a couple of days for a messy OBJ.

Build it as a new page, `map.html`, linked from the existing nav, reusing the facilities token. That keeps the 2,200-line facilities file from becoming the place the experiment happens. The page:

- Loads one GLB, or a floor-plan image on a flat plane. Same pin code either way.
- Reads equipment for the site and draws a pin from coordinates on the row.
- Click a pin: name, make and model, next service, open work orders for that equipment, and a link into the existing work-order screen.
- An edit mode so a pin can be placed by clicking the model and saved. Do not hand-edit coordinates in a migration for the second building.

Seed, in that sample database only: one campus, two floors or one floor plan, about eight pieces (air handler, boiler, backflow preventer, panel, water heater, filter rack, lighting closet, fire panel), and about five work orders with a mix of open, overdue, and closed. Mark the rows as sample data so they are obvious.

Fix only the schema bugs the demo trips over: add `scheduled_date` and an equipment relation on `work_orders` so a pin's work orders are real, and stop sending fields the API drops. Leave the parish reports alone.

This phase is a showpiece. It does not automate supply, and it does not need the house database.

### Phase 2. The equipment record

About 2 to 3 focused weeks. This is the core of the maintenance system, and it should land before automatic ordering so orders have a machine to hang from.

Keep the collection named `inventory` so existing rows survive. Treat it as the equipment record. Add the fields in the data-model section below, put the install date and location on the form, and add file uploads for a nameplate photo and a manual (PocketBase file fields).

History is a query, not a new log: work orders and log entries that point at this row, plus the schedules that point at it. Replace the free-text equipment name on new log lines with a relation, and keep the old text for old lines.

Remaining life is `installed + design_life_years`, shown on the equipment page and on the pin. When it is inside a year, the dashboard already has an "equipment overdue" pattern to copy.

Schedules gain an equipment relation and a default technician. A PocketBase cron hook (`pb_hooks`, which 0.22 already supports) creates the queue item when `next_due` is reached, which is what the button does now. People still release the queue into a work order until Phase 3 is trusted.

Also fix, while touching these screens: checklist `items` without `JSON.parse`, date formatting, the building id (store a real building relation and keep `building_name` filled for old reports), and the empty assignee list.

### Phase 3. Chapel Supply loop and the tech's day

About 3 to 5 focused weeks. This is the feature that will order the wrong part if the data is sloppy, so the hook should be boring and logged.

- A bill of materials on the equipment: which SKU, how many, which schedule.
- Par levels per site (and a closet or room label): par quantity, on hand, reorder quantity.
- Using a part on a work order or a checklist decrements that site's on-hand. Crossing under par creates a `supply_order` with `source = par`.
- The daily hook creates a `supply_order` with `source = schedule` when a consumable schedule comes due (filters every quarter), instead of only a queue item.
- When a person marks that order `Delivered`, one hook creates one work order: the task title ("Change filters"), the equipment, the technician, and `scheduled_date` of the next local day. Store the work order id on the supply order so a double click cannot create two tasks.
- A day board: work orders for one technician on one date. This is the schedule he asked for. It is a view on work orders, not a second calendar.

Phase 3b, after the loop above works on sample data: a `purchase_orders` record when warehouse `stock_qty` falls to `reorder_point`, for Chapel Supply to send to an outside vendor. Still no wholesaler API. A person marks it sent and received, and receiving runs the restock path that already exists.

### Phase 4. The brain center for the companies

About 4 to 8 focused weeks, and it needs decisions only the owner can make: which legal entities exist, whether a technician works across HVAC and backflow, and whether a church is a customer with many buildings or a site with a pastor report.

Add `companies` (HVAC, backflow, supply, others) and hang technicians and work orders off them. Customer sites stay `sites`. Chapel Supply is the company that fulfills `supply_orders`, not a hardcoded second website. The pastor, finance, and admin reports become a report for that customer, with the signature and address taken from the site and the user, not from the HTML.

Do this after Phases 1–3. Rewriting the parish app into a multi-company platform first would delay the demo and the filter loop, which are the parts a buyer can see.

## Data model to add

Additive only. Old rows keep working. Names below are the collection to change or create.

**Equipment.** Extend `inventory`. Do not add a parallel assets table. In this product the asset is the equipment.

| Field | Purpose |
| --- | --- |
| `building` | Relation to `buildings`. Keep `building_name` filled so current reports still render. |
| `map_x`, `map_y`, `map_z` | Pin position in the model's coordinates. Null means "not on the map." |
| `map_floor` | Text, when a building has more than one plan. |
| `asset_tag` | The sticker in the mechanical room. |
| `nameplate` | File. Photo of the plate. |
| `manual` | File. |
| `specs` | JSON. Filter size, voltage, phase, tonnage, refrigerant, belt, capacity. Sparse on purpose. |
| `design_life_years` | Number. Remaining life is computed, not stored. |
| `parent` | Relation to another inventory row. An air handler owns its filter rack. |
| `status` | In service, spare, out of service. |
| `criticality` | Optional, for the dashboard later. |
| `sample` | Bool. True on demo rows. |

**Maps.** New `building_maps`, one or more per building.

| Field | Purpose |
| --- | --- |
| `building` | Relation. |
| `floor` | Text. Matches `inventory.map_floor`. |
| `kind` | `floorplan` or `mesh`. |
| `image` | File. PNG of the blueprint. Used when `kind` is `floorplan`. |
| `model` | File. GLB. Used when `kind` is `mesh`. |
| `label` | "Sanctuary," "Mechanical room." |

**Work orders.** Extend `work_orders`.

| Field | Purpose |
| --- | --- |
| `building` | Relation. Stops the zero counts. |
| `equipment` | Relation to `inventory`. The pin's work orders. |
| `scheduled_date` | Date. The field the form already thinks exists. |
| `technician` | Relation to `technicians`. Keep `assignee` text for old rows. |
| `supply_order` | Relation, when this task came from a delivery. |
| `source` | `reported`, `queue`, `schedule`, `delivery`, `par`. |

**Schedules.** Extend `recurring_schedules`.

| Field | Purpose |
| --- | --- |
| `equipment` | Relation. |
| `technician` | Relation. Who should get the task. |
| `product` | Relation to `products`, when the visit consumes a SKU. |
| `qty` | How many of that SKU to order. |
| `auto_order` | Bool. The hook creates a supply order instead of only a queue item. |
| `task_title` | "Change filters." Copied onto the work order at delivery. |

**Parts / SKUs.** `products` already is the SKU list. Add `equipment_parts` only if one machine consumes several SKUs on different intervals and a single schedule row is too tight. Columns: `equipment`, `product`, `qty`, `interval`, `task_title`, `technician`. Phase 3 can start with the schedule columns above and add this table when a machine needs two parts.

**Par levels.** New `par_levels`.

| Field | Purpose |
| --- | --- |
| `site` | Relation. |
| `product` | Relation to `products`. |
| `location_label` | "Boiler room closet." |
| `par_qty` | The level to stay at. |
| `on_hand` | Count at the site, not at the warehouse. |
| `reorder_qty` | How many to put on the supply order. |

**Supply orders.** Extend `supply_orders`. This is the customer order to Chapel Supply, which already exists.

| Field | Purpose |
| --- | --- |
| `source` | `manual`, `schedule`, `par`. |
| `schedule` | Relation, optional. |
| `par_level` | Relation, optional. |
| `equipment` | Relation, so the delivery task knows the machine. |
| `task_title` | Text. |
| `technician` | Relation. |
| `work_order` | Relation, filled when the delivery task is created. |

**Purchase orders.** New `purchase_orders` and `purchase_order_items`, Phase 3b. Chapel Supply buying from an outside vendor when `products.stock_qty` hits `reorder_point`. Status `draft`, `sent`, `received`. Receiving increments warehouse stock through the movement log that already exists. This is not the church's order.

**Deliveries.** No new table at first. `supply_orders.status = Delivered` plus `delivered_date` is the delivery. Split to a `deliveries` table only if one order arrives in parts.

**Technicians and the day board.** New `technicians`: name, relation to `user_profiles`, phone, active, and later a `company`. The day board is `work_orders` filtered by `technician` and `scheduled_date`. No second schedule table.

**Companies.** Phase 4. New `companies`: name, trade, active. Add `company` on technicians, work orders, and supply orders. Sites remain the customer place.

## Recommended 3D approach

Use **three.js** inside the existing vanilla pages. Do not adopt react-three-fiber for this.

react-three-fiber is a React renderer. This app has no React, no Node toolchain, and no compile step. Adding it means a Vite and React rewrite of a UI that already runs the work-order loop, in exchange for a nicer component model. That rewrite is a Phase 4 conversation if the whole UI is being replaced. It is a bad way to get a sales demo.

three.js loads from a small vendored build (an import map plus `GLTFLoader` and `OrbitControls`), checked into the repo, so a demo laptop and the house server do not depend on a CDN. PocketBase serves it as a static file.

The scene is one of two things, chosen by `building_maps.kind`:

- **Floor plan.** A PNG from a blueprint, a PDF export, or a magicplan sheet, drawn on a flat plane. Pins are x and y. This is the right first demo when the scan is old or does not exist.
- **Mesh.** A GLB from Polycam, or from Blender after an OBJ or USDZ conversion. Pins are x, y, z. Orbit, pan, zoom. Click uses a raycaster. Labels are HTML (CSS2D) so they stay readable.

Both modes read the same `inventory` pin fields and open the same side panel. Swapping a blueprint for a scan later is a file upload on the building, not a new feature.

Placement is an in-app edit mode: click the model, save `map_x/y/z` on the equipment. That is how the second building gets pinned without a developer.

Keep Matterport as a capture tool, not as the viewer embedded in Chapel. Their viewer does not create Chapel work orders, and it requires their account at demo time.

Out of scope for the viewer: photoreal materials, measurements, editing the mesh, and automatic recognition of equipment from the scan. Pins are placed by a person. Recognition is a research project and would make the demo slower.

## Suggested order of work when development restarts

1. Power the house server on only long enough to copy `pb_data` and note which ports are open. Do not develop against that copy until the rules are locked.
2. Boot this repo locally with a new data directory, using the serve command above.
3. Lock the API rules, still on sample data.
4. Build Phase 1 (`map.html`, pin fields, sample campus).
5. Phase 2 equipment record, then Phase 3 supply loop, then companies.

The pull request that added this document does not do any of those steps.
