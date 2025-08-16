// 简化的接口继承关系解析测试
function testInterfaceInheritanceRegex() {
    console.log('=== Testing Interface Inheritance Regex ===\n');
    
    // 模拟extractInheritanceFromText方法的核心逻辑
    function extractInheritanceFromText(text, className) {
        const result = {
            className: className,
            packageName: '',
            superClass: null,
            interfaces: [],
            isInterface: false,
            isAbstract: false
        };

        // 检查是否是接口
        const isInterfaceRegex = new RegExp(`interface\\s+${className}`, 'i');
        if (isInterfaceRegex.test(text)) {
            result.isInterface = true;
            console.log(`${className} is an interface`);
        }

        // 检查接口声明和接口继承
        const interfaceRegex = new RegExp(`interface\\s+${className}(?:\\s+extends\\s+([^{]+))?`, 'i');
        const interfaceMatch = interfaceRegex.exec(text);
        if (interfaceMatch && interfaceMatch[1]) {
            // 对于接口继承，父接口应该存储在superClass字段中
            const parentInterfaces = interfaceMatch[1]
                .split(',')
                .map(i => i.trim())
                .filter(i => i.length > 0);
            
            if (parentInterfaces.length > 0) {
                result.superClass = parentInterfaces[0]; // 主要父接口
                if (parentInterfaces.length > 1) {
                    result.interfaces = parentInterfaces.slice(1);
                }
                console.log(`Found interface inheritance for ${className}: superClass=${result.superClass}, additional interfaces:`, result.interfaces);
            }
        }

        return result;
    }
    
    // 测试用例
    const testCases = [
        {
            name: 'InterfaceGrandparent',
            text: `package com.webtutsplus.ecommerce.utils;

public interface InterfaceGrandparent {
    void grandparentMethod();
    default int getInterfaceLevel() {
        return 1;
    }
    String getInterfaceType();
}`
        },
        {
            name: 'InterfaceParent',
            text: `package com.webtutsplus.ecommerce.utils;

public interface InterfaceParent extends InterfaceGrandparent {
    void parentMethod();
    @Override
    default int getInterfaceLevel() {
        return 2;
    }
    String getParentInfo();
}`
        },
        {
            name: 'InterfaceChild',
            text: `package com.webtutsplus.ecommerce.utils;

public interface InterfaceChild extends InterfaceParent {
    void childMethod();
    @Override
    default int getInterfaceLevel() {
        return 3;
    }
    String getChildInfo();
}`
        }
    ];
    
    // 测试每个接口的继承关系解析
    testCases.forEach(testCase => {
        console.log(`\n--- Testing ${testCase.name} ---`);
        const result = extractInheritanceFromText(testCase.text, testCase.name);
        console.log('Result:', JSON.stringify(result, null, 2));
    });
    
    console.log('\n=== Interface Inheritance Regex Test Complete ===');
}

// 运行测试
testInterfaceInheritanceRegex();
