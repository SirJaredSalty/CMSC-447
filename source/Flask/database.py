import sqlite3
import click
from flask import current_app, g
from flask.cli import with_appcontext
from flask import Flask
from sqlalchemy.engine import Engine
from sqlalchemy import event

# The main purpose of this file was used when initally creating the SQLite database.
# Credit given to the Flask documentation https://flask.palletsprojects.com/en/2.0.x/tutorial/database/. 

# Create a new database instance or returns an existing one.
# Always called to retrieve the database when starting the Flask server.
def get_db():
    if 'db' not in g:
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row

    g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

# Closes the database connection
def close_db(e=None):
    db = g.pop('db', None)

    if db is not None:
        db.close()

# Initialize the database. Runs the create_tables SQL file. 
def init_db():
    db = get_db()

    with current_app.open_resource('create_tables.sql') as f:
        db.executescript(f.read().decode('utf8'))

# Initialize the Flask instance
def init_app(app):
    app.teardown_appcontext(close_db)
    app.cli.add_command(init_db_command)

# Create the database 
@click.command('init-db')
@with_appcontext
def init_db_command():
    """Clear the existing data and create new tables."""
    init_db()
    click.echo('Initialized the database.')