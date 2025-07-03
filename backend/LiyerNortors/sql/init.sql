CREATE TABLE "user"(
    uid SERIAL PRIMARY KEY ,
    name TEXT UNIQUE NOT NULL ,
    password TEXT NOT NULL ,
    modified INT NOT NULL DEFAULT 0,
    tags TEXT[] DEFAULT ARRAY['default']::TEXT[]
);

CREATE TABLE canvans(
    uid INT ,
    pid TEXT  ,
    tags TEXT[]  ,
    PRIMARY KEY(uid, pid)
);