const express = require('express');
const fileUpload = require('express-fileupload');
const fetch = require('node-fetch');
const FormData = require('form-data');
const app = express();
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const { json } = require('body-parser');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

function generateShortHash(inputString) {
  const sha256 = crypto.createHash('sha256');
  sha256.update(inputString, 'utf-8');
  const fullHash = sha256.digest('hex');
  const shortHash = fullHash.slice(0, 6);
  return shortHash;
}

app.use(fileUpload());

app.post('/upload', async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).send('No files were uploaded.');
    }

    const uploadedFile = req.files.myFile;

    // Upload the file to IPFS
    const formData = new FormData();
    formData.append("file", uploadedFile.data);

    const ipfsResponse = await fetch("http://localhost:5001/api/v0/add", {
      method: "POST",
      body: formData
    });

    if (!ipfsResponse.ok) {
      throw new Error('Failed to upload to IPFS');
    }

    const ipfsData = await ipfsResponse.json();
    const ipfsHash = ipfsData.Hash;
    const uniqueCode = generateShortHash(ipfsHash);

    // Handle additional data here
    const name = req.body.name;
    const fatherName = req.body.fatherName;
    const dob = req.body.dob;
    const certificateType = req.body.certificateType;

    // Prepare data to send to another server
    const dataToSend = {
      propertyName: 'data',
      data: {
        name: name,
        fatherName: fatherName,
        dob: dob,
        certificateType: certificateType,
        ipfsHash:ipfsHash,
        uniqueCode:uniqueCode
      }
    };

    // Options for the HTTP request to the receiving server
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/mine',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    // Create an HTTP request
    const httpRequest = http.request(options, (httpResponse) => {
      let responseData = '';

      // Handle the response from the receiving server
      httpResponse.on('data', (chunk) => {
        responseData += chunk;
      });

      httpResponse.on('end', () => {
        console.log('Response from the receiving server:', responseData);
      });
    });

    // Handle errors
    httpRequest.on('error', (error) => {
      console.error('Error sending data:', error);
    });

    // Send the data
    httpRequest.write(JSON.stringify(dataToSend));
    httpRequest.end();
    

    res.render('success', { uniqueCode });
  } catch (error) {
    console.error('IPFS upload error:', error);
    res.status(500).send('Failed to upload to IPFS and pin.');
  }
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});
