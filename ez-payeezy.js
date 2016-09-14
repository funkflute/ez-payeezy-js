var EzPayeezy = function() {

	// environment for api call, is prepended as the subdomain,
	// api.payeezy.com, or api-cert.payeezy.com, for example
	var environment = 'api';

	// set your Payeezy API credentials
	var config = {
		apikey          : null,  // your Payeezy apikey
		js_security_key : null,  // your Payeezy js_security_key
		ta_token        : null,  // Transarmor® token
		auth            : false, // do we do a $0 authorization on the card?
		currency        : null,
	};

	// client function to pass results back to
	var client_callback = null;

	// list of card types and their validation pattern
	var card_types = {
		Visa               : /^4[0-9]{12}(?:[0-9]{3})?$/,
		Mastercard         : /^5[1-5][0-9]{14}$/,
		'American Express' : /^3[47][0-9]{13}$/,
		'Diners Club'      : /^3(?:0[0-5]|[68][0-9])[0-9]{11}$/,
		Discover           : /^6(?:011|5[0-9]{2})[0-9]{12}$/,
		JCB                : /^(?:2131|1800|35\d{3})\d{11}$/
	};

	function setConfig(key, value) {
		switch (key) {
			case 'environment':
				environment = value;
			break;

			default:
				if (config.hasOwnProperty(key)) {
					config[key] = value;
				}
		}
	};

	function isConfigured() {
		for (var key in config) {
			var value = config[key];
			// missing
			if (value === null) {
				client_callback(400, 'Missing Payeezy Config Value: ' + key);
				return false;
			}
		}
		return true;
	};

	// return fields with payeezy-data data attribute
	function getData() {
		var data = ['type=FDToken'];
		var pz_attributes = {
			credit_card     : 'data-payeezy-card',
			billing_address : 'data-payeezy-billing',
		}
		var exp_date = [];
		for (var key in pz_attributes) {
			var attr_name = pz_attributes[key];
			var inputs = document.querySelectorAll('[' + attr_name + ']');
			for (i = 0; i < inputs.length; i++) {
				var input = inputs[i];
				var attr_value = input.getAttribute(attr_name);
				// if exp date
				if (attr_value.indexOf('exp_') === 0) {
					if (attr_value == 'exp_month') exp_date[0] = input.value;
					if (attr_value == 'exp_year')  exp_date[1] = input.value;
					// make exp date if we have both
					if (exp_date.length == 2) {
						data.push('credit_card.exp_date=' + encodeURIComponent(exp_date.join('')));
					}
				} else {
					data.push(key+'.'+attr_value + '=' + encodeURIComponent(input.value));
				}
			}
		}
		return data;
	};

	function getUrl() {
		var qs = ['callback=EzPayeezy.callback'];
		// set api settings
		for (var key in config) {
			qs.push( encodeURIComponent(key) + '=' + encodeURIComponent(config[key]) );
		}
		// set card details
		qs = qs.concat(getData());
		return 'https://' + environment + '.payeezy.com/v1/securitytokens?' + qs.join('&');
	};

	return {

		init: function(object) {
			for (var key in object) {
				setConfig(key, object[key]);
			}
		},

		// helper method to get/validate card type from card value
		getCardType: function(value) {
			for (var card in card_types) {
				if (card_types[card].test(value)) {
					return card;
				}
			}
		},

		createToken: function(callback) {
			client_callback = callback;
			if(isConfigured()) {
				var script = document.createElement('script');
				script.src = getUrl();
				document.getElementsByTagName('head')[0].appendChild(script);
			}
		},

		callback: function(event) {
			console.log(event.results);
			client_callback(event.status, event.results);
		},

	}
}();
