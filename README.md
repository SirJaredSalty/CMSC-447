# Run Application
1. Open up 2 terminals inside the CMSC-447 folder and activate the virtual environment in both by typing "env/Scripts/activate".
2. In the 1st terminal go into the "source" folder and type "npm start" to start the http server.
3. In the 2nd terminal go into the "source" folder and type ' $env:FLASK_APP = "Flask" ' and "flask run" to start the Flask backend server.
4. Open browser and type localhost:8000.

# Notes
- HTML folder contains the frontend code, the instance folder is the SQLite database, and the Flask folder contains the backend server code.
- I'm on Windows using powershell. The commands "env/Scripts/activate" and ' $env:FLASK_APP = "Flask" ' are specific to Windows and powershell respectively. 