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
exports.ClassDiagramWebviewProvider = void 0;
const vscode = __importStar(require("vscode"));
class ClassDiagramWebviewProvider {
    context;
    currentPanel;
    constructor(context) {
        this.context = context;
    }
    async showClassDiagram(plantUMLCode, title) {
        // Create or show webview panel
        if (this.currentPanel) {
            this.currentPanel.reveal();
        }
        else {
            this.currentPanel = vscode.window.createWebviewPanel('javaClassDiagram', `Class Diagram - ${title}`, vscode.ViewColumn.Two, {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'resources')
                ]
            });
            // Handle panel disposal
            this.currentPanel.onDidDispose(() => {
                this.currentPanel = undefined;
            });
            // Handle messages from webview
            this.currentPanel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'navigateToClass':
                        this.navigateToClass(message.className, message.filePath);
                        break;
                    case 'navigateToMethod':
                        this.navigateToMethod(message.className, message.methodName, message.filePath);
                        break;
                }
            }, undefined, this.context.subscriptions);
            // Handle messages from webview
            this.currentPanel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'navigateToClass':
                        this.navigateToClass(message.className, message.filePath);
                        break;
                    case 'navigateToMethod':
                        this.navigateToMethod(message.className, message.methodName, message.filePath);
                        break;
                }
            });
        }
        // Update webview content
        this.currentPanel.webview.html = this.getWebviewContent(plantUMLCode, title);
    }
    getWebviewContent(plantUMLCode, title) {
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
            padding: 20px;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        .container {
            max-width: 100%;
            margin: 0 auto;
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
        .clickable-element {
            cursor: pointer;
            transition: opacity 0.2s;
        }
        .clickable-element:hover {
            opacity: 0.7;
        }
        #diagram-svg {
            max-width: 100%;
            height: auto;
            transition: transform 0.3s ease;
        }
        .zoom-controls {
            position: absolute;
            top: 10px;
            right: 10px;
            display: flex;
            gap: 5px;
            z-index: 10;
        }
        .zoom-btn {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        .zoom-btn:hover {
            background: var(--vscode-button-hoverBackground);
            transform: scale(1.1);
        }
        .diagram-container {
            position: relative;
            background-color: var(--vscode-editor-background);
            border: 1px solid var(--vscode-widget-border);
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            overflow: auto;
            min-height: 400px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">Java Class Diagram - ${title}</h1>
            <div class="controls">
                <button class="button" onclick="toggleCode()">Show/Hide Code</button>
                <button class="button" onclick="downloadSVG()">Download SVG</button>
                <button class="button" onclick="refreshDiagram()">Refresh</button>
            </div>
        </div>
        
        <div class="diagram-container">
            <div class="zoom-controls">
                <button class="zoom-btn" onclick="zoomIn()" title="Zoom In">+</button>
                <button class="zoom-btn" onclick="zoomOut()" title="Zoom Out">-</button>
                <button class="zoom-btn" onclick="resetZoom()" title="Reset Zoom">⌂</button>
            </div>
            <div class="loading" id="loading">
                Generating enhanced diagram...
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
                    diagramContent.innerHTML = '<div class="error">Failed to generate diagram. Please check your PlantUML code.</div>';
                };
                
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('diagram-content').innerHTML = 
                    \`<div class="error">Error generating diagram: \${error.message}</div>\`;
            }
        }
        
        function addClickHandlers() {
            // This is a placeholder for adding click handlers to class elements
            // In a real implementation, we would parse the SVG and add click handlers
            // to class names and method names
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

        let currentZoom = 1;

        function zoomIn() {
            currentZoom = Math.min(currentZoom * 1.2, 3);
            applyZoom();
        }

        function zoomOut() {
            currentZoom = Math.max(currentZoom / 1.2, 0.3);
            applyZoom();
        }

        function resetZoom() {
            currentZoom = 1;
            applyZoom();
        }

        function applyZoom() {
            const svg = document.getElementById('diagram-svg');
            if (svg) {
                svg.style.transform = \`scale(\${currentZoom})\`;
                svg.style.transformOrigin = 'center center';
            }
        }

        function navigateToClass(className, filePath) {
            vscode.postMessage({
                command: 'navigateToClass',
                className: className,
                filePath: filePath
            });
        }

        function navigateToMethod(className, methodName, filePath) {
            vscode.postMessage({
                command: 'navigateToMethod',
                className: className,
                methodName: methodName,
                filePath: filePath
            });
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', function(event) {
            if (event.ctrlKey || event.metaKey) {
                switch(event.key) {
                    case '=':
                    case '+':
                        event.preventDefault();
                        zoomIn();
                        break;
                    case '-':
                        event.preventDefault();
                        zoomOut();
                        break;
                    case '0':
                        event.preventDefault();
                        resetZoom();
                        break;
                }
            }
        });
        
        // Generate diagram on load
        generateDiagram();
    </script>
</body>
</html>`;
    }
    async navigateToClass(className, filePath) {
        try {
            if (filePath && filePath !== '') {
                // 修复文件路径格式问题
                let normalizedPath = filePath;
                // 处理 URL 编码的路径
                if (filePath.includes('%')) {
                    normalizedPath = decodeURIComponent(filePath);
                }
                // 确保路径格式正确
                if (normalizedPath.startsWith('file:///')) {
                    normalizedPath = normalizedPath.replace('file:///', '');
                }
                // 处理 Windows 路径格式
                if (process.platform === 'win32' && normalizedPath.match(/^[a-zA-Z]:/)) {
                    // 路径已经是正确的 Windows 格式
                }
                else if (process.platform === 'win32' && normalizedPath.match(/^\/[a-zA-Z]:/)) {
                    // 移除开头的斜杠
                    normalizedPath = normalizedPath.substring(1);
                }
                console.log(`Attempting to navigate to: ${normalizedPath}`);
                const uri = vscode.Uri.file(normalizedPath);
                const document = await vscode.workspace.openTextDocument(uri);
                const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
                // 提取简单类名进行搜索
                const simpleClassName = className.includes('.') ? className.split('.').pop() : className;
                // Try to find the class definition and navigate to it
                const text = document.getText();
                const classRegex = new RegExp(`(class|interface|enum)\\s+${simpleClassName}\\b`, 'g');
                const match = classRegex.exec(text);
                if (match) {
                    const position = document.positionAt(match.index);
                    editor.selection = new vscode.Selection(position, position);
                    editor.revealRange(new vscode.Range(position, position));
                }
            }
            else {
                // Try to find the class using workspace symbol search
                const simpleClassName = className.includes('.') ? className.split('.').pop() : className;
                const symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', simpleClassName);
                if (symbols && symbols.length > 0) {
                    const classSymbol = symbols.find(symbol => (symbol.kind === vscode.SymbolKind.Class ||
                        symbol.kind === vscode.SymbolKind.Interface ||
                        symbol.kind === vscode.SymbolKind.Enum) &&
                        symbol.name === simpleClassName);
                    if (classSymbol) {
                        const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
                        const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
                        editor.selection = new vscode.Selection(classSymbol.location.range.start, classSymbol.location.range.start);
                        editor.revealRange(classSymbol.location.range);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error navigating to class:', error);
            // 尝试使用工作区符号搜索作为备选方案
            try {
                const simpleClassName = className.includes('.') ? className.split('.').pop() : className;
                const symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', simpleClassName);
                if (symbols && symbols.length > 0) {
                    const classSymbol = symbols[0]; // 使用第一个匹配的符号
                    const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
                    await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
                    return;
                }
            }
            catch (fallbackError) {
                console.error('Fallback navigation also failed:', fallbackError);
            }
            vscode.window.showErrorMessage(`Could not navigate to class ${className}. File may not exist or be accessible.`);
        }
    }
    async navigateToMethod(className, methodName, filePath) {
        try {
            const document = await vscode.workspace.openTextDocument(filePath);
            const editor = await vscode.window.showTextDocument(document);
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
}
exports.ClassDiagramWebviewProvider = ClassDiagramWebviewProvider;
//# sourceMappingURL=ClassDiagramWebviewProvider.js.map