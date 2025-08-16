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
exports.JavaLanguageServerClient = void 0;
const vscode = __importStar(require("vscode"));
const node_1 = require("vscode-languageclient/node");
// Define custom request types for Java-specific operations
var JavaRequests;
(function (JavaRequests) {
    JavaRequests.GET_CLASS_HIERARCHY = new node_1.RequestType('java/getClassHierarchy');
    JavaRequests.GET_CLASS_INFO = new node_1.RequestType('java/getClassInfo');
    JavaRequests.GET_TYPE_DEFINITION = new node_1.RequestType('java/getTypeDefinition');
})(JavaRequests || (JavaRequests = {}));
class JavaLanguageServerClient {
    context;
    client;
    isReady = false;
    constructor(context) {
        this.context = context;
    }
    async initialize() {
        // Check if Java extension is installed and active
        const javaExtension = vscode.extensions.getExtension('redhat.java');
        if (!javaExtension) {
            throw new Error('Java Language Support extension is not installed. Please install the Extension Pack for Java.');
        }
        if (!javaExtension.isActive) {
            await javaExtension.activate();
        }
        // We'll connect to the existing Java Language Server instead of starting our own
        // This is done through the Java extension's API
        await this.connectToExistingLanguageServer();
    }
    async connectToExistingLanguageServer() {
        try {
            // Get the Java extension's language client
            const javaExtension = vscode.extensions.getExtension('redhat.java');
            if (javaExtension && javaExtension.isActive) {
                // Access the language client from the Java extension
                // Note: This is a simplified approach. In practice, we might need to use
                // the Java extension's public API or create our own client
                this.isReady = true;
                console.log('Connected to Java Language Server');
            }
        }
        catch (error) {
            console.error('Failed to connect to Java Language Server:', error);
            throw error;
        }
    }
    async getClassHierarchy(document, position) {
        if (!this.isReady || !this.client) {
            return null;
        }
        try {
            const params = {
                textDocument: { uri: document.uri.toString() },
                position: { line: position.line, character: position.character },
                resolve: 3 // Get 3 levels of hierarchy
            };
            return await this.client.sendRequest(JavaRequests.GET_CLASS_HIERARCHY, params);
        }
        catch (error) {
            console.error('Error getting class hierarchy:', error);
            return null;
        }
    }
    async getClassInfo(className, includeSystemClasses = true) {
        // Always use VSCode API for now since we're connecting to existing Language Server
        return await this.getClassInfoUsingVSCodeAPI(className);
    }
    async getInheritanceHierarchy(className) {
        try {
            // Use VSCode's type hierarchy provider if available
            const symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', className);
            if (!symbols || symbols.length === 0) {
                return [];
            }
            const classSymbol = symbols.find(symbol => symbol.kind === vscode.SymbolKind.Class &&
                symbol.name === className);
            if (!classSymbol) {
                return [];
            }
            // Get the document and analyze inheritance
            const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
            return this.extractInheritanceFromDocument(document, className);
        }
        catch (error) {
            console.error('Error getting inheritance hierarchy:', error);
            return [];
        }
    }
    extractInheritanceFromDocument(document, className) {
        const text = document.getText();
        const hierarchy = [];
        // Look for extends clause
        const classRegex = new RegExp(`class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_.<>]+)`, 'g');
        const match = classRegex.exec(text);
        if (match) {
            hierarchy.push(match[1]);
        }
        return hierarchy;
    }
    extractInheritanceFromText(document, className) {
        const text = document.getText();
        console.log(`Extracting inheritance for ${className} from text length: ${text.length}`);
        const result = {
            superClass: undefined,
            interfaces: [],
            isAbstract: false
        };
        // 简化的正则表达式 - 更宽松的匹配
        // 查找 "class className extends superClass"
        const extendsRegex = new RegExp(`class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_]+)`, 'i');
        const extendsMatch = extendsRegex.exec(text);
        if (extendsMatch) {
            result.superClass = extendsMatch[1].trim();
            console.log(`Found superclass for ${className}: ${result.superClass}`);
        }
        else {
            console.log(`No superclass found for ${className}`);
        }
        // 查找 "implements Interface1, Interface2"
        const implementsRegex = new RegExp(`class\\s+${className}[^{]*implements\\s+([^{]+)`, 'i');
        const implementsMatch = implementsRegex.exec(text);
        if (implementsMatch) {
            result.interfaces = implementsMatch[1]
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);
            console.log(`Found interfaces for ${className}:`, result.interfaces);
        }
        // 检查是否是抽象类
        const abstractRegex = new RegExp(`abstract\\s+class\\s+${className}`, 'i');
        if (abstractRegex.test(text)) {
            result.isAbstract = true;
            console.log(`${className} is abstract`);
        }
        // 检查接口声明和接口继承
        const interfaceRegex = new RegExp(`interface\\s+${className}(?:\\s+extends\\s+([^{]+))?`, 'i');
        const interfaceMatch = interfaceRegex.exec(text);
        if (interfaceMatch && interfaceMatch[1]) {
            // 对于接口继承，父接口应该存储在superClass字段中
            // 如果有多个父接口（Java 8+支持），取第一个作为主要父接口
            const parentInterfaces = interfaceMatch[1]
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);
            if (parentInterfaces.length > 0) {
                result.superClass = parentInterfaces[0]; // 主要父接口
                if (parentInterfaces.length > 1) {
                    // 如果有多个父接口，其余的存储在interfaces字段中
                    result.interfaces = parentInterfaces.slice(1);
                }
                console.log(`Found interface inheritance for ${className}: superClass=${result.superClass}, additional interfaces:`, result.interfaces);
            }
        }
        console.log(`Final inheritance result for ${className}:`, result);
        return result;
    }
    // 测试方法 - 用于调试继承关系解析
    testInheritanceExtraction(className, classText) {
        console.log(`\n=== Testing inheritance extraction for ${className} ===`);
        console.log('Class text:', classText.substring(0, 200) + '...');
        const result = this.extractInheritanceFromText({
            getText: () => classText
        }, className);
        console.log('Extraction result:', result);
        console.log('=== End test ===\n');
    }
    async getClassInfoUsingVSCodeAPI(className) {
        try {
            // First try to find in workspace
            let symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', className);
            // If not found in workspace, try to find system classes
            if (!symbols || symbols.length === 0) {
                return await this.getSystemClassInfo(className);
            }
            // Find the class symbol
            const classSymbol = symbols.find(symbol => (symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === className);
            if (!classSymbol) {
                return await this.getSystemClassInfo(className);
            }
            // Get document symbols to extract class details
            const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
            const documentSymbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
            // Check if documentSymbols is valid and iterable
            if (!documentSymbols || !Array.isArray(documentSymbols)) {
                console.warn(`No document symbols found for ${className}, falling back to system class info`);
                return await this.getSystemClassInfo(className);
            }
            return this.parseDocumentSymbols(documentSymbols, className, document);
        }
        catch (error) {
            console.error('Error using VSCode API for class info:', error);
            return await this.getSystemClassInfo(className);
        }
    }
    async getSystemClassInfo(className) {
        try {
            // Try to use "Go to Definition" on a reference to the class
            // This can help us find system classes that aren't in the workspace
            // For system classes like java.lang.String, java.util.List, etc.
            // We can provide basic information
            if (this.isKnownSystemClass(className)) {
                return this.getKnownSystemClassInfo(className);
            }
            return null;
        }
        catch (error) {
            console.error('Error getting system class info:', error);
            return null;
        }
    }
    isKnownSystemClass(className) {
        const systemClasses = [
            'String', 'Object', 'Integer', 'Long', 'Double', 'Float', 'Boolean',
            'List', 'ArrayList', 'LinkedList', 'Set', 'HashSet', 'Map', 'HashMap',
            'Collection', 'Iterable', 'Iterator', 'Serializable', 'Comparable',
            'Exception', 'RuntimeException', 'Thread', 'Runnable'
        ];
        return systemClasses.includes(className) ||
            className.startsWith('java.') ||
            className.startsWith('javax.');
    }
    getKnownSystemClassInfo(className) {
        // Provide basic information for known system classes
        const systemClassMap = {
            'String': {
                className: 'String',
                packageName: 'java.lang',
                superClass: 'Object',
                interfaces: ['Serializable', 'Comparable', 'CharSequence'],
                isInterface: false,
                isEnum: false,
                isAbstract: false
            },
            'Object': {
                className: 'Object',
                packageName: 'java.lang',
                interfaces: [],
                isInterface: false,
                isEnum: false,
                isAbstract: false
            },
            'ArrayList': {
                className: 'ArrayList',
                packageName: 'java.util',
                superClass: 'AbstractList',
                interfaces: ['List', 'RandomAccess', 'Cloneable', 'Serializable'],
                isInterface: false,
                isEnum: false,
                isAbstract: false
            },
            'List': {
                className: 'List',
                packageName: 'java.util',
                superClass: 'Collection',
                interfaces: [],
                isInterface: true,
                isEnum: false,
                isAbstract: false
            },
            'Serializable': {
                className: 'Serializable',
                packageName: 'java.io',
                interfaces: [],
                isInterface: true,
                isEnum: false,
                isAbstract: false
            }
        };
        const baseInfo = systemClassMap[className] || {
            className: className,
            packageName: this.extractPackageFromFullName(className),
            interfaces: [],
            isInterface: false,
            isEnum: false,
            isAbstract: false
        };
        return {
            className: baseInfo.className || className,
            packageName: baseInfo.packageName || '',
            superClass: baseInfo.superClass,
            interfaces: baseInfo.interfaces || [],
            fields: [],
            methods: [],
            constructors: [],
            isAbstract: baseInfo.isAbstract || false,
            isInterface: baseInfo.isInterface || false,
            isEnum: baseInfo.isEnum || false
        };
    }
    extractPackageFromFullName(fullClassName) {
        const lastDotIndex = fullClassName.lastIndexOf('.');
        return lastDotIndex > 0 ? fullClassName.substring(0, lastDotIndex) : '';
    }
    parseDocumentSymbols(symbols, className, document) {
        const classSymbol = this.findClassSymbol(symbols, className);
        if (!classSymbol) {
            return null;
        }
        const fields = [];
        const methods = [];
        const constructors = [];
        // Parse class members
        if (classSymbol.children && Array.isArray(classSymbol.children)) {
            for (const child of classSymbol.children) {
                switch (child.kind) {
                    case vscode.SymbolKind.Field:
                    case vscode.SymbolKind.Property:
                        fields.push({
                            name: child.name,
                            type: child.detail || 'unknown',
                            modifiers: [],
                            location: {
                                uri: document.uri.toString(),
                                range: {
                                    start: { line: child.range.start.line, character: child.range.start.character },
                                    end: { line: child.range.end.line, character: child.range.end.character }
                                }
                            }
                        });
                        break;
                    case vscode.SymbolKind.Method:
                        const methodInfo = {
                            name: child.name,
                            returnType: child.detail || 'void',
                            parameters: [],
                            modifiers: [],
                            exceptions: [],
                            location: {
                                uri: document.uri.toString(),
                                range: {
                                    start: { line: child.range.start.line, character: child.range.start.character },
                                    end: { line: child.range.end.line, character: child.range.end.character }
                                }
                            }
                        };
                        if (child.name === className) {
                            constructors.push(methodInfo);
                        }
                        else {
                            methods.push(methodInfo);
                        }
                        break;
                }
            }
        }
        // Extract inheritance information from the document text
        const inheritanceInfo = this.extractInheritanceFromText(document, className);
        console.log(`Inheritance info for ${className}:`, inheritanceInfo);
        return {
            className: className,
            packageName: this.extractPackageName(document),
            superClass: inheritanceInfo.superClass,
            interfaces: inheritanceInfo.interfaces,
            fields,
            methods,
            constructors,
            isAbstract: inheritanceInfo.isAbstract,
            isInterface: classSymbol.kind === vscode.SymbolKind.Interface,
            isEnum: classSymbol.kind === vscode.SymbolKind.Enum,
            location: {
                uri: document.uri.toString(),
                range: {
                    start: { line: classSymbol.range.start.line, character: classSymbol.range.start.character },
                    end: { line: classSymbol.range.end.line, character: classSymbol.range.end.character }
                }
            }
        };
    }
    findClassSymbol(symbols, className) {
        // Check if symbols is valid and iterable
        if (!symbols || !Array.isArray(symbols)) {
            return null;
        }
        for (const symbol of symbols) {
            if ((symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === className) {
                return symbol;
            }
            // Search in children recursively
            if (symbol.children && Array.isArray(symbol.children)) {
                const found = this.findClassSymbol(symbol.children, className);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    extractPackageName(document) {
        const text = document.getText();
        const packageMatch = text.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
        return packageMatch ? packageMatch[1] : '';
    }
    async getTypeDefinition(document, position) {
        try {
            const locations = await vscode.commands.executeCommand('vscode.executeDefinitionProvider', document.uri, position);
            return locations || [];
        }
        catch (error) {
            console.error('Error getting type definition:', error);
            return [];
        }
    }
    async findClassInDependencies(className) {
        try {
            // Use VSCode's workspace symbol search to find classes in dependencies
            const symbols = await vscode.commands.executeCommand('vscode.executeWorkspaceSymbolProvider', className);
            if (!symbols || symbols.length === 0) {
                return null;
            }
            // Look for the class in external dependencies (JAR files)
            const externalSymbol = symbols.find(symbol => (symbol.kind === vscode.SymbolKind.Class ||
                symbol.kind === vscode.SymbolKind.Interface ||
                symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === className &&
                symbol.location.uri.scheme !== 'file' // External dependency
            );
            if (externalSymbol) {
                try {
                    const document = await vscode.workspace.openTextDocument(externalSymbol.location.uri);
                    const documentSymbols = await vscode.commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri);
                    if (documentSymbols) {
                        return this.parseDocumentSymbols(documentSymbols, className, document);
                    }
                }
                catch (error) {
                    console.log('Could not open external document:', error);
                }
            }
            return null;
        }
        catch (error) {
            console.error('Error finding class in dependencies:', error);
            return null;
        }
    }
    async getAllRelatedClasses(className) {
        const relatedClasses = [];
        const processedClasses = new Set();
        await this.collectRelatedClasses(className, relatedClasses, processedClasses, 3); // Max depth of 3
        return relatedClasses;
    }
    async collectRelatedClasses(className, relatedClasses, processedClasses, maxDepth) {
        if (maxDepth <= 0 || processedClasses.has(className)) {
            return;
        }
        processedClasses.add(className);
        const classInfo = await this.getClassInfo(className);
        if (!classInfo) {
            return;
        }
        relatedClasses.push(classInfo);
        // Collect superclass
        if (classInfo.superClass && !processedClasses.has(classInfo.superClass)) {
            await this.collectRelatedClasses(classInfo.superClass, relatedClasses, processedClasses, maxDepth - 1);
        }
        // Collect interfaces
        for (const interfaceName of classInfo.interfaces) {
            if (!processedClasses.has(interfaceName)) {
                await this.collectRelatedClasses(interfaceName, relatedClasses, processedClasses, maxDepth - 1);
            }
        }
        // Collect field types
        for (const field of classInfo.fields) {
            const fieldType = this.extractSimpleClassName(field.type);
            if (fieldType && !this.isPrimitiveType(fieldType) && !processedClasses.has(fieldType)) {
                await this.collectRelatedClasses(fieldType, relatedClasses, processedClasses, maxDepth - 1);
            }
        }
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
    dispose() {
        if (this.client) {
            this.client.stop();
        }
    }
}
exports.JavaLanguageServerClient = JavaLanguageServerClient;
//# sourceMappingURL=JavaLanguageServerClient.js.map