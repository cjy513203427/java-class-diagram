const { JavaLanguageServerClient } = require('../out/languageserver/JavaLanguageServerClient');

// 模拟测试接口继承关系解析
function testInterfaceInheritance() {
    console.log('=== Testing Interface Inheritance Parsing ===\n');
    
    // 创建一个模拟的语言服务器客户端
    const client = new JavaLanguageServerClient(null);
    
    // 测试接口继承的文本解析
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
        try {
            client.testInheritanceExtraction(testCase.name, testCase.text);
        } catch (error) {
            console.error(`Error testing ${testCase.name}:`, error.message);
        }
    });
    
    console.log('\n=== Interface Inheritance Test Complete ===');
}

// 运行测试
testInterfaceInheritance();
