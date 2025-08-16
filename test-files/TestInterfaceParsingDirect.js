// 直接测试接口继承关系解析的核心逻辑
const fs = require('fs');
const path = require('path');

function testInterfaceParsingLogic() {
    console.log('=== Testing Interface Inheritance Parsing Logic ===\n');
    
    // 模拟tryParseLocalClassHeader方法的核心逻辑
    function tryParseLocalClassHeader(baseDir, simpleName, packageName) {
        try {
            const filePath = path.join(baseDir, `${simpleName}.java`);
            if (!fs.existsSync(filePath)) return null;
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
            } else {
                // 解析类继承
                const extendsMatch = new RegExp(`class\\s+${simpleName}\\s+extends\\s+([a-zA-Z0-9_]+)`, 'i').exec(text);
                const implementsMatch = new RegExp(`class\\s+${simpleName}[^{]*implements\\s+([^{]+)`, 'i').exec(text);
                superClass = extendsMatch ? extendsMatch[1] : undefined;
                interfaces = implementsMatch ? implementsMatch[1].split(',').map(s => s.trim()) : [];
            }
            
            const isAbstract = new RegExp(`abstract\\s+(class|interface)\\s+${simpleName}`, 'i').test(text);
            
            return {
                className: simpleName,
                packageName: packageName || '',
                superClass,
                interfaces,
                isAbstract,
                isInterface,
                isEnum: false
            };
        } catch (error) {
            console.error(`Error parsing ${simpleName}:`, error.message);
            return null;
        }
    }
    
    // 测试接口文件
    const testDir = 'test-files';
    const testCases = [
        'InterfaceGrandparent',
        'InterfaceParent', 
        'InterfaceChild',
        'InterfaceImplementation'
    ];
    
    console.log('Testing interface inheritance parsing...\n');
    
    testCases.forEach(className => {
        console.log(`--- Testing ${className} ---`);
        const result = tryParseLocalClassHeader(testDir, className, 'com.webtutsplus.ecommerce.utils');
        if (result) {
            console.log(`Class: ${result.className}`);
            console.log(`Is Interface: ${result.isInterface}`);
            console.log(`Super Class/Interface: ${result.superClass || 'None'}`);
            console.log(`Interfaces: ${result.interfaces.length > 0 ? result.interfaces.join(', ') : 'None'}`);
            console.log(`Is Abstract: ${result.isAbstract}`);
            
            // 验证接口继承关系
            if (result.isInterface && result.superClass) {
                console.log(`✓ Interface inheritance detected: ${result.className} extends ${result.superClass}`);
            } else if (!result.isInterface && result.interfaces.length > 0) {
                console.log(`✓ Interface implementation detected: ${result.className} implements ${result.interfaces.join(', ')}`);
            } else if (result.isInterface && !result.superClass) {
                console.log(`✓ Root interface detected: ${result.className}`);
            }
        } else {
            console.log(`❌ Failed to parse ${className}`);
        }
        console.log('');
    });
    
    console.log('=== Interface Inheritance Parsing Test Complete ===');
}

// 运行测试
testInterfaceParsingLogic();
