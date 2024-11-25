// jscript/utility.js

export function dereference(array){
    var new_array = []
    for(var i = 0; i < array.length; i++){
        new_array.push(array[i])
    }
    return new_array
}
