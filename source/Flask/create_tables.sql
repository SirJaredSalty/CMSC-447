DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS favorite;
DROP TABLE IF EXISTS county;
DROP TABLE IF EXISTS county_statistic;
DROP TABLE IF EXISTS [state];

CREATE TABLE user (
  id INTEGER PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  [password] TEXT NOT NULL
);

CREATE TABLE favorite (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  county_fips INTEGER NOT NULL,
  FOREIGN KEY(user_id) REFERENCES user(id),
  FOREIGN KEY(county_fips) REFERENCES county(fips)
);

CREATE TABLE county (
  fips INTEGER PRIMARY KEY,
  [name] TEXT NOT NULL,
  state_abbr INTEGER NOT NULL,
  FOREIGN KEY(state_abbr) REFERENCES [state](abbreviation)
);

CREATE TABLE county_statistic (
  [date] DATE PRIMARY KEY,
  county_fips INTEGER,
  [population] INTEGER,
  vaccine_rate FLOAT,
  cases INTEGER,
  deaths INTEGER,
  FOREIGN KEY(county_fips) REFERENCES county(fips)
);

CREATE TABLE [state] (
  fips INTEGER PRIMARY KEY,
  [name] TEXT NOT NULL UNIQUE,
  abbreviation TEXT UNIQUE NOT NULL
);