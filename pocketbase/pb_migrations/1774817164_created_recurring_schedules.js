/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "seydfs9wmuzyi9o",
    "created": "2026-03-29 20:46:04.275Z",
    "updated": "2026-03-29 20:46:04.275Z",
    "name": "recurring_schedules",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "1kg5yq7x",
        "name": "site",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "wysdo4aehjk14st",
          "cascadeDelete": false,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "hu2zfeyk",
        "name": "title",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "g6k4halj",
        "name": "category",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "HVAC",
            "Plumbing",
            "Electrical",
            "Fire Safety",
            "Security",
            "Elevator",
            "Roofing",
            "Grounds",
            "Kitchen",
            "AV / Organ",
            "General"
          ]
        }
      },
      {
        "system": false,
        "id": "dmmmeelg",
        "name": "building_scope",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "hn8vg701",
        "name": "priority",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "P1",
            "P2",
            "P3",
            "P4"
          ]
        }
      },
      {
        "system": false,
        "id": "pxb4kx3w",
        "name": "vendor_name",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "9brbtw0d",
        "name": "interval",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "Daily",
            "Weekly",
            "Monthly",
            "Quarterly",
            "Semi-annual",
            "Annual"
          ]
        }
      },
      {
        "system": false,
        "id": "xduxs5jp",
        "name": "next_due",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "uz2uw6ui",
        "name": "notes",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "1muyx0qq",
        "name": "active",
        "type": "bool",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {}
      }
    ],
    "indexes": [],
    "listRule": null,
    "viewRule": null,
    "createRule": null,
    "updateRule": null,
    "deleteRule": null,
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("seydfs9wmuzyi9o");

  return dao.deleteCollection(collection);
})
