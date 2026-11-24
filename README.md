# meeting-slot-picker

Code for a Claude skill that finds free meeting slots in a Google Calendar.
Keeping the code here lets the skill load it instead of rewriting it on every run.

- `selector.js` – `renderSelector(el)`: pick meeting length, days and hours (Hebrew, RTL).
- `picker.js` – `renderPicker(el, slots)`: choose free slots and build a list to paste into an email.
- `find_slots.py` – computes free slots from a Google Calendar `list_events` JSON export.

No calendar data is stored in this repository.
