import * as vscode from 'vscode';
import { 
    LanguageClient, 
    LanguageClientOptions, 
    ServerOptions,
    TransportKind,
    RequestType,
    Position,
    Range,
    TextDocumentIdentifier
} from 'vscode-languageclient/node';

// Define custom request types for Java-specific operations
namespace JavaRequests {
    export const GET_CLASS_HIERARCHY = new RequestType<ClassHierarchyParams, ClassHierarchyResult, void>('java/getClassHierarchy');
    export const GET_CLASS_INFO = new RequestType<ClassInfoParams, ClassInfoResult, void>('java/getClassInfo');
    export const GET_TYPE_DEFINITION = new RequestType<TypeDefinitionParams, TypeDefinitionResult, void>('java/getTypeDefinition');
}

export interface ClassHierarchyParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
    resolve?: number;
}

export interface ClassHierarchyResult {
    hierarchy: ClassHierarchyItem[];
}

export interface ClassHierarchyItem {
    name: string;
    kind: number;
    uri: string;
    range: Range;
    selectionRange: Range;
    parents?: ClassHierarchyItem[];
    children?: ClassHierarchyItem[];
}

export interface ClassInfoParams {
    className: string;
    includeSystemClasses?: boolean;
}

export interface ClassInfoResult {
    className: string;
    packageName: string;
    superClass?: string;
    interfaces: string[];
    fields: FieldInfo[];
    methods: MethodInfo[];
    constructors: MethodInfo[];
    isAbstract: boolean;
    isInterface: boolean;
    isEnum: boolean;
    location?: {
        uri: string;
        range: Range;
    };
}

export interface FieldInfo {
    name: string;
    type: string;
    modifiers: string[];
    location?: {
        uri: string;
        range: Range;
    };
}

export interface MethodInfo {
    name: string;
    returnType: string;
    parameters: ParameterInfo[];
    modifiers: string[];
    exceptions: string[];
    location?: {
        uri: string;
        range: Range;
    };
}

export interface ParameterInfo {
    name: string;
    type: string;
}

export interface TypeDefinitionParams {
    textDocument: TextDocumentIdentifier;
    position: Position;
}

export interface TypeDefinitionResult {
    uri: string;
    range: Range;
}

export class JavaLanguageServerClient {
    private client: LanguageClient | undefined;
    private isReady: boolean = false;

    constructor(private context: vscode.ExtensionContext) {}

    async initialize(): Promise<void> {
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

    private async connectToExistingLanguageServer(): Promise<void> {
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
        } catch (error) {
            console.error('Failed to connect to Java Language Server:', error);
            throw error;
        }
    }

    async getClassHierarchy(document: vscode.TextDocument, position: vscode.Position): Promise<ClassHierarchyResult | null> {
        if (!this.isReady || !this.client) {
            return null;
        }

        try {
            const params: ClassHierarchyParams = {
                textDocument: { uri: document.uri.toString() },
                position: { line: position.line, character: position.character },
                resolve: 3 // Get 3 levels of hierarchy
            };

            return await this.client.sendRequest(JavaRequests.GET_CLASS_HIERARCHY, params);
        } catch (error) {
            console.error('Error getting class hierarchy:', error);
            return null;
        }
    }

    async getClassInfo(className: string, includeSystemClasses: boolean = true): Promise<ClassInfoResult | null> {
        // Always use VSCode API for now since we're connecting to existing Language Server
        return await this.getClassInfoUsingVSCodeAPI(className);
    }

    async getInheritanceHierarchy(className: string): Promise<string[]> {
        try {
            // Use VSCode's type hierarchy provider if available
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                className
            );

            if (!symbols || symbols.length === 0) {
                return [];
            }

            const classSymbol = symbols.find(symbol =>
                symbol.kind === vscode.SymbolKind.Class &&
                symbol.name === className
            );

            if (!classSymbol) {
                return [];
            }

            // Get the document and analyze inheritance
            const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
            return this.extractInheritanceFromDocument(document, className);

        } catch (error) {
            console.error('Error getting inheritance hierarchy:', error);
            return [];
        }
    }

    private extractInheritanceFromDocument(document: vscode.TextDocument, className: string): string[] {
        const text = document.getText();
        const hierarchy: string[] = [];

        // Look for extends clause
        const classRegex = new RegExp(`class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_.<>]+)`, 'g');
        const match = classRegex.exec(text);

        if (match) {
            hierarchy.push(match[1]);
        }

        return hierarchy;
    }

    private extractInheritanceFromText(document: vscode.TextDocument, className: string): {
        superClass?: string;
        interfaces: string[];
        isAbstract: boolean;
    } {
        const text = document.getText();
        console.log(`Extracting inheritance for ${className} from text length: ${text.length}`);

        const result = {
            superClass: undefined as string | undefined,
            interfaces: [] as string[],
            isAbstract: false
        };

        // 简化的正则表达式 - 更宽松的匹配
        // 查找 "class className extends superClass"
        const extendsRegex = new RegExp(`class\\s+${className}\\s+extends\\s+([a-zA-Z0-9_]+)`, 'i');
        const extendsMatch = extendsRegex.exec(text);

        if (extendsMatch) {
            result.superClass = extendsMatch[1].trim();
            console.log(`Found superclass for ${className}: ${result.superClass}`);
        } else {
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
    testInheritanceExtraction(className: string, classText: string): void {
        console.log(`\n=== Testing inheritance extraction for ${className} ===`);
        console.log('Class text:', classText.substring(0, 200) + '...');

        const result = this.extractInheritanceFromText({
            getText: () => classText
        } as vscode.TextDocument, className);

        console.log('Extraction result:', result);
        console.log('=== End test ===\n');
    }

    private async getClassInfoUsingVSCodeAPI(className: string): Promise<ClassInfoResult | null> {
        try {
            // First try to find in workspace
            let symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                className
            );

            // If not found in workspace, try to find system classes
            if (!symbols || symbols.length === 0) {
                return await this.getSystemClassInfo(className);
            }

            // Find the class symbol
            const classSymbol = symbols.find(symbol =>
                (symbol.kind === vscode.SymbolKind.Class ||
                 symbol.kind === vscode.SymbolKind.Interface ||
                 symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === className
            );

            if (!classSymbol) {
                return await this.getSystemClassInfo(className);
            }

            // Get document symbols to extract class details
            const document = await vscode.workspace.openTextDocument(classSymbol.location.uri);
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            // Check if documentSymbols is valid and iterable
            if (!documentSymbols || !Array.isArray(documentSymbols)) {
                console.warn(`No document symbols found for ${className}, falling back to system class info`);
                return await this.getSystemClassInfo(className);
            }

            return this.parseDocumentSymbols(documentSymbols, className, document);
        } catch (error) {
            console.error('Error using VSCode API for class info:', error);
            return await this.getSystemClassInfo(className);
        }
    }

    private async getSystemClassInfo(className: string): Promise<ClassInfoResult | null> {
        try {
            // Try to use "Go to Definition" on a reference to the class
            // This can help us find system classes that aren't in the workspace

            // For system classes like java.lang.String, java.util.List, etc.
            // We can provide basic information
            if (this.isKnownSystemClass(className)) {
                return this.getKnownSystemClassInfo(className);
            }

            return null;
        } catch (error) {
            console.error('Error getting system class info:', error);
            return null;
        }
    }

    private isKnownSystemClass(className: string): boolean {
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

    private getKnownSystemClassInfo(className: string): ClassInfoResult {
        // Provide basic information for known system classes
        const systemClassMap: { [key: string]: Partial<ClassInfoResult> } = {
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

    private extractPackageFromFullName(fullClassName: string): string {
        const lastDotIndex = fullClassName.lastIndexOf('.');
        return lastDotIndex > 0 ? fullClassName.substring(0, lastDotIndex) : '';
    }

    private parseDocumentSymbols(symbols: vscode.DocumentSymbol[], className: string, document: vscode.TextDocument): ClassInfoResult | null {
        const classSymbol = this.findClassSymbol(symbols, className);
        if (!classSymbol) {
            return null;
        }

        const fields: FieldInfo[] = [];
        const methods: MethodInfo[] = [];
        const constructors: MethodInfo[] = [];

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
                    const methodInfo: MethodInfo = {
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
                    } else {
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

    private findClassSymbol(symbols: vscode.DocumentSymbol[], className: string): vscode.DocumentSymbol | null {
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

    private extractPackageName(document: vscode.TextDocument): string {
        const text = document.getText();
        const packageMatch = text.match(/package\s+([a-zA-Z0-9_.]+)\s*;/);
        return packageMatch ? packageMatch[1] : '';
    }

    async getTypeDefinition(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.Location[]> {
        try {
            const locations = await vscode.commands.executeCommand<vscode.Location[]>(
                'vscode.executeDefinitionProvider',
                document.uri,
                position
            );
            return locations || [];
        } catch (error) {
            console.error('Error getting type definition:', error);
            return [];
        }
    }

    /**
     * 通过Language Server精确定位类的位置
     */
    async findClassLocation(className: string): Promise<vscode.Location | null> {
        try {
            // 首先尝试在工作区中搜索类符号
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                className
            );

            if (symbols && symbols.length > 0) {
                // 查找精确匹配的类符号
                const exactMatch = symbols.find(symbol =>
                    (symbol.kind === vscode.SymbolKind.Class ||
                     symbol.kind === vscode.SymbolKind.Interface ||
                     symbol.kind === vscode.SymbolKind.Enum) &&
                    symbol.name === className
                );

                if (exactMatch) {
                    return exactMatch.location;
                }

                // 如果没有精确匹配，查找包含该类名的符号
                const partialMatch = symbols.find(symbol =>
                    (symbol.kind === vscode.SymbolKind.Class ||
                     symbol.kind === vscode.SymbolKind.Interface ||
                     symbol.kind === vscode.SymbolKind.Enum) &&
                    (symbol.name.endsWith(className) || symbol.name.includes(className))
                );

                if (partialMatch) {
                    return partialMatch.location;
                }
            }

            return null;
        } catch (error) {
            console.error('Error finding class location:', error);
            return null;
        }
    }

    /**
     * 通过Language Server精确定位方法的位置
     */
    async findMethodLocation(className: string, methodName: string): Promise<vscode.Location | null> {
        try {
            // 首先找到类的位置
            const classLocation = await this.findClassLocation(className);
            if (!classLocation) {
                return null;
            }

            // 打开类文件并获取文档符号
            const document = await vscode.workspace.openTextDocument(classLocation.uri);
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!documentSymbols || !Array.isArray(documentSymbols)) {
                return null;
            }

            // 查找类符号
            const classSymbol = this.findClassSymbol(documentSymbols, className);
            if (!classSymbol || !classSymbol.children) {
                return null;
            }

            // 在类的子符号中查找方法
            const methodSymbol = classSymbol.children.find(child =>
                child.kind === vscode.SymbolKind.Method &&
                child.name === methodName
            );

            if (methodSymbol) {
                return new vscode.Location(document.uri, methodSymbol.selectionRange);
            }

            return null;
        } catch (error) {
            console.error('Error finding method location:', error);
            return null;
        }
    }

    /**
     * 通过Language Server精确定位字段的位置
     */
    async findFieldLocation(className: string, fieldName: string): Promise<vscode.Location | null> {
        try {
            // 首先找到类的位置
            const classLocation = await this.findClassLocation(className);
            if (!classLocation) {
                return null;
            }

            // 打开类文件并获取文档符号
            const document = await vscode.workspace.openTextDocument(classLocation.uri);
            const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                'vscode.executeDocumentSymbolProvider',
                document.uri
            );

            if (!documentSymbols || !Array.isArray(documentSymbols)) {
                return null;
            }

            // 查找类符号
            const classSymbol = this.findClassSymbol(documentSymbols, className);
            if (!classSymbol || !classSymbol.children) {
                return null;
            }

            // 在类的子符号中查找字段
            const fieldSymbol = classSymbol.children.find(child =>
                (child.kind === vscode.SymbolKind.Field || child.kind === vscode.SymbolKind.Property) &&
                child.name === fieldName
            );

            if (fieldSymbol) {
                return new vscode.Location(document.uri, fieldSymbol.selectionRange);
            }

            return null;
        } catch (error) {
            console.error('Error finding field location:', error);
            return null;
        }
    }

    async findClassInDependencies(className: string): Promise<ClassInfoResult | null> {
        try {
            // Use VSCode's workspace symbol search to find classes in dependencies
            const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
                'vscode.executeWorkspaceSymbolProvider',
                className
            );

            if (!symbols || symbols.length === 0) {
                return null;
            }

            // Look for the class in external dependencies (JAR files)
            const externalSymbol = symbols.find(symbol =>
                (symbol.kind === vscode.SymbolKind.Class ||
                 symbol.kind === vscode.SymbolKind.Interface ||
                 symbol.kind === vscode.SymbolKind.Enum) &&
                symbol.name === className &&
                symbol.location.uri.scheme !== 'file' // External dependency
            );

            if (externalSymbol) {
                try {
                    const document = await vscode.workspace.openTextDocument(externalSymbol.location.uri);
                    const documentSymbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
                        'vscode.executeDocumentSymbolProvider',
                        document.uri
                    );

                    if (documentSymbols) {
                        return this.parseDocumentSymbols(documentSymbols, className, document);
                    }
                } catch (error) {
                    console.log('Could not open external document:', error);
                }
            }

            return null;
        } catch (error) {
            console.error('Error finding class in dependencies:', error);
            return null;
        }
    }

    async getAllRelatedClasses(className: string): Promise<ClassInfoResult[]> {
        const relatedClasses: ClassInfoResult[] = [];
        const processedClasses = new Set<string>();

        await this.collectRelatedClasses(className, relatedClasses, processedClasses, 3); // Max depth of 3

        return relatedClasses;
    }

    private async collectRelatedClasses(
        className: string,
        relatedClasses: ClassInfoResult[],
        processedClasses: Set<string>,
        maxDepth: number
    ): Promise<void> {
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

    private extractSimpleClassName(type: string): string | null {
        // Remove generics and array brackets
        const cleanType = type.replace(/<.*>/g, '').replace(/\[\]/g, '');

        // Skip primitive types and common generic types
        if (this.isPrimitiveType(cleanType) || cleanType === 'T' || cleanType === 'E' || cleanType === 'K' || cleanType === 'V') {
            return null;
        }

        return cleanType;
    }

    private isPrimitiveType(type: string): boolean {
        const primitives = ['int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void'];
        return primitives.includes(type);
    }

    dispose(): void {
        if (this.client) {
            this.client.stop();
        }
    }
}
