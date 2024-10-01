# Bladder Pressure Data Uploader Application

## Overview

The **Bladder Pressure Data Uploader** is a web-based application designed to upload, parse, visualize, and analyze bladder pressure data from `.txt` and `.csv` files. It offers interactive features such as point selection, data deletion, peak detection with customizable parameters, and data exporting.

## Features

- **File Uploading:** Supports `.txt` and `.csv` formats with secure file handling.
- **Data Parsing and Validation:** Extracts essential columns (`Elapsed Time` and `Bladder Pressure`) and ensures data integrity.
- **Interactive Data Visualization:** Utilizes Plotly.js to render dynamic graphs with a dark-themed interface.
- **Point Selection and Deletion:** Select up to two data points to delete a range of data points, with an option to undo.
- **Peak Detection:** Identify peaks using SciPy's `find_peaks` with real-time adjustable parameters.
- **Custom Annotations:** Add vertical lines at specific points using keyboard inputs (`0`, `1`, `2`, `3` for different colors).
- **Data Exporting:** Download the manipulated data as a `.csv` file.

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package installer)

### Steps

1. **Clone the Repository**

   ```bash
   git clone https://github.com/yourusername/bladder_pressure_uploader.git
   cd bladder_pressure_uploader
