"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const JavaCodeParser_1 = require("./parser/JavaCodeParser");
const PlantUMLGenerator_1 = require("./plantuml/PlantUMLGenerator");
const SystemClassParser_1 = require("./parser/SystemClassParser");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
let currentPanel;
async function activate(context) {
    console.log('Java Class Diagram extension is now active!');
    vscode.window.showInformationMessage('Java Class Diagram extension activated!');
    const javaParser = new JavaCodeParser_1.JavaCodeParser(context);
    const plantUMLGenerator = new PlantUMLGenerator_1.PlantUMLGenerator();
    // Initialize the Java parser with Language Server support
    try {
        await javaParser.initialize();
        console.log('Java parser initialized with Language Server support');
    }
    catch (error) {
        console.warn('Failed to initialize Language Server support, using fallback parsing:', error);
    }
    // Register command to generate class diagram for single file
    const generateDiagramCommand = vscode.commands.registerCommand('javaClassDiagram.generateDiagram', async (uri) => {
        try {
            vscode.window.showInformationMessage('Generate Class Diagram command triggered!');
            if (!uri) {
                const activeEditor = vscode.window.activeTextEditor;
                if (!activeEditor) {
                    vscode.window.showErrorMessage('No Java file selected');
                    return;
                }
                uri = activeEditor.document.uri;
            }
            if (!uri.fsPath.endsWith('.java')) {
                vscode.window.showErrorMessage('Please select a Java file');
                return;
            }
            vscode.window.showInformationMessage('Generating enhanced class diagram...');
            const javaCode = fs.readFileSync(uri.fsPath, 'utf8');
            // Use the new method that gets related classes
            const { mainClass, relatedClasses } = await javaParser.parseJavaFileWithRelatedClasses(javaCode, uri.fsPath);
            // Generate interactive diagram with related classes
            const plantUMLCode = plantUMLGenerator.generateInteractiveClassDiagram(mainClass, relatedClasses);
            // Show diagram in new webview panel
            await showClassDiagram(context, plantUMLCode, path.basename(uri.fsPath, '.java'), [mainClass, ...relatedClasses]);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error generating diagram: ${error}`);
            console.error('Error:', error);
        }
    });
    // Register command to generate class diagram for folder
    const generateFolderDiagramCommand = vscode.commands.registerCommand('javaClassDiagram.generateFolderDiagram', async (uri) => {
        try {
            vscode.window.showInformationMessage('Generate Folder Class Diagram command triggered!');
            if (!uri) {
                vscode.window.showErrorMessage('No folder selected');
                return;
            }
            // Show progress indicator
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating folder class diagram",
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0, message: "Searching for Java files..." });
                const javaFiles = await findJavaFiles(uri.fsPath);
                if (javaFiles.length === 0) {
                    vscode.window.showWarningMessage('No Java files found in the selected folder');
                    return;
                }
                // Limit the number of files to process to prevent memory issues
                const maxFiles = 50;
                let filesToProcess = javaFiles;
                if (javaFiles.length > maxFiles) {
                    const choice = await vscode.window.showWarningMessage(`Found ${javaFiles.length} Java files. Processing all files may cause performance issues. Would you like to process only the first ${maxFiles} files?`, 'Process First 50', 'Process All', 'Cancel');
                    if (choice === 'Cancel') {
                        return;
                    }
                    else if (choice === 'Process First 50') {
                        filesToProcess = javaFiles.slice(0, maxFiles);
                    }
                }
                progress.report({ increment: 10, message: `Processing ${filesToProcess.length} Java files...` });
                const allClassStructures = [];
                const errors = [];
                for (let i = 0; i < filesToProcess.length; i++) {
                    if (token.isCancellationRequested) {
                        vscode.window.showInformationMessage('Class diagram generation cancelled');
                        return;
                    }
                    const javaFile = filesToProcess[i];
                    const fileName = path.basename(javaFile);
                    try {
                        progress.report({
                            increment: 80 / filesToProcess.length,
                            message: `Parsing ${fileName}... (${i + 1}/${filesToProcess.length})`
                        });
                        const javaCode = fs.readFileSync(javaFile, 'utf8');
                        const classStructure = await javaParser.parseJavaFile(javaCode, javaFile);
                        allClassStructures.push(classStructure);
                    }
                    catch (error) {
                        console.error(`Error parsing ${javaFile}:`, error);
                        errors.push({ file: fileName, error: error instanceof Error ? error.message : String(error) });
                        // Continue with other files
                    }
                }
                if (allClassStructures.length === 0) {
                    vscode.window.showErrorMessage('No classes could be parsed from the selected folder');
                    if (errors.length > 0) {
                        const errorSummary = errors.map(e => `${e.file}: ${e.error}`).join('\n');
                        vscode.window.showErrorMessage(`Parsing errors:\n${errorSummary}`);
                    }
                    return;
                }
                progress.report({ increment: 90, message: "Generating PlantUML diagram..." });
                try {
                    const plantUMLCode = plantUMLGenerator.generateMultiClassDiagram(allClassStructures);
                    progress.report({ increment: 100, message: "Opening diagram..." });
                    await showClassDiagram(context, plantUMLCode, path.basename(uri.fsPath) + '_diagram', allClassStructures);
                    // Show summary
                    let message = `Successfully generated diagram for ${allClassStructures.length} classes`;
                    if (errors.length > 0) {
                        message += ` (${errors.length} files had parsing errors)`;
                    }
                    vscode.window.showInformationMessage(message);
                }
                catch (error) {
                    vscode.window.showErrorMessage(`Error generating PlantUML diagram: ${error instanceof Error ? error.message : String(error)}`);
                    console.error('PlantUML generation error:', error);
                }
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error generating folder diagram: ${error}`);
            console.error('Error:', error);
        }
    });
    // Add a test command for large project handling
    const testLargeProjectCommand = vscode.commands.registerCommand('javaClassDiagram.testLargeProject', async () => {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }
            vscode.window.showInformationMessage('Testing large project handling...');
            // Test finding Java files in the workspace
            const javaFiles = await findJavaFiles(workspaceFolder.uri.fsPath);
            const message = `Found ${javaFiles.length} Java files in workspace. ` +
                `First 5 files: ${javaFiles.slice(0, 5).map(f => path.basename(f)).join(', ')}`;
            vscode.window.showInformationMessage(message);
            // Show detailed info in console
            console.log('Java files found:');
            javaFiles.forEach((file, index) => {
                console.log(`${index + 1}. ${file}`);
            });
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error testing large project: ${error instanceof Error ? error.message : String(error)}`);
        }
    });
    // Add a test command for system class parsing
    const testSystemParsingCommand = vscode.commands.registerCommand('javaClassDiagram.testSystemParsing', async () => {
        try {
            vscode.window.showInformationMessage('Testing system class parsing...');
            await (0, SystemClassParser_1.testSystemClassParser)();
            vscode.window.showInformationMessage('System class parsing test completed! Check the output console.');
        }
        catch (error) {
            vscode.window.showErrorMessage(`Error testing system parsing: ${error}`);
        }
    });
    // Add a test command
    const testCommand = vscode.commands.registerCommand('javaClassDiagram.test', () => {
        vscode.window.showInformationMessage('Java Class Diagram extension is working!');
    });
    context.subscriptions.push(generateDiagramCommand, generateFolderDiagramCommand, testLargeProjectCommand, testSystemParsingCommand, testCommand);
}
async function showClassDiagram(context, plantUMLCode, title, classStructures) {
    // Close existing panel if it exists
    if (currentPanel) {
        currentPanel.dispose();
    }
    // Create new panel
    currentPanel = vscode.window.createWebviewPanel('javaClassDiagram', `Class Diagram - ${title}`, vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
            vscode.Uri.joinPath(context.extensionUri, 'resources')
        ]
    });
    // Handle panel disposal
    currentPanel.onDidDispose(() => {
        currentPanel = undefined;
    });
    // Handle messages from webview for navigation
    currentPanel.webview.onDidReceiveMessage(async (message) => {
        switch (message.command) {
            case 'navigateToClass':
                await navigateToClass(message.className, message.filePath);
                break;
            case 'navigateToMethod':
                await navigateToMethod(message.className, message.methodName, message.filePath);
                break;
            case 'showClassDetails':
                await showClassDetails(message.className, classStructures);
                break;
        }
    });
    currentPanel.webview.html = getEnhancedWebviewContent(plantUMLCode, title, classStructures);
}
function getEnhancedWebviewContent(plantUMLCode, title, classStructures) {
    // Create a summary of the classes for the sidebar
    const classSummary = classStructures.map(cls => ({
        name: cls.className,
        type: cls.classType,
        package: cls.packageName,
        filePath: cls.filePath,
        fieldCount: cls.fields.length,
        methodCount: cls.methods.length,
        constructorCount: cls.constructors.length,
        isSystemClass: cls.isSystemClass
    }));
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 300px;
            background-color: var(--vscode-sideBar-background);
            border-right: 1px solid var(--vscode-widget-border);
            padding: 20px;
            overflow-y: auto;
        }
        .main-content {
            flex: 1;
            padding: 20px;
            overflow: auto;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 1px solid var(--vscode-widget-border);
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
        }
        .controls {
            display: flex;
            gap: 10px;
        }
        .button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        }
        .button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        .diagram-container {
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 20px;
            text-align: center;
            overflow: auto;
        }
        .class-item {
            background-color: var(--vscode-list-inactiveSelectionBackground);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            cursor: pointer;
        }
        .class-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .class-name {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 5px;
        }
        .class-type {
            color: var(--vscode-descriptionForeground);
            font-size: 12px;
            margin-bottom: 5px;
        }
        .class-stats {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        .system-class {
            border-left: 4px solid var(--vscode-charts-blue);
        }
        .plantuml-code {
            display: none;
            background-color: var(--vscode-textCodeBlock-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 4px;
            padding: 15px;
            margin-top: 20px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            white-space: pre-wrap;
            overflow-x: auto;
        }
        .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 200px;
            font-size: 16px;
            color: var(--vscode-descriptionForeground);
        }
        .error {
            color: var(--vscode-errorForeground);
            background-color: var(--vscode-inputValidation-errorBackground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        #diagram-svg {
            max-width: 100%;
            height: auto;
            cursor: pointer;
        }
        .sidebar-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 15px;
            color: var(--vscode-sideBarTitle-foreground);
        }
    </style>
</head>
<body>
    <div class="sidebar">
        <div class="sidebar-title">Classes (${classSummary.length})</div>
        <div id="class-list">
            ${classSummary.map(cls => `
                <div class="class-item ${cls.isSystemClass ? 'system-class' : ''}" 
                     onclick="selectClass('${cls.name}', '${cls.filePath}')">
                    <div class="class-name">${cls.name}</div>
                    <div class="class-type">${cls.type}${cls.package ? ' • ' + cls.package : ''}</div>
                    <div class="class-stats">
                        Fields: ${cls.fieldCount} • Methods: ${cls.methodCount} • Constructors: ${cls.constructorCount}
                        ${cls.isSystemClass ? ' • System Class' : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <div class="main-content">
        <div class="header">
            <h1 class="title">Java Class Diagram - ${title}</h1>
            <div class="controls">
                <button class="button" onclick="toggleCode()">Show/Hide Code</button>
                <button class="button" onclick="downloadSVG()">Download SVG</button>
                <button class="button" onclick="refreshDiagram()">Refresh</button>
                <button class="button" onclick="testSystemParsing()">Test System Parsing</button>
            </div>
        </div>
        
        <div class="diagram-container">
            <div class="loading" id="loading">
                Generating enhanced class diagram...
            </div>
            <div id="diagram-content"></div>
        </div>
        
        <div class="plantuml-code" id="plantuml-code">
            <h3>PlantUML Code:</h3>
            <pre>${plantUMLCode}</pre>
        </div>
    </div>

    <script src="https://unpkg.com/plantuml-encoder@1.4.0/dist/plantuml-encoder.min.js"></script>
    <script>
        const vscode = acquireVsCodeApi();
        const plantUMLCode = \`${plantUMLCode}\`;
        const classStructures = ${JSON.stringify(classSummary)};
        
        function generateDiagram() {
            try {
                const loading = document.getElementById('loading');
                const diagramContent = document.getElementById('diagram-content');
                
                loading.style.display = 'flex';
                diagramContent.innerHTML = '';
                
                // Encode PlantUML code
                const encoded = plantumlEncoder.encode(plantUMLCode);
                const diagramUrl = \`http://www.plantuml.com/plantuml/svg/\${encoded}\`;
                
                // Create SVG element
                const img = document.createElement('img');
                img.id = 'diagram-svg';
                img.src = diagramUrl;
                img.alt = 'Class Diagram';
                
                img.onload = function() {
                    loading.style.display = 'none';
                    diagramContent.appendChild(img);
                    
                    // Add click handlers for interactive elements
                    addClickHandlers();
                };
                
                img.onerror = function() {
                    loading.style.display = 'none';
                    diagramContent.innerHTML = '<div class="error">Failed to generate diagram. Please check your internet connection.</div>';
                };
                
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('diagram-content').innerHTML = 
                    \`<div class="error">Error generating diagram: \${error.message}</div>\`;
            }
        }
        
        function addClickHandlers() {
            const svg = document.getElementById('diagram-svg');
            if (svg) {
                svg.addEventListener('click', function(event) {
                    // Handle clicks on diagram elements
                    console.log('Diagram clicked', event);
                });
            }
        }
        
        function toggleCode() {
            const codeElement = document.getElementById('plantuml-code');
            if (codeElement.style.display === 'none' || codeElement.style.display === '') {
                codeElement.style.display = 'block';
            } else {
                codeElement.style.display = 'none';
            }
        }
        
        function downloadSVG() {
            const svg = document.getElementById('diagram-svg');
            if (svg) {
                const link = document.createElement('a');
                link.download = '${title}_class_diagram.svg';
                link.href = svg.src;
                link.click();
            }
        }
        
        function refreshDiagram() {
            generateDiagram();
        }
        
        function selectClass(className, filePath) {
            vscode.postMessage({
                command: 'navigateToClass',
                className: className,
                filePath: filePath
            });
        }
        
        function testSystemParsing() {
            vscode.postMessage({
                command: 'testSystemParsing'
            });
        }
        
        // Generate diagram on load
        generateDiagram();
    </script>
</body>
</html>`;
}
async function navigateToClass(className, filePath) {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
        // Find class declaration
        const text = document.getText();
        const classRegex = new RegExp(`(class|interface|enum)\\s+${className}\\b`, 'g');
        const match = classRegex.exec(text);
        if (match) {
            const position = document.positionAt(match.index);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Could not navigate to class ${className}: ${error}`);
    }
}
async function navigateToMethod(className, methodName, filePath) {
    try {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
        // Find method declaration
        const text = document.getText();
        const methodRegex = new RegExp(`\\b${methodName}\\s*\\(`, 'g');
        const match = methodRegex.exec(text);
        if (match) {
            const position = document.positionAt(match.index);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position));
        }
    }
    catch (error) {
        vscode.window.showErrorMessage(`Could not navigate to method ${methodName}: ${error}`);
    }
}
async function showClassDetails(className, classStructures) {
    const classStructure = classStructures.find(cls => cls.className === className);
    if (classStructure) {
        const details = `
Class: ${classStructure.className}
Type: ${classStructure.classType}
Package: ${classStructure.packageName || 'default'}
Fields: ${classStructure.fields.length}
Methods: ${classStructure.methods.length}
Constructors: ${classStructure.constructors.length}
System Class: ${classStructure.isSystemClass ? 'Yes' : 'No'}
        `;
        vscode.window.showInformationMessage(details);
    }
}
async function findJavaFiles(folderPath) {
    const javaFiles = [];
    // Directories to skip for performance and relevance
    const skipDirectories = new Set([
        'node_modules', '.git', '.svn', '.hg', 'build', 'dist', 'out', 'bin',
        'target', '.idea', '.vscode', 'temp', 'tmp', '.gradle', '.maven',
        'test-output', 'coverage', 'logs', 'cache'
    ]);
    function searchDirectory(dir, depth = 0) {
        // Limit recursion depth to prevent infinite loops and improve performance
        if (depth > 10) {
            return;
        }
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                // Skip hidden files and directories
                if (file.startsWith('.') && !file.endsWith('.java')) {
                    continue;
                }
                const filePath = path.join(dir, file);
                try {
                    const stat = fs.statSync(filePath);
                    if (stat.isDirectory()) {
                        // Skip excluded directories
                        if (skipDirectories.has(file.toLowerCase())) {
                            continue;
                        }
                        searchDirectory(filePath, depth + 1);
                    }
                    else if (file.endsWith('.java')) {
                        javaFiles.push(filePath);
                    }
                }
                catch (error) {
                    // Skip files/directories that can't be accessed
                    console.warn(`Skipping ${filePath}: ${error}`);
                    continue;
                }
            }
        }
        catch (error) {
            console.warn(`Cannot read directory ${dir}: ${error}`);
        }
    }
    searchDirectory(folderPath);
    return javaFiles;
}
function deactivate() {
    console.log('Java Class Diagram extension is now deactivated!');
}
//# sourceMappingURL=extension.js.map