/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "9irwyqt8gm5y0ir",
    "created": "2026-03-29 21:15:32.080Z",
    "updated": "2026-03-29 21:15:32.080Z",
    "name": "user_profiles",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "3exrvret",
        "name": "auth_email",
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
        "id": "kkthrex7",
        "name": "display_name",
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
        "id": "jz6lglws",
        "name": "role",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "admin",
            "staff",
            "readonly"
          ]
        }
      },
      {
        "system": false,
        "id": "pa4xzbdj",
        "name": "site_access",
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
        "id": "npq5xmjc",
        "name": "phone",
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
        "id": "y6umw0zd",
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
  const collection = dao.findCollectionByNameOrId("9irwyqt8gm5y0ir");

  return dao.deleteCollection(collection);
})
