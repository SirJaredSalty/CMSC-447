# Run Application
1. Open up 2 terminals inside the CMSC-447 folder and activate the virtual environment in both by typing "env/Scripts/activate".
2. In the 1st terminal go into the "source" folder and type "npm start" to start the http server.
3. In the 2nd terminal go into the "source" folder and type ' $env:FLASK_APP = "Flask" ' and "flask run" to start the Flask backend server.
4. Open browser and type localhost:8000.

# Updating the Database
If clicking on a county says "TypeError: Cannot read properties of undefined (reading 'name')" then the entire date range selected has no data 
in the database. You'll need to update it by typing "localhost:5000/UpdateStats" into your browser. This takes **awhile** and you'll know it's 
done once the webpage loads. You can track the progress of the database update by looking at the terminal for the flask backend. It will take
3222 iterations to fill data for all counties in the past 28 days.  

# Notes
- HTML folder contains the frontend code, the instance folder is the SQLite database, and the Flask folder contains the backend server code.
- I'm on Windows using powershell. The commands "env/Scripts/activate" and ' $env:FLASK_APP = "Flask" ' are specific to Windows and powershell respectively.