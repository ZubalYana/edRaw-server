const express = require('express');
const app = express();
const dotenv = require('dotenv').config();
const PORT = process.env.PORT || 5000;

app.get('/test', (req, res) => {
    res.send('Hello from edRaw-server');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));