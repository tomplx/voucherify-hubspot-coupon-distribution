const express = require('express');
const path = require('path');
const integrationService = require('./integration.service');
const app = express();

const PORT = 80;

app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.get('/campaigns', async (req, res) => {
    res.send(await integrationService.getVoucherifyCampaignsList());
});

app.get('/contacts-list', async (req, res) => {
    res.send(await integrationService.getHubspotContactsLists());
});

app.get('/contact-properties', async (req, res) => {
    res.send(await integrationService.getHubspotcontactPropertiess());
});

app.get('/check-property', async (req, res) => {
    const propertyExisting = await integrationService.isPropertyExisting(req.query.property);

    res.status(200).send({validation: !propertyExisting});
});

app.post('/send-coupons', async (req, res) => {
    const {campaign, contactsList, sourceIdProperty, couponProperty} = req.body;

    const distribution = await integrationService.saveCouponsToHubspotContacts(campaign, contactsList, sourceIdProperty, couponProperty);

    if(distribution === true) {
        res.status(200).send({message: 'ok'});
    }
    else {
        res.status(500).send({message: 'error'});
    }
  });

app.listen(process.env.PORT || PORT);
console.log(`Listening on 127.0.0.1:${PORT}`);