CREATE NODE TABLE Person (
    id UUID PRIMARY KEY,
    first_name STRING,
    middle_name STRING,
    last_name STRING,
    birth_name STRING,
    gender STRING,
    is_dead BOOLEAN,
    birth_date_year INT,
    birth_date_month INT,
    birth_date_day INT,
    death_date_year INT,
    death_date_month INT,
    death_date_day INT
);

CREATE REL TABLE IS_PARENT_OF(FROM Person TO Person);

CREATE REL TABLE IS_MARRIED(
    FROM Person TO Person,
    since_year INT,
    since_month INT,
    since_day INT,
    until_year INT,
    until_month INT,
    until_day INT
);

CREATE REL TABLE IS_SIBLING(FROM Person TO Person, is_half BOOLEAN);

COPY Person FROM "${dataPathPrefix}/people.csv" (HEADER=true);

COPY IS_PARENT_OF FROM "${dataPathPrefix}/parent-relations.csv" (HEADER=true);

COPY IS_MARRIED FROM "${dataPathPrefix}/marriage-relations.csv" (HEADER=true);

MATCH (p1:Person)<-[:IS_PARENT_OF]-(parent)-[:IS_PARENT_OF]->(p2:Person)
WHERE id(p1) < id(p2)
WITH p1, p2, collect(DISTINCT parent) AS parents
MERGE (p1)-[s:IS_SIBLING]->(p2)
SET s.is_half = CASE WHEN size(parents) = 1 THEN true ELSE false END;