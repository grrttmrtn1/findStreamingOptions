import configparser
import os

_config = None

def load_config(path='/home/gmartin/dev/findMovies/config.ini'):
    global _config
    if _config is None:
        _config = configparser.ConfigParser()
        _config.read(path)
    return _config

def validate_config(path='/home/gmartin/dev/findMovies/config.ini') -> bool:
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


def _get(section, key):
    config = load_config()
    if not config.has_section(section):
        return False
    if not config.has_option(section, key):
        return False
    return True


def get_country():
    if _get('app', 'country'):
        return load_config().get('app', 'country')
    return False

def get_series_granularity():
    if _get('app', 'series_granularity'):
        return load_config().get('app', 'series_granularity')
    return False
    
def get_output_language():
    if _get('app', 'output_language'):
        return load_config().get('app', 'output_language')
    return False

def get_show_type():
    if _get('app', 'show_type'):
        return load_config().get('app', 'show_type')
    return False
    
def get_apiKey():
    if _get('app', 'ApiKey'):
        return load_config().get('app', 'ApiKey')
    return False
    
def get_baseURL():
    if _get('app', 'BaseURL'):
        return load_config().get('app', 'BaseURL')
    return False

