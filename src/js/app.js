import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {getModel} from './code-analyzer';
import {getSubstitutionModel} from './symbolicSubstitution';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let inputVector = $('#inputVectorPlaceHolder').val();
        parseCode(codeToParse);
        let model = getModel();
        model.sort(compare);
        let subModel = getSubstitutionModel(model,inputVector,codeToParse);
        document.getElementById('tableWrapper').innerHTML = createTable(subModel);
        createTableWork1(model);
        //$('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});

function compare(a,b) {
    if (a.line < b.line)
        return -1;
    if (a.line > b.line)
        return 1;
}

function createTable(model)
{
    var inerHtmlTable ='<div><table  cellspacing="0" cellpadding="0">\n';
    for (var i = 0; i < model.length; i++) {
        var firstTag ='<td>';
        if(model[i].color ==1) {
            firstTag ='<td class="green">';}
        else if(model[i].color ==2)        {
            firstTag ='<td class="red">';}
        inerHtmlTable += '<tr>';
        inerHtmlTable += firstTag +model[i].line+'</td>';
        inerHtmlTable += '</tr>\n';
    }
    return inerHtmlTable;
}

function createTableWork1(model)
{
    model.sort(compare);

    var inerHtmlTable ='<div><table border="1">\n';
    inerHtmlTable+='<tr><th>Line</th><th>Type</th><th>Name</th><th>Condition</th><th>Value</th></tr>';
    for (var i = 0; i < model.length; i++) {
        inerHtmlTable += '<tr>';
        inerHtmlTable += '<td>'+(model[i].line + '</td><td>' + model[i].type + '</td><td>' + model[i].name + '</td><td>' + model[i].condition + '</td><td>' + model[i].value +'</td>');
        inerHtmlTable += '</tr>\n';
    }

    return inerHtmlTable;
}