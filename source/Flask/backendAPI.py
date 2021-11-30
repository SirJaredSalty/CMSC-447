import json, os
import urllib.request as ur
from datetime import date
from flask import Flask, Blueprint
from flask import request
from flask import Response
from Flask.database import get_db

County = Blueprint('County', __name__)

@County.route("/Initialize",  methods=['POST'])
def InitializeDatabase():
    db = get_db()
    dir_path = os.path.dirname(os.path.realpath(__file__))

    # Get JSON data for counties and states
    countyData = json.load(open(dir_path + '/' + 'CountyInfo.json'))
    stateData = json.load(open(dir_path + '/' + 'StateInfo.json'))
    stateAbbr = json.load(open(dir_path + '/' + 'StateAbbr.json'))

    # Load in states
    for i in range (len(stateData)):
        fips = str(stateData[i]['fips'])
        name = str(stateAbbr[stateData[i]['state']])
        abbr = str(stateData[i]['state'])
        query = "INSERT INTO [state] (fips, [name], abbreviation) VALUES (?, ?, ?)"
        db.execute(query, (fips, name, abbr))
        db.commit()

    # Load counties
    for i in range (len(countyData)):
        fips = str(countyData[i]['fips'])
        name = str(countyData[i]['county'])
        state_abbr = str(countyData[i]['state'])
        pop = int(countyData[i]['population'])
        query = "INSERT INTO county (fips, [name], state_abbr, [population]) VALUES (?, ?, ?, ?)"
        db.execute(query, (fips, name, state_abbr, pop))
        db.commit()

    return Response(status = 200)


@County.route("/UpdateStats",  methods=['GET'])
def UpdateCountyStats():
    db = get_db()
    
    db.execute("DELETE FROM county_statistic")
    db.commit()

    # Load county's Covid-19 statistics
    counties = db.execute("SELECT * FROM county").fetchall()
    for i in range (len(counties)):
        county_fips = str(counties[i]['fips'])
        stat = db.execute("SELECT * FROM county_statistic where county_fips = ?", (county_fips, )).fetchall()
        print(i)

        if len(stat) == 0:
            url = "https://api.covidactnow.org/v2/county/" + county_fips + ".timeseries.json?apiKey=e4071d45fd8647babcc6be35102ae515"
            countyStats = json.load(ur.urlopen(url))

            # Get stats for last 28 days
            for j in range (29, 0, -1):
                index = len(countyStats['actualsTimeseries']) - j
                currVaccineComplete = countyStats['actualsTimeseries'][index]['vaccinationsCompleted']
                currVaccineInitiated = countyStats['actualsTimeseries'][index]['vaccinationsInitiated']
                currDeaths = countyStats['actualsTimeseries'][index]['deaths']
                currCases = countyStats['actualsTimeseries'][index]['cases']
                date = countyStats['actualsTimeseries'][index]['date']
                vacc_complete = currVaccineComplete if isinstance(currVaccineComplete, int) else None
                vacc_initiated = currVaccineInitiated if isinstance(currVaccineInitiated, int) else None
                cases = currCases if isinstance(currCases, int) else None
                deaths = currDeaths if isinstance(currDeaths, int) else None
                query = "INSERT INTO county_statistic ([date], county_fips, vaccines_initiated, vaccines_complete, cases, deaths) VALUES (?, ?, ?, ?, ?, ?)"
                db.execute(query, (date, county_fips, vacc_initiated, vacc_complete, cases, deaths))
                db.commit()

    return Response(status = 200)


@County.route("/County/<string:FIPS>",  methods=['GET'])
def GetCountyStats(FIPS):
    db = get_db()

    queryResult = db.execute("SELECT * FROM county_statistic INNER JOIN county ON county_statistic.county_fips = county.fips WHERE county_fips = ?", (FIPS, )).fetchall()
    if(len(queryResult) == 0):
        return Response(status = 404)

    jsonQuery = []
    currDict = {}

    # Convert the query to a JSON array
    for result in queryResult:
        currDict["date"] = str(result[0])
        currDict["county_fips"] = result[1]
        currDict["vaccines_initiated"] = result[2]
        currDict["vaccines_complete"] = result[3]
        currDict["cases"] = result[4]
        currDict["deaths"] = result[5]
        currDict["name"] = result[7]
        currDict["state"] = result[8]
        currDict["population"] = result[9]
        jsonQuery.append(currDict.copy())
        currDict.clear()

    return json.dumps(jsonQuery)



@County.route("/Favorites",  methods=['GET'])
def GetFavorites():
    db = get_db()

    queryResult = db.execute("SELECT * FROM favorite INNER JOIN county ON favorite.county_fips = county.fips WHERE user_id = ?", (request.args.get('id'), )).fetchall()
    if(len(queryResult) == 0):
        return Response(status = 404)

    jsonQuery = []
    currDict = {}

    # Convert the query to a JSON array
    for result in queryResult:
        currDict["fips"] = result[2]
        currDict["start_date"] = str(result[3])
        currDict["end_date"] = str(result[4])
        currDict["vacc_init"] = result[5]
        currDict["vacc_comp"] = result[6]
        currDict["cases"] = result[7]
        currDict["deaths"] = result[8]
        currDict["name"] = result[10]
        currDict["population"] = result[12]
        jsonQuery.append(currDict.copy())
        currDict.clear()

    return json.dumps(jsonQuery)


@County.route("/Favorites",  methods=['POST'])
def AddFavorites():
    db = get_db()
    
    id = request.args.get('id')
    fips = request.args.get('fips')
    start = request.args.get('start')
    end = request.args.get('end')
    init = request.args.get('init')
    comp = request.args.get('comp')
    cases = request.args.get('cases')
    deaths = request.args.get('deaths')

    query = "INSERT INTO favorite (user_id, county_fips, [start_date], end_date, vaccines_initiated, vaccines_complete, cases, deaths) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    db.execute(query, (id, fips, start, end, init, comp, cases, deaths))
    db.commit()

    return Response(status = 200)


@County.route("/Favorites",  methods=['DELETE'])
def DeleteFavorites():
    db = get_db()
    
    id = request.args.get('id')
    fips = request.args.get('fips')
    start = request.args.get('start')
    end = request.args.get('end')

    db.execute("DELETE FROM favorite WHERE user_id = ? AND county_fips = ? AND [start_date] = ? AND end_date = ?", (id, fips, start, end)).fetchall()
    db.commit()

    return Response(status = 200)


@County.route("/login",  methods=['GET'])
def Login():
    db = get_db()
    
    username = request.args.get('username')
    password= request.args.get('password')

    queryResult = db.execute("SELECT id FROM user WHERE username = ? AND password = ?", (username, password)).fetchall()
    if(len(queryResult) == 0):
        return Response(status = 404)

    return json.dumps({"id": queryResult[0][0]})


@County.route("/login",  methods=['POST'])
def CreateAccount():
    db = get_db()
    
    username = request.args.get('username')
    password= request.args.get('password')
    
    queryResult = db.execute("SELECT * FROM user WHERE username = ? AND [password] = ?", (username, password)).fetchall()
    if(len(queryResult) > 0 or username == ""):
        return Response(status = 404)

    query = "INSERT INTO user (username, [password]) VALUES (?, ?)"
    db.execute(query, (username, password))
    db.commit()
    
    queryResult = db.execute("SELECT id FROM user WHERE username = ? AND password = ?", (username, password)).fetchall()
    return json.dumps({"id": queryResult[0][0]})
