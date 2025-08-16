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
exports.PlantUMLGenerator = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PlantUMLGenerator {
    template = '';
    constructor() {
        this.loadTemplate();
    }
    loadTemplate() {
        try {
            const templatePath = path.join(__dirname, '../../resources/templates/classDiagramTemplate.puml');
            if (fs.existsSync(templatePath)) {
                this.template = fs.readFileSync(templatePath, 'utf8');
            }
        }
        catch (error) {
            console.log('Template not found, using default styling');
            this.template = this.getDefaultTemplate();
        }
    }
    getDefaultTemplate() {
        return `@startuml
!theme plain
skinparam classAttributeIconSize 0
skinparam classFontSize 12
skinparam packageFontSize 14
skinparam backgroundColor #FFFFFF

' Enhanced styling similar to intersystems-objectscript-class-diagram-view
skinparam class {
    BackgroundColor #F8F9FA
    BorderColor #2E86AB
    FontColor #212529
    BorderThickness 2
    FontStyle bold
}

skinparam interface {
    BackgroundColor #E3F2FD
    BorderColor #1976D2
    FontColor #0D47A1
    BorderThickness 2
}

skinparam enum {
    BackgroundColor #FFF3E0
    BorderColor #F57C00
    FontColor #E65100
    BorderThickness 2
}

skinparam abstract {
    BackgroundColor #F3E5F5
    BorderColor #7B1FA2
    FontColor #4A148C
    BorderThickness 2
}

' System class styling
skinparam class<<system>> {
    BackgroundColor #FFEBEE
    BorderColor #D32F2F
    FontColor #B71C1C
    BorderThickness 1
    FontStyle italic
}

' Clickable styling
skinparam class<<clickable>> {
    BackgroundColor #E8F5E8
    BorderColor #4CAF50
    FontColor #2E7D32
    BorderThickness 2
}

' Main class highlighting
skinparam class<<main>> {
    BackgroundColor #FFF9C4
    BorderColor #F57F17
    FontColor #E65100
    BorderThickness 3
    FontStyle bold
}

skinparam arrow {
    Color #424242
    Thickness 2
}

left to right direction
scale max 1200 width

`;
    }
    generateClassDiagram(classStructure) {
        let plantUMLCode = this.getDefaultTemplate();
        // Add package if exists
        if (classStructure.packageName) {
            plantUMLCode += `package ${classStructure.packageName} {\n`;
        }
        // Generate class definition
        plantUMLCode += this.generateClassDefinition(classStructure);
        // Generate relationships
        plantUMLCode += this.generateRelationships(classStructure);
        // Generate inheritance hierarchy if available
        plantUMLCode += this.generateInheritanceHierarchy(classStructure);
        // Close package if exists
        if (classStructure.packageName) {
            plantUMLCode += '}\n';
        }
        plantUMLCode += '@enduml\n';
        return plantUMLCode;
    }
    generateMultiClassDiagram(classStructures) {
        let plantUMLCode = this.getDefaultTemplate();
        // Add configuration for large diagrams
        if (classStructures.length > 20) {
            plantUMLCode += `!define LARGE_DIAGRAM
skinparam minClassWidth 100
skinparam maxMessageSize 50
skinparam wrapWidth 200
skinparam packageStyle rectangle
hide empty members

`;
        }
        // Group classes by package
        const packageMap = new Map();
        for (const classStructure of classStructures) {
            const packageName = classStructure.packageName || 'default';
            if (!packageMap.has(packageName)) {
                packageMap.set(packageName, []);
            }
            packageMap.get(packageName).push(classStructure);
        }
        // Limit classes per package for readability
        const maxClassesPerPackage = 15;
        const processedPackages = new Map();
        for (const [packageName, classes] of packageMap) {
            if (classes.length > maxClassesPerPackage) {
                // Take the first N classes and add a note about truncation
                const truncatedClasses = classes.slice(0, maxClassesPerPackage);
                processedPackages.set(packageName, truncatedClasses);
                // Add a note about truncated classes
                plantUMLCode += `note as N_${packageName.replace(/\./g, '_')} 
Package ${packageName} contains ${classes.length} classes.
Only showing first ${maxClassesPerPackage} classes.
end note

`;
            }
            else {
                processedPackages.set(packageName, classes);
            }
        }
        // Generate classes grouped by package
        for (const [packageName, classes] of processedPackages) {
            if (packageName !== 'default') {
                plantUMLCode += `package "${packageName}" {\n`;
            }
            for (const classStructure of classes) {
                plantUMLCode += this.generateClassDefinition(classStructure);
            }
            if (packageName !== 'default') {
                plantUMLCode += '}\n\n';
            }
        }
        // Generate relationships - simplified for large diagrams
        if (classStructures.length > 30) {
            // Only show inheritance relationships for large diagrams
            for (const classStructure of classStructures) {
                plantUMLCode += this.generateSimplifiedRelationships(classStructure);
            }
        }
        else {
            // Full relationships for smaller diagrams
            for (const classStructure of classStructures) {
                plantUMLCode += this.generateRelationships(classStructure);
                plantUMLCode += this.generateInheritanceHierarchy(classStructure);
            }
            // Generate cross-package relationships
            plantUMLCode += this.generateCrossPackageRelationships(classStructures);
        }
        // Add standard Java interfaces and parent classes
        plantUMLCode += this.generateStandardInheritance(classStructures);
        plantUMLCode += '@enduml\n';
        return plantUMLCode;
    }
    generateInteractiveClassDiagram(mainClass, relatedClasses = []) {
        let plantUMLCode = this.getDefaultTemplate();
        // Add all classes without package nesting - show full package names in class names
        const allClasses = [mainClass, ...relatedClasses];
        // Generate classes with full package names (no nesting)
        for (const cls of allClasses) {
            plantUMLCode += this.generateClickableClassDefinitionWithFullPackage(cls, cls === mainClass);
        }
        // Generate relationships using full class names
        for (const cls of allClasses) {
            plantUMLCode += this.generateRelationshipsWithFullNames(cls);
        }
        // Generate cross-class relationships
        plantUMLCode += this.generateCrossPackageRelationshipsWithFullNames(allClasses);
        // Add missing system classes that are referenced
        plantUMLCode += this.generateReferencedSystemClasses(allClasses);
        plantUMLCode += '@enduml\n';
        return plantUMLCode;
    }
    generateClassDefinition(classStructure) {
        let classCode = '';
        // Determine class type symbol
        let classSymbol = 'class';
        if (classStructure.classType === 'interface') {
            classSymbol = 'interface';
        }
        else if (classStructure.classType === 'enum') {
            classSymbol = 'enum';
        }
        else if (classStructure.classType === 'abstract class') {
            classSymbol = 'abstract class';
        }
        // Use proper class name (capitalize first letter for PlantUML)
        const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
        classCode += `${classSymbol} ${className}`;
        // Add stereotype if it's a system class
        if (classStructure.isSystemClass) {
            classCode += ' <<system>>';
        }
        classCode += ' {\n';
        // Add fields
        if (classStructure.fields.length > 0) {
            for (const field of classStructure.fields) {
                classCode += this.generateFieldDefinition(field);
            }
            if (classStructure.constructors.length > 0 || classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add constructors
        if (classStructure.constructors.length > 0) {
            for (const constructor of classStructure.constructors) {
                classCode += this.generateConstructorDefinition(constructor);
            }
            if (classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add methods
        if (classStructure.methods.length > 0) {
            for (const method of classStructure.methods) {
                classCode += this.generateMethodDefinition(method);
            }
        }
        classCode += '}\n';
        classCode += '\n';
        return classCode;
    }
    generateFieldDefinition(field) {
        let fieldCode = '';
        // Add visibility symbol
        const visibilitySymbol = this.getVisibilitySymbol(field.visibility);
        fieldCode += `  ${visibilitySymbol}`;
        // Add static/final modifiers
        if (field.isStatic) {
            fieldCode += '{static} ';
        }
        if (field.isFinal) {
            fieldCode += '{final} ';
        }
        // Add field name and type
        fieldCode += `${field.name} : ${this.simplifyType(field.type)}`;
        fieldCode += '\n';
        return fieldCode;
    }
    generateConstructorDefinition(constructor) {
        let constructorCode = '';
        // Add visibility symbol
        const visibilitySymbol = this.getVisibilitySymbol(constructor.visibility);
        constructorCode += `  ${visibilitySymbol}`;
        // Add constructor name and parameters
        constructorCode += `${constructor.name}(`;
        if (constructor.parameters.length > 0) {
            const params = constructor.parameters.map(param => `${param.name}: ${this.simplifyType(param.type)}`).join(', ');
            constructorCode += params;
        }
        constructorCode += ')';
        constructorCode += '\n';
        return constructorCode;
    }
    generateMethodDefinition(method) {
        let methodCode = '';
        // Add visibility symbol
        const visibilitySymbol = this.getVisibilitySymbol(method.visibility);
        methodCode += `  ${visibilitySymbol}`;
        // Add static/abstract/final modifiers
        if (method.isStatic) {
            methodCode += '{static} ';
        }
        if (method.isAbstract) {
            methodCode += '{abstract} ';
        }
        if (method.isFinal) {
            methodCode += '{final} ';
        }
        // Add method name and parameters
        methodCode += `${method.name}(`;
        if (method.parameters.length > 0) {
            const params = method.parameters.map(param => `${param.name}: ${this.simplifyType(param.type)}`).join(', ');
            methodCode += params;
        }
        methodCode += ')';
        // Add return type
        if (method.returnType && method.returnType !== 'void') {
            methodCode += ` : ${this.simplifyType(method.returnType)}`;
        }
        methodCode += '\n';
        return methodCode;
    }
    generateRelationships(classStructure) {
        let relationships = '';
        // Generate inheritance relationship
        if (classStructure.superClass) {
            const superClassName = this.extractSimpleType(classStructure.superClass);
            const displaySuper = superClassName.charAt(0).toUpperCase() + superClassName.slice(1);
            const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
            relationships += `${displaySuper} <|-- ${className}\n`;
        }
        // Generate interface implementations
        for (const interfaceName of classStructure.interfaces) {
            const simpleInterfaceName = this.extractSimpleType(interfaceName);
            const displayInterface = simpleInterfaceName.charAt(0).toUpperCase() + simpleInterfaceName.slice(1);
            const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
            relationships += `${displayInterface} <|.. ${className}\n`;
        }
        // Generate field relationships (composition/aggregation)
        for (const field of classStructure.fields) {
            if (this.isCustomType(field.type)) {
                const fieldType = this.extractSimpleType(field.type);
                const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
                // Use composition for private fields, aggregation for others
                if (field.visibility === 'private') {
                    relationships += `${className} *-- ${fieldType}\n`;
                }
                else {
                    relationships += `${className} o-- ${fieldType}\n`;
                }
            }
        }
        return relationships;
    }
    generateInheritanceHierarchy(classStructure) {
        let hierarchy = '';
        // Generate inheritance chain from system class information
        if (classStructure.inheritanceHierarchy && classStructure.inheritanceHierarchy.length > 1) {
            for (let i = 0; i < classStructure.inheritanceHierarchy.length - 1; i++) {
                const parentRaw = this.extractSimpleType(classStructure.inheritanceHierarchy[i]);
                const childRaw = this.extractSimpleType(classStructure.inheritanceHierarchy[i + 1]);
                const parent = parentRaw.charAt(0).toUpperCase() + parentRaw.slice(1);
                const child = childRaw.charAt(0).toUpperCase() + childRaw.slice(1);
                // Avoid duplicate relationships
                if (parent !== child) {
                    hierarchy += `${parent} <|-- ${child}\n`;
                }
            }
        }
        return hierarchy;
    }
    generateCrossPackageRelationships(classStructures) {
        let relationships = '';
        const classNames = new Set(classStructures.map(cls => cls.className));
        for (const classStructure of classStructures) {
            // Check for relationships with other classes in the diagram
            for (const field of classStructure.fields) {
                const fieldType = this.extractSimpleType(field.type);
                if (classNames.has(fieldType) && fieldType !== classStructure.className) {
                    const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
                    const targetClass = fieldType.charAt(0).toUpperCase() + fieldType.slice(1);
                    // Avoid self-references and duplicates
                    if (className !== targetClass) {
                        relationships += `${className} --> ${targetClass}\n`;
                    }
                }
            }
        }
        // Add common inheritance relationships for exception classes
        const exceptionClasses = classStructures.filter(cls => cls.className.includes('Exception') ||
            cls.superClass?.includes('Exception') ||
            cls.inheritanceHierarchy.some(parent => parent.includes('Exception')));
        if (exceptionClasses.length > 0) {
            // Add standard exception inheritance
            relationships += '\n' + this.generateExceptionInheritance(exceptionClasses);
        }
        return relationships;
    }
    generateExceptionInheritance(exceptionClasses) {
        let inheritance = '';
        for (const exceptionClass of exceptionClasses) {
            const className = exceptionClass.className.charAt(0).toUpperCase() + exceptionClass.className.slice(1);
            // Check if it's a custom exception that likely extends a standard exception
            if (exceptionClass.superClass) {
                const superClass = this.extractSimpleType(exceptionClass.superClass);
                inheritance += `${superClass} <|-- ${className}\n`;
            }
            else {
                // Default to extending RuntimeException for custom exceptions
                inheritance += `RuntimeException <|-- ${className}\n`;
            }
        }
        return inheritance;
    }
    getVisibilitySymbol(visibility) {
        switch (visibility) {
            case 'public':
                return '+';
            case 'private':
                return '-';
            case 'protected':
                return '#';
            case 'package':
                return '~';
            default:
                return '~';
        }
    }
    extractSimpleType(type) {
        // Remove generic type parameters
        const baseType = type.replace(/<.*>/, '');
        // Remove array brackets
        const simpleType = baseType.replace(/\[\]/, '');
        // Get the simple class name (last part after dot)
        const parts = simpleType.split('.');
        return parts[parts.length - 1];
    }
    simplifyType(type) {
        // More aggressive type simplification for better diagram readability
        return this.extractSimpleType(type);
    }
    isCustomType(type) {
        // List of common Java built-in types that we don't want to show as relationships
        const builtInTypes = [
            'String', 'Integer', 'Long', 'Double', 'Float', 'Boolean', 'Character',
            'Byte', 'Short', 'Object', 'Class', 'Enum', 'Number',
            'int', 'long', 'double', 'float', 'boolean', 'char', 'byte', 'short', 'void',
            'List', 'Set', 'Map', 'Collection', 'ArrayList', 'HashMap', 'HashSet',
            'LinkedList', 'TreeSet', 'TreeMap', 'Vector', 'Stack', 'Queue', 'Deque',
            'Date', 'Calendar', 'BigDecimal', 'BigInteger', 'LocalDate', 'LocalTime',
            'LocalDateTime', 'ZonedDateTime', 'Instant', 'Duration', 'Period',
            'Optional', 'Stream', 'Supplier', 'Consumer', 'Function', 'Predicate',
            'Comparator', 'Iterator', 'Iterable', 'Serializable', 'Cloneable',
            'Runnable', 'Callable', 'Future', 'CompletableFuture', 'Thread',
            'StringBuilder', 'StringBuffer', 'Pattern', 'Matcher', 'File', 'Path',
            'URL', 'URI', 'UUID', 'Properties', 'Locale', 'TimeZone'
        ];
        return !builtInTypes.includes(type) && type.length > 0 && !type.includes('[]');
    }
    generateSimplifiedRelationships(classStructure) {
        let relationships = '';
        // Only show direct inheritance
        if (classStructure.superClass) {
            const superClassName = this.extractSimpleType(classStructure.superClass);
            const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
            relationships += `${superClassName} <|-- ${className}\n`;
        }
        // Show interface implementations
        for (const interfaceName of classStructure.interfaces) {
            const simpleInterfaceName = this.extractSimpleType(interfaceName);
            const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
            relationships += `${simpleInterfaceName} <|.. ${className}\n`;
        }
        return relationships;
    }
    generateStandardInheritance(classStructures) {
        let inheritance = '';
        // Add repository interfaces extending JpaRepository
        const repoInterfaces = classStructures.filter(cls => cls.className.includes('Repo') && cls.classType === 'interface');
        if (repoInterfaces.length > 0) {
            inheritance += '\n' + '// Repository inheritance\n';
            for (const repo of repoInterfaces) {
                const repoName = repo.className.charAt(0).toUpperCase() + repo.className.slice(1);
                inheritance += `JpaRepository <|-- ${repoName}\n`;
            }
        }
        // Add service classes that might extend common service patterns
        const serviceClasses = classStructures.filter(cls => cls.className.includes('Service') && cls.classType === 'class');
        if (serviceClasses.length > 0) {
            inheritance += '\n' + '// Service layer\n';
            // Services typically don't have a common parent, but we can group them
            for (const service of serviceClasses) {
                const serviceName = service.className.charAt(0).toUpperCase() + service.className.slice(1);
                // Add stereotype to indicate service layer
                inheritance += `note right of ${serviceName} : <<Service>>\n`;
            }
        }
        return inheritance;
    }
    generateClickableClassDefinition(classStructure, isMainClass = false) {
        let classCode = '';
        // Determine class type symbol
        let classSymbol = 'class';
        if (classStructure.classType === 'interface') {
            classSymbol = 'interface';
        }
        else if (classStructure.classType === 'enum') {
            classSymbol = 'enum';
        }
        else if (classStructure.classType === 'abstract class') {
            classSymbol = 'abstract class';
        }
        // Use proper class name (capitalize first letter for PlantUML)
        const className = classStructure.className.charAt(0).toUpperCase() + classStructure.className.slice(1);
        classCode += `${classSymbol} ${className}`;
        // Add stereotypes
        const stereotypes = [];
        if (classStructure.isSystemClass) {
            stereotypes.push('system');
        }
        if (!classStructure.isSystemClass) {
            stereotypes.push('clickable');
        }
        if (isMainClass) {
            stereotypes.push('main');
        }
        if (stereotypes.length > 0) {
            classCode += ` <<${stereotypes.join(',')}>>`; // 修复了缺少的右括号
        }
        classCode += ' {\n';
        // Add fields (limit to most important ones for readability)
        const visibleFields = classStructure.fields.slice(0, 10); // Show max 10 fields
        if (visibleFields.length > 0) {
            for (const field of visibleFields) {
                classCode += this.generateFieldDefinition(field);
            }
            if (classStructure.fields.length > 10) {
                classCode += `  ... (${classStructure.fields.length - 10} more fields)\n`;
            }
            if (classStructure.constructors.length > 0 || classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add constructors (limit to 3)
        const visibleConstructors = classStructure.constructors.slice(0, 3);
        if (visibleConstructors.length > 0) {
            for (const constructor of visibleConstructors) {
                classCode += this.generateConstructorDefinition(constructor);
            }
            if (classStructure.constructors.length > 3) {
                classCode += `  ... (${classStructure.constructors.length - 3} more constructors)\n`;
            }
            if (classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add methods (limit to most important ones)
        const visibleMethods = this.selectImportantMethods(classStructure.methods);
        if (visibleMethods.length > 0) {
            for (const method of visibleMethods) {
                classCode += this.generateMethodDefinition(method);
            }
            if (classStructure.methods.length > visibleMethods.length) {
                classCode += `  ... (${classStructure.methods.length - visibleMethods.length} more methods)\n`;
            }
        }
        classCode += '}\n';
        // Add click URL for navigation (if not a system class)
        if (!classStructure.isSystemClass && classStructure.filePath) {
            // 使用正确的文件路径格式
            const normalizedPath = classStructure.filePath.replace(/\\/g, '/');
            classCode += `url of ${className} is [[${normalizedPath}]]\n`;
        }
        classCode += '\n';
        return classCode;
    }
    selectImportantMethods(methods) {
        // Prioritize public methods, getters/setters, and commonly used methods
        const important = [];
        const gettersSetters = [];
        const publicMethods = [];
        const otherMethods = [];
        for (const method of methods) {
            if (method.name.startsWith('get') || method.name.startsWith('set') || method.name.startsWith('is')) {
                gettersSetters.push(method);
            }
            else if (method.visibility === 'public') {
                publicMethods.push(method);
            }
            else {
                otherMethods.push(method);
            }
        }
        // Add up to 3 getters/setters, 5 public methods, and 2 other methods
        important.push(...gettersSetters.slice(0, 3));
        important.push(...publicMethods.slice(0, 5));
        important.push(...otherMethods.slice(0, 2));
        return important.slice(0, 10); // Max 10 methods total
    }
    generateClickableClassDefinitionWithFullPackage(classStructure, isMainClass = false) {
        let classCode = '';
        // Determine class type symbol
        let classSymbol = 'class';
        if (classStructure.classType === 'interface') {
            classSymbol = 'interface';
        }
        else if (classStructure.classType === 'enum') {
            classSymbol = 'enum';
        }
        else if (classStructure.classType === 'abstract class') {
            classSymbol = 'abstract class';
        }
        // Create full class name with package (like intersystems style)
        const fullClassName = this.getFullClassName(classStructure);
        classCode += `${classSymbol} "${fullClassName}"`;
        // Add stereotypes
        const stereotypes = [];
        if (classStructure.isSystemClass) {
            stereotypes.push('system');
        }
        if (!classStructure.isSystemClass) {
            stereotypes.push('clickable');
        }
        if (isMainClass) {
            stereotypes.push('main');
        }
        if (stereotypes.length > 0) {
            classCode += ` <<${stereotypes.join(',')}>>`;
        }
        classCode += ' {\n';
        // Add fields (limit to most important ones for readability)
        const visibleFields = classStructure.fields.slice(0, 8); // Reduce for better readability
        if (visibleFields.length > 0) {
            for (const field of visibleFields) {
                classCode += this.generateFieldDefinition(field);
            }
            if (classStructure.fields.length > 8) {
                classCode += `  ... (${classStructure.fields.length - 8} more fields)\n`;
            }
            if (classStructure.constructors.length > 0 || classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add constructors (limit to 2)
        const visibleConstructors = classStructure.constructors.slice(0, 2);
        if (visibleConstructors.length > 0) {
            for (const constructor of visibleConstructors) {
                classCode += this.generateConstructorDefinition(constructor);
            }
            if (classStructure.constructors.length > 2) {
                classCode += `  ... (${classStructure.constructors.length - 2} more constructors)\n`;
            }
            if (classStructure.methods.length > 0) {
                classCode += '  --\n';
            }
        }
        // Add methods (limit to most important ones)
        const visibleMethods = this.selectImportantMethods(classStructure.methods).slice(0, 6);
        if (visibleMethods.length > 0) {
            for (const method of visibleMethods) {
                classCode += this.generateMethodDefinition(method);
            }
            if (classStructure.methods.length > visibleMethods.length) {
                classCode += `  ... (${classStructure.methods.length - visibleMethods.length} more methods)\n`;
            }
        }
        classCode += '}\n';
        // Add click URL for navigation (if not a system class)
        if (!classStructure.isSystemClass && classStructure.filePath) {
            const normalizedPath = classStructure.filePath.replace(/\\/g, '/');
            classCode += `url of "${fullClassName}" is [[${normalizedPath}]]\n`;
        }
        classCode += '\n';
        return classCode;
    }
    getFullClassName(classStructure) {
        if (classStructure.packageName) {
            return `${classStructure.packageName}.${classStructure.className}`;
        }
        return classStructure.className;
    }
    generateReferencedSystemClasses(classStructures) {
        let systemClasses = '';
        const referencedSystemClasses = new Set();
        // Collect all referenced system classes
        for (const cls of classStructures) {
            // Add superclass if it's a system class
            if (cls.superClass && this.isSystemClassName(cls.superClass)) {
                referencedSystemClasses.add(this.getFullClassNameFromType(cls.superClass));
            }
            // Add interfaces if they're system classes
            for (const iface of cls.interfaces) {
                if (this.isSystemClassName(iface)) {
                    referencedSystemClasses.add(this.getFullClassNameFromType(iface));
                }
            }
        }
        // Generate simple definitions for system classes with full names
        for (const systemClass of referencedSystemClasses) {
            const isInterface = this.isKnownInterface(systemClass);
            if (isInterface) {
                systemClasses += `interface "${systemClass}" <<system>> {\n}\n`;
            }
            else {
                systemClasses += `class "${systemClass}" <<system>> {\n}\n`;
            }
        }
        return systemClasses;
    }
    isSystemClassName(className) {
        return className.startsWith('java.') ||
            className.startsWith('javax.') ||
            ['Object', 'String', 'List', 'ArrayList', 'Map', 'HashMap', 'Set', 'HashSet',
                'Collection', 'Iterable', 'Serializable', 'Comparable', 'Runnable'].includes(className);
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
    generateRelationshipsWithFullNames(classStructure) {
        let relationships = '';
        const fullClassName = this.getFullClassName(classStructure);
        // Generate inheritance relationship
        if (classStructure.superClass) {
            const superClassName = this.getFullClassNameFromType(classStructure.superClass);
            // 确保父类名称正确格式化
            const formattedSuperClass = this.formatClassNameForPlantUML(superClassName);
            const formattedCurrentClass = this.formatClassNameForPlantUML(fullClassName);
            relationships += `"${formattedSuperClass}" <|-- "${formattedCurrentClass}"\n`;
        }
        // Generate interface implementations
        for (const interfaceName of classStructure.interfaces) {
            const fullInterfaceName = this.getFullClassNameFromType(interfaceName);
            const formattedInterface = this.formatClassNameForPlantUML(fullInterfaceName);
            const formattedCurrentClass = this.formatClassNameForPlantUML(fullClassName);
            relationships += `"${formattedInterface}" <|.. "${formattedCurrentClass}"\n`;
        }
        // Generate field relationships (composition/aggregation) - simplified for clarity
        for (const field of classStructure.fields.slice(0, 2)) { // Limit to avoid clutter
            if (this.isCustomType(field.type)) {
                const fieldType = this.getFullClassNameFromType(field.type);
                const formattedFieldType = this.formatClassNameForPlantUML(fieldType);
                const formattedCurrentClass = this.formatClassNameForPlantUML(fullClassName);
                // Use composition for private fields, aggregation for others
                if (field.visibility === 'private') {
                    relationships += `"${formattedCurrentClass}" *-- "${formattedFieldType}"\n`;
                }
                else {
                    relationships += `"${formattedCurrentClass}" o-- "${formattedFieldType}"\n`;
                }
            }
        }
        return relationships;
    }
    formatClassNameForPlantUML(className) {
        // 确保类名格式正确，移除不必要的字符
        return className.trim();
    }
    generateCrossPackageRelationshipsWithFullNames(classStructures) {
        let relationships = '';
        const classNameMap = new Map();
        const processedRelationships = new Set();
        // Build a map of simple class names to full class names
        for (const cls of classStructures) {
            classNameMap.set(cls.className, this.getFullClassName(cls));
        }
        // Generate inheritance relationships between classes in the diagram
        for (const classStructure of classStructures) {
            const fullClassName = this.getFullClassName(classStructure);
            // Check for inheritance relationships with other classes in the diagram
            if (classStructure.superClass) {
                const superSimpleName = this.extractSimpleType(classStructure.superClass);
                if (classNameMap.has(superSimpleName)) {
                    const superFullName = classNameMap.get(superSimpleName);
                    const relationshipKey = `${superFullName}|--|${fullClassName}`;
                    if (!processedRelationships.has(relationshipKey)) {
                        relationships += `"${superFullName}" <|-- "${fullClassName}"\n`;
                        processedRelationships.add(relationshipKey);
                    }
                }
            }
            // Check for interface implementations with other classes in the diagram
            for (const interfaceName of classStructure.interfaces) {
                const interfaceSimpleName = this.extractSimpleType(interfaceName);
                if (classNameMap.has(interfaceSimpleName)) {
                    const interfaceFullName = classNameMap.get(interfaceSimpleName);
                    const relationshipKey = `${interfaceFullName}..|${fullClassName}`;
                    if (!processedRelationships.has(relationshipKey)) {
                        relationships += `"${interfaceFullName}" <|.. "${fullClassName}"\n`;
                        processedRelationships.add(relationshipKey);
                    }
                }
            }
            // Check for field relationships with other classes in the diagram
            for (const field of classStructure.fields.slice(0, 2)) { // Limit to avoid clutter
                const fieldType = this.extractSimpleType(field.type);
                if (classNameMap.has(fieldType) && fieldType !== classStructure.className) {
                    const targetFullName = classNameMap.get(fieldType);
                    const relationshipKey = `${fullClassName}-->${targetFullName}`;
                    // Avoid self-references and duplicates
                    if (fullClassName !== targetFullName && !processedRelationships.has(relationshipKey)) {
                        relationships += `"${fullClassName}" --> "${targetFullName}" : uses\n`;
                        processedRelationships.add(relationshipKey);
                    }
                }
            }
        }
        return relationships;
    }
    getFullClassNameFromType(type) {
        // If it's already a full class name (contains dots), return as is
        if (type.includes('.')) {
            return type;
        }
        // For simple class names, check if it's a known system class
        const systemClassMap = {
            'String': 'java.lang.String',
            'Object': 'java.lang.Object',
            'Integer': 'java.lang.Integer',
            'Long': 'java.lang.Long',
            'Double': 'java.lang.Double',
            'Float': 'java.lang.Float',
            'Boolean': 'java.lang.Boolean',
            'List': 'java.util.List',
            'ArrayList': 'java.util.ArrayList',
            'LinkedList': 'java.util.LinkedList',
            'Set': 'java.util.Set',
            'HashSet': 'java.util.HashSet',
            'Map': 'java.util.Map',
            'HashMap': 'java.util.HashMap',
            'Collection': 'java.util.Collection',
            'Iterable': 'java.lang.Iterable',
            'Serializable': 'java.io.Serializable',
            'Comparable': 'java.lang.Comparable',
            'Runnable': 'java.lang.Runnable'
        };
        return systemClassMap[type] || type;
    }
}
exports.PlantUMLGenerator = PlantUMLGenerator;
//# sourceMappingURL=PlantUMLGenerator.js.map