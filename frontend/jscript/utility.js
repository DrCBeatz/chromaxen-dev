// jscript/utility.js

/**
 * Returns a shallow copy of the provided array. This function is useful if you want 
 * to ensure that modifications to the returned array do not affect the original array.
 *
 * @function dereference
 * @param {Array} array - The array to be copied.
 * @returns {Array} A new array containing the same elements as the original.
 */
export function dereference(array){
    const new_array = []
    for(let i = 0; i < array.length; i++){
        new_array.push(array[i])
    }
    return new_array
}