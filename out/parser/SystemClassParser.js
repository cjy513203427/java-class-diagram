"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemClassParser = void 0;
exports.getJavaClassStructure = getJavaClassStructure;
exports.testSystemClassParser = testSystemClassParser;
const child_process_1 = require("child_process");
const util_1 = require("util");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
class SystemClassParser {
    /**
     * Get enhanced class information using javap command
     * This provides complete inheritance hierarchy and system class details
     */
    async getSystemClassInfo(className) {
        try {
            // Try different javap options to get comprehensive information
            const commands = [
                `javap -public -protected -package -private -s -verbose ${className}`,
                `javap -public -s ${className}`,
                `javap -public ${className}`
            ];
            let stdout = '';
            let success = false;
            for (const command of commands) {
                try {
                    const result = await execAsync(command, { timeout: 10000 });
                    stdout = result.stdout;
                    success = true;
                    break;
                }
                catch (error) {
                    // Try next command if current one fails
                    continue;
                }
            }
            if (!success || !stdout) {
                return null;
            }
            return this.parseJavapOutput(stdout, className);
        }
        catch (error) {
            console.error(`Error getting system class info for ${className}:`, error);
            return null;
        }
    }
    /**
     * Get complete inheritance hierarchy for a class
     */
    async getInheritanceHierarchy(className) {
        const hierarchy = [];
        let currentClass = className;
        while (currentClass && currentClass !== 'java.lang.Object') {
            const classInfo = await this.getSystemClassInfo(currentClass);
            if (!classInfo || !classInfo.superClass) {
                break;
            }
            hierarchy.push(classInfo.superClass);
            currentClass = classInfo.superClass;
            // Prevent infinite loops
            if (hierarchy.length > 10) {
                break;
            }
        }
        return hierarchy;
    }
    /**
     * Check if a class exists in the system classpath
     */
    async isSystemClass(className) {
        try {
            const result = await execAsync(`javap ${className}`, { timeout: 5000 });
            return result.stdout.length > 0;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Get all interfaces implemented by a class (including inherited ones)
     */
    async getAllInterfaces(className) {
        const interfaces = new Set();
        const classInfo = await this.getSystemClassInfo(className);
        if (classInfo) {
            // Add direct interfaces
            classInfo.interfaces.forEach(iface => interfaces.add(iface));
            // Add interfaces from superclass
            if (classInfo.superClass) {
                const superInterfaces = await this.getAllInterfaces(classInfo.superClass);
                superInterfaces.forEach(iface => interfaces.add(iface));
            }
        }
        return Array.from(interfaces);
    }
    parseJavapOutput(javapOutput, className) {
        const lines = javapOutput.split('\n');
        const classInfo = {
            className: this.extractSimpleClassName(className),
            packageName: this.extractPackageName(className),
            interfaces: [],
            isAbstract: false,
            isInterface: false,
            isEnum: false,
            fields: [],
            methods: [],
            constructors: [],
            annotations: []
        };
        let currentSection = '';
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line)
                continue;
            // Parse class declaration
            if (line.includes('class ') || line.includes('interface ') || line.includes('enum ')) {
                this.parseClassDeclaration(line, classInfo);
                continue;
            }
            // Parse fields
            if (this.isFieldDeclaration(line)) {
                const field = this.parseField(line);
                if (field) {
                    classInfo.fields.push(field);
                }
                continue;
            }
            // Parse methods and constructors
            if (this.isMethodDeclaration(line)) {
                const method = this.parseMethod(line);
                if (method) {
                    if (method.name === classInfo.className) {
                        classInfo.constructors.push(method);
                    }
                    else {
                        classInfo.methods.push(method);
                    }
                }
                continue;
            }
        }
        return classInfo;
    }
    parseClassDeclaration(line, classInfo) {
        // Check class type
        if (line.includes('interface ')) {
            classInfo.isInterface = true;
        }
        else if (line.includes('enum ')) {
            classInfo.isEnum = true;
        }
        if (line.includes('abstract ')) {
            classInfo.isAbstract = true;
        }
        // Parse extends clause
        const extendsMatch = line.match(/extends\s+([a-zA-Z0-9_.$]+)/);
        if (extendsMatch) {
            classInfo.superClass = extendsMatch[1];
        }
        // Parse implements clause
        const implementsMatch = line.match(/implements\s+([a-zA-Z0-9_.$,\s]+)/);
        if (implementsMatch) {
            classInfo.interfaces = implementsMatch[1]
                .split(',')
                .map(iface => iface.trim())
                .filter(iface => iface.length > 0);
        }
    }
    isFieldDeclaration(line) {
        // Simple heuristic: contains visibility modifier and ends with semicolon or assignment
        return /^(public|private|protected|static|final)\s+.*[;=]/.test(line) &&
            !line.includes('(') && !line.includes(')');
    }
    parseField(line) {
        const fieldMatch = line.match(/^(public|private|protected)?\s*(static)?\s*(final)?\s*([a-zA-Z0-9_.<>[\]]+)\s+([a-zA-Z0-9_$]+)/);
        if (!fieldMatch)
            return null;
        return {
            name: fieldMatch[5],
            type: fieldMatch[4],
            visibility: fieldMatch[1] || 'package',
            isStatic: fieldMatch[2] === 'static',
            isFinal: fieldMatch[3] === 'final',
            annotations: []
        };
    }
    isMethodDeclaration(line) {
        // Contains parentheses and visibility modifier
        return /^(public|private|protected|static|abstract|final).*\(.*\)/.test(line);
    }
    parseMethod(line) {
        const methodMatch = line.match(/^(public|private|protected)?\s*(static)?\s*(abstract)?\s*(final)?\s*([a-zA-Z0-9_.<>[\]]+)\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/);
        if (!methodMatch)
            return null;
        const parameters = [];
        if (methodMatch[7]) {
            const paramStrings = methodMatch[7].split(',');
            for (const paramString of paramStrings) {
                const paramMatch = paramString.trim().match(/([a-zA-Z0-9_.<>[\]]+)\s+([a-zA-Z0-9_$]+)/);
                if (paramMatch) {
                    parameters.push({
                        type: paramMatch[1],
                        name: paramMatch[2]
                    });
                }
            }
        }
        return {
            name: methodMatch[6],
            returnType: methodMatch[5],
            parameters: parameters,
            visibility: methodMatch[1] || 'package',
            isStatic: methodMatch[2] === 'static',
            isAbstract: methodMatch[3] === 'abstract',
            isFinal: methodMatch[4] === 'final',
            annotations: [],
            exceptions: []
        };
    }
    extractSimpleClassName(fullClassName) {
        const parts = fullClassName.split('.');
        return parts[parts.length - 1];
    }
    extractPackageName(fullClassName) {
        const parts = fullClassName.split('.');
        if (parts.length <= 1)
            return '';
        return parts.slice(0, -1).join('.');
    }
}
exports.SystemClassParser = SystemClassParser;
// Example usage function as requested in the requirements
function getJavaClassStructure(className) {
    const parser = new SystemClassParser();
    return parser.getSystemClassInfo(className);
}
// Test the functionality
async function testSystemClassParser() {
    const parser = new SystemClassParser();
    // Test with java.lang.String as requested
    console.log('Testing with java.lang.String...');
    const stringInfo = await parser.getSystemClassInfo('java.lang.String');
    if (stringInfo) {
        console.log('Class structure:', JSON.stringify(stringInfo, null, 2));
    }
    // Test inheritance hierarchy
    console.log('\nTesting inheritance hierarchy...');
    const hierarchy = await parser.getInheritanceHierarchy('java.lang.String');
    console.log('Inheritance hierarchy:', hierarchy);
}
//# sourceMappingURL=SystemClassParser.js.map