import * as esprima from 'esprima';
import * as escodegen from 'escodegen';
import * as esgraph from 'esgraph';

let functionArgs;
let argsToPresent;
let throwArgs;
let programLines;

function parseOriginalCode(codeToParse){
    return esprima.parseScript(codeToParse,{range : true});
}

function createGraph(parsedJson,functionArgs){
    parseCode(parsedJson,functionArgs);
    let jsonCode = parseOriginalCode(parsedJson);
    let graphCfg = esgraph(jsonCode.body[0].body);
    let dotGraph = esgraph.dot(graphCfg, {counter:0, source: parsedJson});
    let arrayDot = dotGraph.split('\n');
    removeExceptions(arrayDot);
    removeEntryAndExit(arrayDot);
    handleGraphToPresent(arrayDot);
    removeNoNeedNodes(arrayDot);
    changeToBoxOrDiamondShape(arrayDot);
    addColorToGraph(arrayDot,programLines);
    colorReturnStatement(arrayDot);
    removeLetFromNodes(arrayDot);
    addNumbersToNodes(arrayDot);
    dotGraph = arrayDot.join(' ');
    return dotGraph;
}

const parseCode = (codeToSubstitute,codeToArgs) => {
    functionArgs = codeToArgs.split(',');
    programLines = [];
    argsToPresent = [];
    throwArgs = [];
    let i;
    for(i = 0;i < functionArgs.length; i++){
        functionArgs[i] = (esprima.parseScript(functionArgs[i])).body[0];
    }
    let inputCode= esprima.parseScript(codeToSubstitute,{loc:true});
    let envOfProgram = [];
    let substituteCode = parseJsonCode(inputCode,envOfProgram,0);
    let outputCode = escodegen.generate(substituteCode);
    handleProgramLines(codeToSubstitute);
    return outputCode;
};

export {parseCode,createGraph};

function handleGraphToPresent(cfgDot){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        if(checkVariableDec(cfgDot[i]) && checkVariableDec(cfgDot[i+1])){
            mergeTwoVariableNodes(cfgDot,i);
            i--;

        }
    }
    return cfgDot;
}

function mergeTwoVariableNodes(nodes,num){
    let firstNodeLabel = returnLabelOfNode(nodes[num]);
    let secondNodeLabel = returnLabelOfNode(nodes[num+1]);
    let newMergedLabel = firstNodeLabel + '\n' +  secondNodeLabel;
    let replacedNode = getNumOfNode(nodes[num]) + ' -> ' + getNumOfNode(nodes[num+1]) + ' []';
    let removeNode = getNumOfNode(nodes[num+1]) + ' -> ' + getNumOfNode(nodes[num+2]) + ' []';
    let i;
    for(i = 0;i < nodes.length;i++){
        if(nodes[i] === replacedNode){
            nodes[i] = getNumOfNode(nodes[num]) + ' -> ' + getNumOfNode(nodes[num+2]) + ' []';
        }
        else if(nodes[i] === removeNode){
            nodes.splice(i,1);
        }
    }
    nodes[num] = nodes[num].replace(firstNodeLabel,newMergedLabel);
    nodes.splice(num+1,1);
}

function checkVariableDec(node){
    let currLabel = returnLabelOfNode(node);
    return currLabel.includes('let');
}

function getNumOfNode(node){
    let currNode = node;
    currNode = currNode.substring(0,2);
    return currNode;
}

function removeExceptions(cfgDot){
    let currLabel;
    let i;
    for(i = 0;i < cfgDot.length;i++){
        currLabel = returnLabelOfNode(cfgDot[i]);
        if(currLabel.includes('exception')){
            cfgDot.splice(i,1);
        }
    }
    return cfgDot;
}

function removeNoNeedNodes(cfgDot){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        if(cfgDot[i] === ''){
            cfgDot.splice(i,1);
        }
    }
}

function removeLetFromNodes(cfgDot){
    let arrayLabel;
    let newLabel;
    let i;
    for(i = 0;i < cfgDot.length;i++){
        let currLabel = returnLabelOfNode(cfgDot[i]);
        if(currLabel.includes('let')) {
            arrayLabel = currLabel.split('\n');
            for (let j = 0; j < arrayLabel.length; j++) {
                arrayLabel[j] = arrayLabel[j].substring(3);
            }
            newLabel = arrayLabel.join('\n');
            let labelIndex = '[label="';
            let indexToInsertIn = cfgDot[i].indexOf(labelIndex) + labelIndex.length;
            cfgDot[i] = cfgDot[i].substr(0,indexToInsertIn) + newLabel + cfgDot[i].substr(indexToInsertIn + currLabel.length);
        }
    }
}

function addNumbersToNodes(cfgDot){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        if(!(cfgDot[i].includes(' -> '))){
            let labelIndex = '[label="';
            let indexToInsertIn = cfgDot[i].indexOf(labelIndex) + labelIndex.length;
            let stringToAdd = '(' + (i+1) + ')\n';
            cfgDot[i] = cfgDot[i].substr(0,indexToInsertIn) + stringToAdd + cfgDot[i].substr(indexToInsertIn);
        }
    }
}

function changeToBoxOrDiamondShape(cfgDot){
    let diamondsShape = checkDiamondOrBox(cfgDot);
    let i,j;
    for(i = 0;i < cfgDot.length;i++){
        if(!(cfgDot[i].includes(' -> '))){
            let startFromPos = cfgDot[i].indexOf(';');
            let stringLabel = cfgDot[i].substring(0, cfgDot[i].indexOf(']',startFromPos));
            cfgDot[i] = stringLabel + ', shape = "box' + '"]';
        }
        for(j = 0;j < diamondsShape.length;j++){
            if(diamondsShape.includes(getNumOfNode(cfgDot[i]))){
                cfgDot[i] = cfgDot[i].replace('box','diamond');
            }
        }
    }
}

function checkDiamondOrBox(nodes){
    let diamonds = [];
    let i;
    for(i = 0;i < nodes.length;i++){
        if(returnLabelOfNode(nodes[i]).includes('true')){
            diamonds.push(getNumOfNode(nodes[i]));
        }
    }
    return diamonds;
}

function addColorToGraph(cfgDot,programLines){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        let shapeLabel = cfgDot[i].split('shape');
        if(!(shapeLabel[0].includes(' -> '))){
            changeColorInNode(cfgDot,i,'green');
        }
    }
    checkGraphPathToColor(cfgDot,programLines);
}

function colorReturnStatement(cfgDot){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        let shapeLabel = cfgDot[i].split('shape');
        if(!(shapeLabel[0].includes(' -> ')) && cfgDot[i].includes('return')){
            changeColorInNode(cfgDot,i,'green');
        }
    }
}

function changeColorInNode(cfgDot,num,color){
    let startFromPos = cfgDot[num].indexOf(';');
    let stringLabel = cfgDot[num].substring(0, cfgDot[num].indexOf(']',startFromPos));
    cfgDot[num] = stringLabel + ' style="filled" fillcolor = "' + color + '"]';
}

function checkGraphPathToColor(cfgDot,programLines){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        let shapeLabel = cfgDot[i].split('shape');
        if(!(shapeLabel[0].includes(' -> ')) && (shapeLabel[1].includes('diamond'))){
            changeColorInNode(cfgDot,i,'green');
            let labelIndex = '[label="';
            let indexToInsertIn = cfgDot[i].indexOf(labelIndex) + labelIndex.length;
            let checkWhile = checkWhileCode(programLines);
            let ifCond = cfgDot[i].substring(indexToInsertIn,cfgDot[i].indexOf(','));
            if(checkWhile){
                checkValueOfWhileCond(ifCond.substring(0, ifCond.indexOf('"')), programLines, cfgDot, i);
            }
            checkValueOfIfCond(ifCond.substring(0,ifCond.indexOf('"')),programLines,cfgDot,i);
        }
    }
}

function checkValueOfIfCond(ifCond,programLines,cfgDot,i){
    let j;
    for(j = 0;j < programLines.length;j++){
        if(programLines[j].string === ifCond){
            if(programLines[j].val === false){
                let counter = checkNodesInBlock(cfgDot,i);
                while(counter != 0){
                    changeColorInNode(cfgDot,i+1,'white');
                    counter--;
                    i++;
                }
            }
        }
    }
    checkIfValueTrue(ifCond,programLines,cfgDot,i);
}

function checkIfValueTrue(ifCond,programLines,cfgDot,i){
    let j;
    for(j = 0;j < programLines.length;j++){
        if(programLines[j].string === ifCond && programLines[j].val === true){
            let counter = checkNodesInBlock(cfgDot,i);
            let numOfNode = getNumOfNode(cfgDot[i]);
            while(counter != 0){
                let neededNode = findNeededLabel(cfgDot, numOfNode, 'false');
                let num = checkPlaceInArray(cfgDot, neededNode);
                changeColorInNode(cfgDot,num,'white');
                counter--;
                i++;
            }
        }
    }
}

function checkValueOfWhileCond(whileCond,programLines,cfgDot,i){
    let j;
    for(j = 0;j < programLines.length;j++){
        if(programLines[j].val === false) {
            let counter = checkNodesInBlock(cfgDot,i);
            while(counter != 0){
                changeColorInNode(cfgDot, i+1, 'white');
                counter--;
                i++;
            }
        }
    }
}

function checkNodesInBlock(cfgDot,i){
    let counter = 0;
    let j;
    for(j = i+1;j < cfgDot.length;j++){
        let tmp = returnLabelOfNode(cfgDot[j]).substring(0,cfgDot[i].indexOf('"'));
        if(tmp.includes('=') || tmp.includes('--') || tmp.includes('++')){
            counter++;
        }
    }
    return counter;
}

function findNeededLabel(cfgDot,numOfNode,boolValue){
    let neededNodeToColor;
    let i;
    for(i = 0;i < cfgDot.length;i++){
        if(cfgDot[i].includes(numOfNode + ' -> ')){
            if(returnLabelOfNode(cfgDot[i]).includes('false') && boolValue === 'false'){
                neededNodeToColor = getNumOfNode(cfgDot[i].substring(6));
            }
        }
    }
    return neededNodeToColor;
}

function checkPlaceInArray(cfgDot,nodeNum){
    let i;
    for(i = 0;i < cfgDot.length;i++){
        if(getNumOfNode(cfgDot[i]) === nodeNum){
            return i;
        }
    }
}

function checkWhileCode(programLines){
    let i;
    for(i = 0;i < programLines.length;i++){
        if(programLines[i].flag === 'WhileStatement'){
            return true;
        }
    }
    return false;
}

function removeEntryAndExit(cfgDot){
    let entryNode = 'n0 -> n1 []';
    cfgDot.splice(0,1);
    let exitNode =findExitNode(cfgDot);
    cfgDot = removeEntryNode(cfgDot,entryNode);
    cfgDot = removeExitNode(cfgDot,exitNode);
    return cfgDot;
}

function removeEntryNode(arrayDot,entryNode){
    let i;
    for(i = 0;i < arrayDot.length;i++){
        if(arrayDot[i] === entryNode){
            arrayDot.splice(i,1);
        }
    }
    return arrayDot;
}

function removeExitNode(arrayDot,exitNode){
    let i;
    for(i = 0;i < arrayDot.length;i++){
        if(returnLabelOfNode(arrayDot[i]).includes('exit')){
            arrayDot.splice(i,1);
        }
        if(arrayDot[i].includes(' -> ' +exitNode)){
            arrayDot.splice(i,1);
        }
    }
    return arrayDot;
}

function findExitNode(nodes){
    let currLabelNode;
    let numberNode;
    let i;
    for(i = 0;i < nodes.length;i++){
        currLabelNode = returnLabelOfNode(nodes[i]);
        if(currLabelNode.includes('exit')){
            numberNode = getNumOfNode(nodes[i]);
        }
    }
    return numberNode;
}

function returnLabelOfNode(node){
    let nodeLabel = node.substring(node.indexOf('label') + 7);
    if(nodeLabel.includes('let')){
        let cleanEnd = nodeLabel.indexOf(';');
        nodeLabel = nodeLabel.substring(0,cleanEnd);
    }
    return nodeLabel;
}

function handleProgramLines(codeToSubstitute){
    let codeArray = codeToSubstitute.split('\n');
    for(let j = 0;j<codeArray.length;j++){
        if(codeArray[j].includes('if')){
            let ass = codeArray[j].split('if');
            ass = ass[1].substring(ass[1].indexOf('(') + 1,ass[1].indexOf(')'));
            for(let i = 0;i<programLines.length;i++){
                if(programLines[i].flag === 'IfStatement'){
                    programLines[i].string = ass;
                    programLines[i].flag = 'IfStatement' + i;
                    break;
                }
            }
        }
    }
}

const substituteFunctions = {
    'Program' : substituteProgram,
    'FunctionDeclaration' : substituteFunctionDeclaration,
    'BlockStatement' : substituteBlockStatement,
    'VariableDeclaration' : substituteVariableDeclaration,
    'ExpressionStatement' : substituteExpressionStatement,
    'AssignmentExpression' : substituteAssignmentExpression,
    'WhileStatement' : substituteWhileStatement,
    'IfStatement' : substituteIfStatement,
    'ArrayExpression' : substituteArrayExpression,
    'BinaryExpression' : substituteBinaryExpression,
    'Identifier' : substituteIdentifier,
    'Literal' : literal,
    'MemberExpression' : substituteMemberExpression,
    'ReturnStatement' : substituteReturnStatement,
    'UnaryExpression' : substituteUnaryExpression,
    'UpdateExpression' : substituteUpdateExpression,
};

const parseJsonCode = (stringCode,environmentFunc,depth) =>{
    return substituteFunctions[stringCode.type](stringCode,environmentFunc,depth);
};

function handleEnvironment(argName,value,environmentFunc,depth){
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === argName && element['scope'] === depth){
            element['val'] = parseJsonCode(value,environmentFunc,depth);
            return true;
        }
    }
    return false;
}

function checkExprArgs(stringCode){
    let bool = true;
    if (stringCode.type === 'ExpressionStatement') {
        bool = checkRelevantArgsToPresent(stringCode.expression);
    }
    else if(stringCode.type === 'VariableDeclaration')
        bool = checkRelevantArgsToPresent(stringCode);
    return bool;
}

function checkRelevantArgsToPresent(stringCode) {
    let bool = true;
    if ((stringCode.type === 'VariableDeclaration' && !argsToPresent.includes(escodegen.generate(stringCode.declarations[0])))) {
        bool = false;
    }
    if (stringCode.type === 'AssignmentExpression') {
        if (!argsToPresent.includes(escodegen.generate(stringCode.left))) {
            bool = false;
        }
    }
    return bool;
}

function throwExpInCurrScope(n,environmentFunc){
    let i;
    for(i=(environmentFunc.length-1);i>=0;i--){
        if(environmentFunc[i]['scope']===n){
            throwArgs.push(environmentFunc.splice(i,1));
            break;
        }
    }
}

function substituteProgram(stringCode,environmentFunc,depth){
    let i;
    for(i = 0;i < stringCode.body.length;i++) {
        stringCode.body[i] = parseJsonCode(stringCode.body[i],environmentFunc,depth);
    }
    return stringCode;
}

function substituteFunctionDeclaration(stringCode,environmentFunc,depth){
    let i;
    for(i = 0;i < stringCode.params.length;i++){
        argsToPresent.push(escodegen.generate(stringCode.params[i]));
        environmentFunc.unshift({var:stringCode.params[i].name,val:parseJsonCode(functionArgs[i],environmentFunc,depth),scope:depth});
    }
    stringCode.body = parseJsonCode(stringCode.body,environmentFunc,depth);
    throwExpInCurrScope(0,environmentFunc);
    return stringCode;
}

function substituteBlockStatement(stringCode,environmentFunc,depth){
    let relevantOutput = [];
    let i;
    for(i = 0;i < stringCode.body.length;i++){
        stringCode.body[i] = parseJsonCode(stringCode.body[i],environmentFunc,depth+1);
        if(checkExprArgs(stringCode.body[i])){
            relevantOutput.push(stringCode.body[i]);
        }
    }
    stringCode.body = relevantOutput;
    throwExpInCurrScope(depth+1,environmentFunc);
    return stringCode;
}


function substituteVariableDeclaration(stringCode,environmentFunc,depth){
    let variable = stringCode.declarations;
    let checkUpdated;
    let i;
    for(i = 0;i < variable.length;i++){
        let varName = variable[i].id.name;
        if(variable[i].init!=null){
            checkUpdated = handleEnvironment(varName,variable[i].init,environmentFunc,depth);
            if(!checkUpdated){
                environmentFunc.unshift({var:varName,val:parseJsonCode(variable[i].init,environmentFunc,depth),scope:depth});
            }
        }
    }
    return stringCode;
}

function substituteExpressionStatement(stringCode,environmentFunc,depth){
    stringCode.expression = parseJsonCode(stringCode.expression,environmentFunc,depth);
    return stringCode;
}

function substituteAssignmentExpression(stringCode,environmentFunc,depth){
    let checkUpdated;
    stringCode.right = parseJsonCode(stringCode.right,environmentFunc,depth);
    let leftVarName = escodegen.generate(stringCode.left);
    checkUpdated = handleEnvironment(leftVarName,stringCode.right,environmentFunc,depth);
    if(!checkUpdated){
        environmentFunc.unshift({var:leftVarName,val:parseJsonCode(stringCode.right,environmentFunc,depth),scope:depth});
    }
    return stringCode;
}

function substituteArrayExpression(stringCode,environmentFunc,depth){
    let i;
    for(i = 0;i < stringCode.elements.length;i++){
        stringCode.elements[i] = parseJsonCode(stringCode.elements[i],environmentFunc,depth);
    }
    return stringCode;
}

function substituteBinaryExpression(stringCode,environmentFunc,depth){
    stringCode.left = parseJsonCode(stringCode.left,environmentFunc,depth);
    stringCode.right = parseJsonCode(stringCode.right,environmentFunc,depth);
    return evalValue(stringCode);
}


function substituteMemberExpression(stringCode,environmentFunc,depth){
    stringCode.property = parseJsonCode(stringCode.property,environmentFunc,depth);
    let property = escodegen.generate(stringCode.property);
    let objRest = '[' + property + ']';
    let objName = stringCode.object.name;
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === objName){
            let evalArgName = eval(escodegen.generate(element['val'])+objRest);
            stringCode = esprima.parseScript(evalArgName.toString(),{loc:true});
            stringCode = stringCode.body[0].expression;
        }
    }
    return stringCode;
}

function substituteUnaryExpression(stringCode,environmentFunc,depth){
    stringCode.argument = parseJsonCode(stringCode.argument,environmentFunc,depth);
    return stringCode;
}

function substituteUpdateExpression(stringCode,environmentFunc,depth){
    let argName = stringCode.argument.name;
    let operator = stringCode.operator[0];
    stringCode = esprima.parseScript(argName + '=' + argName + operator + '1', {loc: true}).body[0];
    stringCode.expression = parseJsonCode(stringCode.expression,environmentFunc,depth);
    return stringCode;
}

function substituteIdentifier(stringCode,environmentFunc){
    let i;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === stringCode.name && !argsToPresent.includes(element['var']))
            stringCode = element['val'];
    }
    return stringCode;
}

function substituteWhileStatement(stringCode,environmentFunc,depth){
    stringCode.test = parseJsonCode(stringCode.test,environmentFunc,depth);
    let resultTest = changeArgs(stringCode.test,environmentFunc,depth);
    programLines.push({string:(escodegen.generate(stringCode.test)),flag:'WhileStatement',val:resultTest});
    stringCode.body = parseJsonCode(stringCode.body,environmentFunc,depth);
    return stringCode;
}

function evalValue(stringCode){
    let currArg = escodegen.generate(stringCode);
    let i;
    for(i = 0;i < argsToPresent.length; i++){
        if(currArg.includes(argsToPresent[i]))
            return stringCode;
    }
    let evaluate = eval(currArg);
    stringCode = esprima.parseScript(evaluate.toString());
    stringCode = stringCode.body[0].expression;
    return stringCode;
}


function changeArgs(stringCode,environmentFunc){
    let currArg = escodegen.generate(stringCode);
    let i;
    for (i = 0; i < argsToPresent.length; i++) {
        if (currArg.includes(argsToPresent[i])) {
            let indexInEnv = findValueOfArgInEnv(environmentFunc,argsToPresent[i]);
            let valueOfArgInEnv = escodegen.generate(environmentFunc[indexInEnv]['val']).substring(0,1);
            currArg = changeValues(currArg, argsToPresent[i], valueOfArgInEnv);
        }
    }
    let evaluate = eval(currArg);
    return evaluate;
}

function findValueOfArgInEnv(environmentFunc,argument){
    let i;
    let out;
    for(i = 0;i < environmentFunc.length;i++){
        let element = environmentFunc[i];
        if(element['var'] === argument){
            out = i;
        }
    }
    return out;
}

function changeValues(currArg, argsToShow,newValue){
    let argArray = currArg.split(' ');
    let i;
    for(i = 0;i < argArray.length;i++){
        if(argArray[i] === argsToShow){
            argArray[i] = newValue;
        }
    }
    return argArray.join(' ');
}

function substituteIfStatement(stringCode,environmentFunc,depth){
    stringCode.test = parseJsonCode(stringCode.test,environmentFunc,depth);
    let resultTest = changeArgs(stringCode.test,environmentFunc,depth);
    programLines.push({string:(escodegen.generate(stringCode.test)),flag:'IfStatement',val:resultTest});
    depth = depth+1;
    let temp = Object.assign([],environmentFunc);
    stringCode.consequent = parseJsonCode(stringCode.consequent,environmentFunc,depth);
    throwExpInCurrScope(depth,environmentFunc);
    environmentFunc = Object.assign([],temp);
    if(stringCode.alternate === null) return stringCode;
    stringCode.alternate = parseJsonCode(stringCode.alternate,environmentFunc,depth);
    throwExpInCurrScope(depth,environmentFunc);
    environmentFunc = Object.assign([],temp);
    return stringCode;
}

function literal(stringCode){
    return stringCode;
}

function substituteReturnStatement(stringCode,environmentFunc,depth){
    stringCode.argument = parseJsonCode(stringCode.argument,environmentFunc,depth);
    return stringCode;
}