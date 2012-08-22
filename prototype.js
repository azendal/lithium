(function(global) {

    var Neon = {};

    Neon.Interface = function Interface(nameOrNameSpace, name) {
        var nameSpace, interfaceName, factory;
        nameSpace = (nameOrNameSpace && name) ? nameOrNameSpace : this;
        interfaceName = (nameOrNameSpace && name) ? name :
            (nameOrNameSpace) ? nameOrNameSpace : 'interface' + Math.random().toString();
        factory = function(definition) {
            definition.isInterface = true;
            definition.name = interfaceName;
            nameSpace[interfaceName] = definition;
            return nameSpace[interfaceName];
        };
        return factory;
    };

    Neon.Module = function Module(nameOrNameSpace, name) {
        var nameSpace, moduleName, factory;
        nameSpace = (nameOrNameSpace && name) ? nameOrNameSpace : this;
        moduleName = (nameOrNameSpace && name) ? name :
            (nameOrNameSpace) ? nameOrNameSpace : 'module' + Math.random().toString();
        factory = function(definition) {
            definition.isModule = true;
            nameSpace[moduleName] = definition;
            return nameSpace[moduleName];
        };
        return factory;
    };

    Neon.Class = function Class(classNameOrNameSpace, className) {
        var nameSpace, newClass, classFactory;
        nameSpace = (classNameOrNameSpace && className) ? classNameOrNameSpace : this;
        className = (classNameOrNameSpace && className) ? className :
            (classNameOrNameSpace) ? classNameOrNameSpace : 'class' + Math.random().toString();

        newClass = function() {
            if (this.init) {
                this.init.apply(this, arguments);
            }
        };

        newClass.__descendants = [];
        newClass.__implementedInterfaces = [];
        newClass.__includedModules = [];
        newClass.className = className;
        newClass.include = function(module) {
            var property;
            for (property in module) {
                if (module.hasOwnProperty(property)
                    && property != 'prototype'
                    && property != 'constructor'
                    && property != 'isModule'
                    && property != 'superClass') {
                    newClass[property] = module[property];
                }
            }

            if (module.hasOwnProperty('prototype') && module.prototype) {
                for (property in module.prototype) {
                    if (module.prototype.hasOwnProperty(property)) {
                        newClass.prototype[property] = module.prototype[property];
                    }
                }
            } else {
                module.prototype = {};
            }

            newClass.__includedModules.push(module);
            return this;
        };

        classFactory = function(classDefinition) {
            var i, il, j, jl, property, classPrototype = classDefinition.prototype;
            if (classPrototype) {
                for (property in classPrototype) {
                    if (classPrototype.hasOwnProperty(property)) {
                        newClass.prototype[property] = classPrototype[property];
                    }
                }
                delete classDefinition.prototype;
            }
            for (property in classDefinition) {
                if (classDefinition.hasOwnProperty(property)) {
                    newClass[property] = classDefinition[property];
                }
            }

            for (i = 0, il = newClass.__implementedInterfaces.length; i < il; i++) {
                for (j = 0, jl = newClass.__implementedInterfaces[i].constructor.length; j < jl; j++) {
                    if (!newClass[ newClass.__implementedInterfaces[i].constructor[j] ]) {
                        console.log('must implement static ' + newClass.__implementedInterfaces[i].name);
                        break;
                    }
                }

                if (newClass.__implementedInterfaces[i].hasOwnProperty('prototype')
                    && newClass.__implementedInterfaces[i].prototype) {
                    for (j = 0, jl = newClass.__implementedInterfaces[i].prototype.length; j < jl; j++) {
                        if (!newClass.prototype[newClass.__implementedInterfaces[i].prototype[j]]) {
                            console.log('must implement prototype ' + newClass.__implementedInterfaces[i].name);
                            break;
                        }
                    }
                }
            }

            nameSpace[className] = newClass;
            return newClass;
        };

        classFactory.inherits = function(superClass) {
            var i, inheritedClass;
            newClass.superClass = superClass;
            if (superClass.hasOwnProperty('__descendants')) {
                superClass.__descendants.push(newClass);
            }
            inheritedClass = function() {
            };
            inheritedClass.prototype = superClass.prototype;
            newClass.prototype = new inheritedClass();
            newClass.prototype.constructor = newClass;

            for (i in superClass) {
                if (superClass.hasOwnProperty(i)
                    && i != 'prototype'
                    && i !== 'className'
                    && i !== 'superClass'
                    && i !== 'include'
                    && i != '__descendants') {
                    newClass[i] = superClass[i];
                }
            }

            delete this.inherits;
            return this;
        };

        classFactory.ensures = function(interfaces) {
            for (var i = 0; i < arguments.length; i++) {
                newClass.__implementedInterfaces.push(arguments[i]);
            }
            delete this.ensures;
            return classFactory;
        };

        classFactory.includes = function() {
            for (var i = 0; i < arguments.length; i++) {
                newClass.include(arguments[i]);
            }
            return classFactory;
        };

        return classFactory;

    };

    if (typeof define === 'function') {
        define(function() {
            return Neon;
        });
    } else {
        global.Class = Neon.Class;
        global.Module = Neon.Module;
        global.Interface = Neon.Interface;
    }

}(typeof window !== 'undefined' ? window : (typeof exports !== 'undefined' ? exports : null)));

currentMethod = [];
calls = [];

Li = {};
Class(Li, 'ObjectSpy')({
    prototype : {
        spies : null,
        init : function () {
            this.spies = [];
        },
        spy   : function (targetObject) {
            Object.getOwnPropertyNames(targetObject).forEach(function (property) {
                if (typeof targetObject[property] !== "function"){
                    return false;
                }
                var spy = new Li.Spy();
                spy.on(targetObject).method(property);
                this.spies.push(spy);
            }, this);
        },
        destroy : function () {
            this.spies.forEach(function (spy) {
                spy.removeSpy();
            });
            this.spies = null;
        }
    }
});

Class(Li, 'Spy')({
    prototype : {
        targetObject   : null,
        methodName     : null,
        spyMethod      : null,
        originalMethod : null,
        objectHasMethod : null,
        called         : null,
        init           : function (config) {
            config = config || {};

            this.called         = [];
            this.targetObject   = config.targetObject;
            this.methodName     = config.methodName;
        },
        applySpy       : function () {
            var spy;

            spy = this;
            if (this.targetObject.hasOwnProperty(this.methodName) === false) {
                this.objectHasMethod = false;
            } 
            else {
                this.objectHasMethod = true;
            }
            
            this.originalMethod = this.targetObject[this.methodName];

            this.targetObject[this.methodName] = function () {
                var args, result;
                args = Array.prototype.slice.call(arguments, 0, arguments.length);
                var scope = this;
                
                if (this === spy) {
                    scope = spy.targetObject;
                }
                
                //console.log(spy.targetObject, spy.methodName, spy.originalMethod);
                
                currentMethod.push(spy.methodName);
                if (currentMethod.length > 1) {
                    console.log(currentMethod[currentMethod.length -2], ';', currentMethod[currentMethod.length - 1]);
                    calls.push(currentMethod[currentMethod.length -2] + ';' + currentMethod[currentMethod.length - 1])
                }
                
                result = spy.originalMethod.apply(scope, args);
                
                currentMethod.pop();
                
                spy.called.push({
                    arguments : args,
                    returned : result
                });

                return result;
            };
            
            Object.getOwnPropertyNames(this.originalMethod).forEach(function (property) {
                spy.targetObject[spy.methodName][property] = spy.originalMethod[property];
            });
            
            return this;
        },
        removeSpy      : function () {
            if (this.objectHasMethod === true) {
                this.targetObject[this.methodName] = this.originalMethod;
            }
            else {
                delete this.targetObject[this.methodName];
            }
            return this;
        },
        on             : function (targetObject) {
            this.targetObject = targetObject;
            return this;
        },
        method         : function (methodName) {
            this.methodName = methodName;
            this.applySpy();
            return this;
        }
    }
});

testObj = {
    first : function (x) {
        this.second(1);
        this.third(1);
    },
    second : function (x) {
        this.third(1);
    },
    third : function (x) {
        return 'x';
    }
}

//var spy = (new Li.Spy()).on(testObj).method('first');
//var spy2 = (new Li.Spy()).on(testObj).method('second');
//var spy3 = (new Li.Spy()).on(testObj).method('third');
objectSpy = new Li.ObjectSpy()
objectSpy.spy(Elastic);

objectSpy2 = new Li.ObjectSpy()
objectSpy2.spy(Elastic.helpers);

objectSpy2 = new Li.ObjectSpy()
objectSpy2.spy(jQuery.fn);

Elastic.refresh();

calls.join("\n");