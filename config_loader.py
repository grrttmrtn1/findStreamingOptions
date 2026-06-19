import configparser
import os
from urllib.parse import urlparse

_config = None

def load_config(path='./config.ini'):
    global _config
    if _config is None:
        _config = configparser.ConfigParser()
        _config.read(path)
    return _config

def validate_config(path='./config.ini') -> bool:
    if not os.path.exists(path):
        print(f"Config file not found at: {path}")
        return False
    try:
        parser = configparser.ConfigParser()
        parser.read(path)
        if not parser.sections():
            print(f"Config file at {path} is empty or improperly formatted.")
            return False
        return True
    except configparser.Error as e:
        print(f"Failed to parse config file: {e}")
        return False


def _get(section, key, default=None):
    env_key = key.upper()
    if env_key in os.environ:
        return os.environ[env_key]

    config = load_config()
    if not config.has_section(section):
        return default
    if not config.has_option(section, key):
        return default
    return config.get(section, key)


def get_country():
    return _get('app', 'country', 'us')

def get_series_granularity():
    return _get('app', 'series_granularity', 'show')
    
def get_output_language():
    return _get('app', 'output_language', 'en')

def get_show_type():
    return _get('app', 'show_type')
    
def get_apiKey():
    return _get('app', 'ApiKey') or os.environ.get('RAPIDAPI_KEY')
    
def get_baseURL():
    return _get('app', 'BaseURL') or os.environ.get('RAPIDAPI_URL')

def get_api_url():
    base_url = get_baseURL()
    if not base_url:
        return None
    if base_url.startswith(('http://', 'https://')):
        return base_url
    return f"https://{base_url}"

def get_api_host():
    api_url = get_api_url()
    if not api_url:
        return None
    return urlparse(api_url).netloc
