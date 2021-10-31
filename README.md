# Run Application
1. Open up 2 terminals inside the proj1 folder and activate the virtual environment in both typing "env/Scripts/activate".
2. In the 1st terminal navigate into the "source" folder and type ' $env:FLASK_APP = "Flask" ' and "flask run" to start the Flask backend server.
3. In the 2nd terminal navigate into the "source" then the "React" folder and type "npm start" to start the React frontend.
4. Your browser should open automatically, if not go to "http://localhost:3000/" in browser.

# Notes
- React folder contains the React frontend code, the instance folder is the SQLite database, and the Flask folder contains the backend server code.
- I'm on Windows using powershell. The commands "env/Scripts/activate" and ' $env:FLASK_APP = "Flask" ' are specific to Windows and powershell respectively. 
