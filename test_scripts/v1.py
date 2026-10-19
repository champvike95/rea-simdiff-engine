import os
import json

class DataProcessor:
    def __init__(self, path):
        self.path = path

    def load(self):
        with open(self.path) as f:
            return json.load(f)

def run_pipeline(data):
    return [x * 2 for x in data]

def helper(x):
    return x + 1
