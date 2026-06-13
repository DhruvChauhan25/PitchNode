const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.post('/evaluate', (req, res) => {
    res.json({
        score: 85,
        feedback: "Good job!"
    });
});

app.listen(5002, () => {
    console.log('Evaluation Service is running on port 5002');
});