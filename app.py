from flask import Flask, jsonify
from flask import request
from flask import render_template
from flask import make_response
import requests
import json
import urllib
import math
import random
#from json2html import *
import movies

app = Flask(__name__)


@app.route('/', methods=['GET'])
def searchTitle():
    return render_template('index.html')

@app.route('/getMovie', methods=['GET'])
def getMovie():
    title = request.args.get('title', '').strip()
    if not title:
        return "No title provided", 400
    return render_template('movie.html', title=title)

@app.route('/getMovieData', methods=['GET'])
def getMovieData():
    title = request.args.get('title')
    if not title:
        return jsonify({"error": "Missing title"}), 400
    return jsonify(movies.search_Title(title))