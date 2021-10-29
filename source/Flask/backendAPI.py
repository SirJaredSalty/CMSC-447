import json, os
from flask import Flask, Blueprint
from flask import request
from flask import Response
from Flask.database import get_db

APIKEY = "e4071d45fd8647babcc6be35102ae515"
User = Blueprint('User', __name__)

@User.route("/",  methods=['POST'])
def InitializeDatabase():
    db = get_db()
    dir_path = os.path.dirname(os.path.realpath(__file__))

    # Query is dynamic depending on the input given to search a user/users
    countyData = json.load(open(dir_path + '/' + 'CountyInfo.json'))
    stateData = json.load(open(dir_path + '/' + 'StateInfo.json'))
    stateAbbr = json.load(open(dir_path + '/' + 'StateAbbr.json'))

    # Load in states
    for i in range (len(stateData)):
        fips = int(stateData[i]['fips'])
        name = str(stateAbbr[stateData[i]['state']])
        abbr = str(stateData[i]['state'])
        query = "INSERT INTO [state] (fips, [name], abbreviation) VALUES (?, ?, ?)"
        db.execute(query, (fips, name, abbr))
        db.commit()

    # Load counties
    for i in range (len(countyData)):
        fips = int(countyData[i]['fips'])
        name = str(countyData[i]['county'])
        state_abbr = str(countyData[i]['state'])
        query = "INSERT INTO county (fips, [name], state_abbr) VALUES (?, ?, ?)"
        db.execute(query, (fips, name, state_abbr))
        db.commit()


    for i in range (len(countyData)):
        currVaccine = countyData[i]['metrics']['vaccinationsCompletedRatio']
        currDeaths = countyData[i]['actuals']['deaths']
        currCases = countyData[i]['actuals']['cases']
        date = int(countyData[i]['fips'])
        county_fips = int(countyData[i]['fips'])
        pop = int(countyData[i]['population'])
        vacc_rate = currVaccine if isinstance(currVaccine, float) else None
        cases = currCases if isinstance(currCases, int) else None
        deaths = currDeaths if isinstance(currDeaths, int) else None
        query = "INSERT INTO county_statistic ([date], county_fips, [population], vaccine_rate, cases, deaths) VALUES (?, ?, ?, ?, ?, ?)"
        db.execute(query, (date, county_fips, pop, vacc_rate, cases, deaths))
        db.commit()

    queryResult = db.execute("SELECT * FROM county_statistic").fetchall()
    jsonQuery = []
    currDict = {}

    # Convert the query to a JSON array
    for result in queryResult:
        currDict["fips"] = result[0]
        currDict["name"] = result[1]
        currDict["state_abbr"] = result[2]
        currDict["population"] = result[3]
        currDict["vaccine_rate"] = result[4]
        currDict["cases"] = result[5]
        currDict["deaths"] = result[6]
        jsonQuery.append(currDict.copy())
        currDict.clear()

    return json.dumps(jsonQuery)


# Route that will Update/Put data of an existing user depending on the passed ID.
@User.route("/<string:userID>",  methods=['PUT'])
def UpdateUser(userID):
    db = get_db()

    # Check if the ID given exists in the database
    if(len(db.execute("SELECT * FROM user WHERE id = "  + str(userID).strip()).fetchall()) == 0):
        return Response(status = 404)
    
    # Dynamically set new attributes to a user depending on what information wants to be change.
    query = "UPDATE user SET "
    if(request.args.get("name").strip() != ""):
        query += ("full_name = '" + request.args.get("name").strip() + "', ")

    if(request.args.get("id").strip() != ""):
        query += ("id = " + request.args.get("id").strip() + ", ")

    if(request.args.get("points").strip() != ""):
        query += ("points = " + request.args.get("points").strip() + ", ")

    # Run the query and update the user
    query = query[:-2]
    query += (" WHERE id = " + str(userID).strip())
    db.execute(query)
    db.commit() 

    # Execute another query to retrieve an updated list of users after the Update/Put
    queryResult = db.execute("SELECT * FROM user").fetchall()
    jsonQuery = []
    currDict = {}

    # Convert the query to a JSON array
    for result in queryResult:
        currDict["id"] = result[0]
        currDict["full_name"] = result[1]
        currDict["points"] = result[2]
        jsonQuery.append(currDict.copy())
        currDict.clear()

    return json.dumps(jsonQuery)