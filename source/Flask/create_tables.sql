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
  county_fips TEXT NOT NULL,
  [start_date] DATE NOT NULL,
  end_date DATE NOT NULL, 
  vaccines_initiated INTEGER,
  vaccines_complete INTEGER,
  cases INTEGER,
  deaths INTEGER,
  FOREIGN KEY(user_id) REFERENCES user(id),
  FOREIGN KEY(county_fips) REFERENCES county(fips)
);

CREATE TABLE county (
  fips TEXT PRIMARY KEY,
  [name] TEXT NOT NULL,
  state_abbr INTEGER NOT NULL,
  [population] INTEGER NOT NULL,
  FOREIGN KEY(state_abbr) REFERENCES [state](abbreviation)
);

CREATE TABLE county_statistic (
  [date] DATE NOT NULL,
  county_fips TEXT NOT NULL,
  vaccines_initiated INTEGER,
  vaccines_complete INTEGER,
  cases INTEGER,
  deaths INTEGER,
  PRIMARY KEY([date], county_fips),
  FOREIGN KEY(county_fips) REFERENCES county(fips)
);

CREATE TABLE [state] (
  fips TEXT PRIMARY KEY,
  [name] TEXT NOT NULL UNIQUE,
  abbreviation TEXT UNIQUE NOT NULL
);