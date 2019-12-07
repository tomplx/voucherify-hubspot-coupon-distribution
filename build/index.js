const hubSpotVoucherifyIntegration = function() {
    const form = document.querySelector('#form');
    const templateCampaigns = $('#campaignsListScript').html();
    const templateContactsLists = $('#contactsListScript').html();
    const templatePropertiesListContainer = $('#sourceIdPropertiesScript').html();
    
    const $campaignsList = $('#campaignsList');
    const $contactsList = $('#contactsList');
    const $sourceIdInput = $('#sourceIdInput');
    const $couponPropertyInput = $('#couponPropertyInput');
    const $couponPropertyInputError = $('#couponPropertyInputError');
    const $propertyListContainer = $('#propertyListContainer');
    const $successIndicator = $('#successIndicator');
    const $submitButton = $('#submitButton');
    const $loader = $('#loader');
    
    const templateScriptCampaigns = Handlebars.compile(templateCampaigns);
    const templateScriptLists = Handlebars.compile(templateContactsLists);
    const templateScriptProperties = Handlebars.compile(templatePropertiesListContainer);
    const requestOptions = {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    };

    const init = () => {
        loadContacts();
        loadContactProperties();
        loadCampaigns();
        
        $successIndicator.hide();
        $loader.hide();
        $couponPropertyInput.focusout((_e) => {
            validateProperty(_e.target.value);
        });
    };

    const loadCampaigns = () => {
        fetch('/campaigns', requestOptions)
            .then(response => response.json())
            .then(response => {
                const html = templateScriptCampaigns({campaigns: response});
                $campaignsList.html(html);
            })
            .catch(e => { throw e; });
    };
    
    const loadContacts = () => {
        fetch('/contacts-list', requestOptions)
            .then(response => response.json())
            .then(response => {
                const html = templateScriptLists({lists: response});
                $contactsList.html(html);
            })
            .catch(e => { throw e; });;
    };
    
    const loadContactProperties = () => {
        fetch('/contact-properties', requestOptions)
            .then(response => response.json())
            .then(contactProperties => {
                initPropertiesSearch(contactProperties);
            })
            .catch(e => { throw e; });;
    };
    
    const validateProperty = async _propertyToCheck => {
        if (_propertyToCheck === '' || (/([A-Z]|[\d])|(\W)/.test(_propertyToCheck))) {
            $couponPropertyInput.toggleClass('error', true);
            $couponPropertyInputError.toggleClass('show', false);
    
            return false;
        }
        else {
            const isPropertyValid = await fetch(`/check-property?property=${_propertyToCheck}`)
                .then(response => response.json())
                .then(response => response.validation)
                .catch(e => { throw e; });
    
            $couponPropertyInputError.toggleClass('show', !isPropertyValid);
            $couponPropertyInput.toggleClass('error', !isPropertyValid);
    
            return isPropertyValid;
        }
    };
    
    const searchFilterSortProperties = (_propertiesList, _searchValue) => {
        return _propertiesList
            .filter(_property => {
                const searchIndex = _property.name.toLowerCase().indexOf(_searchValue.toLowerCase());
    
                if (searchIndex !== -1) {
                    _property.searchIndex = searchIndex;
    
                    return true;
                }
    
                return false;
            })
            .sort((_property, _nextProperty) => {
                if (_property.searchIndex > _nextProperty.searchIndex) return 1;
                if (_nextProperty.searchIndex > _property.searchIndex) return -1;
    
                return 0;
            })
            .splice(0,20);
        
    }
    
    const assignPropertyEvents = inputObject => {
        $sourceIdInput.focus(() => {
            $propertyListContainer.show();
        });
        $sourceIdInput.focusout(() => {
            $propertyListContainer.hide();
        });

        $propertyListContainer[0].querySelectorAll('.property').forEach(_property => {
            _property.addEventListener('click', () => {
                inputObject.value = _property.innerText;
                setPropertiesList([]);
            });
        });
    };
    
    const initPropertiesSearch = (_propertiesList) => {
        $sourceIdInput[0].addEventListener('keydown', (_inputEvent) => {
            const inputObject = _inputEvent.target;
            const inputValue = inputObject.value;
            let filteredProperties = [];
    
            if (inputValue !== '') {
                $propertyListContainer.show();
                filteredProperties = searchFilterSortProperties(_propertiesList, inputValue);
            }
            else {
                $propertyListContainer.hide();
            }
    
            setPropertiesList(filteredProperties);
            assignPropertyEvents(inputObject);
        });
    }
    
    const setPropertiesList = (_propertiesList) => {
        const html = templateScriptProperties({properties: _propertiesList});
        $propertyListContainer.html(html);
    };
    
    form.addEventListener('submit', async (_event) => {
        _event.preventDefault();
    
        const selectedCampaign = $campaignsList.val();
        const selectedContactsList = $contactsList.val();
        const selectedSourceIdProperty = $sourceIdInput.val();
        const couponProperty = $couponPropertyInput.val();
        const propertyValidation = await validateProperty(couponProperty);
    
        if (!propertyValidation) {
            return false;
        }

        $submitButton.hide();
        $loader.show();
    
        fetch('/send-coupons', {
            method: 'POST',
            headers: requestOptions.headers,
            body: JSON.stringify({
                campaign: selectedCampaign,
                contactsList: selectedContactsList,
                sourceIdProperty: selectedSourceIdProperty,
                couponProperty: couponProperty
            })
        })
        .then(response => {
            if (response.status === 200) {
                $loader.hide();
                $successIndicator.show();
            }
        })
        .catch(e => {
            $loader.hide();
            $submitButton.show();

            throw e;
        });;
    });

    init();
};

hubSpotVoucherifyIntegration();