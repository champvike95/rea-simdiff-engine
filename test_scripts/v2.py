import os
import json
import logging

class DataProcessor:
    def __init__(self, path):
        self.path = path

    def load(self):
        with open(self.path) as f:
            return json.load(f)

    def save(self, data):
        with open(self.path, 'w') as f:
            json.dump(data, f)

class Validator:
    def check(self, data):
        return isinstance(data, list)

def run_pipeline(data, verbose=False):
    return [x * 2 for x in data]
