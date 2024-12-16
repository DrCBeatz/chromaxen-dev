// jscript/presets.js

/**
 * @module presets
 * This module provides functions to load and parse XML presets for Chromaxen.
 * It includes a helper function to retrieve an element by its tag name and 
 * a function to load XML preset data asynchronously using Fetch.
 */

/**
 * Returns the first child of the given parent node that matches the specified tag name.
 * 
 * @param {Node} parent - The parent DOM node from which to search.
 * @param {string} tagName - The tag name of the child node to find.
 * @returns {Node|undefined} The first matching child node, or undefined if none is found.
 */
export function getFirstChildByTagName(parent, tagName) {
	const nodes = parent.childNodes;
	for (let i = 0; i < nodes.length; i++) {
		if (nodes[i].nodeType === 1 && nodes[i].tagName === tagName) {
			return nodes[i];
		}
	}
}

/**
 * Loads an XML presets file, parses it into a Document object, and passes it to a callback function.
 * 
 * @param {string} file_name - The path or URL of the XML presets file.
 * @param {function(Document): void} callback - A callback function that is called once the XML is loaded and parsed.
 * @returns {void} This function does not return a value, but executes the callback when the data is ready.
 */
export function loadPresets(file_name, callback) {
    fetch(file_name, { cache: "no-store" })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            return response.text();
        })
        .then(text => {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "application/xml");

            // Check for parser errors
            const parserError = xmlDoc.getElementsByTagName("parsererror");
            if (parserError.length > 0) {
                throw new Error("Error parsing XML.");
            }

            if (typeof callback === 'function') {
                callback(xmlDoc);
              }              
        })
        .catch(error => {
            console.error("Error loading presets:", error);
        });
}