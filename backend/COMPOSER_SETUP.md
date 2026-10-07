# First local setup

The repository intentionally does not commit a generated `composer.lock` in this demo archive.

Inside `backend/` run:

```bash
composer install
```

This creates `composer.lock` and the `vendor/` directory.

Then run the application with Docker from the repository root:

```bash
docker compose up --build
```

After the services are up, initialize the Elasticsearch index:

```bash
sh scripts/init-elasticsearch.sh
```

The MySQL schema can be loaded with:

```bash
docker exec -i geotrack-mysql mysql -ugeotrack -pgeotrack geotrack < backend/database/schema.sql
```
