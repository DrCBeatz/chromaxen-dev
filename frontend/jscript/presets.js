// jscript/presets.js

export function getFirstChildByTagName(parent, tagName) {
	const nodes = parent.childNodes;
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].nodeType == 1 && nodes[i].tagName == tagName) {
			return nodes[i];
		}
	}
}

export function loadPresets(file_name, callback) {
	const xhttp = new XMLHttpRequest();
	xhttp.onreadystatechange = function () {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			callback(xhttp.responseXML)
		}
	}
	xhttp.open("GET", file_name, true);
	xhttp.setRequestHeader("Cache-Control", "no-cache")
	xhttp.send();
	return xhttp.responseXML;
}
