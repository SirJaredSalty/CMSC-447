import os
from flask import Flask
from flask_cors import CORS

# Credit given to the Flask documentation https://flask.palletsprojects.com/en/2.0.x/tutorial/database/. 

# Function used to initialize the Flask instance and start up the database.
def create_app(test_config=None):
    # Create and configure the app
    app = Flask(__name__, instance_relative_config=True)
    CORS(app)
    app.config.from_mapping(
        SECRET_KEY='dev',
        DATABASE=os.path.join(app.instance_path, 'Flask.sqlite'),
    )

    if test_config is None:
        # Load the instance config, if it exists, when not testing
        app.config.from_pyfile('config.py', silent=True)
    else:
        # Load the test config if passed in
        app.config.from_mapping(test_config)

    # Ensure the instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize the Flask instance with the database
    from . import database
    database.init_app(app)

    # Create a blueprint for the County API route calls
    from . import backendAPI
    app.register_blueprint(backendAPI.County)

    return app