# app/routes.py

import os
from flask import Blueprint, render_template, request, jsonify, current_app
from .utils import allowed_file, parse_txt_file
import pandas as pd
import numpy as np
from scipy.signal import find_peaks
from werkzeug.utils import secure_filename  # Added import

main_bp = Blueprint('main', __name__)

@main_bp.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@main_bp.route('/upload', methods=['POST'])
def upload_file():
    """Handle the file upload and process the data."""
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part in the request.'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'status': 'error', 'message': 'No file selected.'}), 400

    if file and allowed_file(file.filename, current_app.config['ALLOWED_EXTENSIONS']):
        try:
            # Secure the filename and save the uploaded file
            filename = secure_filename(file.filename)
            input_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(input_path)

            # Determine file type and parse accordingly
            file_extension = filename.rsplit('.', 1)[1].lower()
            if file_extension == 'csv':
                df = pd.read_csv(input_path)
                # Ensure required columns exist
                required_columns = ['Elapsed Time', 'Bladder Pressure']
                missing_columns = [col for col in required_columns if col not in df.columns]
                if missing_columns:
                    return jsonify({'status': 'error', 'message': f'CSV is missing columns: {", ".join(missing_columns)}.'}), 400
                # Convert columns to numeric
                df['Elapsed Time'] = pd.to_numeric(df['Elapsed Time'], errors='coerce')
                df['Bladder Pressure'] = pd.to_numeric(df['Bladder Pressure'], errors='coerce')
                df.dropna(subset=['Elapsed Time', 'Bladder Pressure'], inplace=True)
                data = df[['Elapsed Time', 'Bladder Pressure', 'Scale']].to_dict(orient='list')
            elif file_extension == 'txt':
                df = parse_txt_file(input_path)
                if df.empty:
                    return jsonify({'status': 'error', 'message': 'No valid data found in the TXT file.'}), 400
                data = df.to_dict(orient='list')
            else:
                return jsonify({'status': 'error', 'message': 'Unsupported file type.'}), 400

            return jsonify({'status': 'success', 'data': data}), 200
        except Exception as e:
            return jsonify({'status': 'error', 'message': f'Error processing file: {str(e)}'}), 500
    else:
        return jsonify({'status': 'error', 'message': 'Invalid file type. Only CSV and TXT files are allowed.'}), 400

@main_bp.route('/find_peaks', methods=['POST'])
def find_peaks_route():
    """Process data with find_peaks and return peak indices."""
    data = request.get_json()
    csv_data = data.get('csv_data')
    params = data.get('params', {})

    if not csv_data:
        return jsonify({'status': 'error', 'message': 'No data provided.'}), 400

    # Convert csv_data back to DataFrame
    try:
        df = pd.DataFrame(csv_data)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Invalid data format: {str(e)}'}), 400

    headers = df.columns.tolist()

    # Use 'Elapsed Time' and 'Bladder Pressure' columns
    required_columns = ['Elapsed Time', 'Bladder Pressure']
    missing_columns = [col for col in required_columns if col not in headers]
    if missing_columns:
        return jsonify({'status': 'error', 'message': f'Data is missing columns: {", ".join(missing_columns)}.'}), 400

    x = np.array(df['Elapsed Time'])
    y = np.array(df['Bladder Pressure'])

    # Convert parameters to appropriate types and handle default values
    peak_kwargs = {}
    try:
        height = params.get('height')
        distance = params.get('distance')
        prominence = params.get('prominence')
        width = params.get('width')

        if height:
            peak_kwargs['height'] = float(height)
        if distance:
            peak_kwargs['distance'] = float(distance)
        if prominence:
            peak_kwargs['prominence'] = float(prominence)
        if width:
            peak_kwargs['width'] = float(width)
    except ValueError as ve:
        return jsonify({'status': 'error', 'message': f'Invalid parameter value: {str(ve)}'}), 400

    try:
        # Use find_peaks to identify peaks
        peaks, _ = find_peaks(y, **peak_kwargs)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Error finding peaks: {str(e)}'}), 500

    return jsonify({'status': 'success', 'peaks': peaks.tolist()}), 200
