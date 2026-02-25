DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'budgetapp') THEN
      CREATE ROLE budgetapp LOGIN PASSWORD 'budgetapp';
   END IF;
END
$$;

SELECT 'CREATE DATABASE budgetapp_dev OWNER budgetapp'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'budgetapp_dev')\gexec
GRANT ALL PRIVILEGES ON DATABASE budgetapp_dev TO budgetapp;
