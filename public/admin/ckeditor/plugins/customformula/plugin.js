CKEDITOR.plugins.add('customformula',{
    init: function (editor) {
        var pluginName = 'customformula';
        editor.ui.addButton('customAdd', {
            label: 'Add',
            command: 'Add',
            icon: this.path + 'images/plus.png'
        });
        editor.ui.addButton('customSub', {
            label: 'Subtract',
            command: 'Sub',
            icon: this.path + 'images/minus.png'
        });
        editor.ui.addButton('customDiv', {
            label: 'Divide',
            command: 'Div',
            icon: this.path + 'images/divide.png'
        });
        editor.ui.addButton('customMul', {
            label: 'Multiply',
            command: 'Mul',
            icon: this.path + 'images/multiply.png'
        });
        editor.ui.addButton('customRoot', {
            label: 'Square Root',
            command: 'Sqrt',
            icon: this.path + 'images/squareroot.png'
        });
        editor.ui.addButton('customPow', {
            label: 'Power',
            command: 'Pow',
            icon: this.path + 'images/power.png'
        });
        editor.ui.addButton('customOpenParenthesis', {
            label: 'Open Brackets',
            command: 'open_parenthesis',
            icon: this.path + 'images/parenthesis-open.png'
        });
        editor.ui.addButton('customCloseParenthesis', {
            label: 'Close Brackets',
            command: 'close_parenthesis',
            icon: this.path + 'images/parenthesis-close.png'
        });
        editor.addCommand('Add', {
            exec: function(e){
                e.insertHtml('+');
            },
            async : true
        });
        editor.addCommand('Sub', {
            exec: function(e){
                e.insertHtml('-');
            },
            async : true
        });
        editor.addCommand('Mul', {
            exec: function(e){
                e.insertHtml('*');
            },
            async : true
        });
        editor.addCommand('Div', {
            exec: function(e){
                e.insertHtml('/');
            },
            async : true
        });
        editor.addCommand('Sqrt', {
            exec: function(e){
                e.insertHtml('√');
            },
            async : true
        });
        editor.addCommand('Pow', {
            exec: function(e){
                e.insertHtml('^');
            },
            async : true
        });
        editor.addCommand('open_parenthesis', {
            exec: function(e){
                e.insertHtml('(');
            },
            async : true
        });
        editor.addCommand('close_parenthesis', {
            exec: function(e){
                e.insertHtml(')');
            },
            async : true
        });
    }
});