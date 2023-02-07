const express = require('express');
const axios = require('axios');
const Chart = require('chart.js');
const app = express();
const dotenv = require('dotenv').config();

app.get('/cpu-graph', (req, res) => {

    try {
    const token = `${process.env.APIKEY}`;
    let dropletIds = [];

// Get list of Droplet IDs and push them into an array
async function getDroplets() {
    let response = await axios({
        method: 'get',
        url: `https://api.digitalocean.com/v2/droplets`,
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    response.data.droplets.forEach(element => {
        dropletIds.push(element.id)
    });

    // Retrieve data monitoring data for each Droplet from the last hour

    const startTime = (Date.now() - 3600000)/1000;
    const endTime = Date.now()/1000;

    let cpuMetricsArray = [];

    let cpuMetricsPromises = dropletIds.map(async element => {
        return await axios({
            method: 'get',
            url: `https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu?host_id=${element}&start=${startTime}&end=${endTime}`,
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
    });

    // Wait for all promises to complete
    let cpuMetricsResponses = await Promise.all(cpuMetricsPromises);

    // Extract user CPU load data for each Droplet and create a chart from it
    cpuMetricsResponses.forEach(response => {
        cpuMetricsArray.push(response.data.data.result[7]);
        const dropletId = response.data.data.result[7].metric.host_id;
        const data = response.data.data.result[7].values;

        console.log(`This is the chart data for Droplet ${dropletId}:`, data);

    //     const cpuChart = new Chart("cpuChart", {
    //         type: "line",
    //         data: {
    //             labels: data.map(time => data[0][0]),
    //             datasets: [
    //                 {
    //                     label: "CPU load over time",
    //                     data: data.map(value => data[0][1])
    //                 }
    //             ]
    //         },
    //         options: {}
    //       });
    });

    res.json({cpuMetricsArray});
}
getDroplets();
    } catch (error) {
        next(error);
    }
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
