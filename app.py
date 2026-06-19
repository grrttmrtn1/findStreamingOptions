from flask import Flask, jsonify, render_template, request

import config_loader
import movies

app = Flask(__name__)

SUPPORTED_COUNTRIES = [
    {"code": "us", "name": "United States"},
    {"code": "ca", "name": "Canada"},
    {"code": "gb", "name": "United Kingdom"},
    {"code": "au", "name": "Australia"},
    {"code": "de", "name": "Germany"},
    {"code": "fr", "name": "France"},
    {"code": "es", "name": "Spain"},
    {"code": "it", "name": "Italy"},
    {"code": "jp", "name": "Japan"},
    {"code": "br", "name": "Brazil"},
]


@app.route('/', methods=['GET'])
def searchTitle():
    return render_template(
        'index.html',
        default_country=config_loader.get_country(),
        countries=SUPPORTED_COUNTRIES,
    )

@app.route('/getMovie', methods=['GET'])
def getMovie():
    title = request.args.get('title', '').strip()
    country = request.args.get('country', config_loader.get_country()).strip().lower()
    if not title:
        return "No title provided", 400
    return render_template(
        'movie.html',
        title=title,
        country=country,
        countries=SUPPORTED_COUNTRIES,
    )

@app.route('/getMovieData', methods=['GET'])
def getMovieData():
    title = request.args.get('title', '').strip()
    country = request.args.get('country', config_loader.get_country()).strip().lower()
    if not title:
        return jsonify({"error": "Missing title"}), 400
    try:
        results = movies.search_title(title, country)
    except movies.MovieApiError as exc:
        return jsonify({"error": str(exc)}), exc.status_code

    return jsonify({
        "country": country,
        "results": results,
        "total": len(results),
    })

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
