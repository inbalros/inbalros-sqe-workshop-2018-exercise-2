
var allVariablesDic;
var variableSubs;

var localVariables;
var globalAndInputVariables;
var inputVectorVar;

var expresionsDic;
var programObject;

const getSubstitutionModel = (model,inputVector,program) => {
     allVariablesDic= [] ;localVariables =[];globalAndInputVariables=[];variableSubs= [] ;expresionsDic= [] ; programObject = null;inputVectorVar=[];

    var progArray = program.split('\n')
    separateModeld(model);
    prepareExpressions();
    prepareVariablesTypes(inputVector,model);
    prepareVariableSubs();
    var newProg = prepareNewSubsProgram(model,progArray);
    var subsProg = getSubstitution(newProg);
};

function separateModeld(model) {
    for (var i = 0; i < model.length; i++) {
        if (model[i].type == 'FunctionDeclaration') {
            programObject = {
                from: model[i].line, to: model[i].endLine, type: model[i].type, index: i};
        }
        else if (model[i].type == 'IfStatement' || model[i].type == 'ElseIfStatement' || model[i].type == 'WhileStatement'||model[i].type == 'ElseStatment') {
            expresionsDic.push({
                from: model[i].line, to:  model[i].endLine, type: model[i].type, index: i});
        }
        else if (model[i].type == 'VariableDeclarator' || model[i].type == 'AssignmentExpression') {
            if(model[i].value!='') {
                allVariablesDic.push({
                    from: model[i].line, to: model[i].endLine, type: model[i].type,variable: model[i].name, value: model[i].value});
            }
        }
    }
}

function prepareInputVector(inputVector) {
    var array = inputVector.split(',')
    for (var i = 0; i < array.length; i++) {
        if(array[i].startsWith('['))
        {
            var list =[];
            list.push(array[i].substring(1, array[i].length));
            i++;
            while(!array[i].endsWith(']') && i<array.length)
            {
                list.push(array[i]);
                i++;
            }
            list.push(array[i].substring(0, array[i].length- 1));
            inputVectorVar.push(list);
        }
        else {
            inputVectorVar.push(array[i]);
        }
    }
}

function prepareVariablesTypes(inputVector,model) {
    prepareInputVector(inputVector); var index =0;
    for (var i = 0; i < model.length; i++) {
        if (model[i].type == 'VariableDeclarator') {
            if(model[i].line == programObject.from && model[i].endLine == programObject.to) {
            //means its from the input vector
                globalAndInputVariables.push({
                    from: model[i].line, to:  model[i].endLine, variable: model[i].name, value: inputVectorVar[index]});
                index++;
            }
            else if(model[i].value!='') {
                if(model[i].line > programObject.from && model[i].endLine < programObject.to) {
                    localVariables.push(model[i].name);
                }
                else {
                    globalAndInputVariables.push({
                        from: model[i].line, to: model[i].endLine, variable: model[i].name, value: model[i].value});
                }}}}
}

//return to work in this function
//function pushTolocalVariables(variable) {
//    if (Array.isArray(variable.value)) {
//        for (var i = 0; i < variable.value.length; i++) {
//            localVariables.push(model[i].name);
//        }
//    else {
//            localVariables.push(model[i].name);
//       });
//    }
//}

function prepareVariableSubs() {
    for (var i = 0; i < allVariablesDic.length; i++)
    {
        let nearestObj = findNearestExpression(allVariablesDic[i]);
        if(allVariablesDic[i].from>nearestObj.from && allVariablesDic[i].to <nearestObj.to) {
            pushToVariableSubs(allVariablesDic[i].from, nearestObj.to, allVariablesDic[i].type, allVariablesDic[i].variable, allVariablesDic[i].value);
        }else {
            pushToVariableSubs(nearestObj.from,nearestObj.to,allVariablesDic[i].type,allVariablesDic[i].variable,allVariablesDic[i].value);
        }
    }
}

function pushToVariableSubs(from,to,type,variable,value) {
    if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            variableSubs.push({
                from: from, to: to, type: type, variable: variable+"["+i+"]", value: allVariablesDic[i].value[i]});}
    }
    else {
        variableSubs.push({
            from: from, to: to, type: type, variable: variable, value: value
        });
    }
}

function prepareExpressions() {
    for (var i = 0; i < expresionsDic.length; i++)
    {
        if((i+1)<expresionsDic.length)
        {
            if(expresionsDic[i].type != 'WhileStatement' && expresionsDic[i].to == expresionsDic[i+1].to)
            {
                expresionsDic[i].to = expresionsDic[i+1].from-1;
            }
        }
    }
}

function findNearestExpression(varObject) {
    var distance = 10000;
    var nearestObj = null;
    for (var i = 0; i < expresionsDic.length; i++) {
        if( varObject.from >= expresionsDic[i].from &&  varObject.from <= expresionsDic[i].to && distance > (varObject.from-expresionsDic[i].from))
        {
            distance = varObject.from-expresionsDic[i].from;
            nearestObj = expresionsDic[i];
        }
    }
    if(distance == 10000)
    {
        nearestObj = programObject;
    }
    return nearestObj;
}

function prepareNewSubsProgram(model,progArray) {
    var newProg = []
    //index of a row is i+1
    for(var i = 0; i < progArray.length; i++) {
        if(i+1==programObject.from) {
            newProg.push({
                index:i+1,line: progArray[i]});}
        else if(i+1>programObject.from && i+1<=programObject.to) {
            var keep = true;
            for (var j = 0; j < model.length && keep; j++) {
                if(i+1 == model[j].line && localVariables.includes(model[j].name)) {
                    keep = false;
                }}
            if(keep) {
                newProg.push({
                    index:i+1,line: progArray[i]})
            }}}
    return newProg;
}

function getSubstitution(newProg) {

    for (var i = 0; i < newProg.length; i++) {

        for (var j = variableSubs.length - 1; j >= 0; j--) {

            if(newProg[i].index>variableSubs[j].from && newProg[i].index<=variableSubs[j].to)
            {
                newProg[i].line = newProg[i].line.replaceAll(variableSubs[j].variable,variableSubs[j].value);
            }
        }
    }
    return newProg;
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
};

export {getSubstitutionModel};
