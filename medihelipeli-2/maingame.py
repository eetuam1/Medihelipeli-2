import json
import os
from flask import Flask, request
from flask_cors import CORS
from geopy import distance
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling
import random

load_dotenv()

app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

conn_pool = pooling.MySQLConnectionPool(
    pool_name="my_pool",
    pool_size=5,
    host=os.environ.get('HOST'),
    port=3306,
    database=os.environ.get('DB_NAME'),
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASS'),
    autocommit=True
)

# Set up a connection pool
conn_nonpool = mysql.connector.connect(
    host=os.environ.get('HOST'),
    port=3306,
    database=os.environ.get('DB_NAME'),
    user=os.environ.get('DB_USER'),
    password=os.environ.get('DB_PASS'),
    autocommit=True
)


# Function to get a connection from the pool
def get_connection():
    return conn_pool.get_connection()


# set-up screen name
@app.route('/newgame')
def newgame():
    args = request.args
    player = args.get('player')
    sql = (f"UPDATE player SET screen_name = '{player}', location = 'ENTR', "
           f"patient_goal = 0, patient_qty = 0, range_km = 5000 WHERE id = 1")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        cursor.close()

    sql2 = f"UPDATE patient SET rescued = 0"
    with get_connection() as conn:
        cursor2 = conn.cursor()
        cursor2.execute(sql2)
        cursor2.close()

    return []


# fetch all data from airport DB
@app.route('/airportdata')
def airportdata():
    with get_connection() as conn:
        sql = 'SELECT * FROM airport'
        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql)
        result = json.dumps(cursor.fetchall())
    return result


# fetches player data
@app.route('/playerdata')
def playerdata():
    with get_connection() as conn:
        sql2 = 'SELECT * FROM player'

        cursor = conn.cursor(dictionary=True)
        cursor.execute(sql2)
        result2 = json.dumps(cursor.fetchall())
    return result2


# updates new player data to sql
@app.route('/updateplayer')
def updateplayer():

    args = request.args
    location = args.get('location')
    range_km = int(args.get('range_km'))

    if range_km < 0:
        range_km = 0

    sql = f"UPDATE player SET location = '{location}', range_km = '{range_km}' WHERE id = 1"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        cursor.close()
    return []


@app.route('/updatehome')
def updatehome():
    sql = ""
    args = request.args
    patient_qty = args.get('pqty')

    if patient_qty in ['1', '2']:
        sql = f"UPDATE player SET patient_qty = 0, patient_goal = patient_goal + '{patient_qty}' WHERE id = 1"

    elif patient_qty in ['3']:
        sql = (f"UPDATE player SET range_km = range_km + 500, "
               f"patient_qty = 0, patient_goal = patient_goal + '{patient_qty}' WHERE id = 1")

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        cursor.close()
    return []

# GEOPY


# fetches current range
def player_range():
    sql = 'SELECT range_km FROM player'
    cursor = conn_nonpool.cursor()
    cursor.execute(sql)
    result = cursor.fetchone()
    cursor.close()
    return result[0]


# fetches player coordinates

def player_coordinates():
    sql = ("SELECT ident, latitude_deg, longitude_deg FROM airport "
           "INNER JOIN player ON airport.ident = player.location;")

    cursor = conn_nonpool.cursor()
    cursor.execute(sql)
    result = cursor.fetchone()
    coords = (result[1], result[2])

    return coords


# compares distances between locations

@app.route('/distances')
def distances():
    sql = 'SELECT ident, municipality, latitude_deg, longitude_deg FROM airport'

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        result = cursor.fetchall()

    player_coords = player_coordinates()  # Get player coordinates once

    locations = []

    if cursor.rowcount > 0:

        for res in result:
            # coordinates of each airport
            target_coords = (res[2], res[3])

            # comparison between current location and all other possible destinations
            comparison = int(distance.distance(player_coords, target_coords).km)

            # if other destination is within range, its info is added to a list
            locations.append({
                'ident': res[0],
                'municipality': res[1],
                'distance_km': comparison
            })

        # Convert Python list to a JSON-formatted string using json.dumps
        locations_json = json.dumps(locations)

    else:
        locations_json = ""

    # Return the JSON string
    return locations_json


@app.route('/randomizepatientlocations')
def patient_randomizer():
    icaolist = []

    # Lisää 12 eri sijaintia listaan
    while len(icaolist) < 12:
        m = random.randint(2, 21)
        if m not in icaolist:
            icaolist.append(m)

    # Päivittää tietokantaan missä sijainneissa potilaat ovat
    for i in range(12):
        location_list = icaolist[i]
        sql = (f"UPDATE patient SET location = (SELECT ident FROM airport WHERE airport.id = '{location_list}') "
               f"WHERE patient.id = '{i + 1}'")
        with get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(sql)
            cursor.close()
    return []


@app.route('/rescued')
def rescued():
    sql = f"UPDATE patient SET rescued = 1 WHERE location = (SELECT location FROM player)"

    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql)
        cursor.close()

    sql2 = f"UPDATE player SET patient_qty = patient_qty + 1"

    with get_connection() as conn:
        cursor2 = conn.cursor()
        cursor2.execute(sql2)
        cursor2.close()

    return []


@app.route('/patientdata')
def patient_data():

    sql = (f"SELECT patient.location, airport.municipality FROM patient INNER JOIN "
           f"airport ON airport.ident = patient.location WHERE patient.rescued = 0 "
           f"ORDER BY patient.id desc LIMIT 3;")
    cursor = conn_nonpool.cursor(dictionary=True)
    cursor.execute(sql)

    result = json.dumps(cursor.fetchall())
    return result


@app.route('/wikipediaapi')
def wikipediaapi():
    sql = "SELECT municipality FROM airport, player WHERE player.location = airport.ident"

    cursor = conn_nonpool.cursor(dictionary=True)
    cursor.execute(sql)

    result = json.dumps(cursor.fetchall())
    return result


if __name__ == '__main__':
    app.run(use_reloader=True, host='127.0.0.1', port=5000)
