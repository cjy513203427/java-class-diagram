import * as vscode from 'vscode';
import { JavaLanguageServerClient } from '../languageserver/JavaLanguageServerClient';

export class ClassDiagramWebviewProvider {
    private context: vscode.ExtensionContext;
    private currentPanel: vscode.WebviewPanel | undefined;
    private languageServerClient: JavaLanguageServerClient;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.languageServerClient = new JavaLanguageServerClient(context);
        // 初始化Language Server客户端
        this.initializeLanguageServer();
    }

    private async initializeLanguageServer(): Promise<void> {
        try {
            await this.languageServerClient.initialize();
            console.log('Language Server client initialized for webview navigation');
        } catch (error) {
            console.error('Failed to initialize Language Server client:', error);
        }
    }

    async showClassDiagram(plantUMLCode: string, title: string): Promise<void> {
        // Create or show webview panel
        if (this.currentPanel) {
            this.currentPanel.reveal();
        } else {
            this.currentPanel = vscode.window.createWebviewPanel(
                'javaClassDiagram',
                `Class Diagram - ${title}`,
                vscode.ViewColumn.Two,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, 'resources')
                    ]
                }
            );

            // Handle panel disposal
            this.currentPanel.onDidDispose(() => {
                this.currentPanel = undefined;
            });

            // Handle messages from webview
            this.currentPanel.webview.onDidReceiveMessage(
                async message => {
                    try {
                        switch (message.command) {
                            case 'navigateToClass':
                                await this.navigateToClass(message.className, message.filePath);
                                break;
                            case 'navigateToMethod':
                                await this.navigateToMethod(message.className, message.methodName, message.filePath);
                                break;
                            case 'navigateToField':
                                await this.navigateToField(message.className, message.fieldName, message.filePath);
                                break;
                            default:
                                console.warn(`Unknown command: ${message.command}`);
                        }
                    } catch (error) {
                        console.error('Error handling webview message:', error);
                        vscode.window.showErrorMessage(`处理导航请求时出错: ${error instanceof Error ? error.message : '未知错误'}`);
                    }
                },
                undefined,
                this.context.subscriptions
            );
        }

        // Update webview content
        this.currentPanel.webview.html = this.getWebviewContent(plantUMLCode, title);
    }

    private getWebviewContent(plantUMLCode: string, title: string): string {
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
                img.style.userSelect = 'none';
                img.style.cursor = 'pointer';
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
            const img = document.getElementById('diagram-svg');
            if (!img) return;

            img.addEventListener('click', async (e) => {
                try {
                    // 获取点击位置相对于图片的坐标
                    const rect = img.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    console.log(\`Click position: (\${x}, \${y})\`);

                    // 从 img.src 反向 decode 出 PlantUML 文本
                    const src = img.src || '';
                    const lastSlash = src.lastIndexOf('/');
                    const encoded = lastSlash >= 0 ? src.substring(lastSlash + 1) : '';
                    if (!encoded) return;

                    const uml = plantumlEncoder.decode(encoded);
                    console.log('Decoded PlantUML:', uml);

                    // 解析PlantUML内容，识别点击的元素类型
                    const clickTarget = analyzeClickTarget(uml, x, y, img.naturalWidth, img.naturalHeight);

                    if (clickTarget) {
                        console.log('Click target:', clickTarget);

                        switch (clickTarget.type) {
                            case 'class':
                                navigateToClass(clickTarget.className, clickTarget.filePath);
                                break;
                            case 'method':
                                navigateToMethod(clickTarget.className, clickTarget.methodName, clickTarget.filePath);
                                break;
                            case 'field':
                                navigateToField(clickTarget.className, clickTarget.fieldName, clickTarget.filePath);
                                break;
                            default:
                                console.log('Unknown click target type:', clickTarget.type);
                        }
                    } else {
                        // 如果无法精确识别，回退到原来的逻辑
                        const linkRegex = /\[\[openfile:([^#\]]+)#([^\]]+)\]\]/g;
                        const links = [];
                        let match;
                        while ((match = linkRegex.exec(uml)) !== null) {
                            links.push({ path: decodeURIComponent(match[1]), className: decodeURIComponent(match[2]) });
                        }
                        if (links.length > 0) {
                            const target = links[0];
                            navigateToClass(target.className, target.path);
                        }
                    }
                } catch (err) {
                    console.error('Failed to handle click for navigation:', err);
                }
            });
        }

        function analyzeClickTarget(uml, clickX, clickY, imgWidth, imgHeight) {
            // 这是一个简化的实现，实际上需要更复杂的逻辑来解析PlantUML并确定点击位置
            // 目前我们基于PlantUML内容的文本分析来推断点击目标

            // 解析类定义
            const classRegex = /class\\s+(\\w+)\\s*\\{([^}]*)\\}/g;
            const classes = [];
            let match;

            while ((match = classRegex.exec(uml)) !== null) {
                const className = match[1];
                const classBody = match[2];

                // 解析方法和字段
                const methods = [];
                const fields = [];

                const lines = classBody.split('\\n');
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.includes('(') && trimmedLine.includes(')')) {
                        // 可能是方法
                        const methodMatch = trimmedLine.match(/(\\w+)\\s*\\(/);
                        if (methodMatch) {
                            methods.push(methodMatch[1]);
                        }
                    } else if (trimmedLine && !trimmedLine.startsWith('--') && !trimmedLine.startsWith('==')) {
                        // 可能是字段
                        const fieldMatch = trimmedLine.match(/(\\w+)\\s*:/);
                        if (fieldMatch) {
                            fields.push(fieldMatch[1]);
                        }
                    }
                }

                classes.push({
                    name: className,
                    methods: methods,
                    fields: fields
                });
            }

            // 提取文件路径信息
            const linkRegex = /\[\[openfile:([^#\]]+)#([^\]]+)\]\]/g;
            const fileLinks = {};
            while ((match = linkRegex.exec(uml)) !== null) {
                const filePath = decodeURIComponent(match[1]);
                const className = decodeURIComponent(match[2]);
                fileLinks[className] = filePath;
            }

            // 简化的点击检测：基于点击位置的Y坐标来推断点击的是哪个类的哪个部分
            // 这里需要更复杂的逻辑来精确定位，目前使用简化版本
            if (classes.length > 0) {
                const targetClass = classes[0]; // 简化：使用第一个类
                const filePath = fileLinks[targetClass.name] || '';

                // 基于Y坐标的简单推断（这需要根据实际的PlantUML渲染结果调整）
                const relativeY = clickY / imgHeight;

                if (relativeY < 0.3) {
                    // 点击在类名区域
                    return {
                        type: 'class',
                        className: targetClass.name,
                        filePath: filePath
                    };
                } else if (relativeY < 0.6 && targetClass.fields.length > 0) {
                    // 点击在字段区域
                    const fieldIndex = Math.floor((relativeY - 0.3) / 0.3 * targetClass.fields.length);
                    const fieldName = targetClass.fields[Math.min(fieldIndex, targetClass.fields.length - 1)];
                    return {
                        type: 'field',
                        className: targetClass.name,
                        fieldName: fieldName,
                        filePath: filePath
                    };
                } else if (targetClass.methods.length > 0) {
                    // 点击在方法区域
                    const methodIndex = Math.floor((relativeY - 0.6) / 0.4 * targetClass.methods.length);
                    const methodName = targetClass.methods[Math.min(methodIndex, targetClass.methods.length - 1)];
                    return {
                        type: 'method',
                        className: targetClass.name,
                        methodName: methodName,
                        filePath: filePath
                    };
                }
            }

            return null;
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

        function navigateToField(className, fieldName, filePath) {
            vscode.postMessage({
                command: 'navigateToField',
                className: className,
                fieldName: fieldName,
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

    private async navigateToClass(className: string, filePath: string): Promise<void> {
        try {
            console.log(`Navigating to class: ${className}, filePath: ${filePath}`);

            // 提取简单类名
            const simpleClassName = className.includes('.') ? className.split('.').pop()! : className;

            // 首先尝试使用Language Server精确定位
            const location = await this.languageServerClient.findClassLocation(simpleClassName);

            if (location) {
                console.log(`Found class location via Language Server: ${location.uri.toString()}`);
                const document = await vscode.workspace.openTextDocument(location.uri);
                const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);

                // 跳转到精确位置
                editor.selection = new vscode.Selection(location.range.start, location.range.start);
                editor.revealRange(location.range, vscode.TextEditorRevealType.InCenter);

                // 高亮显示类名
                const highlightRange = new vscode.Range(location.range.start, location.range.end);
                editor.setDecorations(vscode.window.createTextEditorDecorationType({
                    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
                    border: '1px solid',
                    borderColor: new vscode.ThemeColor('editor.findMatchBorder')
                }), [highlightRange]);

                // 2秒后清除高亮
                setTimeout(() => {
                    editor.setDecorations(vscode.window.createTextEditorDecorationType({}), []);
                }, 2000);

                return;
            }

            // 如果Language Server没有找到，尝试使用文件路径
            if (filePath && filePath !== '') {
                await this.navigateToClassByFilePath(className, filePath);
                return;
            }

            // 最后的备选方案：使用工作区符号搜索
            await this.navigateToClassBySymbolSearch(simpleClassName);

        } catch (error) {
            console.error('Error navigating to class:', error);
            vscode.window.showErrorMessage(`无法导航到类 ${className}。${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    private async navigateToClassByFilePath(className: string, filePath: string): Promise<void> {
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
        } else if (process.platform === 'win32' && normalizedPath.match(/^\/[a-zA-Z]:/)) {
            // 移除开头的斜杠
            normalizedPath = normalizedPath.substring(1);
        }

        console.log(`Attempting to navigate to file: ${normalizedPath}`);

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
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        }
    }

    private async navigateToClassBySymbolSearch(simpleClassName: string): Promise<void> {
        const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
            'vscode.executeWorkspaceSymbolProvider',
            simpleClassName
        );

        if (symbols && symbols.length > 0) {
            const classSymbol = symbols.find(symbol =>
                (symbol.kind === vscode.SymbolKind.Class ||
                 symbol.kind === vscode.SymbolKind.Interface ||
                 symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === simpleClassName
            );

            if (classSymbol) {
                const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
                const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
                editor.selection = new vscode.Selection(classSymbol.location.range.start, classSymbol.location.range.start);
                editor.revealRange(classSymbol.location.range, vscode.TextEditorRevealType.InCenter);
            } else {
                throw new Error(`未找到类 ${simpleClassName} 的符号信息`);
            }
        } else {
            throw new Error(`在工作区中未找到类 ${simpleClassName}`);
        }
    }

    private async navigateToMethod(className: string, methodName: string, filePath: string): Promise<void> {
        try {
            console.log(`Navigating to method: ${methodName} in class: ${className}, filePath: ${filePath}`);

            // 提取简单类名
            const simpleClassName = className.includes('.') ? className.split('.').pop()! : className;

            // 首先尝试使用Language Server精确定位方法
            const location = await this.languageServerClient.findMethodLocation(simpleClassName, methodName);

            if (location) {
                console.log(`Found method location via Language Server: ${location.uri.toString()}`);
                const document = await vscode.workspace.openTextDocument(location.uri);
                const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);

                // 跳转到精确位置
                editor.selection = new vscode.Selection(location.range.start, location.range.start);
                editor.revealRange(location.range, vscode.TextEditorRevealType.InCenter);

                // 高亮显示方法名
                const highlightRange = new vscode.Range(location.range.start, location.range.end);
                editor.setDecorations(vscode.window.createTextEditorDecorationType({
                    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
                    border: '1px solid',
                    borderColor: new vscode.ThemeColor('editor.findMatchBorder')
                }), [highlightRange]);

                // 2秒后清除高亮
                setTimeout(() => {
                    editor.setDecorations(vscode.window.createTextEditorDecorationType({}), []);
                }, 2000);

                return;
            }

            // 如果Language Server没有找到，尝试使用传统方法
            await this.navigateToMethodByRegex(methodName, filePath);

        } catch (error) {
            console.error('Error navigating to method:', error);
            vscode.window.showErrorMessage(`无法导航到方法 ${methodName}。${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    private async navigateToMethodByRegex(methodName: string, filePath: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);

        // Find method declaration using regex
        const text = document.getText();
        const methodRegex = new RegExp(`\\b${methodName}\\s*\\(`, 'g');
        const match = methodRegex.exec(text);

        if (match) {
            const position = document.positionAt(match.index);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        } else {
            throw new Error(`在文件中未找到方法 ${methodName}`);
        }
    }

    private async navigateToField(className: string, fieldName: string, filePath: string): Promise<void> {
        try {
            console.log(`Navigating to field: ${fieldName} in class: ${className}, filePath: ${filePath}`);

            // 提取简单类名
            const simpleClassName = className.includes('.') ? className.split('.').pop()! : className;

            // 首先尝试使用Language Server精确定位字段
            const location = await this.languageServerClient.findFieldLocation(simpleClassName, fieldName);

            if (location) {
                console.log(`Found field location via Language Server: ${location.uri.toString()}`);
                const document = await vscode.workspace.openTextDocument(location.uri);
                const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);

                // 跳转到精确位置
                editor.selection = new vscode.Selection(location.range.start, location.range.start);
                editor.revealRange(location.range, vscode.TextEditorRevealType.InCenter);

                // 高亮显示字段名
                const highlightRange = new vscode.Range(location.range.start, location.range.end);
                editor.setDecorations(vscode.window.createTextEditorDecorationType({
                    backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
                    border: '1px solid',
                    borderColor: new vscode.ThemeColor('editor.findMatchBorder')
                }), [highlightRange]);

                // 2秒后清除高亮
                setTimeout(() => {
                    editor.setDecorations(vscode.window.createTextEditorDecorationType({}), []);
                }, 2000);

                return;
            }

            // 如果Language Server没有找到，尝试使用传统方法
            await this.navigateToFieldByRegex(fieldName, filePath);

        } catch (error) {
            console.error('Error navigating to field:', error);
            vscode.window.showErrorMessage(`无法导航到字段 ${fieldName}。${error instanceof Error ? error.message : '未知错误'}`);
        }
    }

    private async navigateToFieldByRegex(fieldName: string, filePath: string): Promise<void> {
        const document = await vscode.workspace.openTextDocument(filePath);
        const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Two);

        // Find field declaration using regex
        const text = document.getText();
        // 匹配字段声明，考虑各种修饰符和类型
        const fieldRegex = new RegExp(`\\b(private|protected|public|static|final|volatile|transient)\\s+.*?\\b${fieldName}\\b`, 'g');
        let match = fieldRegex.exec(text);

        // 如果没找到，尝试更简单的匹配
        if (!match) {
            const simpleFieldRegex = new RegExp(`\\b${fieldName}\\b\\s*[=;]`, 'g');
            match = simpleFieldRegex.exec(text);
        }

        if (match) {
            const position = document.positionAt(match.index);
            editor.selection = new vscode.Selection(position, position);
            editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
        } else {
            throw new Error(`在文件中未找到字段 ${fieldName}`);
        }
    }
}