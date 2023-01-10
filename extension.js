// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "virtual-labs-experiment-generator" is now active!');

	let options = [
	{
		label:"Command 1",
		description:"Clone the experiment template",
	},
	{
		label:"Command 2",
		description:"Build the experiment on the local machine",
	},
	{
		label:"Command 3",
		description:"Run validations and performance measurement",
	},
	{
		label:"Command 4",
		description:"Instantiate a web-server",
	}
	];
	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand(
		'virtual-labs-experiment-generator.virtualLabs', 
		async function () {
			const functionality = await vscode.window.showQuickPick(options)
			if(functionality==null) return;
			console.log(functionality.label);
			console.log(functionality.description);

		// Display a message box to the user
		vscode.window.showInformationMessage('Virtual Labs Experiment Generator is now Active!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
function deactivate() {}

module.exports = {
	activate,
	deactivate
}
