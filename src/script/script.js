var configuration = {
	url: document.location.href,
	advancedMode: false
};

var ansi_up = new AnsiUp;
var otaReleaseUrls = ['https://api.github.com/repos/dobrosi/jozsefutca/releases/latest', '/api/ota'];
var indexReleaseUrls = ['https://api.github.com/repos/dobrosi/kaputelefon-frontend/releases/latest', '/file/html']
var corsProxyUrl = 'https://api.allorigins.win';
var actionContacts = '/file/contacts';
var actionAccounts = '/file/accounts';
var logTimeout;
var keyupTimeout = null
var lastChangeEvent;
var lastChangeForm;
var logHtml = '';
var bsCollapse, toastInfo, toastError;
var icon;

document.addEventListener("DOMContentLoaded", function(event) {
	try {
		let newConfiguration = JSON.parse(localStorage.getItem("configuration"));
		if (newConfiguration != null && newConfiguration.url !== "") {
			configuration = newConfiguration;
		}
	} catch (e) {
		console.log(e);
	}
	initGui();
});

function initGui() {
	initLogfile();
	bsCollapse = new bootstrap.Collapse(document.getElementById('navbarSupportedContent'));
	toastInfo = new bootstrap.Toast(document.getElementById('toastInfo'));
	toastError = new bootstrap.Toast(document.getElementById('toastError'));
	initAdvancedMode();
	initTypeSelect();
	initForms();
	document.querySelectorAll('.versionDiv').forEach(function(versionDiv){versionDiv.innerHTML = version});
    getFirmwareVersion();
    getMacAddress();
}

function log(msg) {
	log(msg, false);
}

function log(msg, server) {
	let lines = msg.split('\n');
	let datestr = moment().format('HH:mm:ss.SSS');
	for(i in lines) {
		let line = lines[i];
		if(line.length == 0) continue;
		if (line.length > 150) {
			line = line.substr(0, 150) + '...';
		}
		line = ansi_up.ansi_to_html("\033[1;100;97m" + datestr + (server ? ' S ' : ' C ') + "\033[1;37;40m ") + ansi_up.ansi_to_html(line);
		logHtml += line + "<br>";
		let words = line.split('</span>');
        words.pop();
		let format = '';
		line = '';
		let pairs = new Array();
		for(j in words) {
		    let word = words[j];
		    let pair = word.substring(13).split("\">");
		    format += '%c %s '
		    pairs.push(pair[0]);
		    pairs.push(pair[1]);
		}
		console.log(format, ...pairs);
	}
}

function openLog() {
    open('','_blank', '').
        document.write(
            '<html><body style=\'background-color: black;padding: 1px;color: lightgray;line-height: 14px;font-size: 12px;\'>' +
            logHtml +
            '</body></html>');
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

function initTypeSelect() {
    document.getElementById('typeSelect').addEventListener('change', function() {
        showHide('.codeBlock', this.value!='mkt');
    });
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
    icon = 'rotate-right';
    ajax('GET', '/api/restart_to_conf');
}

function factoryReset() {
    icon = 'rotate-right';
    ajax('GET', '/api/factory_reset');
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
	        Swal.showLoading()
	    }
    })
}

function closeLoading() {
    Swal.close();
}

function ajax(protocol, action, successCallback, data, finishCallback) {
	let xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200) {
				if (successCallback != null) {
					successCallback(this);
				} else {
				    if(this.responseText != "") {
					    showInfo(this.responseText);
					} else {
					    showInfo('<i class="bigger fa fa-' + (icon == null ? 'floppy-disk' : icon) + '"></i>');
					    icon = null;
					}
				}
			} else {
				showError(this.status + ": " + this.statusText);
		    }
		}
		if (finishCallback != null) {
                finishCallback(this);
        }
	};
	action = action.startsWith('http') ? action : createUrl(action);
	xhr.open(protocol, action, true);
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

function showHide(clazz, show) {
	let list = document.querySelectorAll(clazz);
	var i;
	for (i = 0; i < list.length; i++) {
		list[i].style.display = show ? 'block' : 'none';
	}
}

function printInfo(e, div) {
    if (div == null) {
        div = "logInfoText";
    }
    document.getElementById(div).innerHTML = e;
}

function loadFormsData() {
	var i = 0;
	document.querySelectorAll('form').forEach(form => setTimeout(() => loadFormData(form), ++i * 200));
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

function loadFormData(form) {
	let action = form.getAttribute('action');
	if (action != null) {
		ajax('GET', action, function(response) {
			if(response.responseText != '') {
				jsonToForm(form, JSON.parse(response.responseText.replace(',}', '}')));
			}
		});
	}
}

function saveConfiguration() {
	localStorage.setItem("configuration", JSON.stringify(configuration));
}

function jsonToForm(f, data) {
	for(var prop in data){
		let field = f.querySelector('*[name=' + prop + ']');
		if (field != null) {
		    if (field.type == 'hidden') {
		    } else if (field.type == 'checkbox') {
                field.checked = stringToBoolean(data[prop]);
            } else {
                field.value = data[prop];
			}
		}
	}
};

function showInfo(msg) {
	document.querySelector('#infoText').innerHTML = msg;
	toastInfo.show();
}

function showError(msg) {
	document.querySelector('#errorText').innerHTML = msg;
	toastError.show();
}

function createUrl(action) {
	return (configuration.url + action).replace(/([^:]\/)\/+/g, "$1");
}

function saveFile(form) {
	let d;
	let action;
	let callback = null;
	if (form.id == 'indexFileForm') {
		showLoading('Feltöltés folyamatban...');
		action = indexReleaseUrls[1];
		d = getFile(form);
		callback = reload;
	} else if (form.id == 'otaFileForm') {
		showLoading('Feltöltés folyamatban...');
		action = otaReleaseUrls[1];
		d = getFile(form);
		callback = reload;
	} else if (form.id == 'phonebookForm') {
		action = actionContacts;
		d = getContacts(form);
	} else if (form.id == 'accountForm') {
		action = actionAccounts;
		d = getAccounts(form);
	}
	ajax('PUT', action, null, d, callback);
}

function getFile(form) {
	return form.getElementsByTagName('input')[0].files[0];
}

function getLine(lines, arg) {
	for (var i = 0; i < lines.length; i++) {
		if (lines[i].startsWith(arg + '=')) {
			return lines[i].split('=')[1];
		}
	}
	return '';
}

function getAccounts(form, content) {
	let d = ''
	let account;
	d = '<' + form.querySelector('#accountSipTextField').value;
	d += ';transport=udp>;'
	d += 'auth_pass=' + form.querySelector('#accountPasswordTextField').value + ";";
	d += 'outbound="' + form.querySelector('#accountOutboundTextField').value + '"';
	if (content != null && content != '') {
		let lines = content.split(';');
		form.querySelector('#accountSipTextField').value = lines[0].split('<')[1];
		form.querySelector('#accountPasswordTextField').value = getLine(lines, 'auth_pass');
		form.querySelector('#accountOutboundTextField').value = getLine(lines, 'outbound').split("\"")[1];
	}
	return d;
}

function getContacts(form, content) {
	let d = '';
	let contacts = new Array();
	if (content != null && content != '') {
		let lines = content.split('\n');
		[].forEach.call(lines, function(line) {
			if(line != "") {
				let words = line.split(/\"\s*</);
				words[0] = words[0].split(/\"/)[1];
				words[1] = words[1].split(/>/)[0];
				contacts[contacts.length] = [words[0], words[1]];
			}
		});
	}
	let divs = form.querySelectorAll('.kt-contact');
	for(var i = 0; i < divs.length ; i++) {
		let div = divs[i];
		let inputs = div.querySelectorAll('input');
		d += '"' + inputs[0].value + '" <' + inputs[1].value + '>\n';
		if (contacts.length > 0) {
			inputs[0].value = contacts[i][0];
			inputs[1].value = contacts[i][1];
		}
	};
	return d;
}

function menu(l) {
    page = l.getAttribute('href');
    document.querySelectorAll('.page').forEach(function(item) {
        if(page == '#' + item.id) {
            item.classList.remove( 'hidden' );
        } else {
            item.classList.add( 'hidden' );
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

function saveSelection(containerEl) {
    var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
    var sel = rangy.getSelection(), range;

    function traverseTextNodes(node, range) {
        if (node.nodeType == 3) {
            if (!foundStart && node == range.startContainer) {
                start = charIndex + range.startOffset;
                foundStart = true;
            }
            if (foundStart && node == range.endContainer) {
                end = charIndex + range.endOffset;
                throw stop;
            }
            charIndex += node.length;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i], range);
            }
        }
    }

    if (sel.rangeCount) {
        try {
            traverseTextNodes(containerEl, sel.getRangeAt(0));
        } catch (ex) {
            if (ex != stop) {
                throw ex;
            }
        }
    }

    return {
        start: start,
        end: end
    };
}

function receiveLogfile(timeout) {
	ajax('GET', '/api/logfile', (response) => {
		log(response.responseText, true);
		logTimeout = setTimeout(() => receiveLogfile(timeout), timeout * 1000 + 100);
	});
}

function checkUpdate(releaseUrls) {
    showLoading('Frissítés folyamatban...');
	ajax('GET', corsProxyUrl + '/get?url=' + releaseUrls[0],
		response => {
			let release = JSON.parse(JSON.parse(response.responseText).contents).assets[0];
			let url = release.browser_download_url;
			var oReq = new XMLHttpRequest();
			oReq.open("GET", corsProxyUrl + '/raw?url=' + url, true);
			oReq.responseType = "blob";
			oReq.onload = function(oEvent) {
				showInfo('Letöltés: ' + release.name);
  				var blob = oReq.response;
				ajax('PUT', releaseUrls[1], null, blob, () => setTimeout(() => reload(), 1000));
			}
			oReq.send();
		});
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
    window.location.reload();
}