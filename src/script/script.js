var configuration = {
	advancedMode: false
};

var ansi_up = new AnsiUp;
var otaReleaseUrls = ['http://kaputelefon-backend.cserke.com', '/api/ota'];
var indexReleaseUrls = ['http://kaputelefon-frontend.cserke.com', '/file/html']
var corsProxyUrl = 'http://allorigins.cserke.com';
var actionSettings = '/api/settings';
var actionContacts = '/file/contacts';
var actionAccounts = '/file/accounts';
var logTimeout;
var keyupTimeout = null
var lastChangeEvent;
var lastChangeForm;
var logHtml = '';
var bsCollapse, toastInfo, toastError;
var icon;

var defaultConsole = window.console;
var console = {};
console.log = function(m){
    log(m);
};
console.warn = function(m){
    log(m, false, function(format, pairs) {defaultConsole.warn(format, ...pairs)});
};
console.error = function(m){
    log(m, false, function(format, pairs) {defaultConsole.error(format, ...pairs)});
};
console.trace = function(m){
    log(m, false, function(format, pairs) {defaultConsole.trace(format, ...pairs)});
};
window.console = console;
window.onerror=function(msg, url, linenumber){
    console.error('Error message: '+msg+'\nURL: '+url+'\nLine Number: '+linenumber)
    return true
}

document.addEventListener("DOMContentLoaded", function() {
	try {
		configuration = JSON.parse(localStorage.getItem("configuration"));
	} catch (e) {
		console.log(e);
	}
	initGui();

	//afterLoadFormsData()
});

function initGui() {
	showLoading('Betöltés...');
	initChangeEvents();
	initLogfile();
	bsCollapse = new bootstrap.Collapse(document.getElementById('navbarSupportedContent'));
	toastInfo = new bootstrap.Toast(document.getElementById('toastInfo'));
	toastError = new bootstrap.Toast(document.getElementById('toastError'));
	initAdvancedMode();
	initForms();
	document.querySelectorAll('.versionDiv').forEach(function(versionDiv){versionDiv.innerHTML = version});
    getFirmwareVersion();
    getMacAddress();
}

function initForms() {
	loadFormsData();
	switchAdvanced(false);
	document.querySelectorAll('form').forEach(function(form) {
	    form.autocomplete = 'off';
	    if (form.className.includes('no-auto-submit')) {
            form.addEventListener('submit', function(event) {
            	event.preventDefault();
                formSubmit(event, form)
            });
        } else {
            form.querySelectorAll('input, select').forEach(function(input) {
                input.addEventListener('keyup', function(event) {
                    invokeKeyupTimeout(event, form);
                });
                input.addEventListener('change', function(event) {
                    invokeKeyupTimeout(event, form);
                });
            });
        }
	});
}

function loadFormsData() {
	ajax(
		'GET',
		actionSettings,
		response => {
			let json = JSON.parse(response.responseText.replace(',}', '}'))
			document.querySelectorAll('form').forEach(form => jsonToForm(form, json));
			afterLoadFormsData();
		}
	)
	ajax(
		'GET',
		actionContacts,
		r => getContacts(document.getElementById('phonebookForm'), r.responseText))
	ajax(
		'GET',
		actionAccounts,
		r => getAccounts(document.getElementById('accountForm'),
			r.responseText));
}

function afterLoadFormsData() {
	showHideBlocks();
	showHide('#menuItems', true);
	showHide('#settings', true);
	hideLoading();
}


function invokeKeyupTimeout(event, form) {
    if (keyupTimeout != null) {
        clearTimeout(keyupTimeout);
    }
    lastChangeEvent = event;
    lastChangeForm = form;
    keyupTimeout = setTimeout(function() {
        formSubmit(lastChangeEvent, lastChangeForm);
        keyupTimeout = null;
        lastChangeEvent = null;
        lastChangeForm = null;
    }, 1000);
}

function formSubmit(event, form) {
    if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        saveForm(form);
    }
    form.classList.add('was-validated');
}

function saveForm(form) {
	let action = form.getAttribute('action');
	if (action != null) {
		action += '?' + new URLSearchParams(new FormData(form)).toString();
		ajax('PUT', action);
	} else {
		saveFile(form);
	}
}

function initChangeEvents() {
    document.getElementById('typeSelect').addEventListener('change', function() {
        showHideBlocks();
    });
	document.getElementById('wifiSwitcher').addEventListener('change', function() {
		showHideBlocks();
	});
	document.getElementById('voipSwitcher').addEventListener('change', function() {
		showHideBlocks();
	});
}

function showHideBlocks() {
	showHide('.codeBlock', document.getElementById('typeSelect').value !== 'mkt');
	showHide('.wifi', document.getElementById('wifiSwitcher').checked);
	showHide('.voip', document.getElementById('voipSwitcher').checked);
}

function initAdvancedMode() {
	let advancedCheckbox = document.getElementById('advancedSwitcher');
	advancedCheckbox.checked = configuration.advancedMode;
	advancedCheckbox.addEventListener('change', function() {
        switchAdvanced(false);
    });
}

function initLogfile() {
	let logsleep = document.querySelector('#logsleep');
	logsleep.addEventListener('change', function() {
        setLogTimeout(this.value);
    });
}

function getFirmwareVersion() {
    ajax('GET', '/api/appversion', e => printInfo(e.responseText, 'fwVersionDiv'));
}

function getMacAddress() {
    ajax('GET', '/api/mac', e => printInfo(e.responseText, 'macAddressDiv'));
}

function restart() {
    icon = 'cw';
    ajax('GET', '/api/restart_to_conf', () => reload());
}

function factoryReset() {
    icon = 'cw';
    ajax('GET', '/api/factory_reset', () => reload());
}

function testCall() {
    icon = 'phone';
    ajax('GET', '/api/testcall');
}

function showLoading(titleText) {
    Swal.fire({
        title: titleText,
        showConfirmButton: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        timerProgressBar: true,
        didOpen: () => {
	        Swal.showLoading();
	    }
    })
}

function hideLoading() {
	Swal.close();
}

function ajax(protocol, url, successCallback, data) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.status === 302) {
			ajax(protocol, this.headers.get('Location'), successCallback, data);
			return;
		}
		if (this.readyState === 4) {
			if (this.status === 200) {
				if (successCallback != null) {
					successCallback(this);
				} else {
				    if(this.responseText !== "") {
					    showInfo(this.responseText);
					} else if(icon != null) {
					    showInfo('Sikeres', '<i class="icon-' + icon + '"></i>');
					    icon = null;
					}
				}
			} else {
				showError(this.status + ": " + this.statusText);
		    }
		}
	};
	xhr.open(protocol, url, true);
	xhr.overrideMimeType('text/json');
	xhr.send(data);
}

function switchAdvanced(moreAdvancedMode) {
	let v = document.getElementById('advancedSwitcher').checked;
	if (v) {
	    new bootstrap.Collapse(document.getElementById('navbarSupportedContent'));
	}
	configuration.advancedMode = v;
	saveConfiguration();
    showHide('.kt-advanced', v);
    showHide('.kt-more-advanced', moreAdvancedMode);
}

function showHide(selector, show) {
	let list = document.querySelectorAll(selector);
	for (let i = 0; i < list.length; i++) {
		if (show) {
			showItem(list[i]);
		} else {
			hideItem(list[i]);
		}
	}
}

function showItem(item) {
	item.classList.remove( 'hidden' );
}

function hideItem(item) {
	item.classList.add( 'hidden' );
}

function printInfo(e, div) {
    if (div == null) {
        div = "logInfoText";
    }
    document.getElementById(div).innerHTML = e;
}

function saveConfiguration() {
	localStorage.setItem("configuration", JSON.stringify(configuration));
}

function jsonToForm(f, data) {
	for(var prop in data){
		let field = f.querySelector('*[name=' + prop + ']');
		if (field != null) {
		    if (field.type === 'hidden') {
		    } else if (field.type === 'checkbox') {
                field.checked = stringToBoolean(data[prop]);
            } else {
                field.value = data[prop];
			}
		}
	}
}

function showInfo(msg, title = "") {
	document.querySelector('#infoText').innerHTML = msg;
	document.querySelector('#infoTitle').innerHTML = title;
	toastInfo.show();
}

function showError(msg) {
	document.querySelector('#errorText').innerHTML = msg;
	toastError.show();
}

function saveFile(form) {
	let d;
	let action;
	let callback = null;
	if (form.id === 'indexFileForm') {
		showLoading('Feltöltés folyamatban...');
		action = indexReleaseUrls[1];
		d = getFile(form);
		callback = reload;
	} else if (form.id === 'otaFileForm') {
		showLoading('Feltöltés folyamatban...');
		action = otaReleaseUrls[1];
		d = getFile(form);
		callback = reload;
	} else if (form.id === 'phonebookForm') {
		action = actionContacts;
		d = getContacts(form);
	} else if (form.id === 'accountForm') {
		action = actionAccounts;
		d = getAccounts(form);
	}
	ajax('PUT', action, callback, d);
}

function getFile(form) {
	return form.getElementsByTagName('input')[0].files[0];
}

function getLine(lines, arg) {
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].startsWith(arg + '=')) {
			return lines[i].split('=')[1];
		}
	}
	return '';
}

function getAccounts(form, content) {
	let d = '<sip:' + form.querySelector('#accountSipTextField1').value + '@' + form.querySelector('#accountSipTextField2').value;
	d += ';transport=udp>;'
	d += 'auth_pass=' + form.querySelector('#accountPasswordTextField').value + ";";
	d += 'outbound="' + form.querySelector('#accountOutboundTextField').value + '"';
	if (content != null && content !== '') {
		let lines = content.split(';');
		let words = getUserAndServer(lines[0].split('<')[1]);
		form.querySelector('#accountSipTextField1').value = words[0];
		form.querySelector('#accountSipTextField2').value = words[1];
		form.querySelector('#accountPasswordTextField').value = getLine(lines, 'auth_pass');
		form.querySelector('#accountOutboundTextField').value = getLine(lines, 'outbound').split("\"")[1];
	}
	return d;
}

function getUserAndServer(str) {
	let words = str.split('@');
	words[0] = words[0].substring(4);
	return words;
}

function getContacts(form, content) {
	let d = '';
	let contacts = [];
	if (content != null && content !== '') {
		let lines = content.split('\n');
		[].forEach.call(lines, function(line) {
			if(line !== "") {
				let words = line.split(/\"\s*</);
				words[0] = words[0].split(/\"/)[1];
				words[1] = words[1].split(/>/)[0];
				contacts[contacts.length] = [words[0], words[1]];
			}
		});
	}
	let divs = form.querySelectorAll('.kt-contact');
	for(let i = 0; i < divs.length ; i++) {
		let div = divs[i];
		let inputs = div.querySelectorAll('input');
		d += '"' + inputs[0].value + '" <sip:' + inputs[1].value + '@' + inputs[2].value + '>\n';
		if (contacts.length > 0) {
//			inputs[0].value = contacts[i][0];
			let words = getUserAndServer(contacts[i][1])
			inputs[1].value = words[0];
			inputs[2].value = words[1];
		}
	}
	return d;
}

function menu(l) {
	let page = l.getAttribute('href');
    document.querySelectorAll('.page').forEach(function(item) {
        if(page === '#' + item.id) {
			showItem(item);
        } else {
            hideItem(item);
        }
    });
}

function checkUpdate(releaseUrls) {
    showLoading('Frissítés folyamatban...');
	ajax('GET', corsProxyUrl + '/get?url=' + releaseUrls[0],
		response => {
			let release = JSON.parse(JSON.parse(response.responseText).contents).assets[0];
			let url = release.browser_download_url;
			let oReq = new XMLHttpRequest();
			oReq.open("GET", corsProxyUrl + '/raw?url=' + url, true);
			oReq.responseType = "blob";
			oReq.onload = function() {
				showInfo('Letöltés: ' + release.name);
  				var blob = oReq.response;
				ajax('PUT', releaseUrls[1], null, blob, () => setTimeout(() => reload(), 1000));
			}
			oReq.send();
		});
}

function log(msg, server = false, callback = function(format, pairs) {defaultConsole.log(format, ...pairs)}) {
	let lines = msg.split('\n');
	let datestr = new Date().toISOString();
	for(i in lines) {
		let line = lines[i];
		if(line.length === 0) continue;
		if (line.length > 150) {
			line = line.substr(0, 150) + '...';
		}
		line = ansi_up.ansi_to_html("\033[1;100;97m" + datestr + (server ? ' S ' : ' C ') + "\033[1;37;40m ") + ansi_up.ansi_to_html(line);
		logHtml += line + "<br>";
		let words = line.split('</span>');
		words.pop();
		let format = '';
		line = '';
		let pairs = [];
		for(j in words) {
			let word = words[j];
			let pair = word.substring(13).split("\">");
			format += '%c %s '
			pairs.push(pair[0]);
			pairs.push(pair[1]);
		}
		callback(format, pairs);
	}
}

function openLogWindow() {
	receiveLogfile(null, function() {
		let w = open('','kaputelefon_log', '');
		if(w) {
			w.document.write(
				'<html><body style=\'background-color: black;padding: 1px;color: lightgray;line-height: 14px;font-size: 12px;\'>' +
				logHtml +
				'</body></html>');
			w.document.close();
			w.document.title = 'Log';
		}
	});
}

function setLogTimeout(timeout) {
	if (logTimeout != null) {
		clearInterval(logTimeout);
	}
	if (timeout >= 0) {
		receiveLogfile(timeout);
	}
}

function receiveLogfile(timeout, callback) {
	ajax('GET', '/api/logfile', (response) => {
		log(response.responseText, true);
		if (timeout != null) {
			logTimeout = setTimeout(() => receiveLogfile(timeout), timeout * 1000 + 100);
		}
		if (callback != null) {
			callback();
		}
	}, null);
}

function stringToBoolean(stringValue) {
    switch(stringValue.toLowerCase().trim()){
        case "true":
        case "yes":
        case "1":
          return true;
        case "false":
        case "no":
        case "0":
        case null:
        case undefined:
          return false;
        default:
          return JSON.parse(stringValue);
    }
}

function reload() {
	showLoading('Újraindítás...');
	setTimeout(() => window.location.reload(), 2000);
}