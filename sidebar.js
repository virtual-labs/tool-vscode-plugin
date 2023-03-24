const vscode = acquireVsCodeApi();
const command1 = document.getElementById('command1');
const command2 = document.getElementById('command2');
const command3 = document.getElementById('command3');
const command4 = document.getElementById('command4');
command1.addEventListener('click', () => {
    vscode.postMessage({
        command: 'command1'
    });
});
command2.addEventListener('click', () => {
    vscode.postMessage({
        command: 'command2'
    });
});
command3.addEventListener('click', () => {
    vscode.postMessage({
        command: 'command3'
    });
});
command4.addEventListener('click', () => {
    vscode.postMessage({
        command: 'command4'
    });
});