console.clear();

var mapObjects = [Breeze];

Object.getOwnPropertyNames(window).forEach(function(object){
    if (window[object] && window[object].className) {
        mapObjects.push(window[object]) 
    } 
});

var mappedObjects = {
    name : 'Code',
    children : []
};

var objectMapper = function(object) {
    var currentObject = {
        name : object.className,
        type : Object.prototype.toString.apply(object).replace('[object ', '').replace(']', ''),
        children : propertyMapper(object)
    };
    
    return currentObject;
};

var propertyMapper = function (object) {
    var properties = [];
    
    Object.getOwnPropertyNames(object).forEach(function(property){
        
        var currentProperty = {
            name : property,
            type : Object.prototype.toString.apply(object[property]).replace('[object ', '').replace(']', ''),
            children : []
        };

        if (property !== 'superClass' && 
            property !== '__descendants' && 
            property !== '__includedModules' && 
            property !== '_cache' &&
            property !== 'constructor' &&
            currentProperty.type == 'Object'
        ) {
            currentProperty.children = propertyMapper(object[property]);
        }

        properties.push(currentProperty);
    });
    
    return properties;
};

mapObjects.forEach(function(object){
    mappedObjects.children.push(objectMapper(object));
});



console.dir(mappedObjects);

var data = JSON.stringify(mappedObjects);
window.location.href = "data:application/x-download;charset=utf-8," + data;