const Hubspot = require('hubspot');
const Voucherify = require('voucherify');

const hubSpotApiKey = '';
const voucherifyApiId = '';
const voucherifyApiKey = '';
const hubspotClient = new Hubspot({apiKey: hubSpotApiKey});
const voucherifyClient = Voucherify({
    applicationId: voucherifyApiId,
    clientSecretKey: voucherifyApiKey
});

const saveCouponsToHubspotContacts = async (_campaignName, _contactsListId, _sourceIdProperty, _couponProperty) => {
    const hubkey = hubSpotApiKey;

    // Getting contacts from selected contacts lists
    const hubSpotContacts = await hubspotClient.lists
        .getContacts(_contactsListId, {
            hapikey: hubkey
        })
        .then(response => response.contacts)
        .catch(e => {
            throw e;
        });

    // Setting new Hubspot contacts property wich will contain coupon code in it's value
    await hubspotClient.contacts.properties
        .create({
            name: _couponProperty,
            label: 'Voucherify generated property',
            description: 'This is generated by Voucherify integration, this property should contain coupon code for your customer',
            groupName: 'contactinformation',
            type: 'string',
            fieldType: 'text',
            formField: false
        })
        .catch(e => {
            throw e;
        });
    
    // Below it's a whole function 
    const mappedContactsWithCoupons = hubSpotContacts.map(async _contact => {
        const distributedCouponCode = await distributeCouponCode(_campaignName, _contact, _sourceIdProperty);

        return {
            vid: _contact.vid,
            properties: [{
                property: _couponProperty,
                value: distributedCouponCode
            }]
        }
    });

    // Wait for all promises inside map to be resolved
    const mappedContactsResolved = await Promise
        .all(mappedContactsWithCoupons)
        .catch(e => {
            throw e;
        });

    // Insert coupon codes for contacts in HubSpot
    return await hubspotClient.contacts
        .createOrUpdateBatch(mappedContactsResolved)
        .then(response => {
            // this is very strange, Hubspot developers decided to make response undefined... by design :/
            // https://github.com/MadKudu/node-hubspot/blob/f94c835fc73382e137c186f11ca8111e3a169843/lib/contact.js#L116
            if (typeof response === 'undefined') {
                return true;
            }
        })
        .catch(e => {
            throw e;
        });
};

const distributeCouponCode = (_campaignName, _contact, _sourceIdProperty) => {
    const {email, firstname, lastname} = _contact.properties;
    
    return voucherifyClient.distributions.publications
        .create({
            campaign: {
                name: _campaignName,
                count: 1
            },
            customer: {
                source_id: _contact.properties[_sourceIdProperty] || email || _contact.vid || '',
                email: email || '',
                name: `${firstname || ''} ${lastname || ''}`
            }
        })
        .then(response => response.voucher.code)
        .catch(e => {
            throw e;
        });
};

const getVoucherifyCampaignsList = async function() {
    const campaigns = await voucherifyClient.campaigns
        .list()
        .catch(e => {
            throw e;
        });

    return campaigns.campaigns.map(campaign => ({ name: campaign.name, description: campaign.description }));
};

const getHubspotContactsLists = async function() {
    const contactsList = await hubspotClient.lists
        .get()
        .then(response => response.lists.filter(list => list.metaData.size > 0))
        .catch(e => {
            throw e;
        });

    return contactsList.map(list => ({ name: list.name, id: list.listId }));
};

const getHubspotcontactPropertiess = async function() {
    const contactProperties = await hubspotClient.contacts.properties
        .get()
        .catch(e => {
            throw e;
        });

    return contactProperties.map(list => ({ name: list.name }));
};

const isPropertyExisting = async function(_propertyName) {
    return await hubspotClient.contacts.properties
        .getByName(_propertyName)
        .catch(e => {
            if (e.statusCode === 404) {
                return false;
            }
            else {
                throw e;
            }
        });
};

module.exports = {
    saveCouponsToHubspotContacts,
    getVoucherifyCampaignsList,
    getHubspotContactsLists,
    getHubspotcontactPropertiess,
    isPropertyExisting
};