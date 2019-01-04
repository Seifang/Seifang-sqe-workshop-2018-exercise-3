import assert from 'assert';
import {createGraph} from '../src/js/code-analyzer';

describe('Create Cfg test:', () => {
    it('Test 1:', () => {
        assert.equal(createGraph(
            'function foo(x){\n' +
            '    let a = x + 1;\n' +
            '    x++;\n' +
            '    return x;  \n' +
            '}',
            '1,'),
        'n1 [label="(1)\n' +
            ' a = x + 1;", shape = "box" style="filled" fillcolor = "green"] n2 [label="(2)\n' +
            'x++", shape = "box" style="filled" fillcolor = "green"] n3 [label="(3)\n' +
            'return x;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n2 [] n2 -> n3 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 2:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' + '    let a = x + 1;\n' +   '    let b = a + y;\n' +
            '    let c = 0;\n' + '    \n' + '    if (b < z) {\n' + '        c = c + 5;\n' + '    } else if (b < z * 2) {\n' + '        c = c + x + 5;\n' + '    } else {\n' +
            '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return c;\n' +
            '}\n',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 1\n' +
            ' b = a + y\n' +
            ' c = 0;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'b < z", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'c = c + 5", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n6 [label="(4)\n' +
            'return c;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white" style="filled" fillcolor = "green"] n7 [label="(5)\n' +
            'b < z * 2", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "white" style="filled" fillcolor = "green"] n8 [label="(6)\n' +
            'c = c + x + 5", shape = "box" style="filled" fillcolor = "green"] n9 [label="(7)\n' +
            'c = c + z + 5", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white" style="filled" fillcolor = "white"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n7 [label="false"] n5 -> n6 [] n7 -> n8 [label="true"] n7 -> n9 [label="false"] n8 -> n6 [] n9 -> n6 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 3:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' + '    let a = x + 1;\n' + '    let b = a + y;\n' + '    let c = 0;\n' +
            '    \n' + '    if (b < z * 2) {\n' + '        c = c + 5;\n' +
            '    } else {\n' + '        c = c + z + 5;\n' + '    }\n' + '    \n' + '    return -c;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 1\n' +
            ' b = a + y\n' +
            ' c = 0;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'b < z * 2", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'c = c + 5", shape = "box" style="filled" fillcolor = "green"] n6 [label="(4)\n' +
            'return -c;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n7 [label="(5)\n' +
            'c = c + z + 5", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white" style="filled" fillcolor = "white"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n7 [label="false"] n5 -> n6 [] n7 -> n6 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 4:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' + '   let a = x + 1;\n' + '   let b = a + y;\n' + '   let c = 0;\n' + '   \n' +
            '   while (a < z) {\n' +
            '       c = a + b;\n' + '       z = c * 2;\n' + '   }\n' + '   \n' +
            '   return z;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 1\n' +
            ' b = a + y\n' +
            ' c = 0;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'a < z", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'c = a + b", shape = "box" style="filled" fillcolor = "green"] n6 [label="(4)\n' +
            'z = c * 2", shape = "box" style="filled" fillcolor = "green"] n7 [label="(5)\n' +
            'return z;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n7 [label="false"] n5 -> n6 [] n6 -> n4 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 5:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' + '   let a = y + 5;\n' + '   let b = y + z;\n' + '   let c = 0;\n' +
            '   \n' + '   while (a < z) {\n' + '       c = a + b;\n' + '       z = c * 2;\n' + '   }\n' +
            '   \n' +
            '   return z;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = y + 5\n' +
            ' b = y + z\n' +
            ' c = 0;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'a < z", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'c = a + b", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n6 [label="(4)\n' +
            'z = c * 2", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n7 [label="(5)\n' +
            'return z;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n7 [label="false"] n5 -> n6 [] n6 -> n4 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 6:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' +
            '   let a = y + 5;\n' + '   let b = y + z;\n' + '   a = a + 2;\n' + '\n' +
            '   if(a < 6){\n' + '     x--;\n' + '     b = 4;\n' + '   } \n' +
            '   return z;\n' + '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = y + 5\n' +
            ' b = y + z;", shape = "box" style="filled" fillcolor = "green"] n3 [label="(2)\n' +
            'a = a + 2", shape = "box" style="filled" fillcolor = "green"] n4 [label="(3)\n' +
            'a < 6", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(4)\n' +
            'x--", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n6 [label="(5)\n' +
            'b = 4", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n7 [label="(6)\n' +
            'return z;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n3 [] n3 -> n4 [] n4 -> n5 [label="true"] n4 -> n7 [label="false"] n5 -> n6 [] n6 -> n7 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 7:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' +
            '   let a = x + 2;\n' + '   let b;\n' + '\n' +
            '   while(a < 6){\n' + '     b = 4;\n' + '   } \n' +
            '   return z;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 2\n' +
            ' b;", shape = "box" style="filled" fillcolor = "green"] n3 [label="(2)\n' +
            'a < 6", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n4 [label="(3)\n' +
            'b = 4", shape = "box" style="filled" fillcolor = "green"] n5 [label="(4)\n' +
            'return z;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n3 [] n3 -> n4 [label="true"] n3 -> n5 [label="false"] n4 -> n3 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 8:', () => {
        assert.equal(createGraph(
            'function foo(x, y, z){\n' +
            '   let a = x + 2;\n' + '   let b = 2;\n' + '   let a = y;\n' + '\n' +
            '   while(b < z){\n' + '     x = x + 1;\n' +
            '   } \n' + '   return z;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 2\n' +
            ' b = 2\n' +
            ' a = y;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'b < z", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'x = x + 1", shape = "box" style="filled" fillcolor = "green"] n6 [label="(4)\n' +
            'return z;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n6 [label="false"] n5 -> n4 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 9:', () => {
        assert.equal(createGraph(
            'function foo(x){\n' +
            'let a = 1;\n' + 'let x = [1,2,3];\n' + 'let b = x[2];\n' + '\n' +
            '  if(b<2){\n' +
            '    x = x + 1;\n' + '}\n' + 'return x;\n' +
            '}',
            '1'),
        'n1 [label="(1)\n' +
            ' a = 1\n' +
            ' x = [1,2,3]\n' +
            ' b = x[2];", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'b<2", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'x = x + 1", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white"] n6 [label="(4)\n' +
            'return x;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n6 [label="false"] n5 -> n6 []');
    });
});

describe('Create Cfg test:', () => {
    it('Test 10:', () => {
        assert.equal(createGraph(
            'function foo(x,y,z){\n' +
            'let a = x + 2;\n' + 'let b = a + y;\n' + 'let c = b + z;\n' + '\n' +
            'if(b < c){\n' +
            'a = b + c;\n' + '}\n' + '\n' +
            'return a;\n' +
            '}',
            '1,2,3'),
        'n1 [label="(1)\n' +
            ' a = x + 2\n' +
            ' b = a + y\n' +
            ' c = b + z;", shape = "box" style="filled" fillcolor = "green"] n4 [label="(2)\n' +
            'b < c", shape = "diamond" style="filled" fillcolor = "green" style="filled" fillcolor = "green"] n5 [label="(3)\n' +
            'a = b + c", shape = "box" style="filled" fillcolor = "green"] n6 [label="(4)\n' +
            'return a;", shape = "box" style="filled" fillcolor = "green" style="filled" fillcolor = "white" style="filled" fillcolor = "green"] n1 -> n4 [] n4 -> n5 [label="true"] n4 -> n6 [label="false"] n5 -> n6 []');
    });
});