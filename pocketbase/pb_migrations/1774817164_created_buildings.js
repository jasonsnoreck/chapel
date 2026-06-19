/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "lyw7ly00kgwk6x7",
    "created": "2026-03-29 20:46:04.204Z",
    "updated": "2026-03-29 20:46:04.204Z",
    "name": "buildings",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "xgmndc0r",
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
        "id": "8rzvzvqe",
        "name": "name",
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
        "id": "nyu9lu8y",
        "name": "short_name",
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
        "id": "zxdmrnhw",
        "name": "type",
        "type": "select",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "church",
            "school",
            "offices",
            "rectory",
            "gym",
            "grounds",
            "other"
          ]
        }
      },
      {
        "system": false,
        "id": "1fvs0rpl",
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
  const collection = dao.findCollectionByNameOrId("lyw7ly00kgwk6x7");

  return dao.deleteCollection(collection);
})
