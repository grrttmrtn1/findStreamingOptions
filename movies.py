import requests
import config_loader

def search_Title(title):
    try:
        if not config_loader.get_apiKey() or not config_loader.get_baseURL():
            raise("Ensure both API Key and Base URL are set in your config")
        if not config_loader.get_output_language() or not config_loader.get_series_granularity():
            raise("Ensure required parameters are included in the config")
        querystring = {"country":config_loader.get_country(),"series_granularity":config_loader.get_series_granularity(),"output_language": config_loader.get_output_language(), "title": title }
        headers = {
            "x-rapidapi-key": config_loader.get_apiKey(),
            "x-rapidapi-host": config_loader.get_baseURL()
        }
        r = requests.get(f"https://{config_loader.get_baseURL()}", headers=headers, params=querystring)
        if r.status_code != 200:
            r.raise_for_status()
        return r.json()
    except Exception as e:
        print(e)