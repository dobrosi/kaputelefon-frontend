var configuration = {
	url: document.location.href,
	advancedMode: false
};

var ansi_up = new AnsiUp;
var releaseUrl = 'https://api.github.com/repos/dobrosi/jozsefutca/releases/latest';
var corsProxyUrl = 'https://api.allorigins.win';
var actionContacts = '/file/contacts';
var actionAccounts = '/file/accounts';
var logfile;
var logTimeout;
var connected;
var not_connected;

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
	initLog();
    bsCollapse = new bootstrap.Collapse(document.getElementById('navbarSupportedContent'));
    toastInfo = new bootstrap.Toast(document.getElementById('toastInfo'));
	toastError = new bootstrap.Toast(document.getElementById('toastError'));
	not_connected = document.querySelector('#not_connected');
	initAdvancedMode();
	initForms();
	document.getElementById("versionDiv").innerHTML = version;
    getFirmwareVersion();
    getMacAddress();
}

function initForms() {
	document.querySelectorAll('form').forEach(function(form) {
		form.addEventListener('submit', function(event) {
			if (!form.checkValidity()) {
				event.preventDefault()
				event.stopPropagation()
			} else {
				saveForm(event);
			}
			form.classList.add('was-validated')
		});
	});
	loadFormsData();
	switchAdvanced(false);
}

function initLog() {
	let oldlog = console.log;
	console.log = function(msg) {
		log(msg);
		oldlog(msg);
	}
}

function initAdvancedMode() {
	let advancedCheckbox = document.getElementById('advancedSwitcher');
	advancedCheckbox.checked = configuration.advancedMode;
	advancedCheckbox.addEventListener('change', function() {
        switchAdvanced(false);
    });
}

function initLogfile() {
	logfile = document.querySelector("#logfile");
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
    ajax('GET', '/api/restart_to_conf');
}

function factoryReset() {
    ajax('GET', '/api/factory_reset');
}

function testCall() {
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
			console.log('ajax response, status: ' + this.status + ', text length: ' + this.responseText.length);
			showConnected(this.status);
			if (this.status == 200) {
				not_connected.style.display = 'none';
				if (successCallback != null) {
					successCallback(this);
				} else {
					showInfo(this.responseText === "" ? "Kész" : this.responseText);
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
			field.value = data[prop];
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

function showConnected(status) {
	if (status == 0) {
		connected = false;
	} else {
		if (!connected) {
		//	loadFormsData();
		}
		connected = true;
	}
	not_connected.style.display = connected ? 'none' : 'block';
}

function createUrl(action) {
	return (configuration.url + action).replace(/([^:]\/)\/+/g, "$1");
}

function saveForm(event) {
	event.preventDefault();
	let form = event.target;
	let action = form.getAttribute('action');
	if (action != null) {
		action += '?' + new URLSearchParams(new FormData(event.target)).toString();
		ajax('PUT', action);
	} else {
		saveFile(form);
	}
}

function saveFile(form) {
	let d;
	let action;
	if (form.id == 'indexFileForm') {
		action = '/file/html';
		d = getFile(form);
	} else if (form.id == 'otaFileForm') {
		action = '/api/ota';
		d = getFile(form);
	} else if (form.id == 'phonebookForm') {
		action = actionContacts;
		d = getContacts(form);
	} else if (form.id == 'accountForm') {
		action = actionAccounts;
		d = getAccounts(form);
	}
	ajax('PUT', action, null, d);
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
        	if (document.querySelector("#navbar-toggler").offsetLeft >= 0) {
            	bsCollapse.hide();
            }
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

function restoreSelection(containerEl, savedSel) {
    var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
    range.collapseToPoint(containerEl, 0);

    function traverseTextNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i]);
            }
        }
    }

    try {
        traverseTextNodes(containerEl);
    } catch (ex) {
        if (ex == stop) {
            rangy.getSelection().setSingleRange(range);
        } else {
            throw ex;
        }
    }
}

function log(msg) {
	log(msg, false);
}

function log(msg, server) {
	var savedSel = saveSelection(logfile);
	let scrolling = logfile.scrollHeight - logfile.offsetHeight - logfile.scrollTop < 1;
	let lines = msg.split('\n');
	let datestr = moment().format('HH:mm:ss.SSS');
	for(i in lines) {
		let line = lines[i];
		if(line.length == 0) continue;
		if (line.length > 150) {
			line = line.substr(0, 150) + '...';
		}
		line = ansi_up.ansi_to_html("\033[1;100;97m" + datestr + (server ? ' S' : ' C') + "\033[1;37;40m") + ' <b>' + ansi_up.ansi_to_html(line);
		logfile.innerHTML += line + '</b><br>';
	}
	if (scrolling) {
		logfile.scrollTop = logfile.scrollHeight;
	}
	restoreSelection(logfile, savedSel);
}

function receiveLogfile(timeout) {
	ajax('GET', '/api/logfile', (response) => {
		log(response.responseText, true);
		logTimeout = setTimeout(() => receiveLogfile(timeout), timeout * 1000 + 100);

	});
}

function clearLogfile() {
	logfile.innerHTML = '';
}

function checkUpdate() {
    showLoading('Firmware frissítés folyamatban...');
	ajax('GET', corsProxyUrl + '/get?url=' + releaseUrl,
		response => {
			let release = JSON.parse(JSON.parse(response.responseText).contents).assets[0];
			let url = release.browser_download_url;
			var oReq = new XMLHttpRequest();
			oReq.open("GET", corsProxyUrl + '/raw?url=' + url, true);
			oReq.responseType = "blob";
			oReq.onload = function(oEvent) {
				showInfo('Letöltés: ' + release.name);
  				var blob = oReq.response;
				ajax('PUT', '/api/ota', null, blob, () => setTimeout(() => closeLoading(), 1000));
			}
			oReq.send();
		});
}
