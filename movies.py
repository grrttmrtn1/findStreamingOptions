from functools import lru_cache

import requests

import config_loader


class MovieApiError(RuntimeError):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.status_code = status_code


def _require_config():
    api_key = config_loader.get_apiKey()
    api_url = config_loader.get_api_url()
    api_host = config_loader.get_api_host()

    if not api_key:
        raise MovieApiError("RapidAPI key is not configured.", 500)
    if not api_url or not api_host:
        raise MovieApiError("RapidAPI URL is not configured.", 500)

    return api_key, api_url, api_host


@lru_cache(maxsize=256)
def _search_title_cached(title, country, output_language, series_granularity):
    api_key, api_url, api_host = _require_config()
    querystring = {
        "country": country,
        "series_granularity": series_granularity,
        "output_language": output_language,
        "title": title,
    }
    headers = {
        "x-rapidapi-key": api_key,
        "x-rapidapi-host": api_host,
    }

    try:
        response = requests.get(
            api_url,
            headers=headers,
            params=querystring,
            timeout=8,
        )
        response.raise_for_status()
    except requests.Timeout as exc:
        raise MovieApiError("Streaming availability lookup timed out.", 504) from exc
    except requests.HTTPError as exc:
        status = exc.response.status_code if exc.response is not None else 502
        if status in {401, 403}:
            message = "Streaming availability API rejected the configured credentials."
        elif status == 429:
            message = "Streaming availability API rate limit reached."
        else:
            message = "Streaming availability API request failed."
        raise MovieApiError(message, 502) from exc
    except requests.RequestException as exc:
        raise MovieApiError("Streaming availability API is unavailable.", 503) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise MovieApiError("Streaming availability API returned invalid JSON.", 502) from exc

    if not isinstance(payload, list):
        raise MovieApiError("Streaming availability API returned an unexpected response.", 502)

    return payload


def search_title(title, country=None):
    cleaned_title = (title or "").strip()
    cleaned_country = (country or config_loader.get_country() or "us").strip().lower()
    output_language = config_loader.get_output_language() or "en"
    series_granularity = config_loader.get_series_granularity() or "show"

    if not cleaned_title:
        raise MovieApiError("A title is required.", 400)
    if len(cleaned_title) > 120:
        raise MovieApiError("Title must be 120 characters or fewer.", 400)
    if not cleaned_country.isalpha() or len(cleaned_country) != 2:
        raise MovieApiError("Country must be a two-letter country code.", 400)

    return _search_title_cached(
        cleaned_title,
        cleaned_country,
        output_language,
        series_granularity,
    )


# Backward-compatible name for older imports.
def search_Title(title):
    return search_title(title)
