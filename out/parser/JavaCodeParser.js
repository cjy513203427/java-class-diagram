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
exports.JavaCodeParser = void 0;
const vscode = __importStar(require("vscode"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const SystemClassParser_1 = require("./SystemClassParser");
const JavaLanguageServerClient_1 = require("../languageserver/JavaLanguageServerClient");
class JavaCodeParser {
    systemParser;
    languageServerClient;
    constructor(context) {
        this.systemParser = new SystemClassParser_1.SystemClassParser();
        this.languageServerClient = new JavaLanguageServerClient_1.JavaLanguageServerClient(context);
    }
    async initialize() {
        try {
            await this.languageServerClient.initialize();
            console.log('Java Language Server client initialized successfully');
        }
        catch (error) {
            console.warn('Failed to initialize Language Server client, falling back to basic parsing:', error);
        }
    }
    async parseJavaFile(javaCode, filePath) {
        // First, try to parse with Language Server for better accuracy
        let classStructure;
        try {
            classStructure = await this.parseWithLanguageServer(javaCode, filePath);
        }
        catch (error) {
            console.log('Language Server parsing failed, falling back to regex parsing:', error);
            try {
                classStructure = await this.parseWithJavaParser(javaCode, filePath);
            }
            catch (error2) {
                console.log('Java-parser failed, falling back to regex parsing:', error2);
                classStructure = await this.parseWithRegex(javaCode, filePath);
            }
        }
        // Enhance with system class information
        await this.enhanceWithSystemInfo(classStructure);
        return classStructure;
    }
    async parseWithLanguageServer(javaCode, filePath) {
        try {
            // Open the document in VSCode to get Language Server support
            const document = await vscode.workspace.openTextDocument(vscode.Uri.file(filePath));
            // Get document symbols from Language Server
            const symbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
            if (!symbols || symbols.length === 0) {
                throw new Error('No symbols found in document');
            }
            // Find the main class symbol
            const classSymbol = this.findMainClassSymbol(symbols);
            if (!classSymbol) {
                throw new Error('No class symbol found');
            }
            // Convert VSCode symbols to our class structure
            return await this.convertSymbolsToClassStructure(classSymbol, document, symbols);
        }
        catch (error) {
            console.error('Language Server parsing failed:', error);
            throw error;
        }
    }
    async parseWithJavaParser(javaCode, filePath) {
        // Note: This would use the java-parser library when available
        // For now, we'll use regex parsing as fallback
        return this.parseWithRegex(javaCode, filePath);
        /* When java-parser is properly integrated:
        const ast = javaParser.parse(javaCode);
        return this.convertAstToClassStructure(ast, filePath);
        */
    }
    async parseWithRegex(javaCode, filePath) {
        const classStructure = {
            className: '',
            packageName: '',
            filePath: filePath,
            classType: 'class',
            interfaces: [],
            fields: [],
            methods: [],
            constructors: [],
            innerClasses: [],
            imports: [],
            annotations: [],
            inheritanceHierarchy: [],
            allInterfaces: [],
            isSystemClass: false
        };
        // Parse package declaration
        const packageMatch = javaCode.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
        if (packageMatch) {
            classStructure.packageName = packageMatch[1];
        }
        // Parse imports
        const importMatches = javaCode.match(/import\s+([a-zA-Z0-9_.]+)\s*;/g);
        if (importMatches) {
            classStructure.imports = importMatches.map(imp => imp.replace(/import\s+|;/g, ''));
        }
        // Parse annotations
        const annotationMatches = javaCode.match(/@[a-zA-Z0-9_]+(\([^)]*\))?/g);
        if (annotationMatches) {
            classStructure.annotations = annotationMatches;
        }
        // Parse class declaration with better regex
        const classMatch = javaCode.match(/(public\s+)?(abstract\s+)?(final\s+)?(class|interface|enum)\s+([a-zA-Z0-9_]+)(\s+extends\s+([a-zA-Z0-9_.<>]+))?(\s+implements\s+([a-zA-Z0-9_.<>,\s]+))?/);
        if (classMatch) {
            const isAbstract = classMatch[2] !== undefined;
            const classType = classMatch[4];
            classStructure.className = classMatch[5];
            classStructure.classType = isAbstract ? 'abstract class' : classType;
            if (classMatch[7]) {
                classStructure.superClass = classMatch[7];
            }
            if (classMatch[9]) {
                classStructure.interfaces = classMatch[9]
                    .split(',')
                    .map(i => i.trim())
                    .filter(i => i.length > 0);
            }
        }
        // Parse fields with enhanced regex
        const fieldMatches = javaCode.match(/(@[a-zA-Z0-9_]+(\([^)]*\))?\s*)*(public|private|protected)?\s*(static)?\s*(final)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*[=;]/g);
        if (fieldMatches) {
            for (const fieldMatch of fieldMatches) {
                const field = this.parseField(fieldMatch);
                if (field) {
                    classStructure.fields.push(field);
                }
            }
        }
        // Parse methods and constructors with enhanced regex
        const methodMatches = javaCode.match(/(@[a-zA-Z0-9_]+(\([^)]*\))?\s*)*(public|private|protected)?\s*(static)?\s*(abstract)?\s*(final)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\([^)]*\)\s*(throws\s+[a-zA-Z0-9_.,\s]+)?\s*[{;]/g);
        if (methodMatches) {
            for (const methodMatch of methodMatches) {
                const method = this.parseMethod(methodMatch);
                if (method) {
                    if (method.name === classStructure.className) {
                        classStructure.constructors.push(method);
                    }
                    else {
                        classStructure.methods.push(method);
                    }
                }
            }
        }
        return classStructure;
    }
    async enhanceWithSystemInfo(classStructure) {
        try {
            const fullClassName = classStructure.packageName ?
                `${classStructure.packageName}.${classStructure.className}` :
                classStructure.className;
            // Check if it's a system class
            classStructure.isSystemClass = await this.systemParser.isSystemClass(fullClassName);
            // Get inheritance hierarchy
            classStructure.inheritanceHierarchy = await this.systemParser.getInheritanceHierarchy(fullClassName);
            // Get all interfaces (including inherited ones)
            classStructure.allInterfaces = await this.systemParser.getAllInterfaces(fullClassName);
            // If system class information is available, merge it
            const systemInfo = await this.systemParser.getSystemClassInfo(fullClassName);
            if (systemInfo) {
                // Merge system information with parsed information
                classStructure.superClass = systemInfo.superClass || classStructure.superClass;
                classStructure.interfaces = [...new Set([...classStructure.interfaces, ...systemInfo.interfaces])];
                // Add system fields and methods if not already present
                this.mergeSystemFields(classStructure, systemInfo);
                this.mergeSystemMethods(classStructure, systemInfo);
            }
        }
        catch (error) {
            console.log('Enhanced parsing not available, using basic parsing:', error);
        }
    }
    mergeSystemFields(classStructure, systemInfo) {
        for (const systemField of systemInfo.fields) {
            const existingField = classStructure.fields.find(f => f.name === systemField.name);
            if (!existingField) {
                classStructure.fields.push({
                    name: systemField.name,
                    type: systemField.type,
                    visibility: systemField.visibility,
                    isStatic: systemField.isStatic,
                    isFinal: systemField.isFinal,
                    annotations: systemField.annotations
                });
            }
        }
    }
    mergeSystemMethods(classStructure, systemInfo) {
        for (const systemMethod of systemInfo.methods) {
            const existingMethod = classStructure.methods.find(m => m.name === systemMethod.name &&
                m.parameters.length === systemMethod.parameters.length);
            if (!existingMethod) {
                classStructure.methods.push({
                    name: systemMethod.name,
                    returnType: systemMethod.returnType,
                    parameters: systemMethod.parameters.map(p => ({
                        name: p.name,
                        type: p.type
                    })),
                    visibility: systemMethod.visibility,
                    isStatic: systemMethod.isStatic,
                    isAbstract: systemMethod.isAbstract,
                    isFinal: systemMethod.isFinal,
                    annotations: systemMethod.annotations,
                    exceptions: systemMethod.exceptions
                });
            }
        }
        // Merge constructors
        for (const systemConstructor of systemInfo.constructors) {
            const existingConstructor = classStructure.constructors.find(c => c.parameters.length === systemConstructor.parameters.length);
            if (!existingConstructor) {
                classStructure.constructors.push({
                    name: systemConstructor.name,
                    returnType: systemConstructor.returnType,
                    parameters: systemConstructor.parameters.map(p => ({
                        name: p.name,
                        type: p.type
                    })),
                    visibility: systemConstructor.visibility,
                    isStatic: systemConstructor.isStatic,
                    isAbstract: systemConstructor.isAbstract,
                    isFinal: systemConstructor.isFinal,
                    annotations: systemConstructor.annotations,
                    exceptions: systemConstructor.exceptions
                });
            }
        }
    }
    parseField(fieldString) {
        const match = fieldString.match(/(@[a-zA-Z0-9_]+(\([^)]*\))?\s*)*(public|private|protected)?\s*(static)?\s*(final)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)/);
        if (!match)
            return null;
        const annotations = fieldString.match(/@[a-zA-Z0-9_]+(\([^)]*\))?/g) || [];
        return {
            name: match[7],
            type: match[6],
            visibility: match[3] || 'package',
            isStatic: match[4] === 'static',
            isFinal: match[5] === 'final',
            annotations: annotations
        };
    }
    parseMethod(methodString) {
        const match = methodString.match(/(@[a-zA-Z0-9_]+(\([^)]*\))?\s*)*(public|private|protected)?\s*(static)?\s*(abstract)?\s*(final)?\s*([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(throws\s+([a-zA-Z0-9_.,\s]+))?/);
        if (!match)
            return null;
        const parameters = [];
        if (match[9]) {
            const paramStrings = match[9].split(',');
            for (const paramString of paramStrings) {
                const paramMatch = paramString.trim().match(/([a-zA-Z0-9_<>[\]]+)\s+([a-zA-Z0-9_]+)/);
                if (paramMatch) {
                    parameters.push({
                        type: paramMatch[1],
                        name: paramMatch[2]
                    });
                }
            }
        }
        const annotations = methodString.match(/@[a-zA-Z0-9_]+(\([^)]*\))?/g) || [];
        const exceptions = match[11] ? match[11].split(',').map(e => e.trim()) : [];
        return {
            name: match[8],
            returnType: match[7],
            parameters: parameters,
            visibility: match[3] || 'package',
            isStatic: match[4] === 'static',
            isAbstract: match[5] === 'abstract',
            isFinal: match[6] === 'final',
            annotations: annotations,
            exceptions: exceptions
        };
    }
    findMainClassSymbol(symbols) {
        // Find the first class, interface, or enum symbol
        for (const symbol of symbols) {
            if (symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum) {
                return symbol;
            }
        }
        return null;
    }
    async convertSymbolsToClassStructure(classSymbol, document, allSymbols) {
        const classStructure = {
            className: classSymbol.name,
            packageName: this.extractPackageNameFromDocument(document),
            filePath: document.uri.fsPath,
            classType: this.getClassType(classSymbol.kind),
            interfaces: [],
            fields: [],
            methods: [],
            constructors: [],
            innerClasses: [],
            imports: this.extractImportsFromDocument(document),
            annotations: [],
            inheritanceHierarchy: [],
            allInterfaces: [],
            isSystemClass: false
        };
        // Parse class members from symbols
        for (const child of classSymbol.children) {
            switch (child.kind) {
                case vscode.SymbolKind.Field:
                case vscode.SymbolKind.Property:
                    classStructure.fields.push(this.convertSymbolToField(child));
                    break;
                case vscode.SymbolKind.Method:
                    const method = this.convertSymbolToMethod(child);
                    if (method.name === classStructure.className) {
                        classStructure.constructors.push(method);
                    }
                    else {
                        classStructure.methods.push(method);
                    }
                    break;
                case vscode.SymbolKind.Constructor:
                    classStructure.constructors.push(this.convertSymbolToMethod(child));
                    break;
                case vscode.SymbolKind.Class:
                case vscode.SymbolKind.Interface:
                case vscode.SymbolKind.Enum:
                    // Handle inner classes recursively if needed
                    break;
            }
        }
        // Try to get inheritance information using Language Server
        await this.enhanceWithLanguageServerInfo(classStructure, document);
        return classStructure;
    }
    extractPackageNameFromDocument(document) {
        const text = document.getText();
        const packageMatch = text.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
        return packageMatch ? packageMatch[1] : '';
    }
    extractImportsFromDocument(document) {
        const text = document.getText();
        const importMatches = text.match(/import\s+([a-zA-Z0-9_.]+)\s*;/g);
        return importMatches ? importMatches.map(imp => imp.replace(/import\s+|;/g, '')) : [];
    }
    getClassType(symbolKind) {
        switch (symbolKind) {
            case vscode.SymbolKind.Interface:
                return 'interface';
            case vscode.SymbolKind.Enum:
                return 'enum';
            case vscode.SymbolKind.Class:
            default:
                return 'class'; // We'll determine if it's abstract later
        }
    }
    convertSymbolToField(symbol) {
        return {
            name: symbol.name,
            type: symbol.detail || 'unknown',
            visibility: 'public', // Default, we'll enhance this later
            isStatic: false,
            isFinal: false,
            annotations: []
        };
    }
    convertSymbolToMethod(symbol) {
        return {
            name: symbol.name,
            returnType: symbol.detail || 'void',
            parameters: [], // We'll parse parameters from the detail if available
            visibility: 'public', // Default, we'll enhance this later
            isStatic: false,
            isAbstract: false,
            isFinal: false,
            annotations: [],
            exceptions: []
        };
    }
    async enhanceWithLanguageServerInfo(classStructure, document) {
        try {
            const fullClassName = classStructure.packageName ?
                `${classStructure.packageName}.${classStructure.className}` :
                classStructure.className;
            // Try to get class info from Language Server client
            const classInfo = await this.languageServerClient.getClassInfo(fullClassName, true);
            if (classInfo) {
                // Merge Language Server information
                classStructure.superClass = classInfo.superClass;
                classStructure.interfaces = classInfo.interfaces;
                classStructure.isSystemClass = !classInfo.location?.uri.startsWith('file:');
                // Update class type based on Language Server info
                if (classInfo.isInterface) {
                    classStructure.classType = 'interface';
                }
                else if (classInfo.isEnum) {
                    classStructure.classType = 'enum';
                }
                else if (classInfo.isAbstract) {
                    classStructure.classType = 'abstract class';
                }
                // Get inheritance hierarchy
                classStructure.inheritanceHierarchy = await this.languageServerClient.getInheritanceHierarchy(fullClassName);
            }
            // Also try to find the class in dependencies if not found locally
            if (!classInfo) {
                const dependencyInfo = await this.languageServerClient.findClassInDependencies(fullClassName);
                if (dependencyInfo) {
                    classStructure.superClass = dependencyInfo.superClass;
                    classStructure.interfaces = dependencyInfo.interfaces;
                    classStructure.isSystemClass = true;
                }
            }
        }
        catch (error) {
            console.log('Could not enhance with Language Server info:', error);
        }
    }
    async parseJavaFileWithRelatedClasses(javaCode, filePath) {
        const mainClass = await this.parseJavaFile(javaCode, filePath);
        const relatedClasses = [];
        try {
            const fullClassName = mainClass.packageName ?
                `${mainClass.packageName}.${mainClass.className}` :
                mainClass.className;
            // 只获取直接相关的类（继承链和依赖），不包含整个包
            const relatedClassInfos = await this.getDirectlyRelatedClasses(fullClassName, path.dirname(filePath), mainClass.packageName);
            for (const classInfo of relatedClassInfos) {
                if (classInfo.className !== mainClass.className) {
                    const relatedClass = this.convertClassInfoToJavaClassStructure(classInfo);
                    relatedClasses.push(relatedClass);
                }
            }
        }
        catch (error) {
            console.log('Could not get related classes:', error);
        }
        return { mainClass, relatedClasses };
    }
    async parseJavaFolderWithAllClasses(folderPath) {
        const mainClasses = [];
        const relatedClasses = [];
        try {
            // 读取文件夹中的所有 Java 文件
            const files = fs.readdirSync(folderPath);
            const javaFiles = files.filter(file => file.endsWith('.java'));
            // 解析所有 Java 文件
            for (const javaFile of javaFiles) {
                try {
                    const filePath = path.join(folderPath, javaFile);
                    const javaCode = fs.readFileSync(filePath, 'utf8');
                    const classStructure = await this.parseJavaFile(javaCode, filePath);
                    mainClasses.push(classStructure);
                }
                catch (error) {
                    console.log(`Error parsing ${javaFile}:`, error);
                    continue;
                }
            }
            // 获取所有类的相关系统类
            for (const mainClass of mainClasses) {
                const fullClassName = mainClass.packageName ?
                    `${mainClass.packageName}.${mainClass.className}` :
                    mainClass.className;
                const systemClasses = await this.getSystemClassesOnly(fullClassName);
                for (const systemClass of systemClasses) {
                    if (!relatedClasses.some(rc => rc.className === systemClass.className && rc.packageName === systemClass.packageName)) {
                        relatedClasses.push(systemClass);
                    }
                }
            }
        }
        catch (error) {
            console.log('Could not parse folder classes:', error);
        }
        return { mainClasses, relatedClasses };
    }
    convertClassInfoToJavaClassStructure(classInfo) {
        return {
            className: classInfo.className,
            packageName: classInfo.packageName,
            filePath: classInfo.location?.uri || '',
            classType: classInfo.isInterface ? 'interface' :
                classInfo.isEnum ? 'enum' :
                    classInfo.isAbstract ? 'abstract class' : 'class',
            superClass: classInfo.superClass,
            interfaces: classInfo.interfaces,
            fields: classInfo.fields.map(field => ({
                name: field.name,
                type: field.type,
                visibility: this.parseVisibility(field.modifiers),
                isStatic: field.modifiers.includes('static'),
                isFinal: field.modifiers.includes('final'),
                annotations: []
            })),
            methods: classInfo.methods.map(method => ({
                name: method.name,
                returnType: method.returnType,
                parameters: method.parameters.map(param => ({
                    name: param.name,
                    type: param.type
                })),
                visibility: this.parseVisibility(method.modifiers),
                isStatic: method.modifiers.includes('static'),
                isAbstract: method.modifiers.includes('abstract'),
                isFinal: method.modifiers.includes('final'),
                annotations: [],
                exceptions: method.exceptions
            })),
            constructors: classInfo.constructors.map(constructor => ({
                name: constructor.name,
                returnType: constructor.returnType,
                parameters: constructor.parameters.map(param => ({
                    name: param.name,
                    type: param.type
                })),
                visibility: this.parseVisibility(constructor.modifiers),
                isStatic: constructor.modifiers.includes('static'),
                isAbstract: constructor.modifiers.includes('abstract'),
                isFinal: constructor.modifiers.includes('final'),
                annotations: [],
                exceptions: constructor.exceptions
            })),
            innerClasses: [],
            imports: [],
            annotations: [],
            inheritanceHierarchy: [],
            allInterfaces: classInfo.interfaces,
            isSystemClass: !classInfo.location?.uri.startsWith('file:')
        };
    }
    parseVisibility(modifiers) {
        if (modifiers.includes('public'))
            return 'public';
        if (modifiers.includes('private'))
            return 'private';
        if (modifiers.includes('protected'))
            return 'protected';
        return 'package';
    }
    async getCompleteInheritanceHierarchy(className) {
        const allRelatedClasses = [];
        const processedClasses = new Set();
        // 获取主类信息
        const mainClassInfo = await this.languageServerClient.getClassInfo(className);
        if (mainClassInfo) {
            allRelatedClasses.push(mainClassInfo);
            processedClasses.add(className);
        }
        // 递归获取继承层次结构
        await this.collectInheritanceHierarchy(className, allRelatedClasses, processedClasses, 5);
        return allRelatedClasses;
    }
    async collectInheritanceHierarchy(className, allClasses, processedClasses, maxDepth) {
        if (maxDepth <= 0 || processedClasses.has(className)) {
            return;
        }
        const classInfo = await this.languageServerClient.getClassInfo(className);
        if (!classInfo) {
            return;
        }
        // 添加当前类（如果还没有添加）
        if (!allClasses.some(c => c.className === classInfo.className && c.packageName === classInfo.packageName)) {
            allClasses.push(classInfo);
        }
        processedClasses.add(className);
        // 递归处理父类
        if (classInfo.superClass && !processedClasses.has(classInfo.superClass)) {
            await this.collectInheritanceHierarchy(classInfo.superClass, allClasses, processedClasses, maxDepth - 1);
        }
        // 递归处理接口
        for (const interfaceName of classInfo.interfaces) {
            if (!processedClasses.has(interfaceName)) {
                await this.collectInheritanceHierarchy(interfaceName, allClasses, processedClasses, maxDepth - 1);
            }
        }
        // 查找子类（在工作区中搜索）
        await this.findSubclasses(className, allClasses, processedClasses, maxDepth - 1);
    }
    async findSubclasses(parentClassName, allClasses, processedClasses, maxDepth) {
        if (maxDepth <= 0)
            return;
        try {
            // 搜索所有类符号
            const allSymbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '');
            if (!allSymbols)
                return;
            // 过滤出类符号
            const classSymbols = allSymbols.filter(symbol => symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum);
            // 检查每个类是否继承自父类
            for (const symbol of classSymbols.slice(0, 20)) { // 限制数量避免性能问题
                if (processedClasses.has(symbol.name))
                    continue;
                try {
                    const document = await vscode.workspace.openTextDocument(symbol.location.uri);
                    const text = document.getText();
                    // 简单的文本搜索来查找继承关系
                    const simpleParentName = parentClassName.includes('.') ?
                        parentClassName.split('.').pop() : parentClassName;
                    const extendsRegex = new RegExp(`extends\\s+${simpleParentName}\\b`);
                    const implementsRegex = new RegExp(`implements\\s+[^{]*\\b${simpleParentName}\\b`);
                    if (extendsRegex.test(text) || implementsRegex.test(text)) {
                        const childClassInfo = await this.languageServerClient.getClassInfo(symbol.name);
                        if (childClassInfo && !allClasses.some(c => c.className === childClassInfo.className)) {
                            allClasses.push(childClassInfo);
                            processedClasses.add(symbol.name);
                        }
                    }
                }
                catch (error) {
                    // 忽略无法访问的文件
                    continue;
                }
            }
        }
        catch (error) {
            console.log('Error finding subclasses:', error);
        }
    }
    async getPackageClasses(packageName, directoryPath) {
        const packageClasses = [];
        try {
            // 读取同一目录下的所有 Java 文件
            const files = fs.readdirSync(directoryPath);
            const javaFiles = files.filter(file => file.endsWith('.java'));
            for (const javaFile of javaFiles) {
                try {
                    const filePath = path.join(directoryPath, javaFile);
                    const javaCode = fs.readFileSync(filePath, 'utf8');
                    // 解析文件
                    const classStructure = await this.parseJavaFile(javaCode, filePath);
                    // 检查是否属于同一包
                    if (classStructure.packageName === packageName) {
                        packageClasses.push(classStructure);
                    }
                }
                catch (error) {
                    console.log(`Error parsing ${javaFile}:`, error);
                    continue;
                }
            }
        }
        catch (error) {
            console.log('Error reading package directory:', error);
        }
        return packageClasses;
    }
    async getDirectlyRelatedClasses(className, baseDir, packageName) {
        const relatedClasses = [];
        const processedClasses = new Set();
        // 获取主类信息
        let mainClassInfo = await this.languageServerClient.getClassInfo(className);
        if (!mainClassInfo && baseDir && packageName) {
            // 兜底：尝试从同包目录读取并解析类名
            const simpleName = className.includes('.') ? className.split('.').pop() : className;
            const fallback = this.tryParseLocalClassHeader(baseDir, simpleName);
            if (fallback) {
                mainClassInfo = fallback;
            }
        }
        if (mainClassInfo) {
            relatedClasses.push(mainClassInfo);
            processedClasses.add(className);
        }
        // 获取完整的继承链（这对于理解类关系很重要）
        await this.collectInheritanceChainWithFallback(className, relatedClasses, processedClasses, baseDir, packageName);
        // 获取直接的字段依赖（但不包含同包的无关类）
        await this.collectFieldDependencies(className, relatedClasses, processedClasses);
        return relatedClasses;
    }
    async collectInheritanceChain(className, relatedClasses, processedClasses) {
        const classInfo = await this.languageServerClient.getClassInfo(className);
        if (!classInfo) {
            return;
        }
        await this.collectInheritanceChainCore(classInfo, relatedClasses, processedClasses);
    }
    async collectInheritanceChainWithFallback(className, relatedClasses, processedClasses, baseDir, packageName) {
        // 优先使用语言服务
        let classInfo = await this.languageServerClient.getClassInfo(className);
        if (!classInfo && baseDir && packageName) {
            const simple = className.includes('.') ? className.split('.').pop() : className;
            const local = this.tryParseLocalClassHeader(baseDir, simple, packageName);
            if (local)
                classInfo = local;
        }
        if (!classInfo)
            return;
        await this.collectInheritanceChainCore(classInfo, relatedClasses, processedClasses, baseDir, packageName);
    }
    async collectInheritanceChainCore(classInfo, relatedClasses, processedClasses, baseDir, packageName) {
        const className = classInfo.className;
        // 递归获取完整的继承链（父类链）
        if (classInfo.superClass && !processedClasses.has(classInfo.superClass)) {
            console.log(`Found superclass for ${className}: ${classInfo.superClass}`);
            let superClassInfo = await this.languageServerClient.getClassInfo(classInfo.superClass);
            if (!superClassInfo && baseDir && packageName) {
                const simple = classInfo.superClass.includes('.') ? classInfo.superClass.split('.').pop() : classInfo.superClass;
                const local = this.tryParseLocalClassHeader(baseDir, simple, packageName);
                if (local)
                    superClassInfo = local;
            }
            if (superClassInfo) {
                console.log(`Successfully got info for superclass: ${classInfo.superClass}`);
                relatedClasses.push(superClassInfo);
                processedClasses.add(classInfo.superClass);
                // 递归获取父类的父类，直到系统类或没有父类
                if (!this.isSystemClassName(classInfo.superClass)) {
                    console.log(`Recursively getting inheritance chain for: ${classInfo.superClass}`);
                    await this.collectInheritanceChainCore(superClassInfo, relatedClasses, processedClasses, baseDir, packageName);
                }
            }
            else {
                console.log(`Could not get info for superclass: ${classInfo.superClass}`);
            }
        }
        else if (classInfo.superClass) {
            console.log(`Superclass ${classInfo.superClass} already processed for ${className}`);
        }
        else {
            console.log(`No superclass found for ${className}`);
        }
        // 获取直接实现的接口
        for (const interfaceName of classInfo.interfaces) {
            if (!processedClasses.has(interfaceName)) {
                const interfaceInfo = await this.languageServerClient.getClassInfo(interfaceName);
                if (interfaceInfo) {
                    relatedClasses.push(interfaceInfo);
                    processedClasses.add(interfaceName);
                }
            }
        }
    }
    tryParseLocalClassHeader(baseDir, simpleName, packageName) {
        try {
            const filePath = path.join(baseDir, `${simpleName}.java`);
            if (!fs.existsSync(filePath))
                return null;
            const text = fs.readFileSync(filePath, 'utf8');
            // 检查是否是接口
            const isInterface = new RegExp(`interface\\s+${simpleName}`, 'i').test(text);
            let superClass;
            let interfaces = [];
            if (isInterface) {
                // 解析接口继承
                const interfaceExtendsMatch = new RegExp(`interface\\s+${simpleName}(?:\\s+extends\\s+([^{]+))?`, 'i').exec(text);
                if (interfaceExtendsMatch && interfaceExtendsMatch[1]) {
                    const parentInterfaces = interfaceExtendsMatch[1]
                        .split(',')
                        .map(i => i.trim())
                        .filter(i => i.length > 0);
                    if (parentInterfaces.length > 0) {
                        superClass = parentInterfaces[0]; // 主要父接口
                        if (parentInterfaces.length > 1) {
                            interfaces = parentInterfaces.slice(1); // 其他父接口
                        }
                    }
                }
            }
            else {
                // 解析类继承
                const extendsMatch = new RegExp(`class\\s+${simpleName}\\s+extends\\s+([a-zA-Z0-9_]+)`, 'i').exec(text);
                const implementsMatch = new RegExp(`class\\s+${simpleName}[^{]*implements\\s+([^{]+)`, 'i').exec(text);
                superClass = extendsMatch ? extendsMatch[1] : undefined;
                interfaces = implementsMatch ? implementsMatch[1].split(',').map(s => s.trim()) : [];
            }
            const isAbstract = new RegExp(`abstract\\s+(class|interface)\\s+${simpleName}`, 'i').test(text);
            return {
                className: simpleName,
                packageName: packageName || this.extractPackageFromSource(text) || '',
                superClass,
                interfaces,
                fields: [],
                methods: [],
                constructors: [],
                isAbstract,
                isInterface,
                isEnum: false,
                location: { uri: filePath, range: { start: { line: 0, character: 0 }, end: { line: 0, character: 0 } } }
            };
        }
        catch {
            return null;
        }
    }
    extractPackageFromSource(text) {
        const m = /package\s+([a-zA-Z0-9_.]+);/.exec(text);
        return m ? m[1] : null;
    }
    async collectFieldDependencies(className, relatedClasses, processedClasses) {
        const classInfo = await this.languageServerClient.getClassInfo(className);
        if (!classInfo) {
            return;
        }
        // 只添加字段类型中的自定义类（限制数量，排除同包类）
        for (const field of classInfo.fields.slice(0, 2)) { // 减少到2个以避免图表过于复杂
            const fieldType = this.extractSimpleClassName(field.type);
            if (fieldType && !this.isPrimitiveType(fieldType) && !processedClasses.has(fieldType)) {
                const fieldClassInfo = await this.languageServerClient.getClassInfo(fieldType);
                // 只包含系统类或不同包的类，避免包含同包的无关类
                if (fieldClassInfo &&
                    (this.isSystemClassName(fieldType) ||
                        fieldClassInfo.packageName !== classInfo.packageName)) {
                    relatedClasses.push(fieldClassInfo);
                    processedClasses.add(fieldType);
                }
            }
        }
    }
    async getSystemClassesOnly(className) {
        const systemClasses = [];
        try {
            const classInfo = await this.languageServerClient.getClassInfo(className);
            if (!classInfo) {
                return systemClasses;
            }
            // 只获取系统类（java.*, javax.*）
            if (classInfo.superClass && this.isSystemClassName(classInfo.superClass)) {
                const systemClass = this.createSystemClassStructure(classInfo.superClass);
                if (systemClass) {
                    systemClasses.push(systemClass);
                }
            }
            for (const interfaceName of classInfo.interfaces) {
                if (this.isSystemClassName(interfaceName)) {
                    const systemClass = this.createSystemClassStructure(interfaceName);
                    if (systemClass) {
                        systemClasses.push(systemClass);
                    }
                }
            }
        }
        catch (error) {
            console.log('Error getting system classes:', error);
        }
        return systemClasses;
    }
    isSystemClassName(className) {
        return className.startsWith('java.') ||
            className.startsWith('javax.') ||
            ['Object', 'String', 'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet',
                'Collection', 'Iterable', 'Serializable', 'Comparable', 'Runnable'].includes(className);
    }
    createSystemClassStructure(className) {
        const parts = className.split('.');
        const simpleClassName = parts[parts.length - 1];
        const packageName = parts.length > 1 ? parts.slice(0, -1).join('.') : '';
        return {
            className: simpleClassName,
            packageName: packageName,
            filePath: '',
            classType: this.isKnownInterface(className) ? 'interface' : 'class',
            interfaces: [],
            fields: [],
            methods: [],
            constructors: [],
            innerClasses: [],
            imports: [],
            annotations: [],
            inheritanceHierarchy: [],
            allInterfaces: [],
            isSystemClass: true
        };
    }
    isKnownInterface(className) {
        const interfaces = [
            'List', 'Set', 'Map', 'Collection', 'Iterable', 'Serializable',
            'Comparable', 'Runnable', 'Callable', 'java.util.List', 'java.util.Set',
            'java.util.Map', 'java.util.Collection', 'java.lang.Iterable',
            'java.io.Serializable', 'java.lang.Comparable', 'java.lang.Runnable'
        ];
        return interfaces.includes(className);
    }
    extractSimpleClassName(type) {
        // Remove generics and array brackets
        const cleanType = type.replace(/<.*>/g, '').replace(/\[\]/g, '');
        // Skip primitive types and common generic types
        if (this.isPrimitiveType(cleanType) || cleanType === 'T' || cleanType === 'E' || cleanType === 'K' || cleanType === 'V') {
            return null;
        }
        return cleanType;
    }
    isPrimitiveType(type) {
        const primitives = ['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void'];
        return primitives.includes(type);
    }
}
exports.JavaCodeParser = JavaCodeParser;
//# sourceMappingURL=JavaCodeParser.js.map