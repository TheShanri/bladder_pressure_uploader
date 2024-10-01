// app/static/js/main.js

let csvData = {};
let selectedPoints = [];
let plotInitialized = false;
let previousData = null;
let peakIndices = [];
let customLines = [];
let mouseX = null;

// Debounce function to limit the rate of findPeaks calls
function debounce(func, delay) {
    let debounceTimer;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(context, args), delay);
    };
}

// Debounced version for slider real-time updates
const debouncedFindPeaks = debounce(function() {
    findPeaks();
}, 300); // 300ms delay

// Function to upload the file to the backend
document.getElementById('upload-button').addEventListener('click', uploadFile);

function uploadFile() {
    // Reset variables
    csvData = {};
    selectedPoints = [];
    previousData = null;
    peakIndices = [];
    customLines = [];
    document.getElementById('undo-button').disabled = true;
    document.getElementById('peak-sliders').style.display = 'none';
    document.getElementById('find-peaks-button').style.display = 'none';
    document.getElementById('export-button').style.display = 'none';
    document.getElementById('message').innerHTML = '';

    const fileInput = document.getElementById('file-input');
    if (!fileInput.files[0]) {
        alert('Please select a file.');
        return;
    }
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            csvData = data.data;
            document.getElementById('export-button').style.display = 'inline-block';
            document.getElementById('find-peaks-button').style.display = 'inline-block';
            // Plot the data
            plotData();
            // Attach event handler for point clicks
            if (!plotInitialized) {
                attachEventHandlers();
                plotInitialized = true;
            }
        } else {
            alert(data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Function to plot the data using Plotly.js
// Function to plot the data using Plotly.js
function plotData() {
    if (!csvData || Object.keys(csvData).length === 0) {
        return;
    }

    const headers = Object.keys(csvData);
    let xData, yPressure, yScale;

    if (headers.includes('Elapsed Time') && headers.includes('Bladder Pressure') && headers.includes('Scale')) {
        xData = csvData['Elapsed Time'];
        yPressure = csvData['Bladder Pressure'];
        yScale = csvData['Scale'];
    } else {
        // Handle missing columns if necessary
        console.error('Required columns are missing in the data.');
        return;
    }

    // Prepare the Bladder Pressure trace
    const tracePressure = {
        x: xData,
        y: yPressure,
        mode: 'lines',
        type: 'scattergl',
        line: {
            color: 'green',
            width: 1.5
        },
        name: 'Bladder Pressure',
        selectedpoints: selectedPoints,
        selected: {
            marker: {
                color: 'red',
                size: 8
            }
        },
        unselected: {
            marker: {
                opacity: 0.8
            }
        }
    };

    // Prepare the Scale trace
    const traceScale = {
        x: xData,
        y: yScale,
        mode: 'lines',
        type: 'scattergl',
        line: {
            color: 'blue',
            width: 1.5
        },
        name: 'Scale'
    };

    // Vertical lines for selected points
    const selectedLines = selectedPoints.map(index => {
        const xValue = xData[index];
        return {
            x: [xValue, xValue],
            y: [Math.min(...yPressure, ...yScale), Math.max(...yPressure, ...yScale)],
            mode: 'lines',
            line: {
                color: 'red',
                width: 1,
                dash: 'dash'
            },
            showlegend: false,
            hoverinfo: 'none',
            type: 'scattergl'
        };
    });

    // Vertical lines for identified peaks (Pressure)
    const peakLines = peakIndices.map(index => {
        const xValue = xData[index];
        return {
            x: [xValue, xValue],
            y: [Math.min(...yPressure, ...yScale), Math.max(...yPressure, ...yScale)],
            mode: 'lines',
            line: {
                color: 'purple',
                width: 1,
                dash: 'dash'
            },
            showlegend: false,
            hoverinfo: 'none',
            type: 'scattergl'
        };
    });

    // Custom vertical lines added via keypress
    const customKeyLines = customLines.map(line => {
        return {
            x: [line.x, line.x],
            y: [Math.min(...yPressure, ...yScale), Math.max(...yPressure, ...yScale)],
            mode: 'lines',
            line: {
                color: line.color,
                width: 1,
                dash: 'dash'
            },
            showlegend: false,
            hoverinfo: 'none',
            type: 'scattergl'
        };
    });

    const dataPressure = [tracePressure, ...selectedLines, ...peakLines, ...customKeyLines];
    const dataScale = [traceScale];

    const layoutPressure = {
        title: 'Bladder Pressure Over Time',
        xaxis: {
            title: 'Elapsed Time (s)',
            color: 'white',
            tickcolor: 'white',
            gridcolor: 'gray',
            zerolinecolor: 'gray'
        },
        yaxis: {
            title: 'Bladder Pressure (mm Hg)',
            color: 'white',
            tickcolor: 'white',
            gridcolor: 'gray',
            zerolinecolor: 'gray'
        },
        plot_bgcolor: 'black',
        paper_bgcolor: 'black',
        font: {
            color: 'white'
        },
        showlegend: false
    };

    const layoutScale = {
        title: 'Scale Over Time',
        xaxis: {
            title: 'Elapsed Time (s)',
            color: 'white',
            tickcolor: 'white',
            gridcolor: 'gray',
            zerolinecolor: 'gray'
        },
        yaxis: {
            title: 'Scale',
            color: 'white',
            tickcolor: 'white',
            gridcolor: 'gray',
            zerolinecolor: 'gray'
        },
        plot_bgcolor: 'black',
        paper_bgcolor: 'black',
        font: {
            color: 'white'
        },
        showlegend: false
    };

    // Update or create the Bladder Pressure plot
    if (plotInitialized) {
        Plotly.react('graph', dataPressure, layoutPressure);
    } else {
        Plotly.newPlot('graph', dataPressure, layoutPressure);
    }

    // Update or create the Scale plot
    if (plotInitialized) {
        Plotly.react('graph-scale', dataScale, layoutScale);
    } else {
        Plotly.newPlot('graph-scale', dataScale, layoutScale);
    }
}


// Handle point selection logic
function handlePointSelection(pointIndex) {
    // Check if point is already selected
    if (selectedPoints.includes(pointIndex)) {
        // Remove the point from selection
        selectedPoints = selectedPoints.filter(index => index !== pointIndex);
    } else {
        // Add the point to selection
        if (selectedPoints.length < 2) {
            selectedPoints.push(pointIndex);
        } else {
            // Replace the oldest point
            selectedPoints.shift();
            selectedPoints.push(pointIndex);
        }
    }
    // Update the plot to reflect the selection change
    plotData();
    updateDeleteButton();
    displaySelectedMessage();
}

// Attach event handlers once
function attachEventHandlers() {
    const graphDiv = document.getElementById('graph');

    graphDiv.on('plotly_click', function(data) {
        const pointIndex = data.points[0].pointIndex;
        handlePointSelection(pointIndex);
    });

    // Handle keyboard events
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' || event.key === 'Backspace') {
            if (selectedPoints.length > 0) {
                selectedPoints.pop(); // Remove the most recent selection
                plotData();
                updateDeleteButton();
                displaySelectedMessage();
            }
        } else if (['0', '1', '2', '3'].includes(event.key)) {
            if (mouseX !== null) {
                addCustomLine(mouseX, event.key);
            }
        }
    });

    // Handle mouse move to track x-position for custom lines
    graphDiv.on('plotly_hover', function(data) {
        mouseX = data.points[0].x;
    });

    graphDiv.on('plotly_unhover', function(data) {
        mouseX = null;
    });

    // Button event listeners
    document.getElementById('delete-button').addEventListener('click', deleteData);
    document.getElementById('undo-button').addEventListener('click', undoDelete);
    document.getElementById('find-peaks-button').addEventListener('click', togglePeakSliders);
    document.getElementById('export-button').addEventListener('click', exportData);
}

// Add custom vertical line at mouse position
function addCustomLine(xValue, key) {
    let color;
    switch(key) {
        case '0':
            color = 'pink';
            break;
        case '1':
            color = 'cyan';
            break;
        case '2':
            color = 'red';
            break;
        case '3':
            color = 'darkblue';
            break;
        default:
            color = 'white';
    }
    customLines.push({ x: xValue, color: color });
    plotData();
}

// Update the delete button state
function updateDeleteButton() {
    const deleteButton = document.getElementById('delete-button');
    if (selectedPoints.length === 2) {
        deleteButton.disabled = false;
    } else {
        deleteButton.disabled = true;
    }
}

// Display message about selected points
function displaySelectedMessage() {
    const messageDiv = document.getElementById('message');
    if (selectedPoints.length > 0) {
        const headers = Object.keys(csvData);
        const xValues = selectedPoints.map(i => csvData['Elapsed Time'][i]);
        const yValues = selectedPoints.map(i => csvData['Bladder Pressure'][i]);
        const pointsInfo = selectedPoints.map((_, idx) => `(${xValues[idx]}, ${yValues[idx]})`).join(' and ');
        messageDiv.innerHTML = `You have selected point(s): ${pointsInfo}`;
    } else {
        messageDiv.innerHTML = '';
    }
}

// Delete selected data points
function deleteData() {
    if (selectedPoints.length === 2) {
        // Save current data for undo functionality
        previousData = JSON.parse(JSON.stringify(csvData));
        document.getElementById('undo-button').disabled = false;

        // Sort indices and get start and end
        const indices = selectedPoints.slice().sort((a, b) => a - b);
        const start = indices[0];
        const end = indices[1];

        // Delete data points between start and end (inclusive)
        csvData['Elapsed Time'].splice(start, end - start + 1);
        csvData['Bladder Pressure'].splice(start, end - start + 1);

        // Reset selection
        selectedPoints = [];

        // Update the plot
        plotData();
        document.getElementById('message').innerHTML = '';

        updateDeleteButton();
    }
}

// Undo the last deletion
function undoDelete() {
    if (previousData) {
        csvData = previousData;
        previousData = null;
        document.getElementById('undo-button').disabled = true;

        // Update the plot
        plotData();
    }
}

// Toggle the visibility of peak sliders
function togglePeakSliders() {
    const peakSliders = document.getElementById('peak-sliders');
    if (peakSliders.style.display === 'none') {
        peakSliders.style.display = 'block';
        initializeSliders();
    } else {
        peakSliders.style.display = 'none';
    }
}

// Initialize slider value displays and add event listeners
function initializeSliders() {
    const sliders = ['height', 'distance', 'prominence', 'width'];
    sliders.forEach(slider => {
        const sliderElement = document.getElementById(slider);
        const valueElement = document.getElementById(`${slider}-value`);
        valueElement.textContent = sliderElement.value;
        sliderElement.oninput = function() {
            valueElement.textContent = this.value;
            debouncedFindPeaks(); // Trigger peak finding on slider change
        };
    });
}

// Function to find peaks
function findPeaks() {
    // Get parameters from slider inputs
    const height = document.getElementById('height').value;
    const distance = document.getElementById('distance').value;
    const prominence = document.getElementById('prominence').value;
    const width = document.getElementById('width').value;

    const params = {};
    if (height) params['height'] = height;
    if (distance) params['distance'] = distance;
    if (prominence) params['prominence'] = prominence;
    if (width) params['width'] = width;

    // Send data and parameters to backend
    fetch('/find_peaks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            csv_data: csvData,
            params: params
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            peakIndices = data.peaks;
            plotData(); // Update the plot with peaks
        } else {
            console.error('Error finding peaks:', data.message);
        }
    })
    .catch(error => console.error('Error:', error));
}

// Export the current data to CSV
function exportData() {
    if (!csvData || Object.keys(csvData).length === 0) {
        alert('No data to export.');
        return;
    }

    const headers = Object.keys(csvData);
    const numRows = csvData[headers[0]].length;

    let csvContent = headers.join(',') + '\n';

    for (let i = 0; i < numRows; i++) {
        let row = headers.map(h => csvData[h][i]);
        csvContent += row.join(',') + '\n';
    }

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'exported_data.csv');
    document.body.appendChild(link); // Required for Firefox
    link.click();
    document.body.removeChild(link);
}
