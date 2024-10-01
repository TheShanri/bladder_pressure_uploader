# app/utils.py

import os
import pandas as pd
from werkzeug.utils import secure_filename

def allowed_file(filename, allowed_extensions):
    """
    Check if the uploaded file has an allowed extension.
    """
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def parse_txt_file(file_path):
    """
    Parse the custom txt file to extract 'Elapsed Time' and 'Bladder Pressure'.
    Assumes tab-separated values with metadata before the header line.
    """
    with open(file_path, 'r') as f:
        lines = f.readlines()

    # Find the line that starts with 'Elapsed Time'
    header_index = None
    for i, line in enumerate(lines):
        if line.strip().startswith('Elapsed Time'):
            header_index = i
            break

    if header_index is None:
        raise ValueError("Header line starting with 'Elapsed Time' not found.")

    # Extract headers
    headers = lines[header_index].strip().split('\t')
    expected_columns = len(headers)

    # Read the data starting from the line after the header
    data_lines = lines[header_index + 1:]

    data = []
    for line_num, line in enumerate(data_lines, start=header_index + 2):
        if line.strip() == '':
            continue  # Skip empty lines
        split_line = line.strip().split('\t')
        if len(split_line) < expected_columns:
            # Pad the missing columns with empty strings
            split_line += [''] * (expected_columns - len(split_line))
        elif len(split_line) > expected_columns:
            # Truncate the extra columns
            split_line = split_line[:expected_columns]
        data.append(split_line)

    # Create a DataFrame
    df = pd.DataFrame(data, columns=headers)

    # Convert relevant columns to numeric, coerce errors to NaN
    df['Elapsed Time'] = pd.to_numeric(df['Elapsed Time'], errors='coerce')
    df['Bladder Pressure'] = pd.to_numeric(df['Bladder Pressure'], errors='coerce')

    # Drop rows with NaN values in 'Elapsed Time' or 'Bladder Pressure'
    df.dropna(subset=['Elapsed Time', 'Bladder Pressure'], inplace=True)

    return df[['Elapsed Time', 'Bladder Pressure']]
