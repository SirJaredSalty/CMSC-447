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


@County.route("/CountyStats",  methods=['POST'])
def UpdateCountyStats():
    db = get_db()

    # Load county's Covid-19 statistics
    counties = db.execute("SELECT * FROM county").fetchall()
    for i in range (len(counties)):
        county_fips = str(counties[i]['fips'])
        stat = db.execute("SELECT * FROM county_statistic where county_fips = ?", (county_fips, )).fetchall()
        print(i, county_fips)

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

