import sys
import zipfile
import xml.etree.ElementTree as ET
import json


def parse_slx_structure(slx_path):
    """Extract block hierarchy and connections from an SLX/XML file."""
    try:
        with zipfile.ZipFile(slx_path, 'r') as z:
            xml_content = z.read('simulink/blockdiagram.xml')
    except Exception:
        with open(slx_path, 'rb') as f:
            xml_content = f.read()

    root = ET.fromstring(xml_content)
    blocks = {}

    for block in root.iter('Block'):
        block_name = block.attrib.get('Name', 'Unknown')
        block_type = block.attrib.get('BlockType', 'Generic')
        sid = block.attrib.get('SID', '')
        ports = [p.attrib for p in block.findall('Port')]

        blocks[block_name] = {
            "type": block_type,
            "sid": sid,
            "ports": ports
        }

    return blocks


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    filepath = sys.argv[1]
    result = parse_slx_structure(filepath)
    print(json.dumps(result, indent=2))
