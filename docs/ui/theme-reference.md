# UI Theme Reference

Source reference: `C:/Users/Hawkseye/Downloads/ChatGPT Image Apr 28, 2026, 11_03_40 PM.png`

This is the visual direction for the EgriProject MVP UI. Follow it throughout the system when UI implementation begins.

## Overall Direction

- Clean agricultural operations dashboard for farm owners and managers.
- Light, dense, work-focused interface with green as the primary brand color.
- Prioritize scanability, compact data presentation, and fast repeated use over marketing-style composition.
- Use consistent shells, cards, tables, controls, and status treatments across all modules.

## Visual Style

- Primary color: deep farm green for headers, sidebar active states, primary buttons, success accents, and section labels.
- Backgrounds: mostly white and very light gray/off-white page surfaces.
- Borders: subtle light gray dividers around cards, tables, inputs, and panels.
- Corners: small radius, approximately 6-8px; avoid overly rounded/pill-heavy styling except for compact badges or toggles.
- Shadows: minimal or none; rely on borders, spacing, and hierarchy.
- Typography: compact, professional sans-serif with clear section titles, small table text, and readable numeric summaries.

## Layout Patterns

- Use a persistent left sidebar for primary MVP modules.
- Use a compact topbar with search and utility icons where appropriate.
- Main pages should use dashboard-style grids: summary cards, tables, charts, maps, and activity/status panels.
- Keep pages information-dense but orderly, with strong alignment and consistent spacing.
- Cards should frame individual functional blocks only; avoid decorative nested cards.

## Component Direction

- Buttons: green primary actions, subtle bordered secondary actions, compact sizing.
- Tables: clean grid rows, clear headers, compact cells, status text or badges in green/orange/red as needed.
- Forms: aligned labels and inputs, tabbed/step sections for larger reports, compact action row at the bottom.
- Charts: simple operational charts with restrained color accents; avoid visual noise.
- Icons: small practical icons for navigation, actions, statuses, and empty/loading states.
- Maps/images: use real operational visuals where relevant, especially for land blocks and crop reporting.

## Tone By Module

- Dashboard: quick operational snapshot with KPIs, trend charts, alerts, inventory/labor summaries, and activity map.
- Farms & Land: tables plus a land-block map visualization.
- Crop Seasons: status table plus stage/progress timeline.
- Daily Reports: structured multi-section form with photo upload area.
- Labor, Expenses, Inventory, Harvest & Sales: compact tables plus summaries/charts where useful.
- Reports: grouped report actions and export buttons.
- Settings: restrained admin panels for general settings, categories, users, notifications, and profile.

## Current Constraint

Do not implement UI components, layouts, styles, pages, shadcn setup, or business logic until that work is explicitly requested. This document is only a theme reference for future implementation.
