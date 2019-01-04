import $ from 'jquery';
import {createGraph} from './code-analyzer';
import * as d3graphviz from 'd3-graphviz';


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let codeToArgs = $('#argsPlaceholder').val();
        let graphDot = createGraph(codeToParse,codeToArgs);
        let string = 'digraph G {' + graphDot + '}';
        d3graphviz.graphviz('#graph').renderDot(string);
    });
});
