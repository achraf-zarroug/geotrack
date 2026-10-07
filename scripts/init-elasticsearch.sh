#!/bin/sh
set -e

curl -X PUT "http://localhost:9200/sites" \
  -H "Content-Type: application/json" \
  -d '{
    "mappings": {
      "properties": {
        "name": {"type": "text"},
        "city": {"type": "text"},
        "type": {"type": "text"},
        "status": {"type": "keyword"},
        "latitude": {"type": "float"},
        "longitude": {"type": "float"}
      }
    }
  }' || true
