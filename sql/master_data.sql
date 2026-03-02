-- P&L Simulation — Master Data
-- Run AFTER schema.sql: psql $DATABASE_URL -f sql/master_data.sql
-- Inserts the single admin_config row with all default values.
-- Re-running is safe (ON CONFLICT DO NOTHING).

INSERT INTO admin_config (
  id,
  target_gross_margin, target_direct_margin, project_income_pct,
  roles, contract_types, locations, other_cost_cats, cost_ref
) VALUES (
  1,
  40, 54, 30,

  -- Roles
  '["Project Manager","Business Analyst","Tech Lead","Senior Developer",
    "Developer","Junior Developer","QA Engineer","DevOps","Designer",
    "Comtor","Scrum Master"]'::jsonb,

  -- Contract types
  '["EMP","APP","POI"]'::jsonb,

  -- Locations
  '[
    {"code":"HN",  "name":{"vi":"Hà Nội",      "en":"Hanoi"},       "active":true},
    {"code":"HL",  "name":{"vi":"Hoà Lạc",     "en":"Hoa Lac"},     "active":true},
    {"code":"DN",  "name":{"vi":"Đà Nẵng",     "en":"Da Nang"},     "active":true},
    {"code":"HCM", "name":{"vi":"Hồ Chí Minh", "en":"Ho Chi Minh"}, "active":true},
    {"code":"CT",  "name":{"vi":"Cần Thơ",     "en":"Can Tho"},     "active":true},
    {"code":"QNH", "name":{"vi":"Quy Nhơn",    "en":"Quy Nhon"},    "active":true},
    {"code":"HUE", "name":{"vi":"Huế",          "en":"Hue"},         "active":true},
    {"code":"NT",  "name":{"vi":"Nha Trang",   "en":"Nha Trang"},   "active":true}
  ]'::jsonb,

  -- Other cost categories
  '["AI License","VDI","Office Mini","Office 365","Cloud Infrastructure","Other"]'::jsonb,

  -- Cost reference tables (salary USD/MM + insurance USD/MM by location × package level)
  '{
    "Primer": {
      "salary": {
        "unit": "USD",
        "lastUpdated": "2026-03-02",
        "table": {
          "HN":  {"P1":"236","P2":"409","P3":"562","P4":"802","P5":"1187","P6":"1611","P7":"2094","P8":"2546","P9":"3340"},
          "HL":  {"P1":"236","P2":"409","P3":"562","P4":"802","P5":"1187","P6":"1611","P7":"2094","P8":"2546","P9":"3340"},
          "DN":  {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "HCM": {"P1":"236","P2":"428","P3":"589","P4":"841","P5":"1246","P6":"1694","P7":"2200","P8":"2672","P9":"3340"},
          "CT":  {"P1":"236","P2":"428","P3":"589","P4":"841","P5":"1246","P6":"1694","P7":"2200","P8":"2672","P9":"3340"},
          "QNH": {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "HUE": {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "NT":  {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"}
        }
      },
      "insurance": {
        "unit": "USD",
        "lastUpdated": "2026-03-02",
        "table": {
          "HN":  {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "HL":  {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "DN":  {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "HCM": {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "CT":  {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "QNH": {"P1":"46","P2":"46","P3":"46","P4":"49","P5":"49","P6":"58","P7":"58","P8":"58","P9":"189"},
          "HUE": {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"},
          "NT":  {"P1":"51","P2":"51","P3":"51","P4":"54","P5":"54","P6":"63","P7":"63","P8":"63","P9":"189"}
        }
      }
    },
    "Supplier": {
      "salary": {
        "unit": "USD",
        "lastUpdated": "2026-03-02",
        "table": {
          "HN":  {"P1":"236","P2":"409","P3":"562","P4":"802","P5":"1187","P6":"1611","P7":"2094","P8":"2546","P9":"3340"},
          "HL":  {"P1":"236","P2":"409","P3":"562","P4":"802","P5":"1187","P6":"1611","P7":"2094","P8":"2546","P9":"3340"},
          "DN":  {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "HCM": {"P1":"236","P2":"428","P3":"589","P4":"841","P5":"1246","P6":"1694","P7":"2200","P8":"2672","P9":"3340"},
          "CT":  {"P1":"236","P2":"428","P3":"589","P4":"841","P5":"1246","P6":"1694","P7":"2200","P8":"2672","P9":"3340"},
          "QNH": {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "HUE": {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"},
          "NT":  {"P1":"236","P2":"389","P3":"534","P4":"762","P5":"1128","P6":"1532","P7":"1988","P8":"2420","P9":"3340"}
        }
      },
      "insurance": null
    }
  }'::jsonb

)
ON CONFLICT (id) DO NOTHING;
